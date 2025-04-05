"""Jira API endpoints for the Jira Analyzer API.

This module defines endpoints that interact directly with the Jira API,
such as fetching projects and issue data.
"""

from typing import Dict, List, Optional

from dependency_injector.wiring import inject
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials

from ..auth import security
from ..config import Settings, get_settings
from ..dependencies import get_jira_client_factory, get_jira_client_service
from ..logger import get_logger
from ..schemas import JiraCredentials
from ..services.jira_client_factory import JiraClientFactory
from ..services.jira_client_service import JiraClientService

# Create module-level logger
logger = get_logger(__name__)

# Create router
router = APIRouter(
    prefix='/jira',
    tags=['Jira'],
)


@router.get(
    '/validate-connection',
    summary='Validate Jira connection',
    description='Validates the connection to Jira using the provided configuration.',
    response_description='Success message if connection is valid',
    responses={
        400: {'description': 'Missing configuration name'},
        404: {'description': 'Configuration not found'},
        500: {'description': 'Failed to connect to Jira'},
    },
)
@inject
async def validate_connection(
    request: Request,
    config_name: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings: Settings = Depends(get_settings),
    jira_client_service: JiraClientService = Depends(get_jira_client_service),
):
    """Validate the connection to Jira.

    This endpoint is used by the validate-credentials endpoint to test
    the connection to Jira without directly creating a JIRA client.

    Args:
        request: FastAPI request object to access cookies.
        config_name: Optional name of a stored Jira configuration to use.
        credentials: JWT token credentials containing the configuration name.
        settings: Application settings for JWT configuration.
        jira_client_service: Service for retrieving and creating Jira clients.

    Returns:
        dict: Success message if connection is valid.

    Raises:
        HTTPException: If the JIRA API request fails.
    """
    # Get the JIRA client from the service
    jira = await jira_client_service.get_client_from_auth(
        request, credentials, settings, config_name
    )
    logger.info('Validating connection to JIRA')
    try:
        # Test the connection by fetching a simple resource
        jira.myself()
        logger.info('Connection to JIRA validated successfully')
        return {'status': 'success', 'message': 'Connection is valid'}
    except Exception as e:
        logger.error(f'Failed to validate connection to JIRA: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    '/projects',
    response_model=List[Dict[str, str]],
    summary='Fetch all Jira projects',
    description='Retrieves a list of all projects from the Jira instance using the provided credentials.',
    response_description='List of projects with their key and name',
    responses={
        400: {'description': 'Missing configuration name'},
        404: {'description': 'Configuration not found'},
        500: {'description': 'Failed to connect to Jira or fetch projects'},
    },
)
@inject
async def get_jira_projects(
    request: Request,
    config_name: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings: Settings = Depends(get_settings),
    jira_client_service: JiraClientService = Depends(get_jira_client_service),
):
    """Fetch all projects from Jira.

    Args:
        request: FastAPI request object to access cookies.
        config_name: Optional name of a stored Jira configuration to use.
        credentials: JWT token credentials containing the configuration name.
        settings: Application settings for JWT configuration.
        jira_client_service: Service for retrieving and creating Jira clients.

    Returns:
        List[dict]: List of projects with their key and name.

    Raises:
        HTTPException: If the JIRA API request fails.
    """
    # Get the JIRA client from the service
    jira = await jira_client_service.get_client_from_auth(
        request, credentials, settings, config_name
    )
    logger.info('Fetching projects from JIRA')
    try:
        projects = jira.projects()
        logger.debug(f'Found {len(projects)} projects')
        return [{'key': project.key, 'name': project.name} for project in projects]
    except Exception as e:
        logger.error(f'Failed to fetch projects from JIRA: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    '/projects-with-credentials',
    response_model=List[Dict[str, str]],
    summary='Fetch all Jira projects using direct credentials',
    description='Retrieves a list of all projects from the Jira instance using the provided credentials directly.',
    response_description='List of projects with their key and name',
    responses={
        401: {'description': 'Invalid credentials'},
        500: {'description': 'Failed to connect to Jira or fetch projects'},
    },
)
@inject
async def get_jira_projects_with_credentials(
    credentials: JiraCredentials,
    jira_client_factory: JiraClientFactory = Depends(get_jira_client_factory),
):
    """Fetch all projects from Jira using direct credentials.

    This endpoint is used when a configuration hasn't been saved yet,
    allowing projects to be fetched during the configuration process.

    Args:
        credentials: Jira credentials to use for the connection.
        jira_client_factory: Factory for creating Jira clients.

    Returns:
        List[dict]: List of projects with their key and name.

    Raises:
        HTTPException: If the JIRA API request fails.
    """
    logger.info(f'Fetching projects from JIRA using direct credentials for: {credentials.name}')
    try:
        # Create a temporary Jira client using the provided credentials
        jira_client = await jira_client_factory.create_client_from_credentials(
            jira_server=credentials.jira_server,
            jira_email=credentials.jira_email,
            jira_api_token=credentials.jira_api_token,
            config_name=credentials.name,
        )

        # Fetch projects
        projects = jira_client.projects()
        logger.debug(f'Found {len(projects)} projects using direct credentials')
        return [{'key': project.key, 'name': project.name} for project in projects]
    except Exception as e:
        logger.error(
            f'Failed to fetch projects from JIRA with direct credentials: {str(e)}', exc_info=True
        )
        raise HTTPException(status_code=500, detail=str(e))
