import pytest
from flask import Flask, jsonify
from unittest.mock import patch, Mock
from app.api.error_handlers import (
    APIError, ValidationError, AuthenticationError, JiraConnectionError,
    handle_api_error, handle_validation_error, handle_authentication_error,
    handle_jira_connection_error, handle_generic_error, register_error_handlers
)

@pytest.fixture
def app():
    """Create Flask app for testing"""
    app = Flask(__name__)
    app.config['TESTING'] = True
    return app

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

def test_api_error_creation():
    """Test APIError class creation"""
    error = APIError("Test error", 400)
    assert str(error) == "Test error"
    assert error.status_code == 400
    
    # Test default status code
    error = APIError("Test error")
    assert error.status_code == 400

def test_validation_error():
    """Test ValidationError class"""
    error = ValidationError("Invalid input")
    assert isinstance(error, APIError)
    assert str(error) == "Invalid input"
    assert error.status_code == 400

def test_authentication_error():
    """Test AuthenticationError class"""
    error = AuthenticationError()
    assert isinstance(error, APIError)
    assert str(error) == "Authentication failed"
    assert error.status_code == 401
    
    # Test custom message
    error = AuthenticationError("Custom auth error")
    assert str(error) == "Custom auth error"
    assert error.status_code == 401

def test_jira_connection_error():
    """Test JiraConnectionError class"""
    error = JiraConnectionError()
    assert isinstance(error, APIError)
    assert str(error) == "Failed to connect to Jira"
    assert error.status_code == 401
    
    # Test custom message
    error = JiraConnectionError("Custom Jira error")
    assert str(error) == "Custom Jira error"
    assert error.status_code == 401

def test_handle_api_error():
    """Test API error handler"""
    error = APIError("Test API error", 400)
    response, status_code = handle_api_error(error)
    
    assert status_code == 400
    assert response.json['status'] == 'error'
    assert response.json['message'] == "Test API error"

def test_handle_validation_error():
    """Test validation error handler"""
    error = ValidationError("Invalid data")
    response, status_code = handle_validation_error(error)
    
    assert status_code == 400
    assert response.json['status'] == 'error'
    assert response.json['message'] == "Invalid data"

def test_handle_authentication_error():
    """Test authentication error handler"""
    error = AuthenticationError("Auth failed")
    response, status_code = handle_authentication_error(error)
    
    assert status_code == 401
    assert response.json['status'] == 'error'
    assert response.json['message'] == "Auth failed"

def test_handle_jira_connection_error():
    """Test Jira connection error handler"""
    error = JiraConnectionError("Jira connection failed")
    response, status_code = handle_jira_connection_error(error)
    
    assert status_code == 401
    assert response.json['status'] == 'error'
    assert response.json['message'] == "Jira connection failed"

def test_handle_generic_error():
    """Test generic error handler"""
    error = Exception("Unexpected error")
    response, status_code = handle_generic_error(error)
    
    assert status_code == 500
    assert response.json['status'] == 'error'
    assert response.json['message'] == "An unexpected error occurred"

def test_error_handler_registration(app):
    """Test error handler registration"""
    register_error_handlers(app)
    
    # Verify handlers are registered
    assert APIError in app.error_handler_spec[None][None]
    assert ValidationError in app.error_handler_spec[None][None]
    assert AuthenticationError in app.error_handler_spec[None][None]
    assert JiraConnectionError in app.error_handler_spec[None][None]
    assert Exception in app.error_handler_spec[None][None]

def test_error_handling_integration(app, client):
    """Test error handling integration with Flask"""
    register_error_handlers(app)
    
    @app.route('/api-error')
    def raise_api_error():
        raise APIError("API error")
    
    @app.route('/validation-error')
    def raise_validation_error():
        raise ValidationError("Validation error")
    
    @app.route('/auth-error')
    def raise_auth_error():
        raise AuthenticationError("Auth error")
    
    @app.route('/jira-error')
    def raise_jira_error():
        raise JiraConnectionError("Jira error")
    
    @app.route('/generic-error')
    def raise_generic_error():
        raise Exception("Generic error")
    
    # Test API error
    response = client.get('/api-error')
    assert response.status_code == 400
    assert response.json['message'] == "API error"
    
    # Test validation error
    response = client.get('/validation-error')
    assert response.status_code == 400
    assert response.json['message'] == "Validation error"
    
    # Test authentication error
    response = client.get('/auth-error')
    assert response.status_code == 401
    assert response.json['message'] == "Auth error"
    
    # Test Jira connection error
    response = client.get('/jira-error')
    assert response.status_code == 401
    assert response.json['message'] == "Jira error"
    
    # Test generic error
    response = client.get('/generic-error')
    assert response.status_code == 500
    assert response.json['message'] == "An unexpected error occurred"

@patch('app.api.error_handlers.logger')
def test_error_logging(mock_logger, app):
    """Test error logging"""
    # Test API error logging
    error = APIError("API error")
    handle_api_error(error)
    mock_logger.error.assert_called_with("API error: API error", exc_info=True)
    
    # Test validation error logging
    error = ValidationError("Validation error")
    handle_validation_error(error)
    mock_logger.warning.assert_called_with("Validation error: Validation error")
    
    # Test authentication error logging
    error = AuthenticationError("Auth error")
    handle_authentication_error(error)
    mock_logger.warning.assert_called_with("Authentication error: Auth error")
    
    # Test Jira connection error logging
    error = JiraConnectionError("Jira error")
    handle_jira_connection_error(error)
    mock_logger.error.assert_called_with("Jira connection error: Jira error")
    
    # Test generic error logging
    error = Exception("Generic error")
    handle_generic_error(error)
    mock_logger.error.assert_called_with("Unhandled error: Generic error", exc_info=True)

def test_error_inheritance():
    """Test error class inheritance"""
    # All custom errors should inherit from APIError
    assert issubclass(ValidationError, APIError)
    assert issubclass(AuthenticationError, APIError)
    assert issubclass(JiraConnectionError, APIError)
    
    # APIError should inherit from Exception
    assert issubclass(APIError, Exception)

def test_error_response_format():
    """Test error response format consistency"""
    errors = [
        (APIError("API error"), 400),
        (ValidationError("Validation error"), 400),
        (AuthenticationError("Auth error"), 401),
        (JiraConnectionError("Jira error"), 401),
        (Exception("Generic error"), 500)
    ]
    
    handlers = {
        APIError: handle_api_error,
        ValidationError: handle_validation_error,
        AuthenticationError: handle_authentication_error,
        JiraConnectionError: handle_jira_connection_error,
        Exception: handle_generic_error
    }
    
    for error, expected_status in errors:
        handler = handlers[error.__class__]
        response, status = handler(error)
        
        # Verify response format
        assert status == expected_status
        assert isinstance(response.json, dict)
        assert 'status' in response.json
        assert 'message' in response.json
        assert response.json['status'] == 'error'

def test_custom_error_messages():
    """Test custom error messages"""
    messages = {
        APIError: "Custom API error",
        ValidationError: "Custom validation error",
        AuthenticationError: "Custom auth error",
        JiraConnectionError: "Custom Jira error"
    }
    
    for error_class, message in messages.items():
        error = error_class(message)
        assert str(error) == message
        assert error.message == message
