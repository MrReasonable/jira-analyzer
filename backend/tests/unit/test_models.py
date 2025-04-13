"""Unit tests for the models module.

This module contains unit tests for the SQLAlchemy models.
"""

from app.models import Base, JiraConfiguration


class TestModels:
    """Tests for the models module."""

    def test_base_class(self):
        """Test that the Base class is properly configured."""
        # Verify that Base is a DeclarativeBase
        assert hasattr(Base, 'metadata')
        assert hasattr(Base, 'registry')

    def test_jira_configuration_model(self):
        """Test that the JiraConfiguration model is properly defined."""
        # Get the model's table
        table = JiraConfiguration.__table__

        # Verify the table name
        assert table.name == 'jira_configurations'

        # Get the model's columns
        columns = {column.name: column for column in table.columns}

        # Verify that all expected columns exist
        expected_columns = [
            'id',
            'name',
            'jira_server',
            'jira_email',
            'jira_api_token',
            'jql_query',
            'workflow_states',
            'lead_time_start_state',
            'lead_time_end_state',
            'cycle_time_start_state',
            'cycle_time_end_state',
        ]
        for column_name in expected_columns:
            assert (
                column_name in columns
            ), f'Column {column_name} not found in JiraConfiguration model'

        # Verify primary key
        assert columns['id'].primary_key

        # Verify indexes
        indexes = [idx for idx in table.indexes if 'name' in [col.name for col in idx.columns]]

        # Check for name uniqueness
        assert any(idx.unique for idx in indexes), 'name column should have a unique index'

        # Verify nullable constraints
        assert not columns['name'].nullable
        assert not columns['jira_server'].nullable
        assert not columns['jira_email'].nullable
        assert not columns['jira_api_token'].nullable
        assert not columns['jql_query'].nullable
        assert not columns['workflow_states'].nullable
        assert not columns['lead_time_start_state'].nullable
        assert not columns['lead_time_end_state'].nullable
        assert not columns['cycle_time_start_state'].nullable
        assert not columns['cycle_time_end_state'].nullable

    def test_jira_configuration_instance(self):
        """Test creating a JiraConfiguration instance."""
        # Create a JiraConfiguration instance
        config = JiraConfiguration(
            name='Test Configuration',
            jira_server='https://example.atlassian.net',
            jira_email='test@example.com',
            jira_api_token='test-token',
            jql_query='project = TEST',
            workflow_states=['To Do', 'In Progress', 'Done'],
            lead_time_start_state='To Do',
            lead_time_end_state='Done',
            cycle_time_start_state='In Progress',
            cycle_time_end_state='Done',
        )

        # Verify the instance attributes
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
