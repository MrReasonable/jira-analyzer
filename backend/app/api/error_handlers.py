from typing import Tuple, Dict, Any
from flask import jsonify
from app.utils.logging import get_logger

logger = get_logger(__name__)

class APIError(Exception):
    """Base class for API errors"""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class ValidationError(APIError):
    """Raised when request validation fails"""
    pass

class AuthenticationError(APIError):
    """Raised when authentication fails"""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status_code=401)

class JiraConnectionError(APIError):
    """Raised when Jira connection fails"""
    def __init__(self, message: str = "Failed to connect to Jira"):
        super().__init__(message, status_code=401)

def handle_api_error(error: APIError) -> Tuple[Dict[str, Any], int]:
    """Handle API errors"""
    logger.error(f"API error: {str(error)}", exc_info=True)
    return jsonify({
        'status': 'error',
        'message': str(error)
    }), error.status_code

def handle_validation_error(error: ValidationError) -> Tuple[Dict[str, Any], int]:
    """Handle validation errors"""
    logger.warning(f"Validation error: {str(error)}")
    return jsonify({
        'status': 'error',
        'message': str(error)
    }), 400

def handle_authentication_error(error: AuthenticationError) -> Tuple[Dict[str, Any], int]:
    """Handle authentication errors"""
    logger.warning(f"Authentication error: {str(error)}")
    return jsonify({
        'status': 'error',
        'message': str(error)
    }), 401

def handle_jira_connection_error(error: JiraConnectionError) -> Tuple[Dict[str, Any], int]:
    """Handle Jira connection errors"""
    logger.error(f"Jira connection error: {str(error)}")
    return jsonify({
        'status': 'error',
        'message': str(error)
    }), 401

def handle_generic_error(error: Exception) -> Tuple[Dict[str, Any], int]:
    """Handle any unhandled exceptions"""
    logger.error(f"Unhandled error: {str(error)}", exc_info=True)
    return jsonify({
        'status': 'error',
        'message': 'An unexpected error occurred'
    }), 500

def register_error_handlers(app):
    """Register error handlers with Flask app"""
    app.register_error_handler(APIError, handle_api_error)
    app.register_error_handler(ValidationError, handle_validation_error)
    app.register_error_handler(AuthenticationError, handle_authentication_error)
    app.register_error_handler(JiraConnectionError, handle_jira_connection_error)
    app.register_error_handler(Exception, handle_generic_error)
