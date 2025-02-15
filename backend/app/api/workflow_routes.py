from flask import Blueprint, request, jsonify
from app.core.models import JiraConfig
from app.services.jira_service import JiraService
from app.utils.logging import get_logger

logger = get_logger(__name__)
workflow_api = Blueprint('workflow_api', __name__)

@workflow_api.route('/teams', methods=['POST'])
def get_teams():
    """Get list of available teams/projects"""
    try:
        data = request.json
        
        if not all([data.get('jiraUrl'), data.get('username'), 
                   data.get('apiToken')]):
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields'
            }), 400

        config = JiraConfig(
            url=data['jiraUrl'],
            username=data['username'],
            api_token=data['apiToken'],
            workflow={'statuses': [], 'expected_path': []}
        )

        jira_service = JiraService(config)
        
        # Test connection first
        if not jira_service.test_connection():
            return jsonify({
                'status': 'error',
                'message': 'Failed to connect to Jira'
            }), 401

        # Get teams
        teams = jira_service.get_teams()
        
        return jsonify({
            'status': 'success',
            'data': teams
        })

    except Exception as e:
        logger.error(f"Error fetching teams: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to fetch teams: {str(e)}'
        }), 500

@workflow_api.route('/filters', methods=['POST'])
def get_filters():
    """Get list of available filters"""
    try:
        data = request.json
        
        if not all([data.get('jiraUrl'), data.get('username'), 
                   data.get('apiToken')]):
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields'
            }), 400

        config = JiraConfig(
            url=data['jiraUrl'],
            username=data['username'],
            api_token=data['apiToken'],
            workflow={'statuses': [], 'expected_path': []}
        )

        jira_service = JiraService(config)
        
        # Test connection first
        if not jira_service.test_connection():
            return jsonify({
                'status': 'error',
                'message': 'Failed to connect to Jira'
            }), 401

        # Get filters
        filters = jira_service.get_filters()
        
        return jsonify({
            'status': 'success',
            'data': filters
        })

    except Exception as e:
        logger.error(f"Error fetching filters: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to fetch filters: {str(e)}'
        }), 500

@workflow_api.route('/validate-filter', methods=['POST'])
def validate_filter():
    """Validate and get details of a filter"""
    try:
        data = request.json
        
        if not all([data.get('jiraUrl'), data.get('username'), 
                   data.get('apiToken'), data.get('filterName')]):
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields'
            }), 400

        config = JiraConfig(
            url=data['jiraUrl'],
            username=data['username'],
            api_token=data['apiToken'],
            workflow={'statuses': [], 'expected_path': []}
        )

        jira_service = JiraService(config)
        
        # Test connection first
        if not jira_service.test_connection():
            return jsonify({
                'status': 'error',
                'message': 'Failed to connect to Jira'
            }), 401

        # Validate filter
        filter_details = jira_service.validate_filter(data['filterName'])
        
        if filter_details:
            return jsonify({
                'status': 'success',
                'data': filter_details
            })
        else:
            return jsonify({
                'status': 'error',
                'message': f'Filter "{data["filterName"]}" not found'
            }), 404

    except Exception as e:
        logger.error(f"Error validating filter: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to validate filter: {str(e)}'
        }), 500

@workflow_api.route('/extract-workflow', methods=['POST'])
def extract_workflow():
    """Extract workflow configuration from a Jira project"""
    try:
        data = request.json
        
        if not all([data.get('jiraUrl'), data.get('username'), 
                   data.get('apiToken'), data.get('projectKey')]):
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields'
            }), 400

        config = JiraConfig(
            url=data['jiraUrl'],
            username=data['username'],
            api_token=data['apiToken'],
            workflow={'statuses': [], 'expected_path': []}
        )

        jira_service = JiraService(config)
        
        # Test connection first
        if not jira_service.test_connection():
            return jsonify({
                'status': 'error',
                'message': 'Failed to connect to Jira'
            }), 401

        # Extract workflow
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
        return jsonify({
            'status': 'error',
            'message': f'Failed to extract workflow: {str(e)}'
        }), 500