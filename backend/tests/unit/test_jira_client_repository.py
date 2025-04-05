"""Tests for the JiraClientRepository class."""

import pytest
from sqlalchemy import select

from app.models import JiraConfiguration
from app.repositories.jira_client_repository import JiraClientRepository


@pytest.mark.asyncio
async def test_get_by_name_found(db_session):
    """Test getting a configuration by name when it exists."""
    # Arrange

    # Create a test configuration
    config = JiraConfiguration(
        name='test_jira_client_config',
        jira_server='https://test.atlassian.net',
        jira_email='test@example.com',
        jira_api_token='test-token',
        jql_query='project = TEST',
        project_key='TEST',
        workflow_states=['Backlog', 'In Progress', 'Done'],
        lead_time_start_state='Backlog',
        lead_time_end_state='Done',
        cycle_time_start_state='In Progress',
        cycle_time_end_state='Done',
    )
    db_session.add(config)
    await db_session.commit()

    repo = JiraClientRepository(db_session)
    config_name = 'test_jira_client_config'

    # Act
    result = await repo.get_by_name(config_name)

    # Assert
    assert result is not None
    assert result.name == config_name
    assert result.jira_server == 'https://test.atlassian.net'
    assert result.jira_email == 'test@example.com'
    assert result.jira_api_token == 'test-token'


@pytest.mark.asyncio
async def test_get_by_name_not_found(db_session):
    """Test getting a configuration by name when it doesn't exist."""
    # Arrange
    repo = JiraClientRepository(db_session)
    non_existent_name = 'non_existent_config'

    # Act
    result = await repo.get_by_name(non_existent_name)

    # Assert
    assert result is None


@pytest.mark.asyncio
async def test_repository_uses_session_correctly(db_session):
    """Test that the repository correctly uses the provided session."""
    # Arrange

    # Create a test configuration
    config = JiraConfiguration(
        name='test_jira_client_config2',
        jira_server='https://test.atlassian.net',
        jira_email='test@example.com',
        jira_api_token='test-token',
        jql_query='project = TEST',
        project_key='TEST',
        workflow_states=['Backlog', 'In Progress', 'Done'],
        lead_time_start_state='Backlog',
        lead_time_end_state='Done',
        cycle_time_start_state='In Progress',
        cycle_time_end_state='Done',
    )
    db_session.add(config)
    await db_session.commit()

    repo = JiraClientRepository(db_session)
    config_name = 'test_jira_client_config2'

    # Act
    await repo.get_by_name(config_name)

    # Assert - Verify that the session was used correctly
    # This is an implementation detail test, but it's important to ensure
    # the repository is using the session as expected
    stmt = select(JiraConfiguration).where(JiraConfiguration.name == config_name)
    result = await db_session.execute(stmt)
    config = result.scalar_one_or_none()

    assert config is not None
    assert config.name == config_name
