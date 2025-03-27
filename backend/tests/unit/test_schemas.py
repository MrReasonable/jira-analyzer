"""Unit tests for the schemas module.

This module contains unit tests for the Pydantic schemas used for
request/response validation and serialization.
"""

import pytest
from pydantic import ValidationError

from app.models import JiraConfiguration as JiraConfigurationModel
from app.schemas import (
    JiraConfiguration,
    JiraConfigurationBase,
    JiraConfigurationCreate,
    JiraConfigurationList,
    JiraConfigurationUpdate,
)


class TestSchemas:
    """Tests for the schemas module."""

    def test_jira_configuration_base_valid(self):
        """Test that JiraConfigurationBase validates correct data."""
        # Create a valid configuration
        config_data = {
            'name': 'Test Configuration',
            'jira_server': 'https://example.atlassian.net',
            'jira_email': 'test@example.com',
            'jira_api_token': 'test-token',
            'jql_query': 'project = TEST',
            'project_key': 'TEST',
            'workflow_states': ['To Do', 'In Progress', 'Done'],
            'lead_time_start_state': 'To Do',
            'lead_time_end_state': 'Done',
            'cycle_time_start_state': 'In Progress',
            'cycle_time_end_state': 'Done',
        }

        # Validate the data
        config = JiraConfigurationBase(**config_data)

        # Verify the validated data
        assert config.name == 'Test Configuration'
        assert config.jira_server == 'https://example.atlassian.net'
        assert config.jira_email == 'test@example.com'
        assert config.jira_api_token == 'test-token'
        assert config.jql_query == 'project = TEST'
        assert config.project_key == 'TEST'
        assert config.workflow_states == ['To Do', 'In Progress', 'Done']
        assert config.lead_time_start_state == 'To Do'
        assert config.lead_time_end_state == 'Done'
        assert config.cycle_time_start_state == 'In Progress'
        assert config.cycle_time_end_state == 'Done'

    def test_jira_configuration_base_invalid(self):
        """Test that JiraConfigurationBase rejects invalid data."""
        # Missing required fields
        with pytest.raises(ValidationError):
            JiraConfigurationBase(
                name='Test Configuration',
                # Missing jira_server
                jira_email='test@example.com',
                jira_api_token='test-token',
                jql_query='project = TEST',
                project_key='TEST',
                workflow_states=['To Do', 'In Progress', 'Done'],
                lead_time_start_state='To Do',
                lead_time_end_state='Done',
                cycle_time_start_state='In Progress',
                cycle_time_end_state='Done',
            )

        # Invalid workflow_states (not a list)
        with pytest.raises(ValidationError):
            JiraConfigurationBase(
                name='Test Configuration',
                jira_server='https://example.atlassian.net',
                jira_email='test@example.com',
                jira_api_token='test-token',
                jql_query='project = TEST',
                project_key='TEST',
                workflow_states='Invalid',  # Should be a list
                lead_time_start_state='To Do',
                lead_time_end_state='Done',
                cycle_time_start_state='In Progress',
                cycle_time_end_state='Done',
            )

    def test_jira_configuration_create(self):
        """Test that JiraConfigurationCreate works correctly."""
        # Create a valid configuration
        config_data = {
            'name': 'Test Configuration',
            'jira_server': 'https://example.atlassian.net',
            'jira_email': 'test@example.com',
            'jira_api_token': 'test-token',
            'jql_query': 'project = TEST',
            'project_key': 'TEST',
            'workflow_states': ['To Do', 'In Progress', 'Done'],
            'lead_time_start_state': 'To Do',
            'lead_time_end_state': 'Done',
            'cycle_time_start_state': 'In Progress',
            'cycle_time_end_state': 'Done',
        }

        # Validate the data
        config = JiraConfigurationCreate(**config_data)

        # Verify the validated data
        assert config.name == 'Test Configuration'
        assert config.jira_server == 'https://example.atlassian.net'
        assert config.jira_email == 'test@example.com'
        assert config.jira_api_token == 'test-token'
        assert config.jql_query == 'project = TEST'
        assert config.workflow_states == ['To Do', 'In Progress', 'Done']
        assert config.lead_time_start_state == 'To Do'
        assert config.lead_time_end_state == 'Done'
        assert config.cycle_time_start_state == 'In Progress'
        assert config.cycle_time_end_state == 'Done'

    def test_jira_configuration_update(self):
        """Test that JiraConfigurationUpdate works correctly."""
        # Create a valid configuration
        config_data = {
            'name': 'Test Configuration',
            'jira_server': 'https://example.atlassian.net',
            'jira_email': 'test@example.com',
            'jira_api_token': 'test-token',
            'jql_query': 'project = TEST',
            'project_key': 'TEST',
            'workflow_states': ['To Do', 'In Progress', 'Done'],
            'lead_time_start_state': 'To Do',
            'lead_time_end_state': 'Done',
            'cycle_time_start_state': 'In Progress',
            'cycle_time_end_state': 'Done',
        }

        # Validate the data
        config = JiraConfigurationUpdate(**config_data)

        # Verify the validated data
        assert config.name == 'Test Configuration'
        assert config.jira_server == 'https://example.atlassian.net'
        assert config.jira_email == 'test@example.com'
        assert config.jira_api_token == 'test-token'
        assert config.jql_query == 'project = TEST'
        assert config.project_key == 'TEST'
        assert config.workflow_states == ['To Do', 'In Progress', 'Done']
        assert config.lead_time_start_state == 'To Do'
        assert config.lead_time_end_state == 'Done'
        assert config.cycle_time_start_state == 'In Progress'
        assert config.cycle_time_end_state == 'Done'

    def test_jira_configuration(self):
        """Test that JiraConfiguration works correctly."""
        # Create a valid configuration
        config_data = {
            'id': 1,
            'name': 'Test Configuration',
            'jira_server': 'https://example.atlassian.net',
            'jira_email': 'test@example.com',
            'jira_api_token': 'test-token',
            'jql_query': 'project = TEST',
            'project_key': 'TEST',
            'workflow_states': ['To Do', 'In Progress', 'Done'],
            'lead_time_start_state': 'To Do',
            'lead_time_end_state': 'Done',
            'cycle_time_start_state': 'In Progress',
            'cycle_time_end_state': 'Done',
        }

        # Validate the data
        config = JiraConfiguration(**config_data)

        # Verify the validated data
        assert config.id == 1
        assert config.name == 'Test Configuration'
        assert config.jira_server == 'https://example.atlassian.net'
        assert config.jira_email == 'test@example.com'
        assert config.jira_api_token == 'test-token'
        assert config.jql_query == 'project = TEST'
        assert config.project_key == 'TEST'
        assert config.workflow_states == ['To Do', 'In Progress', 'Done']
        assert config.lead_time_start_state == 'To Do'
        assert config.lead_time_end_state == 'Done'
        assert config.cycle_time_start_state == 'In Progress'
        assert config.cycle_time_end_state == 'Done'

    def test_jira_configuration_from_orm(self):
        """Test that JiraConfiguration can be created from an ORM model."""
        # Create a JiraConfigurationModel instance
        orm_model = JiraConfigurationModel(
            id=1,
            name='Test Configuration',
            jira_server='https://example.atlassian.net',
            jira_email='test@example.com',
            jira_api_token='test-token',
            jql_query='project = TEST',
            project_key='TEST',  # Add project_key field
            workflow_states=['To Do', 'In Progress', 'Done'],
            lead_time_start_state='To Do',
            lead_time_end_state='Done',
            cycle_time_start_state='In Progress',
            cycle_time_end_state='Done',
        )

        # Create a JiraConfiguration from the ORM model
        config = JiraConfiguration.model_validate(orm_model)

        # Verify the validated data
        assert config.id == 1
        assert config.name == 'Test Configuration'
        assert config.jira_server == 'https://example.atlassian.net'
        assert config.jira_email == 'test@example.com'
        assert config.jira_api_token == 'test-token'
        assert config.jql_query == 'project = TEST'
        assert config.project_key == 'TEST'  # Verify project_key
        assert config.workflow_states == ['To Do', 'In Progress', 'Done']
        assert config.lead_time_start_state == 'To Do'
        assert config.lead_time_end_state == 'Done'
        assert config.cycle_time_start_state == 'In Progress'
        assert config.cycle_time_end_state == 'Done'

    def test_jira_configuration_list(self):
        """Test that JiraConfigurationList works correctly."""
        # Create a valid configuration
        config_data = {
            'name': 'Test Configuration',
            'jira_server': 'https://example.atlassian.net',
            'jira_email': 'test@example.com',
        }

        # Validate the data
        config = JiraConfigurationList(**config_data)

        # Verify the validated data
        assert config.name == 'Test Configuration'
        assert config.jira_server == 'https://example.atlassian.net'
        assert config.jira_email == 'test@example.com'

    def test_jira_configuration_list_from_orm(self):
        """Test that JiraConfigurationList can be created from an ORM model."""
        # Create a JiraConfigurationModel instance
        orm_model = JiraConfigurationModel(
            id=1,
            name='Test Configuration',
            jira_server='https://example.atlassian.net',
            jira_email='test@example.com',
            jira_api_token='test-token',
            jql_query='project = TEST',
            project_key='TEST',  # Add project_key field
            workflow_states=['To Do', 'In Progress', 'Done'],
            lead_time_start_state='To Do',
            lead_time_end_state='Done',
            cycle_time_start_state='In Progress',
            cycle_time_end_state='Done',
        )

        # Create a JiraConfigurationList from the ORM model
        config = JiraConfigurationList.model_validate(orm_model)

        # Verify the validated data
        assert config.name == 'Test Configuration'
        assert config.jira_server == 'https://example.atlassian.net'
        assert config.jira_email == 'test@example.com'
        # Verify that sensitive fields are not included
        assert not hasattr(config, 'jira_api_token')
