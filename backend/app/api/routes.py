from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest, UnsupportedMediaType, MethodNotAllowed
from app.services.analysis_service import AnalysisService
from app.utils.logging import get_logger

logger = get_logger(__name__)
api = Blueprint('api', __name__)
analysis_service = AnalysisService()

@api.before_request
def validate_json():
    """Validate JSON content type and payload for POST requests"""
    if request.method == 'POST':
        if not request.is_json:
            raise UnsupportedMediaType("Content-Type must be application/json")
        if not request.get_json(silent=True):
            raise BadRequest("Missing or invalid JSON payload")

@api.route('/analyze', methods=['POST'])
def analyze_tickets():
    """Endpoint to analyze Jira tickets"""
    if request.method != 'POST':
        raise MethodNotAllowed(valid_methods=['POST'])

    logger.info("Received analysis request")
    response, status_code = analysis_service.analyze(request.json)
    return jsonify(response), status_code

@api.route('/validate-connection', methods=['POST'])
def validate_connection():
    """Endpoint to validate Jira connection"""
    if request.method != 'POST':
        raise MethodNotAllowed(valid_methods=['POST'])

    analysis_service.validate_connection(request.json)
    return jsonify({'status': 'success'})

@api.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    if request.method != 'GET':
        raise MethodNotAllowed(valid_methods=['GET'])

    logger.info("Health check requested")
    return jsonify({'status': 'healthy'})

# Register error handlers
def register_error_handlers(app):
    """Register error handlers for the API blueprint"""
    from app.api.error_handlers import (
        handle_validation_error,
        handle_authentication_error,
        handle_jira_connection_error,
        handle_bad_request,
        handle_method_not_allowed,
        handle_unsupported_media_type,
        handle_generic_error
    )

    app.register_error_handler(BadRequest, handle_bad_request)
    app.register_error_handler(UnsupportedMediaType, handle_unsupported_media_type)
    app.register_error_handler(MethodNotAllowed, handle_method_not_allowed)
    app.register_error_handler(Exception, handle_generic_error)
