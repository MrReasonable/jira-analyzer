import pytest
from unittest.mock import patch, MagicMock
import os
from app.config import Settings, get_settings

class TestConfig:
    """Test suite for configuration handling"""

    def test_required_settings(self):
        """Test that required settings are enforced"""
        required_vars = {
            'JIRA_SERVER': 'https://test.atlassian.net',
            'JIRA_EMAIL': 'test@example.com',
            'JIRA_API_TOKEN': 'test-token'
        }
        
        # Test with all required variables
        with patch.dict(os.environ, required_vars):
            settings = Settings()
            assert settings.jira_server == required_vars['JIRA_SERVER']
            assert settings.jira_email == required_vars['JIRA_EMAIL']
            assert settings.jira_api_token == required_vars['JIRA_API_TOKEN']

        # Test missing variables
        for key in required_vars:
            test_vars = required_vars.copy()
            del test_vars[key]
            
            with patch.dict(os.environ, test_vars, clear=True):
                with pytest.raises(Exception) as exc:
                    Settings()
                assert key.lower() in str(exc.value).lower()

    def test_settings_validation(self):
        """Test validation of setting values"""
        invalid_configs = [
            {
                'JIRA_SERVER': 'not-a-url',
                'JIRA_EMAIL': 'test@example.com',
                'JIRA_API_TOKEN': 'token'
            },
            {
                'JIRA_SERVER': 'https://test.atlassian.net',
                'JIRA_EMAIL': 'not-an-email',
                'JIRA_API_TOKEN': 'token'
            },
            {
                'JIRA_SERVER': 'https://test.atlassian.net',
                'JIRA_EMAIL': 'test@example.com',
                'JIRA_API_TOKEN': ''  # Empty token
            }
        ]
        
        for config in invalid_configs:
            with patch.dict(os.environ, config, clear=True):
                with pytest.raises(Exception):
                    Settings()

    def test_settings_caching(self):
        """Test that settings are properly cached"""
        test_vars = {
            'JIRA_SERVER': 'https://test.atlassian.net',
            'JIRA_EMAIL': 'test@example.com',
            'JIRA_API_TOKEN': 'test-token'
        }
        
        with patch.dict(os.environ, test_vars):
            # First call should create settings
            settings1 = get_settings()
            # Second call should return cached settings
            settings2 = get_settings()
            
            assert settings1 is settings2

    def test_env_file_loading(self):
        """Test loading settings from .env file"""
        mock_env_content = """
        JIRA_SERVER=https://test.atlassian.net
        JIRA_EMAIL=test@example.com
        JIRA_API_TOKEN=test-token
        """
        
        with patch('builtins.open', MagicMock()):
            with patch.dict(os.environ, {}, clear=True):
                settings = Settings()
                assert settings.jira_server == 'https://test.atlassian.net'
                assert settings.jira_email == 'test@example.com'
                assert settings.jira_api_token == 'test-token'

    def test_environment_override(self):
        """Test that environment variables override .env file"""
        env_vars = {
            'JIRA_SERVER': 'https://override.atlassian.net',
            'JIRA_EMAIL': 'override@example.com',
            'JIRA_API_TOKEN': 'override-token'
        }
        
        with patch.dict(os.environ, env_vars):
            settings = Settings()
            assert settings.jira_server == env_vars['JIRA_SERVER']
            assert settings.jira_email == env_vars['JIRA_EMAIL']
            assert settings.jira_api_token == env_vars['JIRA_API_TOKEN']

    def test_url_normalization(self):
        """Test that URLs are properly normalized"""
        test_cases = [
            ('https://test.atlassian.net/', 'https://test.atlassian.net'),  # Trailing slash
            ('http://test.atlassian.net', 'http://test.atlassian.net'),     # HTTP
            ('test.atlassian.net', 'https://test.atlassian.net'),          # No protocol
        ]
        
        for input_url, expected_url in test_cases:
            with patch.dict(os.environ, {
                'JIRA_SERVER': input_url,
                'JIRA_EMAIL': 'test@example.com',
                'JIRA_API_TOKEN': 'token'
            }):
                settings = Settings()
                assert settings.jira_server == expected_url

    def test_email_validation(self):
        """Test email validation rules"""
        valid_emails = [
            'test@example.com',
            'test.name@example.com',
            'test+label@example.com'
        ]
        
        invalid_emails = [
            'not-an-email',
            '@example.com',
            'test@',
            'test@.com'
        ]
        
        base_config = {
            'JIRA_SERVER': 'https://test.atlassian.net',
            'JIRA_API_TOKEN': 'token'
        }
        
        # Test valid emails
        for email in valid_emails:
            config = base_config.copy()
            config['JIRA_EMAIL'] = email
            with patch.dict(os.environ, config):
                settings = Settings()
                assert settings.jira_email == email
        
        # Test invalid emails
        for email in invalid_emails:
            config = base_config.copy()
            config['JIRA_EMAIL'] = email
            with patch.dict(os.environ, config):
                with pytest.raises(Exception):
                    Settings()

    def test_token_validation(self):
        """Test API token validation rules"""
        invalid_tokens = [
            '',             # Empty
            ' ',           # Whitespace
            'a' * 1001,    # Too long
        ]
        
        base_config = {
            'JIRA_SERVER': 'https://test.atlassian.net',
            'JIRA_EMAIL': 'test@example.com'
        }
        
        for token in invalid_tokens:
            config = base_config.copy()
            config['JIRA_API_TOKEN'] = token
            with patch.dict(os.environ, config):
                with pytest.raises(Exception):
                    Settings()

    def test_settings_immutability(self):
        """Test that settings are immutable after creation"""
        with patch.dict(os.environ, {
            'JIRA_SERVER': 'https://test.atlassian.net',
            'JIRA_EMAIL': 'test@example.com',
            'JIRA_API_TOKEN': 'token'
        }):
            settings = Settings()
            
            # Attempt to modify settings
            with pytest.raises(Exception):
                settings.jira_server = 'https://new.atlassian.net'

    def test_default_values(self):
        """Test default values for optional settings"""
        with patch.dict(os.environ, {
            'JIRA_SERVER': 'https://test.atlassian.net',
            'JIRA_EMAIL': 'test@example.com',
            'JIRA_API_TOKEN': 'token'
        }):
            settings = Settings()
            assert settings.jql_query == "project = PROJ AND type = Story"
            assert settings.workflow_states == ["Backlog", "In Progress", "Done"]
            assert settings.lead_time_start_state == "Backlog"
            assert settings.lead_time_end_state == "Done"
            assert settings.cycle_time_start_state == "In Progress"
            assert settings.cycle_time_end_state == "Done"

    def test_custom_values(self):
        """Test setting custom values through environment variables"""
        custom_config = {
            'JIRA_SERVER': 'https://test.atlassian.net',
            'JIRA_EMAIL': 'test@example.com',
            'JIRA_API_TOKEN': 'token',
            'JQL_QUERY': 'project = CUSTOM',
            'WORKFLOW_STATES': '["Todo", "Doing", "Review", "Done"]',
            'LEAD_TIME_START_STATE': 'Todo',
            'LEAD_TIME_END_STATE': 'Done',
            'CYCLE_TIME_START_STATE': 'Doing',
            'CYCLE_TIME_END_STATE': 'Done'
        }
        
        with patch.dict(os.environ, custom_config):
            settings = Settings()
            assert settings.jql_query == "project = CUSTOM"
            assert settings.workflow_states == ["Todo", "Doing", "Review", "Done"]
            assert settings.lead_time_start_state == "Todo"
            assert settings.lead_time_end_state == "Done"
            assert settings.cycle_time_start_state == "Doing"
            assert settings.cycle_time_end_state == "Done"

    def test_workflow_state_validation(self):
        """Test validation of workflow states"""
        invalid_configs = [
            # Lead time start state not in workflow
            {
                'WORKFLOW_STATES': '["Doing", "Done"]',
                'LEAD_TIME_START_STATE': 'Todo'
            },
            # Cycle time end state not in workflow
            {
                'WORKFLOW_STATES': '["Todo", "Doing"]',
                'CYCLE_TIME_END_STATE': 'Done'
            },
            # Empty workflow states
            {
                'WORKFLOW_STATES': '[]'
            },
            # Invalid JSON for workflow states
            {
                'WORKFLOW_STATES': 'not-json'
            }
        ]

        base_config = {
            'JIRA_SERVER': 'https://test.atlassian.net',
            'JIRA_EMAIL': 'test@example.com',
            'JIRA_API_TOKEN': 'token'
        }

        for invalid_config in invalid_configs:
            test_config = base_config.copy()
            test_config.update(invalid_config)
            with patch.dict(os.environ, test_config):
                with pytest.raises(Exception):
                    Settings()

    def test_jql_query_validation(self):
        """Test JQL query validation"""
        invalid_queries = [
            '',  # Empty
            ' ',  # Whitespace
            'not a valid JQL',  # No field
            'project ==== TEST'  # Invalid operator
        ]

        base_config = {
            'JIRA_SERVER': 'https://test.atlassian.net',
            'JIRA_EMAIL': 'test@example.com',
            'JIRA_API_TOKEN': 'token'
        }

        for query in invalid_queries:
            test_config = base_config.copy()
            test_config['JQL_QUERY'] = query
            with patch.dict(os.environ, test_config):
                with pytest.raises(Exception):
                    Settings()
