import pytest
from flask import Flask, json
from unittest.mock import patch, Mock
from app.api.config_routes import config_api
from app.core.models import TeamConfig, db
from app.api.error_handlers import register_error_handlers
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError

@pytest.fixture
def app():
    """Create Flask app for testing"""
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Setup custom JSON provider
    from app.utils.json_encoder import NumpyJSONProvider
    app.json = NumpyJSONProvider(app)
    
    app.register_blueprint(config_api)
    register_error_handlers(app)
    
    with app.app_context():
        db.init_app(app)
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

@pytest.fixture
def sample_config_data():
    """Create sample team configuration data"""
    return {
        "name": "Test Team",
        "jiraUrl": "https://jira.example.com",
        "username": "test",
        "apiToken": "test-token",
        "statuses": ["To Do", "In Progress", "Done"],
        "expectedPath": ["To Do", "In Progress", "Done"],
        "startStates": ["To Do"],
        "endStates": ["Done"],
        "activeStatuses": ["In Progress"],
        "flowEfficiencyMethod": "active_statuses"
    }

@pytest.fixture
def sample_config(app, sample_config_data):
    """Create sample team configuration in database"""
    config = TeamConfig.from_dict(sample_config_data)
    with app.app_context():
        db.session.add(config)
        db.session.commit()
        return config

def test_list_configs_empty(client):
    """Test listing configurations when none exist"""
    response = client.get('/team-configs')
    
    assert response.status_code == 200
    assert response.json['status'] == 'success'
    assert response.json['data'] == []

def test_list_configs(client, sample_config):
    """Test listing configurations"""
    response = client.get('/team-configs')
    
    assert response.status_code == 200
    assert response.json['status'] == 'success'
    assert len(response.json['data']) == 1
    assert response.json['data'][0]['name'] == "Test Team"

def test_create_config_success(client, sample_config_data):
    """Test successful configuration creation"""
    response = client.post(
        '/team-configs',
        data=json.dumps(sample_config_data),
        content_type='application/json'
    )
    
    assert response.status_code == 201
    assert response.json['status'] == 'success'
    assert response.json['data']['name'] == sample_config_data['name']
    assert response.json['data']['jiraUrl'] == sample_config_data['jiraUrl']

def test_create_config_duplicate(client, sample_config, sample_config_data):
    """Test creating configuration with duplicate name"""
    response = client.post(
        '/team-configs',
        data=json.dumps(sample_config_data),
        content_type='application/json'
    )
    
    assert response.status_code == 409
    assert response.json['status'] == 'error'
    assert 'already exists' in response.json['message']

def test_create_config_invalid(client):
    """Test creating configuration with invalid data"""
    invalid_data = {
        "name": "",  # Empty name
        "jiraUrl": "invalid-url",
        "username": "test",
        "apiToken": "test-token",
        "statuses": [],  # Empty statuses
        "expectedPath": ["Invalid"]  # Invalid path
    }
    
    response = client.post(
        '/team-configs',
        data=json.dumps(invalid_data),
        content_type='application/json'
    )
    
    assert response.status_code == 400
    assert response.json['status'] == 'error'

def test_get_config_success(client, sample_config):
    """Test getting specific configuration"""
    response = client.get(f'/team-configs/{sample_config.id}')
    
    assert response.status_code == 200
    assert response.json['status'] == 'success'
    assert response.json['data']['name'] == sample_config.name

def test_get_config_not_found(client):
    """Test getting non-existent configuration"""
    response = client.get('/team-configs/999')
    assert response.status_code == 404

def test_update_config_success(client, sample_config, sample_config_data):
    """Test successful configuration update"""
    updated_data = sample_config_data.copy()
    updated_data['name'] = "Updated Team"
    
    response = client.put(
        f'/team-configs/{sample_config.id}',
        data=json.dumps(updated_data),
        content_type='application/json'
    )
    
    assert response.status_code == 200
    assert response.json['status'] == 'success'
    assert response.json['data']['name'] == "Updated Team"

def test_update_config_not_found(client, sample_config_data):
    """Test updating non-existent configuration"""
    response = client.put(
        '/team-configs/999',
        data=json.dumps(sample_config_data),
        content_type='application/json'
    )
    
    assert response.status_code == 404

def test_update_config_invalid(client, sample_config):
    """Test updating configuration with invalid data"""
    invalid_data = {
        "name": "",  # Empty name
        "jiraUrl": "invalid-url",
        "username": "test",
        "apiToken": "test-token",
        "statuses": [],
        "expectedPath": ["Invalid"]
    }
    
    response = client.put(
        f'/team-configs/{sample_config.id}',
        data=json.dumps(invalid_data),
        content_type='application/json'
    )
    
    assert response.status_code == 400
    assert response.json['status'] == 'error'

def test_delete_config_success(client, sample_config):
    """Test successful configuration deletion"""
    response = client.delete(f'/team-configs/{sample_config.id}')
    
    assert response.status_code == 200
    assert response.json['status'] == 'success'
    
    # Verify deletion
    get_response = client.get(f'/team-configs/{sample_config.id}')
    assert get_response.status_code == 404

def test_delete_config_not_found(client):
    """Test deleting non-existent configuration"""
    response = client.delete('/team-configs/999')
    assert response.status_code == 404

@patch('app.api.config_routes.logger')
def test_error_logging(mock_logger, client, sample_config, sample_config_data):
    """Test error logging"""
    # Test create error logging
    response = client.post(
        '/team-configs',
        data=json.dumps(sample_config_data),
        content_type='application/json'
    )
    assert response.status_code == 409
    mock_logger.error.assert_called()
    
    # Test update error logging
    response = client.put(
        f'/team-configs/{sample_config.id}',
        data=json.dumps({"invalid": "data"}),
        content_type='application/json'
    )
    assert response.status_code == 400
    mock_logger.warning.assert_called()

def test_json_field_handling(client, sample_config_data):
    """Test handling of JSON fields"""
    response = client.post(
        '/team-configs',
        data=json.dumps(sample_config_data),
        content_type='application/json'
    )
    
    assert response.status_code == 201
    data = response.json['data']
    
    # Verify JSON fields are properly serialized
    assert isinstance(data['statuses'], list)
    assert isinstance(data['expectedPath'], list)
    assert isinstance(data['startStates'], list)
    assert isinstance(data['endStates'], list)
    assert isinstance(data['activeStatuses'], list)

def test_config_timestamps(client, sample_config_data):
    """Test configuration timestamps"""
    response = client.post(
        '/team-configs',
        data=json.dumps(sample_config_data),
        content_type='application/json'
    )
    
    assert response.status_code == 201
    data = response.json['data']
    
    # Verify timestamps are present and in ISO format
    assert 'createdAt' in data
    assert 'updatedAt' in data
    datetime.fromisoformat(data['createdAt'].replace('Z', '+00:00'))
    datetime.fromisoformat(data['updatedAt'].replace('Z', '+00:00'))

def test_partial_update(client, sample_config):
    """Test partial configuration update"""
    partial_data = {
        "name": "Updated Team",
        "jiraUrl": sample_config.jira_url,
        "username": sample_config.username,
        "apiToken": sample_config.api_token,
        "statuses": json.loads(sample_config.statuses),
        "expectedPath": json.loads(sample_config.expected_path)
    }
    
    response = client.put(
        f'/team-configs/{sample_config.id}',
        data=json.dumps(partial_data),
        content_type='application/json'
    )
    
    assert response.status_code == 200
    assert response.json['data']['name'] == "Updated Team"
    # Verify other fields remain unchanged
    assert response.json['data']['flowEfficiencyMethod'] == 'active_statuses'

def test_invalid_json(client):
    """Test handling of invalid JSON"""
    response = client.post(
        '/team-configs',
        data='invalid json',
        content_type='application/json'
    )
    
    assert response.status_code == 400

def test_method_not_allowed(client, sample_config):
    """Test incorrect HTTP methods"""
    # PATCH not allowed
    response = client.patch(f'/team-configs/{sample_config.id}')
    assert response.status_code == 405
    
    # PUT not allowed on collection endpoint
    response = client.put('/team-configs')
    assert response.status_code == 405
    
    # DELETE not allowed on collection endpoint
    response = client.delete('/team-configs')
    assert response.status_code == 405
