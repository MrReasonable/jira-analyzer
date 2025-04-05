"""Authentication endpoints for the Jira Analyzer API.

This module defines the authentication endpoints for the API, which handle
user authentication and credential validation.
"""

from typing import Any, Dict

from dependency_injector.wiring import inject
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import create_access_token
from ..config import Settings, get_settings
from ..database import get_session
from ..dependencies import get_jira_client_factory, get_jira_client_service
from ..logger import get_logger
from ..models import JiraConfiguration
from ..schemas import CredentialsResponse, JiraCredentials
from ..services.jira_client_factory import JiraClientFactory
from ..services.jira_client_service import JiraClientService

# Create module-level logger
logger = get_logger(__name__)

# Create router
router = APIRouter(
    tags=['Authentication'],
)


@router.post(
    '/validate-credentials',
    response_model=CredentialsResponse,
    summary='Validate Jira credentials',
    description='Validates Jira credentials by attempting to connect to the Jira API. '
    'If successful, returns a JWT token for use in subsequent requests.',
    response_description='Success message indicating the credentials are valid',
    status_code=status.HTTP_200_OK,
    responses={
        401: {'description': 'Invalid credentials or connection failed'},
    },
)
@inject
async def validate_credentials(
    credentials: JiraCredentials,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
    jira_client_service: JiraClientService = Depends(get_jira_client_service),
    jira_client_factory: JiraClientFactory = Depends(get_jira_client_factory),
):
    """Validate Jira credentials and provide a JWT token for authentication.

    This endpoint is used for the first step of the configuration process
    to verify that the provided credentials can connect to Jira. It does not
    create a new configuration in the database unless one already exists with
    a valid project key.

    Args:
        credentials: Jira credentials to validate.
        request: FastAPI request object.
        response: FastAPI response object to set cookies.
        session: Database session for storing the credentials.
        settings: Application settings for JWT configuration.
        jira_client_service: Service for retrieving and creating Jira clients.
        jira_client_factory: Factory for creating Jira clients.

    Returns:
        CredentialsResponse: Success message and JWT token if credentials are valid.

    Raises:
        HTTPException: If credentials are invalid or connection fails.
    """
    logger.info(f'Validating credentials for: {credentials.name}')

    try:
        # Check if a configuration with this name already exists
        stmt = select(JiraConfiguration).where(JiraConfiguration.name == credentials.name)
        result = await session.execute(stmt)
        existing_config = result.scalar_one_or_none()

        # If configuration exists and has a project key, update the credentials
        if existing_config and existing_config.project_key:
            # Update the existing configuration with the new credentials
            # Use setattr to avoid type errors
            setattr(existing_config, 'jira_server', credentials.jira_server)
            setattr(existing_config, 'jira_email', credentials.jira_email)
            setattr(existing_config, 'jira_api_token', credentials.jira_api_token)
            await session.commit()
            logger.info(f'Updated existing credentials for: {credentials.name}')

        # Validate the credentials directly without storing in the database
        # Create a temporary Jira client to validate the credentials
        logger.debug(f'Validating credentials for: {credentials.name}')
        temp_jira_client = await jira_client_factory.create_client_from_credentials(
            jira_server=credentials.jira_server,
            jira_email=credentials.jira_email,
            jira_api_token=credentials.jira_api_token,
            config_name=credentials.name,
        )

        # Test the connection by fetching user information
        temp_jira_client.myself()
        logger.info(f'Connection validated successfully for: {credentials.name}')

        # Credentials have been validated successfully

        # Generate a JWT token with the configuration name
        token_data: Dict[str, Any] = {'config_name': credentials.name}
        token = create_access_token(token_data, settings)

        # Set the JWT token as an HTTP-only cookie
        cookie_max_age = settings.jwt_expiration_minutes * 60  # Convert minutes to seconds
        response.set_cookie(
            key='jira_token',
            value=token,
            httponly=True,  # Make it inaccessible to JavaScript
            secure=True,  # Only send over HTTPS
            samesite='strict',  # Prevent CSRF attacks
            max_age=cookie_max_age,
            path='/',  # Available across the entire domain
        )

        logger.info(f'Credentials validated successfully for: {credentials.name}')
        return {'status': 'success', 'message': 'Credentials are valid'}
    except Exception as e:
        logger.error(f'Credential validation failed: {str(e)}', exc_info=True)
        raise HTTPException(
            status_code=401, detail=f'Invalid credentials or connection failed: {str(e)}'
        )
