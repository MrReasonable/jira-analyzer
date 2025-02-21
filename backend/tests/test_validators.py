import pytest
from datetime import datetime, timezone, timedelta
from app.api.validators import (
    validate_time_range,
    validate_jira_config,
    validate_team_config,
    validate_connection_request
)
from app.core.models import TimeRange

@pytest.fixture
def base_time():
    """Create base time for testing"""
    return datetime.now(timezone.utc)

@pytest.fixture
def valid_jira_config():
    """Create valid Jira configuration"""
    return {
        "jiraUrl": "https://jira.example.com",
        "username": "test",
        "apiToken": "test-token",
        "jqlQuery": "project = TEST",
        "statuses": ["To Do", "In Progress", "Done"],
        "expectedPath": ["To Do", "In Progress", "Done"]
    }

@pytest.fixture
def valid_team_config(valid_jira_config):
    """Create valid team configuration"""
    return {
        **valid_jira_config,
        "name": "Test Team"
    }

def test_time_range_custom_dates(base_time):
    """Test time range validation with custom dates"""
    # Valid custom range with UTC timezone
    time_range = TimeRange(
        start_date=base_time - timedelta(days=7),
        end_date=base_time
    )
    is_valid, error = validate_time_range(time_range)
    assert is_valid
    assert error is None
    
    # Valid custom range with different timezone
    est_tz = timezone(timedelta(hours=-5))
    time_range = TimeRange(
        start_date=(base_time - timedelta(days=7)).astimezone(est_tz),
        end_date=base_time.astimezone(est_tz)
    )
    is_valid, error = validate_time_range(time_range)
    assert is_valid
    assert error is None
    
    # Invalid: Naive datetime for start_date
    time_range = TimeRange(
        start_date=base_time.replace(tzinfo=None) - timedelta(days=7),
        end_date=base_time
    )
    is_valid, error = validate_time_range(time_range)
    assert not is_valid
    assert "Start date must have timezone information" in error
    
    # Invalid: Naive datetime for end_date
    time_range = TimeRange(
        start_date=base_time - timedelta(days=7),
        end_date=base_time.replace(tzinfo=None)
    )
    is_valid, error = validate_time_range(time_range)
    assert not is_valid
    assert "End date must have timezone information" in error
    
    # Invalid: Start after end (in UTC)
    time_range = TimeRange(
        start_date=base_time,
        end_date=base_time - timedelta(days=7)
    )
    is_valid, error = validate_time_range(time_range)
    assert not is_valid
    assert "Start date must be before end date" in error
    
    # Invalid: End in future (in UTC)
    time_range = TimeRange(
        start_date=base_time,
        end_date=base_time + timedelta(days=7)
    )
    is_valid, error = validate_time_range(time_range)
    assert not is_valid
    assert "End date cannot be in the future" in error
    
    # Test timezone conversion edge case
    # Create dates that are different in local time but same in UTC
    utc_base = datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)
    est_time = datetime(2024, 1, 1, 7, 0, tzinfo=est_tz)  # Same moment as utc_base
    time_range = TimeRange(
        start_date=est_time - timedelta(days=7),
        end_date=utc_base
    )
    is_valid, error = validate_time_range(time_range)
    assert is_valid
    assert error is None

def test_time_range_presets():
    """Test time range validation with presets"""
    valid_presets = ['two_weeks', 'quarter', 'half_year', 'year']
    
    for preset in valid_presets:
        time_range = TimeRange(preset=preset)
        is_valid, error = validate_time_range(time_range)
        assert is_valid
        assert error is None
    
    # Invalid preset
    time_range = TimeRange(preset="invalid")
    is_valid, error = validate_time_range(time_range)
    assert not is_valid
    assert "Invalid preset" in error

def test_time_range_invalid_combinations(base_time):
    """Test invalid time range combinations"""
    # Both preset and custom range
    time_range = TimeRange(
        start_date=base_time - timedelta(days=7),
        end_date=base_time,
        preset="two_weeks"
    )
    is_valid, error = validate_time_range(time_range)
    assert not is_valid
    assert "Cannot specify both" in error
    
    # Incomplete custom range
    time_range = TimeRange(start_date=base_time)
    is_valid, error = validate_time_range(time_range)
    assert not is_valid
    assert "Both start and end dates must be provided" in error

def test_jira_config_required_fields(valid_jira_config):
    """Test Jira configuration required fields"""
    # Test each required field
    required_fields = ['jiraUrl', 'username', 'apiToken', 'statuses', 'expectedPath']
    
    for field in required_fields:
        invalid_config = valid_jira_config.copy()
        del invalid_config[field]
        is_valid, error = validate_jira_config(invalid_config)
        assert not is_valid
        assert f"Missing required field: {field}" in error
        
        # Test empty field
        invalid_config = valid_jira_config.copy()
        invalid_config[field] = ""
        is_valid, error = validate_jira_config(invalid_config)
        assert not is_valid
        assert f"Field cannot be empty: {field}" in error

def test_jira_config_url_validation(valid_jira_config):
    """Test Jira URL validation"""
    invalid_urls = [
        "",  # Empty
        "not_a_url",  # Invalid format
        "ftp://jira.example.com",  # Invalid protocol
        "http://",  # Missing host
        "https://.com",  # Invalid host
    ]
    
    for url in invalid_urls:
        config = valid_jira_config.copy()
        config["jiraUrl"] = url
        is_valid, error = validate_jira_config(config)
        assert not is_valid
        assert "Invalid Jira URL" in error or "protocol" in error

def test_jira_config_array_validation(valid_jira_config):
    """Test array validation in Jira config"""
    # Invalid status type
    config = valid_jira_config.copy()
    config["statuses"] = "Not an array"
    is_valid, error = validate_jira_config(config)
    assert not is_valid
    assert "Statuses must be an array" in error
    
    # Empty arrays
    config = valid_jira_config.copy()
    config["statuses"] = []
    is_valid, error = validate_jira_config(config)
    assert not is_valid
    assert "At least one status is required" in error
    
    # Non-string elements
    config = valid_jira_config.copy()
    config["statuses"] = ["Valid", 123, "Invalid"]
    is_valid, error = validate_jira_config(config)
    assert not is_valid
    assert "All statuses must be strings" in error

def test_jira_config_expected_path(valid_jira_config):
    """Test expected path validation"""
    # Invalid status in path
    config = valid_jira_config.copy()
    config["expectedPath"] = ["To Do", "Invalid Status", "Done"]
    is_valid, error = validate_jira_config(config)
    assert not is_valid
    assert "Invalid Status" in error

def test_team_config_validation(valid_team_config):
    """Test team configuration validation"""
    # Valid config
    is_valid, error = validate_team_config(valid_team_config)
    assert is_valid
    assert error is None
    
    # Missing name
    invalid_config = valid_team_config.copy()
    del invalid_config["name"]
    is_valid, error = validate_team_config(invalid_config)
    assert not is_valid
    assert "Missing required field: name" in error
    
    # Empty name
    invalid_config = valid_team_config.copy()
    invalid_config["name"] = "   "
    is_valid, error = validate_team_config(invalid_config)
    assert not is_valid
    assert "Name cannot be empty" in error
    
    # Name too long
    invalid_config = valid_team_config.copy()
    invalid_config["name"] = "x" * 101
    is_valid, error = validate_team_config(invalid_config)
    assert not is_valid
    assert "Name cannot be longer than 100 characters" in error

def test_connection_request_validation():
    """Test connection request validation"""
    valid_request = {
        "jiraUrl": "https://jira.example.com",
        "username": "test",
        "apiToken": "test-token"
    }
    
    # Valid request
    is_valid, error = validate_connection_request(valid_request)
    assert is_valid
    assert error is None
    
    # Missing fields
    for field in ["jiraUrl", "username", "apiToken"]:
        invalid_request = valid_request.copy()
        del invalid_request[field]
        is_valid, error = validate_connection_request(invalid_request)
        assert not is_valid
        assert f"Missing required field: {field}" in error
    
    # Empty fields
    for field in ["jiraUrl", "username", "apiToken"]:
        invalid_request = valid_request.copy()
        invalid_request[field] = ""
        is_valid, error = validate_connection_request(invalid_request)
        assert not is_valid
        assert f"Field cannot be empty: {field}" in error

def test_jql_query_validation(valid_jira_config):
    """Test JQL query validation"""
    # Test with jqlQuery
    is_valid, error = validate_jira_config(valid_jira_config)
    assert is_valid
    assert error is None
    
    # Test with filterJql
    config = valid_jira_config.copy()
    del config["jqlQuery"]
    config["filterJql"] = "project = TEST"
    is_valid, error = validate_jira_config(config)
    assert is_valid
    assert error is None
    
    # Test with neither
    config = valid_jira_config.copy()
    del config["jqlQuery"]
    is_valid, error = validate_jira_config(config)
    assert not is_valid
    assert "JQL Query is required" in error

def test_edge_cases():
    """Test edge cases in validation"""
    # Empty time range
    time_range = TimeRange()
    is_valid, error = validate_time_range(time_range)
    assert not is_valid
    
    # None values in configs
    config = {
        "jiraUrl": None,
        "username": None,
        "apiToken": None,
        "statuses": None,
        "expectedPath": None
    }
    is_valid, error = validate_jira_config(config)
    assert not is_valid
    
    # Unicode in team name
    team_config = {
        "name": "测试团队",  # Chinese characters
        "jiraUrl": "https://jira.example.com",
        "username": "test",
        "apiToken": "test-token",
        "statuses": ["To Do", "Done"],
        "expectedPath": ["To Do", "Done"]
    }
    is_valid, error = validate_team_config(team_config)
    assert is_valid
    assert error is None
