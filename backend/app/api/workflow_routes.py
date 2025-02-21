from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest, UnsupportedMediaType, MethodNotAllowed, NotFound
from app.core.models import JiraConfig
from app.services.jira_service import JiraService
from app.utils.logging import get_logger
from app.api.error_handlers import ValidationError, JiraConnectionError

logger = get_logger(__name__)
workflow_api = Blueprint('workflow_api', __name__)

@workflow_api.before_request
def validate_json():
    """Validate JSON content type and payload for POST requests"""
    if request.method == 'POST':
        if not request.is_json:
            raise UnsupportedMediaType("Content-Type must be application/json")
        if not request.get_json(silent=True):
            raise BadRequest("Missing or invalid JSON payload")

def validate_jira_credentials(data):
    """Validate Jira credentials in request data"""
    required_fields = ['jiraUrl', 'username', 'apiToken']
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        raise ValidationError("Missing required fields: " + ", ".join(missing))
    return JiraConfig(
        url=data['jiraUrl'],
        username=data['username'],
        api_token=data['apiToken'],
        workflow={'statuses': [], 'expected_path': []}
    )

def create_jira_service(data):
    """Create and validate Jira service connection"""
    config = validate_jira_credentials(data)
    jira_service = JiraService(config)
    if not jira_service.test_connection():
        raise JiraConnectionError("Failed to connect to Jira")
    return jira_service

@workflow_api.route('/teams', methods=['POST'])
def get_teams():
    """Get list of available teams/projects"""
    if request.method != 'POST':
        raise MethodNotAllowed(valid_methods=['POST'])

    try:
        logger.info("Fetching teams")
        jira_service = create_jira_service(request.json)
        teams = jira_service.get_teams()
        return jsonify({
            'status': 'success',
            'data': teams
        })
    except Exception as e:
        logger.error(f"Error fetching teams: {str(e)}", exc_info=True)
        raise

@workflow_api.route('/filters', methods=['POST'])
def get_filters():
    """Get list of available filters"""
    if request.method != 'POST':
        raise MethodNotAllowed(valid_methods=['POST'])

    try:
        logger.info("Fetching filters")
        jira_service = create_jira_service(request.json)
        filters = jira_service.get_filters()
        return jsonify({
            'status': 'success',
            'data': filters
        })
    except Exception as e:
        logger.error(f"Error fetching filters: {str(e)}", exc_info=True)
        raise

@workflow_api.route('/validate-filter', methods=['POST'])
def validate_filter():
    """Validate and get details of a filter"""
    if request.method != 'POST':
        raise MethodNotAllowed(valid_methods=['POST'])

    try:
        data = request.json
        if not data.get('filterName'):
            raise ValidationError("Missing required field: filterName")

        logger.info(f"Validating filter: {data['filterName']}")
        jira_service = create_jira_service(data)
        filter_details = jira_service.validate_filter(data['filterName'])
        
        if not filter_details:
            raise NotFound(f"Filter '{data['filterName']}' not found")

        return jsonify({
            'status': 'success',
            'data': filter_details
        })
    except Exception as e:
        logger.error(f"Error validating filter: {str(e)}", exc_info=True)
        raise

@workflow_api.route('/extract-workflow', methods=['POST'])
def extract_workflow():
    """Extract workflow configuration from a Jira project"""
    if request.method != 'POST':
        raise MethodNotAllowed(valid_methods=['POST'])

    try:
        data = request.json
        if not data.get('projectKey'):
            raise ValidationError("Missing required field: projectKey")

        logger.info(f"Extracting workflow for project: {data['projectKey']}")
        jira_service = create_jira_service(data)
        workflow = jira_service.extract_workflow(data['projectKey'])
        
        return jsonify({
            'status': 'success',
            'data': {
                'allStatuses': workflow.all_statuses,
                'suggestedFlow': workflow.suggested_flow,
                'initialStatuses': workflow.initial_statuses,
                'finalStatuses': workflow.final_statuses,
                'transitions': workflow.transitions
            }
        })
    except Exception as e:
        logger.error(f"Error extracting workflow: {str(e)}", exc_info=True)
        raise

# Register error handlers
def register_error_handlers(app):
    """Register error handlers for the workflow API blueprint"""
    from app.api.error_handlers import (
        handle_validation_error,
        handle_jira_connection_error,
        handle_bad_request,
        handle_method_not_allowed,
        handle_not_found,
        handle_unsupported_media_type,
        handle_generic_error
    )

    app.register_error_handler(ValidationError, handle_validation_error)
    app.register_error_handler(JiraConnectionError, handle_jira_connection_error)
    app.register_error_handler(BadRequest, handle_bad_request)
    app.register_error_handler(MethodNotAllowed, handle_method_not_allowed)
    app.register_error_handler(NotFound, handle_not_found)
    app.register_error_handler(UnsupportedMediaType, handle_unsupported_media_type)
    app.register_error_handler(Exception, handle_generic_error)
