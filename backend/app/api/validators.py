from typing import Dict, Any, Tuple, Optional
from urllib.parse import urlparse
from datetime import datetime, timezone
from app.core.models import TimeRange

def validate_time_range(time_range: TimeRange) -> Tuple[bool, Optional[str]]:
    """
    Validate time range configuration.
    
    Args:
        time_range: TimeRange configuration
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check if either preset or custom range is provided
    has_custom_range = time_range.start_date is not None or time_range.end_date is not None
    has_preset = time_range.preset is not None
    
    if has_custom_range and has_preset:
        return False, "Cannot specify both custom date range and preset"
    
    if has_custom_range:
        if time_range.start_date and time_range.end_date:
            if time_range.start_date > time_range.end_date:
                return False, "Start date must be before end date"
            if time_range.end_date > datetime.now(timezone.utc):
                return False, "End date cannot be in the future"
        else:
            return False, "Both start and end dates must be provided for custom range"
    
    if has_preset:
        valid_presets = ['two_weeks', 'quarter', 'half_year', 'year']
        if time_range.preset not in valid_presets:
            return False, f"Invalid preset. Must be one of: {', '.join(valid_presets)}"
    
    return True, None

def validate_jira_config(data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """Validate the Jira configuration data."""
    required_fields = ['jiraUrl', 'username', 'apiToken', 'statuses', 'expectedPath']
    
    # Check if all required fields are present
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
        if not data[field]:
            return False, f"Field cannot be empty: {field}"
    
    # Special check for JQL - can come from either jqlQuery or filterJql
    if not data.get('jqlQuery') and not data.get('filterJql'):
        return False, "JQL Query is required"
    
    # Validate URL format
    try:
        result = urlparse(data['jiraUrl'])
        if not all([result.scheme, result.netloc]):
            return False, "Invalid Jira URL format"
        if result.scheme not in ['http', 'https']:
            return False, "Jira URL must use http or https protocol"
    except Exception:
        return False, "Invalid Jira URL format"
    
    # Validate arrays
    if not isinstance(data['statuses'], list):
        return False, "Statuses must be an array"
    if not isinstance(data['expectedPath'], list):
        return False, "Expected path must be an array"
    
    if len(data['statuses']) == 0:
        return False, "At least one status is required"
    if len(data['expectedPath']) == 0:
        return False, "Expected path cannot be empty"
    
    # Validate that all statuses and expected path entries are strings
    if not all(isinstance(s, str) for s in data['statuses']):
        return False, "All statuses must be strings"
    if not all(isinstance(s, str) for s in data['expectedPath']):
        return False, "All expected path entries must be strings"
    
    # Validate that expected path only contains valid statuses
    invalid_statuses = [s for s in data['expectedPath'] if s not in data['statuses']]
    if invalid_statuses:
        return False, f"Expected path contains invalid statuses: {', '.join(invalid_statuses)}"
    
    return True, None

def validate_team_config(data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """Validate team configuration data."""
    required_fields = ['name', 'jiraUrl', 'username', 'apiToken', 'statuses', 'expectedPath']
    
    # Check required fields
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
        if not data[field]:
            return False, f"Field cannot be empty: {field}"
    
    # Validate name format
    if not data['name'].strip():
        return False, "Name cannot be empty"
    if len(data['name']) > 100:
        return False, "Name cannot be longer than 100 characters"
    
    # Reuse Jira config validation
    return validate_jira_config(data)

def validate_connection_request(data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """Validate connection test request data."""
    required_fields = ['jiraUrl', 'username', 'apiToken']
    
    # Check if all required fields are present and non-empty
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
        if not data[field]:
            return False, f"Field cannot be empty: {field}"
    
    # Validate URL format
    try:
        result = urlparse(data['jiraUrl'])
        if not all([result.scheme, result.netloc]):
            return False, "Invalid Jira URL format"
        if result.scheme not in ['http', 'https']:
            return False, "Jira URL must use http or https protocol"
    except Exception:
        return False, "Invalid Jira URL format"
    
    return True, None
