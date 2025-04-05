"""Caching service for the Jira Analyzer API.

This module provides caching functionality for the API, allowing
expensive operations to be cached for improved performance.
"""

import datetime
import functools
import os
from typing import Any, Callable, Dict, Optional, TypeVar

from ..logger import get_logger

# Create module-level logger
logger = get_logger(__name__)

# Type variable for generic functions
T = TypeVar('T')

# Simple in-memory cache
_cache: Dict[str, Dict[str, Any]] = {
    'configurations': {},
    'metrics': {},
}

# Check if we're running in test mode
IS_TEST_ENV = os.environ.get('USE_MOCK_JIRA', 'false').lower() == 'true'

# Flag to enable/disable caching
CACHING_ENABLED = not IS_TEST_ENV


def get_cache():
    """Get the cache dictionary.

    Returns:
        Dict[str, Dict[str, Any]]: The cache dictionary.
    """
    return _cache


def cache_result(namespace: str, key_func: Optional[Callable] = None, ttl_seconds: int = 300):
    """Cache the result of a function call.

    Args:
        namespace: The namespace to store the cache in.
        key_func: A function that returns a cache key based on the function arguments.
        ttl_seconds: Time to live for the cache entry in seconds.

    Returns:
        Callable: The decorated function.
    """

    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Skip caching in test environment or if explicitly disabled
            if not CACHING_ENABLED:
                logger.debug(f'Caching disabled, executing function directly: {func.__name__}')
                return await func(*args, **kwargs)

            # Check for test-specific request header
            request = next((arg for arg in args if hasattr(arg, 'headers')), None)
            if request and hasattr(request, 'headers') and 'x-test-request' in request.headers:
                logger.debug(f'Test request detected, skipping cache for: {func.__name__}')
                return await func(*args, **kwargs)

            # Generate cache key
            cache_key = ''
            if key_func is not None:
                cache_key = key_func(*args, **kwargs)
            else:
                # Default key is the function name and arguments
                cache_key = f'{func.__name__}:{str(args)}:{str(kwargs)}'

            # Check if result is in cache
            if namespace in _cache and cache_key in _cache[namespace]:
                cache_entry = _cache[namespace][cache_key]
                # Check if cache entry is still valid
                if datetime.datetime.now().timestamp() - cache_entry['timestamp'] < ttl_seconds:
                    logger.debug(f'Cache hit for {namespace}:{cache_key}')
                    return cache_entry['data']

            # Execute function and cache result
            result = await func(*args, **kwargs)

            # Ensure namespace exists
            if namespace not in _cache:
                _cache[namespace] = {}

            # Store result in cache
            _cache[namespace][cache_key] = {
                'data': result,
                'timestamp': datetime.datetime.now().timestamp(),
            }
            logger.debug(f'Cache miss for {namespace}:{cache_key}, stored result')

            return result

        return wrapper

    return decorator


def clear_cache(namespace: Optional[str] = None):
    """Clear the cache.

    Args:
        namespace: Optional namespace to clear. If not provided, all caches are cleared.
    """
    global _cache

    if namespace:
        if namespace in _cache:
            _cache[namespace] = {}
            logger.info(f'Cleared cache for namespace: {namespace}')
        else:
            logger.warning(f'Cache namespace not found: {namespace}')
    else:
        # Clear all caches
        for ns in _cache:
            _cache[ns] = {}
        logger.info('Cleared all caches')


def enable_caching(enabled: bool = True):
    """Enable or disable caching.

    Args:
        enabled: Whether to enable caching.
    """
    global CACHING_ENABLED
    CACHING_ENABLED = enabled
    logger.info(f'Caching {"enabled" if enabled else "disabled"}')
