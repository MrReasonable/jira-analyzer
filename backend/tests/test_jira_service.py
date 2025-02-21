import pytest
from unittest.mock import Mock, patch, call
from datetime import datetime, timezone
from app.services.jira_service import JiraService
from app.core.models import JiraConfig, WorkflowConfig
from jira import JIRA

@pytest.fixture
def jira_config():
    """Create sample Jira configuration"""
    return JiraConfig(
        url="https://jira.example.com",
        username="test",
        api_token="test-token",
        workflow={"statuses": [], "expected_path": []}
    )

@pytest.fixture
def mock_jira():
    """Create mock JIRA client"""
    with patch('app.services.jira_service.JIRA') as mock:
        client = Mock()
        mock.return_value = client
        yield client

def test_service_initialization(jira_config, mock_jira):
    """Test JiraService initialization"""
    service = JiraService(jira_config)
    
    assert service.config == jira_config
    assert service.client == mock_jira
    mock_jira.assert_called_once_with(
        server=jira_config.url,
        basic_auth=(jira_config.username, jira_config.api_token),
        options={'verify': True, 'timeout': 30, 'max_retries': 3}
    )

def test_test_connection_success(jira_config, mock_jira):
    """Test successful connection test"""
    mock_jira.server_info.return_value = {"version": "8.0.0"}
    service = JiraService(jira_config)
    
    assert service.test_connection() is True
    mock_jira.server_info.assert_called_once()

def test_test_connection_failure(jira_config, mock_jira):
    """Test failed connection test"""
    mock_jira.server_info.side_effect = Exception("Connection failed")
    service = JiraService(jira_config)
    
    assert service.test_connection() is False
    mock_jira.server_info.assert_called_once()

def test_get_teams(jira_config, mock_jira):
    """Test team/project retrieval"""
    mock_project = Mock()
    mock_project.id = "1"
    mock_project.key = "TEST"
    mock_project.name = "Test Project"
    mock_project.projectTypeKey = "software"
    mock_project.projectCategory = Mock(name="Test Category")
    
    mock_jira.projects.return_value = [mock_project]
    service = JiraService(jira_config)
    
    teams = service.get_teams()
    assert len(teams) == 1
    assert teams[0]["key"] == "TEST"
    assert teams[0]["name"] == "Test Project"
    assert teams[0]["category"] == "Test Category"

def test_get_filters(jira_config, mock_jira):
    """Test filter retrieval"""
    mock_filter = Mock()
    mock_filter.id = "1"
    mock_filter.name = "My Filter"
    mock_filter.jql = "project = TEST"
    mock_filter.owner = Mock(displayName="Test User")
    
    mock_jira.favourite_filters.return_value = [mock_filter]
    service = JiraService(jira_config)
    
    filters = service.get_filters()
    assert len(filters) == 1
    assert filters[0]["name"] == "My Filter"
    assert filters[0]["jql"] == "project = TEST"
    assert filters[0]["owner"] == "Test User"

def test_validate_filter_success(jira_config, mock_jira):
    """Test successful filter validation"""
    mock_filter = Mock()
    mock_filter.id = "1"
    mock_filter.name = "Test Filter"
    mock_filter.jql = "project = TEST"
    mock_filter.owner = Mock(displayName="Test User")
    
    mock_jira.favourite_filters.return_value = [mock_filter]
    mock_jira.filter.return_value = mock_filter
    
    service = JiraService(jira_config)
    result = service.validate_filter("Test Filter")
    
    assert result is not None
    assert result["name"] == "Test Filter"
    assert result["jql"] == "project = TEST"

def test_validate_filter_not_found(jira_config, mock_jira):
    """Test filter validation with non-existent filter"""
    mock_jira.favourite_filters.return_value = []
    service = JiraService(jira_config)
    
    result = service.validate_filter("Non-existent")
    assert result is None

def test_extract_workflow(jira_config, mock_jira):
    """Test workflow extraction"""
    # Mock issue with changelog
    mock_issue = Mock()
    mock_issue.fields.status.name = "Done"
    
    mock_history = Mock()
    mock_history.items = [
        Mock(field="status", fromString="To Do", toString="In Progress"),
        Mock(field="status", fromString="In Progress", toString="Done")
    ]
    mock_issue.changelog.histories = [mock_history]
    
    # Mock project statuses
    mock_project = Mock(id="1")
    mock_statuses = [{
        "statuses": [
            {"name": "To Do"},
            {"name": "In Progress"},
            {"name": "Done"}
        ]
    }]
    
    mock_jira.search_issues.return_value = [mock_issue]
    mock_jira.project.return_value = mock_project
    mock_jira._get_json.return_value = mock_statuses
    
    service = JiraService(jira_config)
    workflow = service.extract_workflow("TEST")
    
    assert isinstance(workflow, WorkflowConfig)
    assert "To Do" in workflow.all_statuses
    assert "In Progress" in workflow.all_statuses
    assert "Done" in workflow.all_statuses
    assert "To Do" in workflow.initial_statuses
    assert "Done" in workflow.final_statuses
    assert "To Do" in workflow.transitions
    assert "In Progress" in workflow.transitions["To Do"]

def test_fetch_issues(jira_config, mock_jira):
    """Test issue fetching"""
    mock_issue = Mock()
    mock_issue.fields.summary = "Test Issue"
    mock_issue.fields.status.name = "In Progress"
    mock_jira.search_issues.return_value = [mock_issue]
    
    service = JiraService(jira_config)
    issues = service.fetch_issues("project = TEST")
    
    assert len(issues) == 1
    mock_jira.search_issues.assert_called_with(
        "project = TEST",
        startAt=0,
        maxResults=100,
        expand='changelog',
        fields=','.join([
            'summary', 'status', 'created', 'timeoriginalestimate',
            'timespent', 'parent', 'subtasks', 'customfield_10014',
            'customfield_10015'
        ])
    )

def test_error_handling(jira_config, mock_jira):
    """Test error handling"""
    mock_jira.search_issues.side_effect = Exception("API error")
    service = JiraService(jira_config)
    
    with pytest.raises(Exception) as exc:
        service.fetch_issues("project = TEST")
    assert "API error" in str(exc.value)

@patch('app.services.jira_service.logger')
def test_error_logging(mock_logger, jira_config, mock_jira):
    """Test error logging"""
    mock_jira.server_info.side_effect = Exception("Connection error")
    service = JiraService(jira_config)
    
    service.test_connection()
    mock_logger.error.assert_called_with("Failed to connect to Jira: Connection error")

def test_workflow_extraction_edge_cases(jira_config, mock_jira):
    """Test workflow extraction edge cases"""
    # Empty project
    mock_jira.search_issues.return_value = []
    mock_jira.project.return_value = Mock(id="1")
    mock_jira._get_json.return_value = []
    
    service = JiraService(jira_config)
    workflow = service.extract_workflow("TEST")
    
    assert isinstance(workflow, WorkflowConfig)
    assert len(workflow.all_statuses) == 0
    assert len(workflow.suggested_flow) == 0

def test_filter_validation_edge_cases(jira_config, mock_jira):
    """Test filter validation edge cases"""
    # Filter with missing attributes
    mock_filter = Mock(spec=['id', 'name'])  # Only id and name
    mock_filter.id = "1"
    mock_filter.name = "Test Filter"
    
    mock_jira.favourite_filters.return_value = [mock_filter]
    mock_jira.filter.return_value = mock_filter
    
    service = JiraService(jira_config)
    result = service.validate_filter("Test Filter")
    
    assert result is not None
    assert result["name"] == "Test Filter"
    assert result["jql"] == ""  # Default value for missing attribute
    assert result["owner"] == "Unknown"  # Default value for missing attribute

def test_pagination(jira_config, mock_jira):
    """Test issue fetching with pagination"""
    service = JiraService(jira_config)
    
    # Fetch with different pagination parameters
    service.fetch_issues("project = TEST", start_at=50, max_results=25)
    
    mock_jira.search_issues.assert_called_with(
        "project = TEST",
        startAt=50,
        maxResults=25,
        expand='changelog',
        fields=pytest.ANY
    )

def test_client_options(jira_config):
    """Test JIRA client options"""
    # Modify config options
    with patch('app.services.jira_service.JIRA') as mock_jira:
        service = JiraService(jira_config)
        
        # Verify timeout and retry settings
        options = mock_jira.call_args[1]['options']
        assert options['timeout'] == 30
        assert options['max_retries'] == 3
        assert options['verify'] is True
