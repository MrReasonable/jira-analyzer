from datetime import datetime, timezone
from typing import List, Dict, Any
import logging
from app.core.interfaces import IssueTrackingSystem
from app.core.models import IssueData, StatusChange, JiraConfig
from app.services.jira_service import JiraService

logger = logging.getLogger(__name__)

class JiraIssueTracker(IssueTrackingSystem):
    """Jira-specific implementation of IssueTrackingSystem"""
    
    def __init__(self, config: JiraConfig):
        self.config = config
        self.jira_service = JiraService(config)

    def fetch_issues(self, query: str, start_at: int, batch_size: int) -> List[Any]:
        """Fetch issues from Jira"""
        return self.jira_service.fetch_issues(query, start_at, batch_size)

    def process_issue(self, raw_issue: Any) -> IssueData:
        """Process a raw Jira issue into standardized IssueData"""
        status_changes = []
        current_status = raw_issue.fields.status.name

        # Process changelog
        for history in raw_issue.changelog.histories:
            for item in history.items:
                if item.field == 'status':
                    timestamp = datetime.strptime(
                        history.created.split('.')[0],
                        '%Y-%m-%dT%H:%M:%S'
                    ).replace(tzinfo=timezone.utc)
                    status_changes.append(StatusChange(
                        from_status=item.fromString,
                        to_status=item.toString,
                        timestamp=timestamp
                    ))

        # Extract time tracking data
        time_spent = getattr(raw_issue.fields, 'timespent', None)
        original_estimate = getattr(raw_issue.fields, 'timeoriginalestimate', None)
        logger.info(f"Extracted time tracking data for {raw_issue.key}: time_spent={time_spent}, original_estimate={original_estimate}")
        
        # Extract relationships
        epic_key = getattr(raw_issue.fields, 'customfield_10014', None)
        epic_summary = None
        if epic_key:
            try:
                epic_issue = self.jira_service.client.issue(epic_key, fields=['summary'])
                epic_summary = epic_issue.fields.summary
            except:
                # If we can't fetch the epic, try to get it from the epic name field
                epic_summary = getattr(raw_issue.fields, 'customfield_10015', None)

        parent = getattr(raw_issue.fields, 'parent', None)
        parent_key = parent.key if parent else None
        subtask_keys = [subtask.key for subtask in getattr(raw_issue.fields, 'subtasks', [])]

        # Calculate cycle times using WorkflowAnalyzer
        from app.core.workflow_analyzer import WorkflowAnalyzer
        workflow_analyzer = WorkflowAnalyzer(self.config.workflow['expected_path'])
        
        # Get creation date
        created_date = datetime.strptime(
            raw_issue.fields.created.split('.')[0],
            '%Y-%m-%dT%H:%M:%S'
        ).replace(tzinfo=timezone.utc)
        
        if not status_changes:
            # If there are no transitions and the current status is in the workflow,
            # create a transition from creation date to now
            if current_status in self.config.workflow['expected_path']:
                status_changes = [
                    StatusChange(
                        from_status=current_status,
                        to_status=current_status,
                        timestamp=created_date
                    )
                ]
        else:
            # For issues with transitions, add an initial transition from creation date
            initial_status = status_changes[0].from_status
            status_changes.insert(0, StatusChange(
                from_status=initial_status,
                to_status=initial_status,
                timestamp=created_date
            ))
        
        total_time, _, status_periods = workflow_analyzer.calculate_cycle_time(
            status_changes,
            current_status
        )

        # Convert status periods to cycle times
        cycle_times = {}
        for status, periods in status_periods.items():
            if not periods:
                continue
            total_time = sum(
                (end - start).total_seconds() / 86400
                for start, end in periods
            )
            if status not in self.config.end_states:
                cycle_times[status] = total_time

        return IssueData(
            key=raw_issue.key,
            summary=raw_issue.fields.summary,
            current_status=current_status,
            created_date=datetime.strptime(
                raw_issue.fields.created.split('.')[0],
                '%Y-%m-%dT%H:%M:%S'
            ).replace(tzinfo=timezone.utc),
            cycle_times=cycle_times,
            total_cycle_time=total_time,
            transitions=status_changes,
            time_spent=time_spent,
            original_estimate=original_estimate,
            epic_key=epic_key,
            epic_summary=epic_summary,
            parent_key=parent_key,
            subtask_keys=subtask_keys
        )
