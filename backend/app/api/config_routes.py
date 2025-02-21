from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest, UnsupportedMediaType, MethodNotAllowed, NotFound
from app.core.models import db, TeamConfig
from app.api.validators import validate_team_config
from app.utils.logging import get_logger
from sqlalchemy.exc import IntegrityError
import json

logger = get_logger(__name__)
config_api = Blueprint('config_api', __name__)

@config_api.before_request
def validate_json():
    """Validate JSON content type and payload for POST/PUT requests"""
    if request.method in ['POST', 'PUT']:
        if not request.is_json:
            raise UnsupportedMediaType("Content-Type must be application/json")
        if not request.get_json(silent=True):
            raise BadRequest("Missing or invalid JSON payload")

@config_api.route('/team-configs', methods=['GET', 'POST'])
def handle_configs():
    """Handle team configurations collection endpoint"""
    if request.method == 'GET':
        try:
            configs = TeamConfig.query.all()
            return jsonify({
                'status': 'success',
                'data': [config.to_dict() for config in configs]
            })
        except Exception as e:
            logger.error(f"Error listing configurations: {str(e)}")
            raise

    elif request.method == 'POST':
        try:
            data = request.json
            
            # Validate configuration
            is_valid, error_message = validate_team_config(data)
            if not is_valid:
                raise BadRequest(error_message)
            
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
            logger.error("Duplicate team configuration name")
            return jsonify({
                'status': 'error',
                'message': 'A configuration with this name already exists'
            }), 409
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating configuration: {str(e)}")
            raise

    else:
        raise MethodNotAllowed(valid_methods=['GET', 'POST'])

@config_api.route('/team-configs/<int:config_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_config(config_id):
    """Handle specific team configuration endpoint"""
    try:
        config = db.session.get(TeamConfig, config_id)
        if not config:
            raise NotFound(f"Configuration with ID {config_id} not found")

        if request.method == 'GET':
            return jsonify({
                'status': 'success',
                'data': config.to_dict()
            })

        elif request.method == 'PUT':
            data = request.json
            
            # Validate configuration
            is_valid, error_message = validate_team_config(data)
            if not is_valid:
                raise BadRequest(error_message)
            
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
            
            try:
                db.session.commit()
            except IntegrityError:
                db.session.rollback()
                logger.error("Duplicate team configuration name")
                return jsonify({
                    'status': 'error',
                    'message': 'A configuration with this name already exists'
                }), 409
            
            return jsonify({
                'status': 'success',
                'data': config.to_dict()
            })

        elif request.method == 'DELETE':
            db.session.delete(config)
            db.session.commit()
            
            return jsonify({
                'status': 'success',
                'message': 'Configuration deleted successfully'
            })

        else:
            raise MethodNotAllowed(valid_methods=['GET', 'PUT', 'DELETE'])

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error handling configuration {config_id}: {str(e)}")
        raise

# Register error handlers
def register_error_handlers(app):
    """Register error handlers for the config API blueprint"""
    from app.api.error_handlers import (
        handle_validation_error,
        handle_bad_request,
        handle_method_not_allowed,
        handle_not_found,
        handle_unsupported_media_type,
        handle_generic_error
    )

    app.register_error_handler(BadRequest, handle_bad_request)
    app.register_error_handler(UnsupportedMediaType, handle_unsupported_media_type)
    app.register_error_handler(MethodNotAllowed, handle_method_not_allowed)
    app.register_error_handler(NotFound, handle_not_found)
    app.register_error_handler(Exception, handle_generic_error)
