"""Unit tests for the ConfigurationRepository.

This module contains unit tests for the ConfigurationRepository class.
"""

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import JiraConfiguration
from app.repositories.configuration_repository import ConfigurationRepository
from app.schemas import JiraConfigurationCreate, JiraConfigurationUpdate


@pytest.mark.asyncio
async def test_get_all(db_session: AsyncSession):
    """Test getting all configurations."""
    # Arrange
    repo = ConfigurationRepository(db_session)

    # Create test configurations
    config1 = JiraConfiguration(
        name='Test Config 1',
        jira_server='https://test1.atlassian.net',
        jira_email='test1@example.com',
        jira_api_token='test-token-1',
        jql_query='project = TEST1',
        project_key='TEST1',
        workflow_states=['To Do', 'In Progress', 'Done'],
        lead_time_start_state='To Do',
        lead_time_end_state='Done',
        cycle_time_start_state='In Progress',
        cycle_time_end_state='Done',
    )
    config2 = JiraConfiguration(
        name='Test Config 2',
        jira_server='https://test2.atlassian.net',
        jira_email='test2@example.com',
        jira_api_token='test-token-2',
        jql_query='project = TEST2',
        project_key='TEST2',
        workflow_states=['To Do', 'In Progress', 'Done'],
        lead_time_start_state='To Do',
        lead_time_end_state='Done',
        cycle_time_start_state='In Progress',
        cycle_time_end_state='Done',
    )
    db_session.add(config1)
    db_session.add(config2)
    await db_session.commit()

    # Act
    configs = await repo.get_all()

    # Assert
    assert len(configs) == 2
    assert configs[0].name == 'Test Config 1'
    assert configs[1].name == 'Test Config 2'


@pytest.mark.asyncio
async def test_get_by_name(db_session: AsyncSession):
    """Test getting a configuration by name."""
    # Arrange
    repo = ConfigurationRepository(db_session)

    # Create test configuration
    config = JiraConfiguration(
        name='Test Config',
        jira_server='https://test.atlassian.net',
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
    db_session.add(config)
    await db_session.commit()

    # Act
    result = await repo.get_by_name('Test Config')

    # Assert
    assert result is not None
    assert result.name == 'Test Config'
    assert result.jira_server == 'https://test.atlassian.net'

    # Test non-existent configuration
    result = await repo.get_by_name('Non-existent Config')
    assert result is None


@pytest.mark.asyncio
async def test_create(db_session: AsyncSession):
    """Test creating a configuration."""
    # Arrange
    repo = ConfigurationRepository(db_session)

    # Create configuration data
    config_data = JiraConfigurationCreate(
        name='New Config',
        jira_server='https://new.atlassian.net',
        jira_email='new@example.com',
        jira_api_token='new-token',
        jql_query='project = NEW',
        project_key='NEW',
        workflow_states=['To Do', 'In Progress', 'Done'],
        lead_time_start_state='To Do',
        lead_time_end_state='Done',
        cycle_time_start_state='In Progress',
        cycle_time_end_state='Done',
    )

    # Act
    result = await repo.create(config_data)

    # Assert
    assert result is not None
    assert result.name == 'New Config'
    assert result.jira_server == 'https://new.atlassian.net'

    # Verify it was saved to the database
    stmt = select(JiraConfiguration).where(JiraConfiguration.name == 'New Config')
    db_result = await db_session.execute(stmt)
    db_config = db_result.scalar_one_or_none()
    assert db_config is not None
    assert db_config.name == 'New Config'


@pytest.mark.asyncio
async def test_update(db_session: AsyncSession):
    """Test updating a configuration."""
    # Arrange
    repo = ConfigurationRepository(db_session)

    # Create test configuration
    config = JiraConfiguration(
        name='Update Config',
        jira_server='https://update.atlassian.net',
        jira_email='update@example.com',
        jira_api_token='update-token',
        jql_query='project = UPDATE',
        project_key='UPDATE',
        workflow_states=['To Do', 'In Progress', 'Done'],
        lead_time_start_state='To Do',
        lead_time_end_state='Done',
        cycle_time_start_state='In Progress',
        cycle_time_end_state='Done',
    )
    db_session.add(config)
    await db_session.commit()

    # Create update data
    update_data = JiraConfigurationUpdate(
        name='Update Config',
        jira_server='https://updated.atlassian.net',
        jira_email='updated@example.com',
        jira_api_token='updated-token',
        jql_query='project = UPDATED',
        project_key='UPDATED',
        workflow_states=['To Do', 'In Progress', 'Review', 'Done'],
        lead_time_start_state='To Do',
        lead_time_end_state='Done',
        cycle_time_start_state='In Progress',
        cycle_time_end_state='Done',
    )

    # Act
    result = await repo.update('Update Config', update_data)

    # Assert
    assert result is not None
    assert result.name == 'Update Config'
    assert result.jira_server == 'https://updated.atlassian.net'
    assert result.jira_email == 'updated@example.com'
    assert result.project_key == 'UPDATED'
    assert len(result.workflow_states) == 4
    assert 'Review' in result.workflow_states

    # Test updating non-existent configuration
    result = await repo.update('Non-existent Config', update_data)
    assert result is None


@pytest.mark.asyncio
async def test_delete(db_session: AsyncSession):
    """Test deleting a configuration."""
    # Arrange
    repo = ConfigurationRepository(db_session)

    # Create test configuration
    config = JiraConfiguration(
        name='Delete Config',
        jira_server='https://delete.atlassian.net',
        jira_email='delete@example.com',
        jira_api_token='delete-token',
        jql_query='project = DELETE',
        project_key='DELETE',
        workflow_states=['To Do', 'In Progress', 'Done'],
        lead_time_start_state='To Do',
        lead_time_end_state='Done',
        cycle_time_start_state='In Progress',
        cycle_time_end_state='Done',
    )
    db_session.add(config)
    await db_session.commit()

    # Act
    result = await repo.delete('Delete Config')

    # Assert
    assert result is True

    # Verify it was deleted from the database
    stmt = select(JiraConfiguration).where(JiraConfiguration.name == 'Delete Config')
    db_result = await db_session.execute(stmt)
    db_config = db_result.scalar_one_or_none()
    assert db_config is None

    # Test deleting non-existent configuration
    result = await repo.delete('Non-existent Config')
    assert result is False


@pytest.mark.asyncio
async def test_count(db_session: AsyncSession):
    """Test counting configurations."""
    # Arrange
    repo = ConfigurationRepository(db_session)

    # Create test configurations
    config1 = JiraConfiguration(
        name='Count Config 1',
        jira_server='https://count1.atlassian.net',
        jira_email='count1@example.com',
        jira_api_token='count-token-1',
        jql_query='project = COUNT1',
        project_key='COUNT1',
        workflow_states=['To Do', 'In Progress', 'Done'],
        lead_time_start_state='To Do',
        lead_time_end_state='Done',
        cycle_time_start_state='In Progress',
        cycle_time_end_state='Done',
    )
    config2 = JiraConfiguration(
        name='Count Config 2',
        jira_server='https://count2.atlassian.net',
        jira_email='count2@example.com',
        jira_api_token='count-token-2',
        jql_query='project = COUNT2',
        project_key='COUNT2',
        workflow_states=['To Do', 'In Progress', 'Done'],
        lead_time_start_state='To Do',
        lead_time_end_state='Done',
        cycle_time_start_state='In Progress',
        cycle_time_end_state='Done',
    )
    db_session.add(config1)
    db_session.add(config2)
    await db_session.commit()

    # Act
    count = await repo.count()

    # Assert
    assert count == 2
