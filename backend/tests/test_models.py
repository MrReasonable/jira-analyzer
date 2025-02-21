import pytest
from datetime import datetime, timezone, timedelta
import json
from app.core.models import (
    WorkflowConfig, StatusChange, CycleTimeBreakdown, IssueData,
    EpicData, CFDData, FlowEfficiencyData, TimeRange, JiraConfig,
    AnalysisResult, TeamConfig
)

@pytest.fixture
def sample_datetime():
    """Create sample datetime"""
    return datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)

def test_workflow_config():
    """Test WorkflowConfig dataclass"""
    config = WorkflowConfig(
        all_statuses=["To Do", "In Progress", "Done"],
        suggested_flow=["To Do", "In Progress", "Done"],
        initial_statuses=["To Do"],
        final_statuses=["Done"],
        transitions={"To Do": ["In Progress"], "In Progress": ["Done"]}
    )
    
    assert len(config.all_statuses) == 3
    assert len(config.suggested_flow) == 3
    assert config.initial_statuses == ["To Do"]
    assert config.final_statuses == ["Done"]
    assert "To Do" in config.transitions
    assert config.transitions["To Do"] == ["In Progress"]

def test_status_change(sample_datetime):
    """Test StatusChange dataclass"""
    change = StatusChange(
        from_status="To Do",
        to_status="In Progress",
        timestamp=sample_datetime
    )
    
    assert change.from_status == "To Do"
    assert change.to_status == "In Progress"
    assert change.timestamp == sample_datetime

def test_cycle_time_breakdown(sample_datetime):
    """Test CycleTimeBreakdown dataclass"""
    transitions = [
        StatusChange("To Do", "In Progress", sample_datetime),
        StatusChange("In Progress", "Done", sample_datetime + timedelta(days=1))
    ]
    
    breakdown = CycleTimeBreakdown(
        start_state="To Do",
        end_state="Done",
        duration=1.0,
        transitions=transitions
    )
    
    assert breakdown.start_state == "To Do"
    assert breakdown.end_state == "Done"
    assert breakdown.duration == 1.0
    assert len(breakdown.transitions) == 2

def test_issue_data(sample_datetime):
    """Test IssueData dataclass"""
    transitions = [
        StatusChange("To Do", "In Progress", sample_datetime),
        StatusChange("In Progress", "Done", sample_datetime + timedelta(days=1))
    ]
    
    issue = IssueData(
        key="TEST-1",
        summary="Test Issue",
        current_status="Done",
        created_date=sample_datetime,
        cycle_times={"In Progress": 1.0},
        total_cycle_time=1.0,
        transitions=transitions,
        time_spent=3600,
        original_estimate=7200,
        epic_key="EPIC-1",
        epic_summary="Epic",
        parent_key="PARENT-1",
        subtask_keys=["SUB-1"]
    )
    
    assert issue.key == "TEST-1"
    assert issue.summary == "Test Issue"
    assert issue.current_status == "Done"
    assert issue.created_date == sample_datetime
    assert issue.cycle_times["In Progress"] == 1.0
    assert issue.total_cycle_time == 1.0
    assert len(issue.transitions) == 2
    assert issue.time_spent == 3600
    assert issue.original_estimate == 7200
    assert issue.epic_key == "EPIC-1"
    assert issue.epic_summary == "Epic"
    assert issue.parent_key == "PARENT-1"
    assert issue.subtask_keys == ["SUB-1"]

def test_epic_data(sample_datetime):
    """Test EpicData dataclass"""
    epic = EpicData(
        key="EPIC-1",
        summary="Epic",
        children=["TEST-1", "TEST-2"],
        start_time=sample_datetime,
        end_time=sample_datetime + timedelta(days=1),
        lead_time=1.0
    )
    
    assert epic.key == "EPIC-1"
    assert epic.summary == "Epic"
    assert len(epic.children) == 2
    assert epic.start_time == sample_datetime
    assert epic.end_time == sample_datetime + timedelta(days=1)
    assert epic.lead_time == 1.0

def test_cfd_data(sample_datetime):
    """Test CFDData dataclass"""
    cfd = CFDData(
        dates=[sample_datetime, sample_datetime + timedelta(days=1)],
        status_counts={"To Do": [1, 0], "Done": [0, 1]},
        wip_counts=[1, 1]
    )
    
    assert len(cfd.dates) == 2
    assert len(cfd.status_counts["To Do"]) == 2
    assert len(cfd.wip_counts) == 2

def test_flow_efficiency_data():
    """Test FlowEfficiencyData dataclass"""
    efficiency = FlowEfficiencyData(
        issue_key="TEST-1",
        total_time=2.0,
        active_time=1.0,
        efficiency=0.5
    )
    
    assert efficiency.issue_key == "TEST-1"
    assert efficiency.total_time == 2.0
    assert efficiency.active_time == 1.0
    assert efficiency.efficiency == 0.5

def test_time_range(sample_datetime):
    """Test TimeRange dataclass"""
    time_range = TimeRange(
        start_date=sample_datetime,
        end_date=sample_datetime + timedelta(days=1),
        preset="two_weeks"
    )
    
    assert time_range.start_date == sample_datetime
    assert time_range.end_date == sample_datetime + timedelta(days=1)
    assert time_range.preset == "two_weeks"

def test_jira_config():
    """Test JiraConfig dataclass"""
    config = JiraConfig(
        url="https://jira.example.com",
        username="test",
        api_token="test-token",
        workflow={"statuses": ["To Do", "Done"]},
        start_states=["To Do"],
        end_states=["Done"],
        flow_efficiency_method="active_statuses",
        active_statuses=["In Progress"]
    )
    
    assert config.url == "https://jira.example.com"
    assert config.username == "test"
    assert config.api_token == "test-token"
    assert "statuses" in config.workflow
    assert config.start_states == ["To Do"]
    assert config.end_states == ["Done"]
    assert config.flow_efficiency_method == "active_statuses"
    assert config.active_statuses == ["In Progress"]

def test_analysis_result(sample_datetime):
    """Test AnalysisResult dataclass"""
    cfd = CFDData(
        dates=[sample_datetime],
        status_counts={"To Do": [1]},
        wip_counts=[1]
    )
    
    efficiency = FlowEfficiencyData(
        issue_key="TEST-1",
        total_time=2.0,
        active_time=1.0,
        efficiency=0.5
    )
    
    epic = EpicData(
        key="EPIC-1",
        summary="Epic",
        children=["TEST-1"]
    )
    
    result = AnalysisResult(
        total_issues=1,
        flow_metrics={"cycle_time": 1.0},
        workflow_compliance={"compliant": 1},
        bottlenecks=[{"status": "Review"}],
        cycle_time_stats={"mean": 1.0},
        status_distribution={"In Progress": 1},
        end_states=["Done"],
        issues=[{"key": "TEST-1"}],
        workflow={"statuses": ["To Do", "Done"]},
        cfd_data=cfd,
        flow_efficiency_data=[efficiency],
        epic_data=[epic]
    )
    
    assert result.total_issues == 1
    assert "cycle_time" in result.flow_metrics
    assert "compliant" in result.workflow_compliance
    assert len(result.bottlenecks) == 1
    assert "mean" in result.cycle_time_stats
    assert "In Progress" in result.status_distribution
    assert result.end_states == ["Done"]
    assert len(result.issues) == 1
    assert "statuses" in result.workflow
    assert isinstance(result.cfd_data, CFDData)
    assert len(result.flow_efficiency_data) == 1
    assert len(result.epic_data) == 1

def test_team_config_model(sample_datetime):
    """Test TeamConfig database model"""
    config = TeamConfig(
        name="Test Team",
        jira_url="https://jira.example.com",
        username="test",
        api_token="test-token",
        filter_jql="project = TEST",
        statuses=json.dumps(["To Do", "Done"]),
        expected_path=json.dumps(["To Do", "Done"]),
        start_states=json.dumps(["To Do"]),
        end_states=json.dumps(["Done"]),
        active_statuses=json.dumps(["In Progress"]),
        flow_efficiency_method="active_statuses",
        created_at=sample_datetime,
        updated_at=sample_datetime
    )
    
    assert config.name == "Test Team"
    assert config.jira_url == "https://jira.example.com"
    assert config.username == "test"
    assert config.api_token == "test-token"
    assert config.filter_jql == "project = TEST"
    assert json.loads(config.statuses) == ["To Do", "Done"]
    assert json.loads(config.expected_path) == ["To Do", "Done"]
    assert json.loads(config.start_states) == ["To Do"]
    assert json.loads(config.end_states) == ["Done"]
    assert json.loads(config.active_statuses) == ["In Progress"]
    assert config.flow_efficiency_method == "active_statuses"
    assert config.created_at == sample_datetime
    assert config.updated_at == sample_datetime

def test_team_config_to_dict(sample_datetime):
    """Test TeamConfig to_dict method"""
    config = TeamConfig(
        name="Test Team",
        jira_url="https://jira.example.com",
        username="test",
        api_token="test-token",
        statuses=json.dumps(["To Do", "Done"]),
        expected_path=json.dumps(["To Do", "Done"]),
        created_at=sample_datetime,
        updated_at=sample_datetime
    )
    
    data = config.to_dict()
    assert data["name"] == "Test Team"
    assert data["jiraUrl"] == "https://jira.example.com"
    assert data["username"] == "test"
    assert data["apiToken"] == "test-token"
    assert data["statuses"] == ["To Do", "Done"]
    assert data["expectedPath"] == ["To Do", "Done"]
    assert data["createdAt"] == sample_datetime.isoformat()
    assert data["updatedAt"] == sample_datetime.isoformat()

def test_team_config_from_dict():
    """Test TeamConfig from_dict method"""
    data = {
        "name": "Test Team",
        "jiraUrl": "https://jira.example.com",
        "username": "test",
        "apiToken": "test-token",
        "statuses": ["To Do", "Done"],
        "expectedPath": ["To Do", "Done"],
        "startStates": ["To Do"],
        "endStates": ["Done"],
        "activeStatuses": ["In Progress"],
        "flowEfficiencyMethod": "active_statuses"
    }
    
    config = TeamConfig.from_dict(data)
    assert config.name == "Test Team"
    assert config.jira_url == "https://jira.example.com"
    assert config.username == "test"
    assert config.api_token == "test-token"
    assert json.loads(config.statuses) == ["To Do", "Done"]
    assert json.loads(config.expected_path) == ["To Do", "Done"]
    assert json.loads(config.start_states) == ["To Do"]
    assert json.loads(config.end_states) == ["Done"]
    assert json.loads(config.active_statuses) == ["In Progress"]
    assert config.flow_efficiency_method == "active_statuses"

def test_team_config_timestamps():
    """Test TeamConfig timestamp handling"""
    config = TeamConfig(
        name="Test Team",
        jira_url="https://jira.example.com",
        username="test",
        api_token="test-token",
        statuses=json.dumps(["To Do", "Done"]),
        expected_path=json.dumps(["To Do", "Done"])
    )
    
    assert config.created_at is not None
    assert config.created_at.tzinfo == timezone.utc
    assert config.updated_at is not None
    assert config.updated_at.tzinfo == timezone.utc
