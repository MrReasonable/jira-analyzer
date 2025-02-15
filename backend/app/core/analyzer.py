from datetime import datetime
import numpy as np
import pandas as pd
from typing import List, Dict, Any
import logging
from app.core.models import StatusChange, IssueData, JiraConfig, AnalysisResult
from app.services.jira_service import JiraService

logger = logging.getLogger(__name__)

class JiraCycleTimeAnalyzer:
    def __init__(self, config: JiraConfig):
        """Initialize the analyzer with configuration"""
        self.config = config
        self.jira_service = JiraService(config)
        self.workflow = config.workflow

    def analyze_issues(self, jql_query: str) -> AnalysisResult:
        """
        Analyze issues matching the JQL query
        
        Args:
            jql_query: JQL query string
            
        Returns:
            Analysis result containing metrics and issue data
        """
        issues = self._fetch_all_issues(jql_query)
        processed_issues = [self._process_issue(issue) for issue in issues]
        return self._generate_report(processed_issues)

    def _fetch_all_issues(self, jql_query: str) -> List[Any]:
        """Fetch all issues matching the query with pagination"""
        all_issues = []
        start_at = 0
        batch_size = 100

        while True:
            batch = self.jira_service.fetch_issues(jql_query, start_at, batch_size)
            if not batch:
                break

            all_issues.extend(batch)
            if len(batch) < batch_size:
                break

            start_at += batch_size
            logger.info(f"Fetched {len(all_issues)} issues so far...")

        return all_issues

    def _process_issue(self, issue: Any) -> IssueData:
        """Process a single issue to extract cycle time data"""
        status_changes = []
        current_status = issue.fields.status.name

        for history in issue.changelog.histories:
            for item in history.items:
                if item.field == 'status':
                    timestamp = datetime.strptime(
                        history.created.split('.')[0],
                        '%Y-%m-%dT%H:%M:%S'
                    )
                    status_changes.append(StatusChange(
                        from_status=item.fromString,
                        to_status=item.toString,
                        timestamp=timestamp
                    ))

        cycle_times = self._calculate_cycle_times(status_changes)
        total_cycle_time = sum(cycle_times.values())

        return IssueData(
            key=issue.key,
            summary=issue.fields.summary,
            current_status=current_status,
            created_date=datetime.strptime(
                issue.fields.created.split('.')[0],
                '%Y-%m-%dT%H:%M:%S'
            ),
            cycle_times=cycle_times,
            total_cycle_time=total_cycle_time,
            transitions=status_changes
        )

    def _calculate_cycle_times(self, status_changes: List[StatusChange]) -> Dict[str, float]:
        """Calculate time spent in each status"""
        cycle_times = {status: 0.0 for status in self.workflow['statuses']}
        
        if not status_changes:
            return cycle_times

        for i in range(len(status_changes)):
            current = status_changes[i]
            next_change = status_changes[i + 1] if i < len(status_changes) - 1 else None
            
            if next_change:
                time_diff = (next_change.timestamp - current.timestamp).total_seconds() / 86400
                if current.to_status in cycle_times:
                    cycle_times[current.to_status] += time_diff

        return cycle_times

    def _analyze_workflow_compliance(self, issues: List[IssueData]) -> Dict[str, Any]:
        """Analyze workflow compliance"""
        expected_path = self.workflow['expected_path']
        compliance_data = []
        
        for issue in issues:
            transitions = issue.transitions
            actual_path = [t.to_status for t in transitions]
            
            compliant = True
            current_idx = 0
            
            for status in actual_path:
                if current_idx >= len(expected_path):
                    compliant = False
                    break
                    
                if status != expected_path[current_idx]:
                    if status in expected_path[:current_idx]:
                        continue
                    elif status in expected_path[current_idx:]:
                        current_idx = expected_path.index(status)
                    else:
                        compliant = False
                        break
                else:
                    current_idx += 1
            
            compliance_data.append({
                'issue_key': issue.key,
                'compliant': compliant,
                'actual_path': ' -> '.join(actual_path)
            })
            
        df = pd.DataFrame(compliance_data)
        return {
            'compliant_issues': df['compliant'].sum(),
            'compliance_rate': (df['compliant'].mean() * 100),
            'non_compliant_paths': df[~df['compliant']]['actual_path'].tolist()
        }
    
    def _calculate_status_distribution(self, issues: List[IssueData]) -> Dict[str, Dict[str, float]]:
        """Calculate time distribution across different statuses"""
        status_times = {status: [] for status in self.workflow['statuses']}
        
        for issue in issues:
            for status, time in issue.cycle_times.items():
                if status in status_times:
                    status_times[status].append(float(time))
        
        distribution = {}
        for status, times in status_times.items():
            if times:
                distribution[status] = {
                    'mean': float(np.mean(times)),
                    'median': float(np.median(times)),
                    'p85': float(np.percentile(times, 85)),
                    'std_dev': float(np.std(times))
                }
            else:
                distribution[status] = {
                    'mean': 0.0,
                    'median': 0.0,
                    'p85': 0.0,
                    'std_dev': 0.0
                }
                
        return distribution

    def _calculate_flow_metrics(self, issues: List[IssueData]) -> Dict[str, Any]:
        """Calculate flow metrics"""
        cycle_times = [float(issue.total_cycle_time) for issue in issues]
        
        metrics = {
            'throughput': int(len(issues)),
            'cycle_time': {
                'mean': float(np.mean(cycle_times)) if cycle_times else 0.0,
                'median': float(np.median(cycle_times)) if cycle_times else 0.0,
                'p85': float(np.percentile(cycle_times, 85)) if cycle_times else 0.0,
                'p95': float(np.percentile(cycle_times, 95)) if cycle_times else 0.0,
                'std_dev': float(np.std(cycle_times)) if cycle_times else 0.0
            }
        }
        
        distribution = self._calculate_status_distribution(issues)
        bottlenecks = self._identify_bottlenecks(issues)
        
        metrics['status_distribution'] = distribution
        metrics['bottlenecks'] = [
            {
                'status': b['status'],
                'avg_time': float(b['avg_time']),
                'std_dev': float(b['std_dev']),
                'bottleneck_score': float(b['bottleneck_score']),
                'impact': b['impact']
            }
            for b in bottlenecks
        ]
        
        return metrics    

    def _identify_bottlenecks(self, issues: List[IssueData]) -> List[Dict[str, Any]]:
        """Identify potential bottlenecks in the workflow"""
        status_distribution = self._calculate_status_distribution(issues)
        bottlenecks = []
        
        for status, metrics in status_distribution.items():
            if metrics['mean'] > 0:
                bottleneck_score = (metrics['mean'] * metrics['std_dev']) / metrics['median'] if metrics['median'] > 0 else 0
                
                bottlenecks.append({
                    'status': status,
                    'avg_time': metrics['mean'],
                    'std_dev': metrics['std_dev'],
                    'bottleneck_score': bottleneck_score,
                    'impact': 'High' if bottleneck_score > 5 else 'Medium' if bottleneck_score > 2 else 'Low'
                })
        
        bottlenecks.sort(key=lambda x: x['bottleneck_score'], reverse=True)
        return bottlenecks

    def _generate_report(self, issues: List[IssueData]) -> AnalysisResult:
        """Generate comprehensive analysis report"""
        flow_metrics = self._calculate_flow_metrics(issues)
        workflow_compliance = self._analyze_workflow_compliance(issues)
        
        return AnalysisResult(
            total_issues=int(len(issues)),  # Ensure it's a Python int
            flow_metrics=flow_metrics,
            workflow_compliance=workflow_compliance,
            bottlenecks=flow_metrics['bottlenecks'],
            cycle_time_stats={
                'mean': float(flow_metrics['cycle_time']['mean']),
                'median': float(flow_metrics['cycle_time']['median']),
                'p85': float(flow_metrics['cycle_time']['p85']),
                'p95': float(flow_metrics['cycle_time']['p95']),
                'std_dev': float(flow_metrics['cycle_time']['std_dev'])
            },
            status_distribution=flow_metrics['status_distribution'],
            issues=[{
                'key': issue.key,
                'summary': issue.summary,
                'cycleTime': float(issue.total_cycle_time),
                'statusTimes': {k: float(v) for k, v in issue.cycle_times.items()},
                'currentStatus': issue.current_status,
                'created': issue.created_date.isoformat()
            } for issue in issues]
        )

