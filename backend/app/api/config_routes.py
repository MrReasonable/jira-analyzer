from flask import Blueprint, request, jsonify
from app.core.models import db, TeamConfig
from app.api.validators import validate_team_config
from app.utils.logging import get_logger
from sqlalchemy.exc import IntegrityError
import json

logger = get_logger(__name__)
config_api = Blueprint('config_api', __name__)

@config_api.route('/team-configs', methods=['GET'])
def list_configs():
    """List all team configurations"""
    try:
        configs = TeamConfig.query.all()
        return jsonify({
            'status': 'success',
            'data': [config.to_dict() for config in configs]
        })
    except Exception as e:
        logger.error(f"Error listing configurations: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve configurations'
        }), 500

@config_api.route('/team-configs', methods=['POST'])
def create_config():
    """Create a new team configuration"""
    try:
        data = request.json
        
        # Validate configuration
        is_valid, error_message = validate_team_config(data)
        if not is_valid:
            return jsonify({
                'status': 'error',
                'message': error_message
            }), 400
        
        # Create new config
        config = TeamConfig.from_dict(data)
        db.session.add(config)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'data': config.to_dict()
        }), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': 'A configuration with this name already exists'
        }), 409
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating configuration: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to create configuration'
        }), 500

@config_api.route('/team-configs/<int:config_id>', methods=['GET'])
def get_config(config_id):
    """Get a specific team configuration"""
    config = TeamConfig.query.get_or_404(config_id)
    return jsonify({
        'status': 'success',
        'data': config.to_dict()
    })

@config_api.route('/team-configs/<int:config_id>', methods=['PUT'])
def update_config(config_id):
    """Update a team configuration"""
    try:
        config = TeamConfig.query.get_or_404(config_id)
        data = request.json
        
        # Validate configuration
        is_valid, error_message = validate_team_config(data)
        if not is_valid:
            logger.warning(f"Invalid configuration: {error_message}")
            return jsonify({
                'status': 'error',
                'message': error_message
            }), 400
        
        # Log the data being used to update the configuration
        logger.info(f"Updating configuration for ID {config_id} with data: {data}")
        
        # Update fields
        config.name = data['name']
        config.jira_url = data['jiraUrl']
        config.username = data['username']
        config.api_token = data['apiToken']
        config.filter_jql = data.get('filterJql')
        config.statuses = json.dumps(data['statuses'])
        config.expected_path = json.dumps(data['expectedPath'])
        config.start_states = json.dumps(data.get('startStates', []))
        config.end_states = json.dumps(data.get('endStates', []))
        config.active_statuses = json.dumps(data.get('activeStatuses', []))
        config.flow_efficiency_method = data.get('flowEfficiencyMethod', 'active_statuses')
        
        db.session.commit()
        
        logger.info(f"Configuration for ID {config_id} updated successfully")
        return jsonify({
            'status': 'success',
            'data': config.to_dict()
        })
        
    except IntegrityError:
        db.session.rollback()
        logger.error(f"Integrity error updating configuration for ID {config_id}: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'A configuration with this name already exists'
        }), 409
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating configuration for ID {config_id}: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to update configuration'
        }), 500

@config_api.route('/team-configs/<int:config_id>', methods=['DELETE'])
def delete_config(config_id):
    """Delete a team configuration"""
    try:
        config = TeamConfig.query.get_or_404(config_id)
        db.session.delete(config)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Configuration deleted successfully'
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting configuration: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to delete configuration'
        }), 500
