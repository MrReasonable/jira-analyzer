"""Unit tests for the ConfigurationService.

This module contains unit tests for the ConfigurationService class.
"""

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.schemas import JiraConfigurationCreate, JiraConfigurationUpdate
from app.services.configuration_service import ConfigurationService


@pytest.mark.asyncio
async def test_get_all_paginated():
    """Test getting all configurations with pagination."""
    # Arrange
    mock_session = AsyncMock()
    mock_repo = AsyncMock()

    # Mock the repository's get_all and count methods
    mock_repo.get_all.return_value = ['config1', 'config2']
    mock_repo.count.return_value = 10

    # Create a service with the mocked repository
    service = ConfigurationService(mock_session, mock_repo)

    # Act
    result = await service.get_all_paginated(skip=5, limit=2)

    # Assert
    mock_repo.get_all.assert_called_once_with(5, 2)
    mock_repo.count.assert_called_once()
    assert result['items'] == ['config1', 'config2']
    assert result['total'] == 10
    assert result['skip'] == 5
    assert result['limit'] == 2


@pytest.mark.asyncio
async def test_get_by_name_found():
    """Test getting a configuration by name when it exists."""
    # Arrange
    mock_session = AsyncMock()
    mock_repo = AsyncMock()

    # Mock the repository's get_by_name method
    mock_config = MagicMock()
    mock_config.name = 'Test Config'
    mock_repo.get_by_name.return_value = mock_config

    # Create a service with the mocked repository
    service = ConfigurationService(mock_session, mock_repo)

    # Act
    result = await service.get_by_name('Test Config')

    # Assert
    mock_repo.get_by_name.assert_called_once_with('Test Config')
    assert result == mock_config


@pytest.mark.asyncio
async def test_get_by_name_not_found():
    """Test getting a configuration by name when it doesn't exist."""
    # Arrange
    mock_session = AsyncMock()
    mock_repo = AsyncMock()

    # Mock the repository's get_by_name method to return None
    mock_repo.get_by_name.return_value = None

    # Create a service with the mocked repository
    service = ConfigurationService(mock_session, mock_repo)

    # Act & Assert
    with pytest.raises(HTTPException) as excinfo:
        await service.get_by_name('Non-existent Config')

    # Verify the exception details
    assert excinfo.value.status_code == 404
    assert "Configuration 'Non-existent Config' not found" in str(excinfo.value.detail)
    mock_repo.get_by_name.assert_called_once_with('Non-existent Config')


@pytest.mark.asyncio
async def test_create_success():
    """Test creating a configuration successfully."""
    # Arrange
    mock_session = AsyncMock()
    mock_repo = AsyncMock()

    # Mock the repository's create method
    mock_config = MagicMock()
    mock_config.name = 'New Config'
    mock_repo.create.return_value = mock_config

    # Create a service with the mocked repository
    service = ConfigurationService(mock_session, mock_repo)

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
    result = await service.create(config_data)

    # Assert
    mock_repo.create.assert_called_once_with(config_data)
    assert result == mock_config


@pytest.mark.asyncio
async def test_create_missing_project_key():
    """Test creating a configuration with missing project_key."""
    # Arrange
    mock_session = AsyncMock()
    mock_repo = AsyncMock()

    # Create a service with the mocked repository
    service = ConfigurationService(mock_session, mock_repo)

    # Create configuration data with empty project_key
    config_data = JiraConfigurationCreate(
        name='New Config',
        jira_server='https://new.atlassian.net',
        jira_email='new@example.com',
        jira_api_token='new-token',
        jql_query='project = NEW',
        project_key='',  # Empty project_key
        workflow_states=['To Do', 'In Progress', 'Done'],
        lead_time_start_state='To Do',
        lead_time_end_state='Done',
        cycle_time_start_state='In Progress',
        cycle_time_end_state='Done',
    )

    # Act & Assert
    with pytest.raises(HTTPException) as excinfo:
        await service.create(config_data)

    # Verify the exception details
    assert excinfo.value.status_code == 422
    assert 'Missing required field: project_key' in str(excinfo.value.detail)
    mock_repo.create.assert_not_called()


@pytest.mark.asyncio
async def test_create_repository_error():
    """Test creating a configuration when the repository raises an error."""
    # Arrange
    mock_session = AsyncMock()
    mock_repo = AsyncMock()

    # Mock the repository's create method to raise an exception
    mock_repo.create.side_effect = Exception('Database error')

    # Create a service with the mocked repository
    service = ConfigurationService(mock_session, mock_repo)

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

    # Act & Assert
    with pytest.raises(HTTPException) as excinfo:
        await service.create(config_data)

    # Verify the exception details
    assert excinfo.value.status_code == 400
    assert 'Could not create configuration: Database error' in str(excinfo.value.detail)
    mock_repo.create.assert_called_once_with(config_data)


@pytest.mark.asyncio
async def test_update_success():
    """Test updating a configuration successfully."""
    # Arrange
    mock_session = AsyncMock()
    mock_repo = AsyncMock()

    # Mock the repository's update method
    mock_config = MagicMock()
    mock_config.name = 'Update Config'
    mock_repo.update.return_value = mock_config

    # Create a service with the mocked repository
    service = ConfigurationService(mock_session, mock_repo)

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
    result = await service.update('Update Config', update_data)

    # Assert
    mock_repo.update.assert_called_once_with('Update Config', update_data)
    assert result == mock_config


@pytest.mark.asyncio
async def test_update_not_found():
    """Test updating a configuration that doesn't exist."""
    # Arrange
    mock_session = AsyncMock()
    mock_repo = AsyncMock()

    # Mock the repository's update method to return None
    mock_repo.update.return_value = None

    # Create a service with the mocked repository
    service = ConfigurationService(mock_session, mock_repo)

    # Create update data
    update_data = JiraConfigurationUpdate(
        name='Non-existent Config',
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

    # Act & Assert
    with pytest.raises(HTTPException) as excinfo:
        await service.update('Non-existent Config', update_data)

    # Verify the exception details
    assert excinfo.value.status_code == 404
    assert "Configuration 'Non-existent Config' not found" in str(excinfo.value.detail)
    mock_repo.update.assert_called_once_with('Non-existent Config', update_data)


@pytest.mark.asyncio
async def test_delete_success():
    """Test deleting a configuration successfully."""
    # Arrange
    mock_session = AsyncMock()
    mock_repo = AsyncMock()

    # Mock the repository's delete method to return True
    mock_repo.delete.return_value = True

    # Create a service with the mocked repository
    service = ConfigurationService(mock_session, mock_repo)

    # Act
    await service.delete('Delete Config')

    # Assert
    mock_repo.delete.assert_called_once_with('Delete Config')


@pytest.mark.asyncio
async def test_delete_not_found():
    """Test deleting a configuration that doesn't exist."""
    # Arrange
    mock_session = AsyncMock()
    mock_repo = AsyncMock()

    # Mock the repository's delete method to return False
    mock_repo.delete.return_value = False

    # Create a service with the mocked repository
    service = ConfigurationService(mock_session, mock_repo)

    # Act & Assert
    with pytest.raises(HTTPException) as excinfo:
        await service.delete('Non-existent Config')

    # Verify the exception details
    assert excinfo.value.status_code == 404
    assert "Configuration 'Non-existent Config' not found" in str(excinfo.value.detail)
    mock_repo.delete.assert_called_once_with('Non-existent Config')
