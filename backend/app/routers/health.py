"""Health check endpoints for the Jira Analyzer API.

This module defines the health check endpoints for the API, which are used
to verify that the API is running and healthy.
"""

import datetime

from fastapi import APIRouter, status

from ..logger import get_logger

# Create module-level logger
logger = get_logger(__name__)

# Create router
router = APIRouter(
    prefix='',
    tags=['Health'],
)


@router.get(
    '/ping',
    status_code=status.HTTP_200_OK,
    summary='Simple ping endpoint',
    description='A simple endpoint that returns a pong response without requiring database access.',
    response_description='Pong response indicating the API is running',
)
async def ping():
    """Simple ping endpoint that doesn't require database access.

    This endpoint can be used to verify that the API server is running
    without requiring database access.

    Returns:
        dict: Simple response with pong message.
    """
    logger.info('Ping endpoint called')
    return {'ping': 'pong'}


@router.get(
    '/health',
    status_code=status.HTTP_200_OK,
    summary='Health check endpoint',
    description="Provides information about the API's health status, version, and current timestamp.",
    response_description='Health status information',
)
async def health_check():
    """Health check endpoint to verify the API is running.

    This endpoint can be used by monitoring tools and load balancers
    to check if the application is healthy.

    Returns:
        dict: Status information about the API.
    """
    logger.debug('Health check requested')
    return {
        'status': 'healthy',
        'api_version': '1.0.0',  # This should be imported from a central version file
        'timestamp': str(datetime.datetime.now()),
    }
