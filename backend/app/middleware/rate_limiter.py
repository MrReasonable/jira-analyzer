"""Rate limiting middleware for the FastAPI application.

This module provides a middleware for rate limiting requests to the API.
It uses a simple in-memory store to track requests and enforce limits.
"""

import os
import time
from collections import defaultdict
from typing import Callable, Dict, List, Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from ..logger import get_logger

# Create module-level logger
logger = get_logger(__name__)


class RateLimiter(BaseHTTPMiddleware):
    """Middleware for rate limiting requests to the API.

    This middleware tracks requests by client IP address and enforces
    rate limits based on a configurable window and limit.

    Attributes:
        limit: Maximum number of requests allowed in the window.
        window: Time window in seconds for rate limiting.
        exempt_paths: List of paths that are exempt from rate limiting.
        requests: Dictionary tracking requests by client IP.
        is_test_env: Whether the application is running in a test environment.
    """

    def __init__(
        self,
        app: ASGIApp,
        limit: int = 100,
        window: int = 60,
        exempt_paths: Optional[List[str]] = None,
        is_test_env: bool = False,
    ):
        """Initialize the rate limiter middleware.

        Args:
            app: The ASGI application.
            limit: Maximum number of requests allowed in the window.
            window: Time window in seconds for rate limiting.
            exempt_paths: List of paths that are exempt from rate limiting.
            is_test_env: Whether the application is running in a test environment.
        """
        super().__init__(app)

        # In test environment, increase the limit significantly
        self.is_test_env = is_test_env or os.environ.get('USE_MOCK_JIRA', 'false').lower() == 'true'

        # Set higher limits for test environment
        if self.is_test_env:
            self.limit = 1000  # Much higher limit for tests
            self.window = 60
            logger.info('Rate limiter running in test mode with increased limits')
        else:
            self.limit = limit
            self.window = window

        self.exempt_paths = exempt_paths or []

        # Add test-specific paths to exempt list if in test environment
        if self.is_test_env:
            self.exempt_paths.extend(
                [
                    '/configurations',  # Exempt configuration endpoints in test env
                    '/metrics',  # Exempt metrics endpoints in test env
                ]
            )

        self.requests: Dict[str, List[float]] = defaultdict(list)
        logger.info(
            f'Rate limiter initialized: {self.limit} requests per {self.window} seconds, '
            f'exempt paths: {self.exempt_paths}, test mode: {self.is_test_env}'
        )

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process the request and apply rate limiting.

        Args:
            request: The incoming request.
            call_next: The next middleware or route handler.

        Returns:
            Response: The response from the next middleware or route handler.
        """
        # Skip rate limiting for exempt paths
        path = request.url.path
        if any(path.startswith(exempt_path) for exempt_path in self.exempt_paths):
            return await call_next(request)

        # Skip rate limiting for test-specific headers
        if self.is_test_env and 'x-test-request' in request.headers:
            logger.debug(f'Skipping rate limiting for test request: {path}')
            return await call_next(request)

        # Get client IP
        client_ip = self._get_client_ip(request)

        # Clean up old requests
        self._cleanup_old_requests(client_ip)

        # Check if rate limit is exceeded
        if len(self.requests[client_ip]) >= self.limit:
            logger.warning(f'Rate limit exceeded for {client_ip}')
            return Response(
                content='Rate limit exceeded. Please try again later.',
                status_code=429,
                headers={'Retry-After': str(self.window)},
            )

        # Add current request
        self.requests[client_ip].append(time.time())

        # Process the request
        return await call_next(request)

    def _get_client_ip(self, request: Request) -> str:
        """Get the client IP address from the request.

        Args:
            request: The incoming request.

        Returns:
            str: The client IP address.
        """
        # Try to get the real IP from X-Forwarded-For header
        forwarded_for = request.headers.get('X-Forwarded-For')
        if forwarded_for:
            # X-Forwarded-For can contain multiple IPs, the first one is the client
            return forwarded_for.split(',')[0].strip()

        # Fall back to the client's direct IP or use a safe default
        return (
            request.client.host if request.client else '127.0.0.1'
        )  # Use localhost instead of binding to all interfaces

    def _cleanup_old_requests(self, client_ip: str) -> None:
        """Remove requests older than the window from the tracking dictionary.

        Args:
            client_ip: The client IP address.
        """
        current_time = time.time()
        self.requests[client_ip] = [
            timestamp
            for timestamp in self.requests[client_ip]
            if current_time - timestamp < self.window
        ]
