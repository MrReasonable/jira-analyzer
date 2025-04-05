"""Admin endpoints for the Jira Analyzer API.

This module defines administrative endpoints for the API, such as
cache management and system operations.
"""

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
