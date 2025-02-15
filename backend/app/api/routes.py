from flask import Blueprint, request, jsonify
from datetime import datetime
from app.core.models import JiraConfig, TimeRange
from app.core.analyzer import JiraCycleTimeAnalyzer
from app.services.jira_service import JiraService
from app.api.validators import (
    validate_jira_config,
    validate_jql_query,
    validate_connection_request
)
from app.utils.logging import get_logger
from app.utils.time_utils import build_analysis_jql  # Updated import

logger = get_logger(__name__)
api = Blueprint('api', __name__)

@api.route('/analyze', methods=['POST'])
def analyze_tickets():
    """Endpoint to analyze Jira tickets"""
    try:
        data = request.json
        logger.info("Received analysis request")
        
        # Validate input data
        is_valid, error_message = validate_jira_config(data)
        if not is_valid:
            logger.warning(f"Invalid configuration: {error_message}")
            return jsonify({
                'status': 'error',
                'message': error_message
            }), 400
        
        # Parse time range
        time_range = TimeRange(
            start_date=datetime.fromisoformat(data['startDate']) if data.get('startDate') else None,
            end_date=datetime.fromisoformat(data['endDate']) if data.get('endDate') else None,
            preset=data.get('timePreset')
        )
        
        # Identify "done" states
        done_statuses = data.get('endStates', [])
        if not done_statuses and data.get('expectedPath'):
            done_statuses = [data['expectedPath'][-1]]  # Use last state as default
        
        # Build JQL query with completion states and time range
        final_jql = build_analysis_jql(data['jqlQuery'], time_range, done_statuses)
        
        # Create configuration
        config = JiraConfig(
            url=data['jiraUrl'],
            username=data['username'],
            api_token=data['apiToken'],
            workflow={
                'statuses': data['statuses'],
                'expected_path': data['expectedPath']
            }
        )
        
        # Test connection
        jira_service = JiraService(config)
        if not jira_service.test_connection():
            return jsonify({
                'status': 'error',
                'message': 'Failed to connect to Jira. Please check your credentials and URL.'
            }), 401
        
        # Initialize analyzer and process issues
        analyzer = JiraCycleTimeAnalyzer(config)
        result = analyzer.analyze_issues(final_jql)
        
        if result.total_issues == 0:
            logger.info("No issues found matching the query")
            return jsonify({
                'status': 'warning',
                'message': 'No issues found matching the query',
                'data': {
                    'total_issues': 0,
                    'cycle_time_stats': {
                        'mean': 0,
                        'median': 0,
                        'p85': 0,
                        'p95': 0,
                        'std_dev': 0
                    },
                    'status_distribution': {},
                    'workflow_compliance': {
                        'compliant_issues': 0,
                        'compliance_rate': 0
                    },
                    'issues': [],
                    'timeRange': {
                        'startDate': time_range.start_date.isoformat() if time_range.start_date else None,
                        'endDate': time_range.end_date.isoformat() if time_range.end_date else None,
                        'preset': time_range.preset
                    },
                    'jql': final_jql
                }
            }), 200
        
        logger.info(f"Analysis completed. Found {result.total_issues} issues.")
        return jsonify({
            'status': 'success',
            'data': {
                **result.__dict__,
                'jql': final_jql,  # Return the final JQL for transparency
                'timeRange': {
                    'startDate': time_range.start_date.isoformat() if time_range.start_date else None,
                    'endDate': time_range.end_date.isoformat() if time_range.end_date else None,
                    'preset': time_range.preset
                }
            }
        }), 200
    
    except Exception as e:
        logger.error(f"Error in analyze_tickets: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Analysis failed: {str(e)}'
        }), 500

@api.route('/validate-connection', methods=['POST'])
def validate_connection():
    """Endpoint to validate Jira connection"""
    try:
        data = request.json
        
        # Validate request data
        is_valid, error_message = validate_connection_request(data)
        if not is_valid:
            return jsonify({
                'status': 'error',
                'message': error_message
            }), 400
        
        config = JiraConfig(
            url=data['jiraUrl'],
            username=data['username'],
            api_token=data['apiToken'],
            workflow={'statuses': [], 'expected_path': []}
        )
        
        jira_service = JiraService(config)
        if jira_service.test_connection():
            logger.info("Connection validation successful")
            return jsonify({'status': 'success'})
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to connect to Jira'
            }), 401
    
    except Exception as e:
        logger.error(f"Connection validation failed: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Connection failed: {str(e)}'
        }), 500

@api.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})