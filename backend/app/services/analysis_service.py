from datetime import datetime
from typing import Tuple, Dict, Any, Optional

from app.core.models import JiraConfig, TimeRange, AnalysisResult
from app.core.analyzer import CycleTimeAnalyzer
from app.services.jira_service import JiraService
from app.utils.time_utils import build_analysis_jql
from app.utils.logging import get_logger
from app.api.validators import validate_jira_config, validate_connection_request
from app.api.error_handlers import ValidationError, JiraConnectionError

logger = get_logger(__name__)

class AnalysisService:
    """Service layer for handling analysis operations"""
    
    def __init__(self):
        self.jira_service = None
        self.last_request_data = None

    def initialize_from_request(self, data: Dict[str, Any]) -> None:
        """Initialize services from request data"""
        self.last_request_data = data
        is_valid, error_message = validate_jira_config(data)
        if not is_valid:
            raise ValidationError(error_message)

        # Get start and end states with defaults
        start_states = data.get('startStates', [])
        end_states = data.get('endStates', [])
        
        if not start_states and data.get('statuses'):
            start_states = [data['statuses'][0]]
        if not end_states and data.get('statuses'):
            end_states = [data['statuses'][-1]]

        config = JiraConfig(
            url=data['jiraUrl'],
            username=data['username'],
            api_token=data['apiToken'],
            workflow={
                'statuses': data.get('statuses', []),
                'expected_path': data.get('expectedPath', [])
            },
            start_states=start_states,
            end_states=end_states
        )
        
        self.jira_service = JiraService(config)
        if not self.jira_service.test_connection():
            raise JiraConnectionError()

    def validate_connection(self, data: Dict[str, Any]) -> bool:
        """Validate Jira connection with given credentials"""
        is_valid, error_message = validate_connection_request(data)
        if not is_valid:
            raise ValidationError(error_message)

        config = JiraConfig(
            url=data['jiraUrl'],
            username=data['username'],
            api_token=data['apiToken'],
            workflow={'statuses': [], 'expected_path': []},
            start_states=[],
            end_states=[]
        )
        
        jira_service = JiraService(config)
        if not jira_service.test_connection():
            raise JiraConnectionError()
        
        return True

    def analyze(self, data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """Perform complete analysis workflow"""
        self.last_request_data = data
        config, time_range, final_jql = self._create_analysis_config(data)
        
        # Initialize services with the complete config
        self.jira_service = JiraService(config)
        if not self.jira_service.test_connection():
            raise JiraConnectionError()
            
        result = self.perform_analysis(config, final_jql)
        
        if result.total_issues == 0:
            return {
                'status': 'warning',
                'message': 'No issues found matching the query',
                'data': self.create_empty_result(time_range, final_jql, config.end_states)
            }, 200
        
        return {
            'status': 'success',
            'data': self.format_analysis_result(result, final_jql, time_range)
        }, 200

    def _create_analysis_config(self, data: Dict[str, Any]) -> Tuple[JiraConfig, TimeRange, str]:
        """Create analysis configuration from request data"""
        # Parse time range
        time_range = TimeRange(
            start_date=datetime.fromisoformat(data['startDate']) if data.get('startDate') else None,
            end_date=datetime.fromisoformat(data['endDate']) if data.get('endDate') else None,
            preset=data.get('timePreset')
        )
        
        # Get start and end states with defaults
        start_states = data.get('startStates', [])
        end_states = data.get('endStates', [])
        
        if not start_states and data.get('statuses'):
            start_states = [data['statuses'][0]]
        if not end_states and data.get('statuses'):
            end_states = [data['statuses'][-1]]
        
        # Build appropriate JQL
        lead_time_jql = build_analysis_jql(data['jqlQuery'], time_range, end_states, lead_time_only=True)
        cycle_time_jql = build_analysis_jql(data['jqlQuery'], time_range, end_states, lead_time_only=False)
        final_jql = lead_time_jql if data.get('analysisType') == 'lead_time' else cycle_time_jql
        
        # Create configuration
        config = JiraConfig(
            url=data['jiraUrl'],
            username=data['username'],
            api_token=data['apiToken'],
            workflow={
                'statuses': data['statuses'],
                'expected_path': data['expectedPath']
            },
            start_states=start_states,
            end_states=end_states
        )
        
        return config, time_range, final_jql

    def perform_analysis(self, config: JiraConfig, jql_query: str) -> AnalysisResult:
        """Perform the analysis using the provided configuration"""
        analyzer = CycleTimeAnalyzer(config)
        return analyzer.analyze_issues(jql_query)

    def create_empty_result(self, time_range: TimeRange, jql: str, end_states: list) -> Dict[str, Any]:
        """Create an empty result structure when no issues are found"""
        config = self._create_analysis_config(self.last_request_data)[0]
        return {
            'total_issues': 0,
            'cycle_time_stats': {
                'mean': 0,
                'median': 0,
                'p85': 0,
                'p95': 0,
                'std_dev': 0
            },
            'status_distribution': {},
            'workflow_compliance': {
                'compliant_issues': 0,
                'compliance_rate': 0
            },
            'issues': [],
            'timeRange': {
                'startDate': time_range.start_date.isoformat() if time_range.start_date else None,
                'endDate': time_range.end_date.isoformat() if time_range.end_date else None,
                'preset': time_range.preset
            },
            'jql': jql,
            'cfd_data': {
                'dates': [],
                'status_counts': {},
                'wip_counts': []
            },
            'flow_efficiency_data': [],
            'epic_data': [],
            'end_states': end_states,
            'expected_path': config.workflow['expected_path']
        }

    def format_analysis_result(self, result: AnalysisResult, jql: str, time_range: TimeRange) -> Dict[str, Any]:
        """Format the analysis result for API response"""
        return {
            'total_issues': result.total_issues,
            'flow_metrics': result.flow_metrics,
            'workflow_compliance': result.workflow_compliance,
            'bottlenecks': result.bottlenecks,
            'cycle_time_stats': result.cycle_time_stats,
            'status_distribution': result.status_distribution,
            'expected_path': result.workflow.get('expected_path', []) if hasattr(result, 'workflow') else [],
            'issues': result.issues,
            'jql': jql,
            'timeRange': {
                'startDate': time_range.start_date.isoformat() if time_range.start_date else None,
                'endDate': time_range.end_date.isoformat() if time_range.end_date else None,
                'preset': time_range.preset
            },
            'cfd_data': {
                'dates': [d.isoformat() for d in result.cfd_data.dates] if result.cfd_data else [],
                'status_counts': result.cfd_data.status_counts if result.cfd_data else {},
                'wip_counts': result.cfd_data.wip_counts if result.cfd_data else []
            } if result.cfd_data else None,
            'flow_efficiency_data': [{
                'issue_key': item['issue_key'],
                'total_time': item['total_time'],
                'active_time': item['active_time'],
                'efficiency': item['efficiency']
            } for item in result.flow_efficiency_data] if result.flow_efficiency_data else None,
            'epic_data': [{
                'key': epic.key,
                'summary': epic.summary,
                'children': epic.children,
                'start_time': epic.start_time.isoformat() if epic.start_time else None,
                'end_time': epic.end_time.isoformat() if epic.end_time else None,
                'lead_time': epic.lead_time
            } for epic in result.epic_data] if result.epic_data else None,
            'end_states': result.end_states
        }
