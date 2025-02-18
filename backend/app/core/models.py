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
    epic_summary: Optional[str] = None  # Epic summary
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
class TimeRange:
    """Represents a time range for analysis"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    preset: Optional[str] = None  # 'two_weeks', 'quarter', 'half_year', 'year'

@dataclass
class JiraConfig:
    """Represents Jira configuration"""
    url: str
    username: str
    api_token: str
    workflow: Dict[str, List[str]]
    start_states: List[str] = field(default_factory=list)
    end_states: List[str] = field(default_factory=list)
    time_range: Optional[TimeRange] = None
    flow_efficiency_method: str = 'active_statuses'
    active_statuses: List[str] = field(default_factory=list)

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
    workflow: Dict[str, List[str]]  # Added workflow field
    cfd_data: Optional[CFDData] = None
    flow_efficiency_data: Optional[List[FlowEfficiencyData]] = None
    epic_data: Optional[List[EpicData]] = None

class TeamConfig(db.Model):
    """Stored team configuration"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    jira_url = db.Column(db.String(500), nullable=False)
    username = db.Column(db.String(100), nullable=False)
    api_token = db.Column(db.String(100), nullable=False)
    filter_jql = db.Column(db.Text)  # The JQL query to use
    statuses = db.Column(db.Text, nullable=False)  # JSON string of workflow statuses
    expected_path = db.Column(db.Text, nullable=False)  # JSON string of expected workflow path
    start_states = db.Column(db.Text)  # JSON string of start states
    end_states = db.Column(db.Text)  # JSON string of end states
    active_statuses = db.Column(db.Text)  # JSON string of active statuses
    flow_efficiency_method = db.Column(db.Text)  # 'active_statuses' or 'time_logged'
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
            'filterJql': self.filter_jql,
            'statuses': json.loads(self.statuses),
            'expectedPath': json.loads(self.expected_path),
            'startStates': json.loads(self.start_states) if self.start_states else [],
            'endStates': json.loads(self.end_states) if self.end_states else [],
            'activeStatuses': json.loads(self.active_statuses) if self.active_statuses else [],
            'flowEfficiencyMethod': self.flow_efficiency_method or 'active_statuses',
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
            filter_jql=data.get('filterJql'),
            statuses=json.dumps(data['statuses']),
            expected_path=json.dumps(data['expectedPath']),
            start_states=json.dumps(data.get('startStates', [])),
            end_states=json.dumps(data.get('endStates', [])),
            active_statuses=json.dumps(data.get('activeStatuses', [])),
            flow_efficiency_method=data.get('flowEfficiencyMethod', 'active_statuses')
        )
