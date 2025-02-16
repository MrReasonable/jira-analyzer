from flask import Blueprint, request, jsonify
from app.services.analysis_service import AnalysisService
from app.utils.logging import get_logger

logger = get_logger(__name__)
api = Blueprint('api', __name__)
analysis_service = AnalysisService()

@api.route('/analyze', methods=['POST'])
def analyze_tickets():
    """Endpoint to analyze Jira tickets"""
    logger.info("Received analysis request")
    response, status_code = analysis_service.analyze(request.json)
    return jsonify(response), status_code

@api.route('/validate-connection', methods=['POST'])
def validate_connection():
    """Endpoint to validate Jira connection"""
    analysis_service.validate_connection(request.json)
    return jsonify({'status': 'success'})

@api.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})
