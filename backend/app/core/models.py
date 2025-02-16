from dataclasses import dataclass, field
from datetime import datetime, timezone
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
    time_spent: Optional[int] = None  # Time spent in seconds
    original_estimate: Optional[int] = None  # Original estimate in seconds
    epic_key: Optional[str] = None  # Epic link
    parent_key: Optional[str] = None  # Parent issue key
    subtask_keys: List[str] = field(default_factory=list)  # List of subtask keys

@dataclass
class EpicData:
    """Represents epic analysis data"""
    key: str
    summary: str
    children: List[str]  # List of child issue keys
    start_time: Optional[datetime] = None  # First child enters in-progress
    end_time: Optional[datetime] = None  # Last child enters done
    lead_time: Optional[float] = None  # Total lead time in days

@dataclass
class CFDData:
    """Represents Cumulative Flow Diagram data"""
    dates: List[datetime]
    status_counts: Dict[str, List[int]]  # Status -> list of counts per date
    wip_counts: List[int]  # WIP count per date

@dataclass
class FlowEfficiencyData:
    """Represents Flow Efficiency data"""
    issue_key: str
    total_time: float  # Total lead time in days
    active_time: float  # Time spent actively working (from time tracking)
    efficiency: float  # Percentage of active time vs total time

@dataclass
class JiraConfig:
    """Represents Jira configuration"""
    url: str
    username: str
    api_token: str
    workflow: Dict[str, List[str]]
    start_states: List[str] = field(default_factory=list)
    end_states: List[str] = field(default_factory=list)

@dataclass
class AnalysisResult:
    """Represents the analysis result"""
    total_issues: int
    flow_metrics: Dict
    workflow_compliance: Dict
    bottlenecks: List[Dict]
    cycle_time_stats: Dict
    status_distribution: Dict
    end_states: List[str]
    issues: List[Dict]
    cfd_data: Optional[CFDData] = None
    flow_efficiency_data: Optional[List[FlowEfficiencyData]] = None
    epic_data: Optional[List[EpicData]] = None

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
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

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
