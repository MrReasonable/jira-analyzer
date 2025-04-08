"""Tests for the Jira API endpoints."""

from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from ..constants import STATUS_DONE, STATUS_IN_PROGRESS, STATUS_TO_DO
from ..routers.jira import get_jira_workflows, get_jira_workflows_with_credentials


@pytest.mark.asyncio
async def test_get_jira_workflows():
    """Test the get_jira_workflows endpoint."""
    # Mock dependencies
    request = MagicMock()
    credentials = MagicMock()
    settings = MagicMock()
    jira_client_service = AsyncMock()

    # Mock JIRA client for historical data approach
    mock_jira = MagicMock()

    # Mock search_issues response with sample issues
    mock_issue1 = MagicMock()
    mock_issue1.fields.status.name = STATUS_TO_DO
    mock_issue1.fields.status.statusCategory = {'name': STATUS_TO_DO}

    mock_issue2 = MagicMock()
    mock_issue2.fields.status.name = STATUS_IN_PROGRESS
    mock_issue2.fields.status.statusCategory = {'name': STATUS_IN_PROGRESS}

    mock_issue3 = MagicMock()
    mock_issue3.fields.status.name = STATUS_DONE
    mock_issue3.fields.status.statusCategory = {'name': STATUS_DONE}

    # Set up the mock to return our sample issues
    mock_jira.search_issues.return_value = [mock_issue1, mock_issue2, mock_issue3]

    jira_client_service.get_client_from_auth.return_value = mock_jira

    # Call the function
    with patch('app.routers.jira.datetime') as mock_datetime:
        # Mock the datetime to return a fixed date for testing
        mock_now = datetime(2023, 1, 1)
        mock_datetime.now.return_value = mock_now
        mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)

        # Call endpoint
        result = await get_jira_workflows(
            request=request,
            project_key='TEST',
            config_name='test-config',
            credentials=credentials,
            settings=settings,
            jira_client_service=jira_client_service,
        )

    # Verify results
    assert len(result) == 3

    # Convert result list to dict for easier testing
    result_dict = {item['name']: item for item in result}

    assert STATUS_TO_DO in result_dict
    assert STATUS_IN_PROGRESS in result_dict
    assert STATUS_DONE in result_dict

    assert result_dict[STATUS_TO_DO]['category'] == STATUS_TO_DO
    assert result_dict[STATUS_IN_PROGRESS]['category'] == STATUS_IN_PROGRESS
    assert result_dict[STATUS_DONE]['category'] == STATUS_DONE

    # Verify service was called correctly
    jira_client_service.get_client_from_auth.assert_called_once_with(
        request, credentials, settings, 'test-config'
    )

    # Verify search_issues was called with correct params
    six_months_ago = (mock_now - timedelta(days=180)).strftime('%Y-%m-%d')
    expected_jql = f'project = TEST AND updated >= {six_months_ago}'
    mock_jira.search_issues.assert_called_once()
    call_args = mock_jira.search_issues.call_args[0]
    assert call_args[0] == expected_jql


@pytest.mark.asyncio
async def test_get_jira_workflows_project_key_required():
    """Test that project_key is required."""
    with pytest.raises(HTTPException) as excinfo:
        await get_jira_workflows(
            request=MagicMock(),
            project_key='',  # Empty project key
            credentials=MagicMock(),
            settings=MagicMock(),
            jira_client_service=AsyncMock(),
        )

    assert excinfo.value.status_code == 400
    assert 'Project key is required' in str(excinfo.value.detail)


@pytest.mark.asyncio
async def test_get_jira_workflows_with_no_issues():
    """Test handling case with no issues found."""
    # Mock dependencies
    request = MagicMock()
    credentials = MagicMock()
    settings = MagicMock()
    jira_client_service = AsyncMock()

    # Mock JIRA client
    mock_jira = MagicMock()

    # Return empty issue list
    mock_jira.search_issues.return_value = []

    # Mock statuses for fallback
    mock_status_1 = MagicMock()
    mock_status_1.id = 'todo-1'
    mock_status_1.name = STATUS_TO_DO
    mock_status_1.statusCategory.name = STATUS_TO_DO

    mock_status_2 = MagicMock()
    mock_status_2.id = 'done-1'
    mock_status_2.name = STATUS_DONE
    mock_status_2.statusCategory.name = STATUS_DONE

    mock_jira.statuses.return_value = [mock_status_1, mock_status_2]
    jira_client_service.get_client_from_auth.return_value = mock_jira

    # Call the function
    result = await get_jira_workflows(
        request=request,
        project_key='TEST',
        credentials=credentials,
        settings=settings,
        jira_client_service=jira_client_service,
    )

    # Verify results - should fall back to statuses() method
    assert len(result) == 2

    # Convert result list to dict for easier testing
    result_dict = {item['name']: item for item in result}

    assert STATUS_TO_DO in result_dict
    assert STATUS_DONE in result_dict


@pytest.mark.asyncio
async def test_get_jira_workflows_case_insensitive():
    """Test case-insensitive status name handling."""
    # Mock dependencies
    request = MagicMock()
    credentials = MagicMock()
    settings = MagicMock()
    jira_client_service = AsyncMock()

    # Mock JIRA client
    mock_jira = MagicMock()

    # Mock issues with same status but different case
    mock_issue1 = MagicMock()
    mock_issue1.fields.status.name = 'To Do'
    mock_issue1.fields.status.statusCategory = {'name': STATUS_TO_DO}

    mock_issue2 = MagicMock()
    mock_issue2.fields.status.name = 'TO DO'  # Different case
    mock_issue2.fields.status.statusCategory = {'name': STATUS_TO_DO}

    mock_issue3 = MagicMock()
    mock_issue3.fields.status.name = STATUS_DONE
    mock_issue3.fields.status.statusCategory = {'name': STATUS_DONE}

    # Set up the mock to return our sample issues
    mock_jira.search_issues.return_value = [mock_issue1, mock_issue2, mock_issue3]

    jira_client_service.get_client_from_auth.return_value = mock_jira

    # Call the function
    result = await get_jira_workflows(
        request=request,
        project_key='TEST',
        credentials=credentials,
        settings=settings,
        jira_client_service=jira_client_service,
    )

    # Verify results - should treat different cases as the same status
    assert len(result) == 2  # Not 3, because "To Do" and "TO DO" should be treated as the same

    # Convert result list to dict for easier testing
    result_dict = {item['name'].lower(): item for item in result}

    assert 'to do' in result_dict
    assert STATUS_DONE.lower() in result_dict


@pytest.mark.asyncio
async def test_get_jira_workflows_with_credentials():
    """Test the get_jira_workflows_with_credentials endpoint."""
    # Mock dependencies
    mock_credentials = MagicMock()
    mock_credentials.name = 'test-config'
    mock_credentials.jira_server = 'https://jira.example.com'
    mock_credentials.jira_email = 'test@example.com'
    # Use mock instead of hardcoded token value to avoid bandit warning
    mock_credentials.jira_api_token = MagicMock()

    jira_client_factory = AsyncMock()

    # Mock JIRA client
    mock_jira_client = MagicMock()

    # Mock search_issues response with sample issues
    mock_issue1 = MagicMock()
    mock_issue1.fields.status.name = STATUS_TO_DO
    mock_issue1.fields.status.statusCategory = {'name': STATUS_TO_DO}

    mock_issue2 = MagicMock()
    mock_issue2.fields.status.name = STATUS_DONE
    mock_issue2.fields.status.statusCategory = {'name': STATUS_DONE}

    # Set up the mock to return our sample issues
    mock_jira_client.search_issues.return_value = [mock_issue1, mock_issue2]

    jira_client_factory.create_client_from_credentials.return_value = mock_jira_client

    # Call the function
    with patch('app.routers.jira.datetime') as mock_datetime:
        # Mock the datetime to return a fixed date for testing
        mock_now = datetime(2023, 1, 1)
        mock_datetime.now.return_value = mock_now
        mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)

        # Call endpoint
        result = await get_jira_workflows_with_credentials(
            credentials=mock_credentials,
            project_key='TEST',
            jira_client_factory=jira_client_factory,
        )

    # Verify results
    assert len(result) == 2

    # Convert result list to dict for easier testing
    result_dict = {item['name']: item for item in result}

    assert STATUS_TO_DO in result_dict
    assert STATUS_DONE in result_dict

    # Verify factory was called correctly
    jira_client_factory.create_client_from_credentials.assert_called_once_with(
        jira_server=mock_credentials.jira_server,
        jira_email=mock_credentials.jira_email,
        jira_api_token=mock_credentials.jira_api_token,
        config_name=mock_credentials.name,
    )
