"""JWT authentication utilities for the Jira Analyzer application.

This module provides functions for creating and validating JWT tokens used for
authentication and secure storage of Jira configuration references.
"""

from datetime import datetime, timedelta
from typing import Dict, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from .config import Settings, get_settings
from .database import get_session
from .logger import get_logger
from .models import JiraConfiguration

# Create module-level logger
logger = get_logger(__name__)

# Setup the HTTP Bearer authentication scheme for backward compatibility
security = HTTPBearer(auto_error=False)

# Cookie name for the JWT token
JWT_COOKIE_NAME = 'jira_token'


def create_access_token(data: Dict, settings: Settings = Depends(get_settings)) -> str:
    """Create a new JWT access token.

    Args:
        data: Dictionary containing the data to encode in the token.
        settings: Application settings containing JWT configuration.

    Returns:
        str: Encoded JWT token.
    """
    to_encode = data.copy()

    # Set expiration time
    expire = datetime.now() + timedelta(minutes=settings.jwt_expiration_minutes)
    to_encode.update({'exp': expire})

    # Create the JWT token
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

    return encoded_jwt


def decode_token(token: str, settings: Settings = Depends(get_settings)) -> Dict:
    """Decode and validate a JWT token.

    Args:
        token: JWT token to decode.
        settings: Application settings containing JWT configuration.

    Returns:
        Dict: Decoded token payload.

    Raises:
        HTTPException: If token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError as e:
        logger.error(f'JWT validation error: {str(e)}')
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid authentication credentials',
            headers={'WWW-Authenticate': 'Bearer'},
        )


async def get_current_config_name(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    settings: Settings = Depends(get_settings),
) -> str:
    """Extract the configuration name from the JWT token.

    Args:
        request: FastAPI request object to access cookies.
        credentials: HTTP Authorization credentials containing the JWT token (optional).
        settings: Application settings containing JWT configuration.

    Returns:
        str: Configuration name extracted from the token.

    Raises:
        HTTPException: If token is invalid or doesn't contain a config_name.
    """
    token = None

    # First try to get the token from cookies
    if JWT_COOKIE_NAME in request.cookies:
        token = request.cookies[JWT_COOKIE_NAME]
    # If not found in cookies, try to get it from the Authorization header
    elif credentials:
        token = credentials.credentials

    if not token:
        logger.error('No JWT token found in cookies or Authorization header')
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Authentication required',
            headers={'WWW-Authenticate': 'Bearer'},
        )

    payload = decode_token(token, settings)

    config_name = payload.get('config_name')
    if not config_name:
        logger.error('JWT token missing config_name claim')
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid token: missing configuration name',
            headers={'WWW-Authenticate': 'Bearer'},
        )

    return config_name


async def get_jira_config_from_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> JiraConfiguration:
    """Retrieve the Jira configuration referenced by the JWT token.

    Args:
        request: FastAPI request object to access cookies.
        credentials: HTTP Authorization credentials containing the JWT token.
        session: Database session for retrieving the configuration.
        settings: Application settings containing JWT configuration.

    Returns:
        JiraConfiguration: The Jira configuration referenced by the token.

    Raises:
        HTTPException: If token is invalid or configuration not found.
    """
    config_name = await get_current_config_name(request, credentials, settings)

    # Retrieve the configuration from the database
    from sqlalchemy import select

    stmt = select(JiraConfiguration).where(JiraConfiguration.name == config_name)
    result = await session.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        logger.error(f'Configuration not found: {config_name}')
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuration '{config_name}' not found",
        )

    return config
