import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch, call
from app.services.issue_tracking import JiraIssueTracker
from app.core.models import JiraConfig, IssueData, StatusChange
from app.core.interfaces import IssueTrackingSystem

@pytest.fixture
def jira_config():
    """Create sample Jira configuration"""
    return JiraConfig(
        url="https://jira.example.com",
        username="test",
        api_token="test-token",
        workflow={
            "statuses": ["To Do", "In Progress", "Done"],
            "expected_path": ["To Do", "In Progress", "Done"]
        },
        start_states=["To Do"],
        end_states=["Done"]
    )

@pytest.fixture
def mock_raw_issue():
    """Create mock raw Jira issue"""
    issue = Mock()
    issue.key = "TEST-1"
    issue.fields.summary = "Test Issue"
    issue.fields.status.name = "Done"
    issue.fields.created = "2024-01-01T12:00:00"
    issue.fields.timespent = 3600  # 1 hour
    issue.fields.timeoriginalestimate = 7200  # 2 hours
    
    # Mock changelog
    history = Mock()
    history.created = "2024-01-01T13:00:00"
    history.items = [Mock(
        field="status",
        fromString="To Do",
        toString="In Progress"
    )]
    issue.changelog.histories = [history]
    
    return issue

def test_interface_implementation():
    """Test that JiraIssueTracker implements IssueTrackingSystem"""
    assert issubclass(JiraIssueTracker, IssueTrackingSystem)
    
    # Verify required methods
    assert hasattr(JiraIssueTracker, 'fetch_issues')
    assert hasattr(JiraIssueTracker, 'process_issue')

def test_tracker_initialization(jira_config):
    """Test issue tracker initialization"""
    with patch('app.services.issue_tracking.JiraService') as mock_jira:
        tracker = JiraIssueTracker(jira_config)
        
        assert tracker.config == jira_config
        assert tracker.jira_service == mock_jira.return_value
        mock_jira.assert_called_once_with(jira_config)

def test_fetch_issues(jira_config):
    """Test issue fetching"""
    with patch('app.services.issue_tracking.JiraService') as mock_jira:
        tracker = JiraIssueTracker(jira_config)
        tracker.fetch_issues("project = TEST", 0, 50)
        
        mock_jira.return_value.fetch_issues.assert_called_once_with(
            "project = TEST", 0, 50
        )

def test_process_issue_basic(jira_config, mock_raw_issue):
    """Test basic issue processing"""
    with patch('app.services.issue_tracking.JiraService'):
        tracker = JiraIssueTracker(jira_config)
        result = tracker.process_issue(mock_raw_issue)
        
        assert isinstance(result, IssueData)
        assert result.key == "TEST-1"
        assert result.summary == "Test Issue"
        assert result.current_status == "Done"
        assert result.time_spent == 3600
        assert result.original_estimate == 7200

def test_process_issue_status_changes(jira_config, mock_raw_issue):
    """Test processing of status changes"""
    with patch('app.services.issue_tracking.JiraService'):
        tracker = JiraIssueTracker(jira_config)
        result = tracker.process_issue(mock_raw_issue)
        
        assert len(result.transitions) == 2  # Initial + one change
        assert result.transitions[0].from_status == "To Do"
        assert result.transitions[0].to_status == "To Do"  # Initial state
        assert result.transitions[1].from_status == "To Do"
        assert result.transitions[1].to_status == "In Progress"

def test_process_issue_epic_relationship(jira_config, mock_raw_issue):
    """Test processing of epic relationships"""
    mock_raw_issue.fields.customfield_10014 = "EPIC-1"
    mock_epic = Mock()
    mock_epic.fields.summary = "Epic Summary"
    
    with patch('app.services.issue_tracking.JiraService') as mock_jira:
        mock_jira.return_value.client.issue.return_value = mock_epic
        
        tracker = JiraIssueTracker(jira_config)
        result = tracker.process_issue(mock_raw_issue)
        
        assert result.epic_key == "EPIC-1"
        assert result.epic_summary == "Epic Summary"

def test_process_issue_parent_relationship(jira_config, mock_raw_issue):
    """Test processing of parent relationships"""
    mock_raw_issue.fields.parent = Mock(key="PARENT-1")
    mock_raw_issue.fields.subtasks = [Mock(key="SUB-1"), Mock(key="SUB-2")]
    
    with patch('app.services.issue_tracking.JiraService'):
        tracker = JiraIssueTracker(jira_config)
        result = tracker.process_issue(mock_raw_issue)
        
        assert result.parent_key == "PARENT-1"
        assert result.subtask_keys == ["SUB-1", "SUB-2"]

def test_process_issue_cycle_times(jira_config, mock_raw_issue):
    """Test cycle time calculations"""
    # Add multiple status changes
    history1 = Mock()
    history1.created = "2024-01-01T13:00:00"
    history1.items = [Mock(field="status", fromString="To Do", toString="In Progress")]
    
    history2 = Mock()
    history2.created = "2024-01-01T14:00:00"
    history2.items = [Mock(field="status", fromString="In Progress", toString="Done")]
    
    mock_raw_issue.changelog.histories = [history1, history2]
    
    with patch('app.services.issue_tracking.JiraService'):
        tracker = JiraIssueTracker(jira_config)
        result = tracker.process_issue(mock_raw_issue)
        
        assert result.total_cycle_time > 0
        assert "In Progress" in result.cycle_times
        assert result.cycle_times["In Progress"] > 0

def test_process_issue_no_transitions(jira_config, mock_raw_issue):
    """Test processing issue with no transitions"""
    mock_raw_issue.changelog.histories = []
    
    with patch('app.services.issue_tracking.JiraService'):
        tracker = JiraIssueTracker(jira_config)
        result = tracker.process_issue(mock_raw_issue)
        
        assert len(result.transitions) == 1  # Just the initial state
        assert result.transitions[0].from_status == result.current_status
        assert result.transitions[0].to_status == result.current_status

def test_process_issue_epic_fallback(jira_config, mock_raw_issue):
    """Test epic processing fallback behavior"""
    mock_raw_issue.fields.customfield_10014 = "EPIC-1"
    mock_raw_issue.fields.customfield_10015 = "Epic Name"  # Fallback field
    
    with patch('app.services.issue_tracking.JiraService') as mock_jira:
        # Make epic fetch fail
        mock_jira.return_value.client.issue.side_effect = Exception("Epic not found")
        
        tracker = JiraIssueTracker(jira_config)
        result = tracker.process_issue(mock_raw_issue)
        
        assert result.epic_key == "EPIC-1"
        assert result.epic_summary == "Epic Name"  # Should use fallback

def test_process_issue_timezone_handling(jira_config, mock_raw_issue):
    """Test timezone handling in dates"""
    with patch('app.services.issue_tracking.JiraService'):
        tracker = JiraIssueTracker(jira_config)
        result = tracker.process_issue(mock_raw_issue)
        
        assert result.created_date.tzinfo == timezone.utc
        for transition in result.transitions:
            assert transition.timestamp.tzinfo == timezone.utc

@patch('app.services.issue_tracking.logger')
def test_error_logging(mock_logger, jira_config, mock_raw_issue):
    """Test error logging"""
    with patch('app.services.issue_tracking.JiraService') as mock_jira:
        mock_jira.return_value.client.issue.side_effect = Exception("API error")
        
        tracker = JiraIssueTracker(jira_config)
        result = tracker.process_issue(mock_raw_issue)
        
        mock_logger.info.assert_called()  # Should log time tracking info

def test_process_issue_missing_fields(jira_config, mock_raw_issue):
    """Test handling of missing fields"""
    # Remove optional fields
    del mock_raw_issue.fields.timespent
    del mock_raw_issue.fields.timeoriginalestimate
    del mock_raw_issue.fields.parent
    del mock_raw_issue.fields.subtasks
    
    with patch('app.services.issue_tracking.JiraService'):
        tracker = JiraIssueTracker(jira_config)
        result = tracker.process_issue(mock_raw_issue)
        
        assert result.time_spent is None
        assert result.original_estimate is None
        assert result.parent_key is None
        assert result.subtask_keys == []

def test_process_issue_invalid_dates(jira_config, mock_raw_issue):
    """Test handling of invalid dates"""
    mock_raw_issue.fields.created = "invalid date"
    
    with patch('app.services.issue_tracking.JiraService'), \
         pytest.raises(ValueError):
        tracker = JiraIssueTracker(jira_config)
        tracker.process_issue(mock_raw_issue)
