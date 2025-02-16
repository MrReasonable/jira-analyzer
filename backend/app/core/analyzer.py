from typing import List, Dict, Any
import logging
from app.core.models import JiraConfig, AnalysisResult, IssueData
from app.core.interfaces import IssueTrackingSystem
from app.services.issue_tracking import JiraIssueTracker
from app.core.analysis.factory import AnalysisComponentFactory

logger = logging.getLogger(__name__)

class CycleTimeAnalyzer:
    """Main analyzer class that orchestrates the analysis process"""
    
    def __init__(self, config: JiraConfig, issue_tracker: IssueTrackingSystem = None):
        """
        Initialize the analyzer with configuration and optional issue tracker
        
        Args:
            config: Configuration for the analyzer
            issue_tracker: Optional issue tracking system implementation
        """
        self.config = config
        self.issue_tracker = issue_tracker or JiraIssueTracker(config)
        self.components = AnalysisComponentFactory.create_all(config.__dict__)

    def analyze_issues(self, jql_query: str) -> AnalysisResult:
        """
        Analyze issues matching the JQL query
        
        Args:
            jql_query: JQL query string
            
        Returns:
            Analysis result containing metrics and issue data
        """
        issues = self._fetch_all_issues(jql_query)
        processed_issues = [self.issue_tracker.process_issue(issue) for issue in issues]
        return self._generate_report(processed_issues)

    def _fetch_all_issues(self, jql_query: str) -> List[Any]:
        """Fetch all issues matching the query with pagination"""
        all_issues = []
        start_at = 0
        batch_size = 100

        while True:
            batch = self.issue_tracker.fetch_issues(jql_query, start_at, batch_size)
            if not batch:
                break

            all_issues.extend(batch)
            if len(batch) < batch_size:
                break

            start_at += batch_size
            logger.info(f"Fetched {len(all_issues)} issues so far...")

        return all_issues

    def _generate_report(self, issues: List[IssueData]) -> AnalysisResult:
        """Generate comprehensive analysis report using components"""
        # Run all analysis components
        results: Dict[str, Any] = {}
        for name, component in self.components.items():
            component_results = component.analyze(issues)
            results.update(component_results)

        # Extract specific metrics from component results
        flow_metrics = results.get("flow_metrics", {})
        workflow_compliance = results.get("workflow_compliance", {})
        bottlenecks = results.get("bottlenecks", [])
        status_distribution = results.get("status_distribution", {})
        cfd_data = results.get("cfd_data", None)
        flow_efficiency_data = results.get("flow_efficiency_data", [])

        # Create standardized issue data
        issue_data = [{
            "key": issue.key,
            "summary": issue.summary,
            "cycleTime": float(issue.total_cycle_time),
            "statusTimes": {k: float(v) for k, v in issue.cycle_times.items()},
            "currentStatus": issue.current_status,
            "created": issue.created_date.isoformat(),
            "timeSpent": issue.time_spent,
            "originalEstimate": issue.original_estimate,
            "epicKey": issue.epic_key,
            "parentKey": issue.parent_key,
            "subtaskKeys": issue.subtask_keys
        } for issue in issues]

        return AnalysisResult(
            total_issues=len(issues),
            flow_metrics=flow_metrics,
            workflow_compliance=workflow_compliance,
            bottlenecks=bottlenecks,
            cycle_time_stats=flow_metrics.get("cycle_time", {}),
            status_distribution=status_distribution,
            end_states=self.config.end_states,
            issues=issue_data,
            cfd_data=cfd_data,
            flow_efficiency_data=flow_efficiency_data,
            epic_data=results.get("epic_data", [])
        )

    def register_component(self, name: str, component_class: Any) -> None:
        """Register a new analysis component"""
        AnalysisComponentFactory.register(name, component_class)
        self.components = AnalysisComponentFactory.create_all(self.config.__dict__)
