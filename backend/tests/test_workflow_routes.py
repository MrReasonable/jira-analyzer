import pytest
from flask import Flask, json
from unittest.mock import patch, Mock, call
from app.api.workflow_routes import workflow_api
from app.core.models import WorkflowConfig, JiraConfig
from app.api.error_handlers import register_error_handlers

@pytest.fixture
def app():
    """Create Flask app for testing"""
    app = Flask(__name__)
    app.config['TESTING'] = True
    
    # Setup custom JSON provider
    from app.utils.json_encoder import NumpyJSONProvider
    app.json = NumpyJSONProvider(app)
    
    app.register_blueprint(workflow_api)
    register_error_handlers(app)
    return app

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

@pytest.fixture
def jira_credentials():
    """Create sample Jira credentials"""
    return {
        "jiraUrl": "https://jira.example.com",
        "username": "test",
        "apiToken": "test-token"
    }

@patch('app.api.workflow_routes.JiraService')
def test_get_teams_success(JiraService, client, jira_credentials):
    """Test successful teams retrieval"""
    # Given a mock service that returns teams
    mock_service = Mock()
    JiraService.return_value = mock_service
    mock_service.test_connection.return_value = True
    mock_service.get_teams.return_value = [
        {
            'id': '1',
            'key': 'TEAM1',
            'name': 'Team 1',
            'type': 'software',
            'category': None
        },
        {
            'id': '2',
            'key': 'TEAM2',
            'name': 'Team 2',
            'type': 'software',
            'category': None
        }
    ]
    
    response = client.post(
        '/teams',
        data=json.dumps(jira_credentials),
        content_type='application/json'
    )
    
    assert response.status_code == 200
    assert response.json['status'] == 'success'
    assert len(response.json['data']) == 2
    assert response.json['data'][0]['key'] == 'TEAM1'

def test_get_teams_missing_fields(client):
    """Test teams retrieval with missing fields"""
    response = client.post(
        '/teams',
        data=json.dumps({"jiraUrl": "https://jira.example.com"}),
        content_type='application/json'
    )
    
    assert response.status_code == 400
    assert response.json['status'] == 'error'
    assert 'Missing required fields' in response.json['message']

@patch('app.api.workflow_routes.JiraService')
def test_get_teams_connection_error(JiraService, client, jira_credentials):
    """Test teams retrieval with connection error"""
    # Given a mock service that fails connection test
    mock_service = Mock()
    JiraService.return_value = mock_service
    mock_service.test_connection.return_value = False
    
    response = client.post(
        '/teams',
        data=json.dumps(jira_credentials),
        content_type='application/json'
    )
    
    assert response.status_code == 401
    assert response.json['status'] == 'error'
    assert 'Failed to connect' in response.json['message']

@patch('app.api.workflow_routes.JiraService')
def test_get_filters_success(JiraService, client, jira_credentials):
    """Test successful filters retrieval"""
    # Given a mock service that returns filters
    mock_service = Mock()
    JiraService.return_value = mock_service
    mock_service.test_connection.return_value = True
    mock_service.get_filters.return_value = [
        {
            "id": "1",
            "name": "My Issues",
            "jql": "assignee = currentUser()",
            "owner": "Test User",
            "favourite": True
        },
        {
            "id": "2",
            "name": "Team Issues",
            "jql": "project = TEST",
            "owner": "Test User",
            "favourite": True
        }
    ]
    
    response = client.post(
        '/filters',
        data=json.dumps(jira_credentials),
        content_type='application/json'
    )
    
    assert response.status_code == 200
    assert response.json['status'] == 'success'
    assert len(response.json['data']) == 2
    assert response.json['data'][0]['name'] == 'My Issues'

def test_get_filters_missing_fields(client):
    """Test filters retrieval with missing fields"""
    response = client.post(
        '/filters',
        data=json.dumps({"jiraUrl": "https://jira.example.com"}),
        content_type='application/json'
    )
    
    assert response.status_code == 400
    assert response.json['status'] == 'error'
    assert 'Missing required fields' in response.json['message']

@patch('app.api.workflow_routes.JiraService')
def test_validate_filter_success(JiraService, client, jira_credentials):
    """Test successful filter validation"""
    # Given a mock service that validates a filter
    mock_service = Mock()
    JiraService.return_value = mock_service
    mock_service.test_connection.return_value = True
    mock_service.validate_filter.return_value = {
        "id": "1",
        "name": "My Filter",
        "jql": "project = TEST",
        "owner": "Test User",
        "favourite": True
    }
    
    # When validating a filter
    filter_data = {**jira_credentials, "filterName": "My Filter"}
    response = client.post(
        '/validate-filter',
        data=json.dumps(filter_data),
        content_type='application/json'
    )
    
    # Then the response should indicate success
    
    assert response.status_code == 200
    assert response.json['status'] == 'success'
    assert response.json['data']['name'] == 'My Filter'

@patch('app.api.workflow_routes.JiraService')
def test_validate_filter_not_found(JiraService, client, jira_credentials):
    """Test filter validation with non-existent filter"""
    # Given a mock service that finds no matching filter
    mock_service = Mock()
    JiraService.return_value = mock_service
    mock_service.test_connection.return_value = True
    mock_service.validate_filter.return_value = None
    
    # When validating a non-existent filter
    filter_data = {**jira_credentials, "filterName": "Non-existent"}
    response = client.post(
        '/validate-filter',
        data=json.dumps(filter_data),
        content_type='application/json'
    )
    
    # Then the response should indicate not found
    
    assert response.status_code == 404
    assert response.json['status'] == 'error'
    assert 'not found' in response.json['message']

def test_extract_workflow_success(client, jira_credentials, mock_jira_service):
    """Test successful workflow extraction"""
    workflow_data = {**jira_credentials, "projectKey": "TEST"}
    mock_workflow = WorkflowConfig(
        all_statuses=["To Do", "In Progress", "Done"],
        suggested_flow=["To Do", "In Progress", "Done"],
        initial_statuses=["To Do"],
        final_statuses=["Done"],
        transitions={"To Do": ["In Progress"], "In Progress": ["Done"]}
    )
    mock_jira_service.extract_workflow.return_value = mock_workflow
    
    response = client.post(
        '/extract-workflow',
        data=json.dumps(workflow_data),
        content_type='application/json'
    )
    
    assert response.status_code == 200
    assert response.json['status'] == 'success'
    data = response.json['data']
    assert data['allStatuses'] == ["To Do", "In Progress", "Done"]
    assert data['suggestedFlow'] == ["To Do", "In Progress", "Done"]
    assert data['initialStatuses'] == ["To Do"]
    assert data['finalStatuses'] == ["Done"]
    assert data['transitions'] == {"To Do": ["In Progress"], "In Progress": ["Done"]}

def test_extract_workflow_missing_fields(client, jira_credentials):
    """Test workflow extraction with missing fields"""
    response = client.post(
        '/extract-workflow',
        data=json.dumps(jira_credentials),  # Missing projectKey
        content_type='application/json'
    )
    
    assert response.status_code == 400
    assert response.json['status'] == 'error'
    assert 'Missing required fields' in response.json['message']

def test_extract_workflow_error(client, jira_credentials, mock_jira_service):
    """Test workflow extraction with error"""
    workflow_data = {**jira_credentials, "projectKey": "TEST"}
    mock_jira_service.extract_workflow.side_effect = Exception("Extraction failed")
    
    response = client.post(
        '/extract-workflow',
        data=json.dumps(workflow_data),
        content_type='application/json'
    )
    
    assert response.status_code == 500
    assert response.json['status'] == 'error'
    assert 'Failed to extract workflow' in response.json['message']

@patch('app.api.workflow_routes.logger')
def test_error_logging(mock_logger, client, jira_credentials, mock_jira_service):
    """Test error logging"""
    mock_jira_service.get_teams.side_effect = Exception("Service error")
    
    response = client.post(
        '/teams',
        data=json.dumps(jira_credentials),
        content_type='application/json'
    )
    
    assert response.status_code == 500
    mock_logger.error.assert_called()

def test_invalid_json(client):
    """Test handling of invalid JSON"""
    response = client.post(
        '/teams',
        data='invalid json',
        content_type='application/json'
    )
    
    assert response.status_code == 400

def test_method_not_allowed(client):
    """Test incorrect HTTP methods"""
    endpoints = ['/teams', '/filters', '/validate-filter', '/extract-workflow']
    
    for endpoint in endpoints:
        # GET not allowed
        response = client.get(endpoint)
        assert response.status_code == 405
        
        # PUT not allowed
        response = client.put(endpoint)
        assert response.status_code == 405
        
        # DELETE not allowed
        response = client.delete(endpoint)
        assert response.status_code == 405

@patch('app.api.workflow_routes.JiraService')
def test_service_configuration(JiraService, client, jira_credentials):
    """Test that the service is configured with the provided credentials"""
    # Given a mock service class
    mock_service = Mock()
    JiraService.return_value = mock_service
    mock_service.test_connection.return_value = True
    mock_service.get_teams.return_value = []
    
    # When making a request with credentials
    response = client.post(
        '/teams',
        data=json.dumps(jira_credentials),
        content_type='application/json'
    )
    
    # Then the service should be created with those credentials
    JiraService.assert_called_once()
    config = JiraService.call_args.args[0]
    assert isinstance(config, JiraConfig)
    assert config.url == jira_credentials['jiraUrl']
    assert config.username == jira_credentials['username']
    assert config.api_token == jira_credentials['apiToken']

def test_connection_check_ordering(client, jira_credentials, mock_jira_service):
    """Test that connection is checked before operations"""
    endpoints = ['/teams', '/filters', '/validate-filter', '/extract-workflow']
    
    for endpoint in endpoints:
        mock_jira_service.reset_mock()
        
        # Prepare endpoint-specific data
        data = jira_credentials.copy()
        if endpoint == '/validate-filter':
            data['filterName'] = 'Test Filter'
        elif endpoint == '/extract-workflow':
            data['projectKey'] = 'TEST'
            
        client.post(
            endpoint,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        # Verify test_connection was called before any other method
        assert mock_jira_service.test_connection.called
        assert mock_jira_service.test_connection.call_count == 1
        
        # Get the index of test_connection call
        method_calls = mock_jira_service.method_calls
        test_conn_indices = [
            i for i, call in enumerate(method_calls)
            if call[0] == 'test_connection'
        ]
        
        # If there are any calls, verify test_connection was first
        if method_calls:
            assert test_conn_indices
            assert test_conn_indices[0] == 0  # First call should be test_connection
