from dataclasses import dataclass
from datetime import datetime
from typing import List, Dict, Optional
from flask_sqlalchemy import SQLAlchemy
import json

# Initialize SQLAlchemy
db = SQLAlchemy()

@dataclass
class WorkflowConfig:
    """Represents a Jira workflow configuration"""
    all_statuses: List[str]
    suggested_flow: List[str]
    initial_statuses: List[str]
    final_statuses: List[str]
    transitions: Dict[str, List[str]]

@dataclass
class StatusChange:
    """Represents a status change event"""
    from_status: str
    to_status: str
    timestamp: datetime

@dataclass
class CycleTimeBreakdown:
    """Represents cycle time breakdown between states"""
    start_state: str
    end_state: str
    duration: float
    transitions: List[StatusChange]

@dataclass
class IssueData:
    """Represents processed issue data"""
    key: str
    summary: str
    current_status: str
    created_date: datetime
    cycle_times: Dict[str, float]
    total_cycle_time: float
    transitions: List[StatusChange]
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    cycle_breakdown: Optional[List[CycleTimeBreakdown]] = None

@dataclass
class JiraConfig:
    """Represents Jira configuration"""
    url: str
    username: str
    api_token: str
    workflow: Dict[str, List[str]]
    start_states: List[str] = None
    end_states: List[str] = None

@dataclass
class AnalysisResult:
    """Represents the analysis result"""
    total_issues: int
    flow_metrics: Dict
    workflow_compliance: Dict
    bottlenecks: List[Dict]
    cycle_time_stats: Dict
    status_distribution: Dict
    issues: List[Dict]

@dataclass
class TimeRange:
    """Represents a time range for analysis"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    preset: Optional[str] = None  # 'two_weeks', 'quarter', 'half_year', 'year'

class TeamConfig(db.Model):
    """Stored team configuration"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    jira_url = db.Column(db.String(500), nullable=False)
    username = db.Column(db.String(100), nullable=False)
    api_token = db.Column(db.String(100), nullable=False)
    project_key = db.Column(db.String(50))
    project_name = db.Column(db.String(100))
    filter_id = db.Column(db.String(50))
    filter_name = db.Column(db.String(100))
    filter_jql = db.Column(db.Text)
    statuses = db.Column(db.Text, nullable=False)  # JSON string
    expected_path = db.Column(db.Text, nullable=False)  # JSON string
    start_states = db.Column(db.Text)  # JSON string
    end_states = db.Column(db.Text)  # JSON string
    default_jql = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> Dict:
        """Convert to dictionary, parsing JSON fields"""
        return {
            'id': self.id,
            'name': self.name,
            'jiraUrl': self.jira_url,
            'username': self.username,
            'apiToken': self.api_token,
            'projectKey': self.project_key,
            'projectName': self.project_name,
            'filterId': self.filter_id,
            'filterName': self.filter_name,
            'filterJql': self.filter_jql,
            'statuses': json.loads(self.statuses),
            'expectedPath': json.loads(self.expected_path),
            'startStates': json.loads(self.start_states) if self.start_states else [],
            'endStates': json.loads(self.end_states) if self.end_states else [],
            'defaultJql': self.default_jql,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }

    @staticmethod
    def from_dict(data: Dict) -> 'TeamConfig':
        """Create from dictionary, handling JSON fields"""
        return TeamConfig(
            name=data['name'],
            jira_url=data['jiraUrl'],
            username=data['username'],
            api_token=data['apiToken'],
            project_key=data.get('projectKey'),
            project_name=data.get('projectName'),
            filter_id=data.get('filterId'),
            filter_name=data.get('filterName'),
            filter_jql=data.get('filterJql'),
            statuses=json.dumps(data['statuses']),
            expected_path=json.dumps(data['expectedPath']),
            start_states=json.dumps(data.get('startStates', [])),
            end_states=json.dumps(data.get('endStates', [])),
            default_jql=data.get('defaultJql')
        )