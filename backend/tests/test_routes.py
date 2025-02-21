import pytest
from flask import Flask, json
from unittest.mock import patch, Mock
from app.api.routes import api
from app.api.error_handlers import (
    APIError, ValidationError, AuthenticationError, JiraConnectionError,
    register_error_handlers
)

@pytest.fixture
def app():
    """Create Flask app for testing"""
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.register_blueprint(api)
    register_error_handlers(app)
    return app

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

@pytest.fixture
def sample_analysis_request():
    """Create sample analysis request data"""
    return {
        "jiraUrl": "https://jira.example.com",
        "username": "test",
        "apiToken": "test-token",
        "jqlQuery": "project = TEST",
        "statuses": ["To Do", "In Progress", "Done"],
        "expectedPath": ["To Do", "In Progress", "Done"]
    }

@pytest.fixture
def sample_analysis_response():
    """Create sample analysis response data"""
    return {
        "total_issues": 1,
        "flow_metrics": {
            "cycle_time": {
                "mean": 5.0,
                "median": 4.0
            }
        },
        "workflow_compliance": {
            "compliant": 1
        }
    }

def test_health_check(client):
    """Test health check endpoint"""
    response = client.get('/health')
    
    assert response.status_code == 200
    assert response.json['status'] == 'healthy'

@patch('app.api.routes.analysis_service')
def test_analyze_tickets_success(mock_service, client, sample_analysis_request, sample_analysis_response):
    """Test successful ticket analysis"""
    mock_service.analyze.return_value = (sample_analysis_response, 200)
    
    response = client.post(
        '/analyze',
        data=json.dumps(sample_analysis_request),
        content_type='application/json'
    )
    
    assert response.status_code == 200
    assert response.json == sample_analysis_response
    mock_service.analyze.assert_called_once_with(sample_analysis_request)

@patch('app.api.routes.analysis_service')
def test_analyze_tickets_validation_error(mock_service, client, sample_analysis_request):
    """Test analysis with validation error"""
    mock_service.analyze.side_effect = ValidationError("Invalid input")
    
    response = client.post(
        '/analyze',
        data=json.dumps(sample_analysis_request),
        content_type='application/json'
    )
    
    assert response.status_code == 400
    assert response.json['status'] == 'error'
    assert response.json['message'] == 'Invalid input'

@patch('app.api.routes.analysis_service')
def test_analyze_tickets_auth_error(mock_service, client, sample_analysis_request):
    """Test analysis with authentication error"""
    mock_service.analyze.side_effect = AuthenticationError("Auth failed")
    
    response = client.post(
        '/analyze',
        data=json.dumps(sample_analysis_request),
        content_type='application/json'
    )
    
    assert response.status_code == 401
    assert response.json['status'] == 'error'
    assert response.json['message'] == 'Auth failed'

@patch('app.api.routes.analysis_service')
def test_validate_connection_success(mock_service, client, sample_analysis_request):
    """Test successful connection validation"""
    response = client.post(
        '/validate-connection',
        data=json.dumps(sample_analysis_request),
        content_type='application/json'
    )
    
    assert response.status_code == 200
    assert response.json['status'] == 'success'
    mock_service.validate_connection.assert_called_once_with(sample_analysis_request)

@patch('app.api.routes.analysis_service')
def test_validate_connection_error(mock_service, client, sample_analysis_request):
    """Test connection validation with error"""
    mock_service.validate_connection.side_effect = JiraConnectionError("Connection failed")
    
    response = client.post(
        '/validate-connection',
        data=json.dumps(sample_analysis_request),
        content_type='application/json'
    )
    
    assert response.status_code == 401
    assert response.json['status'] == 'error'
    assert response.json['message'] == 'Connection failed'

def test_invalid_content_type(client, sample_analysis_request):
    """Test requests with invalid content type"""
    response = client.post(
        '/analyze',
        data=sample_analysis_request,  # Not JSON
        content_type='text/plain'
    )
    
    assert response.status_code == 400

def test_missing_json_payload(client):
    """Test requests without JSON payload"""
    response = client.post('/analyze')
    assert response.status_code == 400

@patch('app.api.routes.analysis_service')
def test_analyze_tickets_server_error(mock_service, client, sample_analysis_request):
    """Test analysis with server error"""
    mock_service.analyze.side_effect = Exception("Internal error")
    
    response = client.post(
        '/analyze',
        data=json.dumps(sample_analysis_request),
        content_type='application/json'
    )
    
    assert response.status_code == 500
    assert response.json['status'] == 'error'
    assert response.json['message'] == 'An unexpected error occurred'

@patch('app.api.routes.logger')
def test_request_logging(mock_logger, client):
    """Test request logging"""
    client.get('/health')
    mock_logger.info.assert_called()

def test_method_not_allowed(client, sample_analysis_request):
    """Test incorrect HTTP methods"""
    # GET not allowed for analyze
    response = client.get('/analyze')
    assert response.status_code == 405
    
    # POST not allowed for health check
    response = client.post('/health')
    assert response.status_code == 405

@patch('app.api.routes.analysis_service')
def test_analyze_tickets_response_format(mock_service, client, sample_analysis_request):
    """Test analysis response format"""
    from datetime import datetime, timezone, timedelta
    
    # Create sample datetime for testing
    now = datetime.now(timezone.utc)
    
    mock_response = {
        "total_issues": 10,
        "flow_metrics": {
            "cycle_time": {
                "mean": 5.0,
                "median": 4.0,
                "p85": 7.0
            }
        },
        "workflow_compliance": {
            "compliant": 8,
            "non_compliant": 2
        },
        "bottlenecks": [
            {
                "status": "Review",
                "avg_time": 3.5,
                "impact": "High",
                "times_entered": 5
            }
        ],
        "issues": [
            {
                "key": "TEST-1",
                "summary": "Test Issue",
                "created": now,
                "completed": now + timedelta(days=5),
                "cycleTime": 5.0,
                "transitions": [
                    {
                        "from_status": "To Do",
                        "to_status": "In Progress",
                        "timestamp": now + timedelta(days=1)
                    }
                ]
            }
        ],
        "cfd_data": {
            "dates": [now, now + timedelta(days=1)],
            "status_counts": {
                "To Do": [1, 0],
                "In Progress": [0, 1]
            },
            "wip_counts": [1, 1]
        },
        "flow_efficiency_data": [
            {
                "issue_key": "TEST-1",
                "total_time": 5.0,
                "active_time": 3.0,
                "efficiency": 60.0
            }
        ],
        "epic_data": [
            {
                "key": "EPIC-1",
                "summary": "Test Epic",
                "children": ["TEST-1"],
                "start_time": now,
                "end_time": now + timedelta(days=5),
                "lead_time": 5.0
            }
        ]
    }
    mock_service.analyze.return_value = (mock_response, 200)
    
    response = client.post(
        '/analyze',
        data=json.dumps(sample_analysis_request),
        content_type='application/json'
    )
    
    assert response.status_code == 200
    data = response.json
    
    # Verify basic structure
    assert "total_issues" in data
    assert "flow_metrics" in data
    assert "workflow_compliance" in data
    assert "bottlenecks" in data
    assert "issues" in data
    assert "cfd_data" in data
    assert "flow_efficiency_data" in data
    assert "epic_data" in data
    
    # Verify datetime serialization
    assert all(isinstance(d, str) and d.endswith('Z') for d in data["cfd_data"]["dates"])
    assert data["issues"][0]["created"].endswith('Z')
    assert data["issues"][0]["completed"].endswith('Z')
    assert data["issues"][0]["transitions"][0]["timestamp"].endswith('Z')
    assert data["epic_data"][0]["start_time"].endswith('Z')
    assert data["epic_data"][0]["end_time"].endswith('Z')
    
    # Verify numeric types
    assert isinstance(data["flow_metrics"]["cycle_time"]["mean"], float)
    assert isinstance(data["issues"][0]["cycleTime"], float)
    assert isinstance(data["flow_efficiency_data"][0]["efficiency"], float)
    assert isinstance(data["epic_data"][0]["lead_time"], float)
    
    # Verify nested structures
    assert isinstance(data["issues"][0]["transitions"], list)
    assert isinstance(data["cfd_data"]["status_counts"], dict)
    assert isinstance(data["epic_data"][0]["children"], list)

@patch('app.api.routes.analysis_service')
def test_analyze_tickets_empty_result(mock_service, client, sample_analysis_request):
    """Test analysis with empty result"""
    mock_response = {
        "total_issues": 0,
        "flow_metrics": {},
        "workflow_compliance": {},
        "bottlenecks": []
    }
    mock_service.analyze.return_value = (mock_response, 200)
    
    response = client.post(
        '/analyze',
        data=json.dumps(sample_analysis_request),
        content_type='application/json'
    )
    
    assert response.status_code == 200
    assert response.json["total_issues"] == 0

def test_cors_headers(client):
    """Test CORS headers if configured"""
    response = client.get('/health')
    
    # If CORS is configured, check headers
    if 'Access-Control-Allow-Origin' in response.headers:
        assert response.headers['Access-Control-Allow-Origin']
        assert response.headers['Access-Control-Allow-Methods']
        assert response.headers['Access-Control-Allow-Headers']
