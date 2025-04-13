"""Admin endpoints for the Jira Analyzer API.

This module defines administrative endpoints for the API, such as
cache management and system operations.
"""

import os
from typing import Dict, Optional

from fastapi import APIRouter, HTTPException, Query, status

from ..logger import get_logger

# Create module-level logger
logger = get_logger(__name__)

# Create router
router = APIRouter(
    prefix='/admin',
    tags=['Admin'],
)

# Reference to the cache (will be set by the main application)
_cache: Dict[str, Dict] = {}


def set_cache_reference(cache_ref: Dict[str, Dict]):
    """Set the reference to the application cache.

    This function is called by the main application to provide a reference
    to the application-wide cache dictionary. This allows the admin router
    to clear the cache when requested.

    Args:
        cache_ref: Reference to the application cache.
    """
    global _cache
    _cache = cache_ref
    logger.info('Admin router cache reference set')


@router.post(
    '/cache/clear',
    status_code=status.HTTP_200_OK,
    summary='Clear the application cache',
    description='Clears the in-memory cache for configurations and metrics. '
    'This endpoint is useful when data has been updated and the cache needs to be refreshed.',
    response_description='Success message indicating the cache was cleared',
    response_model=None,
    responses={
        401: {'description': 'Unauthorized, admin credentials required'},
        404: {'description': 'Cache namespace not found'},
    },
)
async def clear_cache(
    namespace: Optional[str] = Query(
        None,
        description='Specific cache namespace to clear (configurations, metrics). If not provided, all caches are cleared.',
    ),
):
    """Clear the application cache.

    Args:
        namespace: Optional namespace to clear. If not provided, all caches are cleared.

    Returns:
        dict: Success message indicating the cache was cleared.

    Raises:
        HTTPException: If the specified namespace is not found.
    """
    # In a production environment, you would add authentication check here
    # For example:
    # if not is_authenticated(request):
    #     raise HTTPException(status_code=401, detail="Admin credentials required")
    global _cache

    if namespace:
        if namespace in _cache:
            _cache[namespace] = {}
            logger.info(f'Cleared cache for namespace: {namespace}')
            return {'status': 'success', 'message': f'Cache cleared for namespace: {namespace}'}
        else:
            logger.warning(f'Cache namespace not found: {namespace}')
            raise HTTPException(status_code=404, detail=f'Cache namespace not found: {namespace}')
    else:
        # Clear all caches
        for ns in _cache:
            _cache[ns] = {}
        logger.info('Cleared all caches')
        return {'status': 'success', 'message': 'All caches cleared'}


@router.post(
    '/database/reset',
    status_code=status.HTTP_200_OK,
    summary='Reset the in-memory database',
    description='Resets the in-memory database by recreating all tables. '
    'This endpoint is only available when using an in-memory database for testing.',
    response_description='Success message indicating the database was reset',
    response_model=None,
    responses={
        401: {'description': 'Unauthorized, admin credentials required'},
        403: {'description': 'Forbidden, only available for in-memory databases'},
    },
)
async def reset_database():
    """Reset the in-memory database.

    This endpoint is only available when using an in-memory database for testing.
    It recreates all tables in the database, effectively resetting it to a clean state.

    Returns:
        dict: Success message indicating the database was reset.

    Raises:
        HTTPException: If not using an in-memory database or if the reset fails.
    """
    # Check if we're using an in-memory database
    use_in_memory_db = os.environ.get('USE_IN_MEMORY_DB', 'false').lower() == 'true'
    if not use_in_memory_db:
        logger.warning('Attempted to reset database when not using in-memory database')
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Database reset is only available when using an in-memory database',
        )

    try:
        # Import here to avoid circular imports
        from ..database import init_db

        # Reset the database
        await init_db()
        logger.info('In-memory database reset successfully')
        return {'status': 'success', 'message': 'In-memory database reset successfully'}
    except Exception as e:
        logger.error(f'Failed to reset in-memory database: {str(e)}', exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Failed to reset in-memory database: {str(e)}',
        )


@router.post(
    '/database/cleanup',
    status_code=status.HTTP_200_OK,
    summary='Clean up the PostgreSQL test database',
    description='Truncates all tables in the PostgreSQL test database. '
    'This endpoint is only available when using PostgreSQL for testing.',
    response_description='Success message indicating the database was cleaned up',
    response_model=None,
    responses={
        401: {'description': 'Unauthorized, admin credentials required'},
        403: {'description': 'Forbidden, only available for PostgreSQL test databases'},
    },
)
async def cleanup_database():
    """Clean up the PostgreSQL test database.

    This endpoint is only available when using PostgreSQL for testing.
    It truncates all tables in the database, effectively cleaning it up.

    Returns:
        dict: Success message indicating the database was cleaned up.

    Raises:
        HTTPException: If not using PostgreSQL for testing or if the cleanup fails.
    """
    # Check if we're using PostgreSQL for testing
    use_in_memory_db = os.environ.get('USE_IN_MEMORY_DB', 'false').lower() == 'true'
    use_pg_for_testing = os.environ.get('USE_PG_FOR_TESTING', 'false').lower() == 'true'

    if not (use_in_memory_db and use_pg_for_testing):
        logger.warning('Attempted to clean up database when not using PostgreSQL for testing')
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Database cleanup is only available when using PostgreSQL for testing',
        )

    try:
        # Import here to avoid circular imports
        from ..database import cleanup_test_database

        # Clean up the database
        await cleanup_test_database()
        logger.info('PostgreSQL test database cleaned up successfully')
        return {'status': 'success', 'message': 'PostgreSQL test database cleaned up successfully'}
    except Exception as e:
        logger.error(f'Failed to clean up PostgreSQL test database: {str(e)}', exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Failed to clean up PostgreSQL test database: {str(e)}',
        )
