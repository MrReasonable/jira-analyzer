"""FastAPI application for the Jira Analyzer.

This module implements the REST API endpoints for the Jira Analyzer application.
It provides functionality for managing Jira configurations and calculating various
metrics like lead time, cycle time, throughput, and cumulative flow diagrams.

The application follows a modular design with clear separation of concerns:
- API endpoints are organized by domain in separate router modules
- Business logic is encapsulated in service modules
- Data access is handled through dependency injection
- Error handling is consistent across all endpoints
- Security measures are implemented for all sensitive operations
- Rate limiting protects against abuse
- Pagination is implemented for list endpoints
- Caching is used for frequently accessed data
- Comprehensive request validation ensures data integrity
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .container import container
from .logger import get_logger
from .middleware.rate_limiter import RateLimiter
from .routers import admin, auth, configurations, health, jira, metrics

# Import admin_test router (will only be registered in test environments)
from .routers import admin_test as admin_test_router
from .services.caching import get_cache

# Create module-level logger
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for the FastAPI application.

    This handles startup and shutdown events for the application.
    On startup, it initializes the database by creating all required tables.
    On shutdown, it performs any necessary cleanup operations.

    Args:
        app: The FastAPI application instance.

    Yields:
        None: Control is yielded back to the application during its lifetime.

    Raises:
        Exception: If database initialization fails.
    """
    # Startup: Initialize application resources
    logger.info('Starting application')
    try:
        # Check if we're using an in-memory database for testing
        use_in_memory_db = os.environ.get('USE_IN_MEMORY_DB', 'false').lower() == 'true'

        if use_in_memory_db:
            # For in-memory databases, we need to initialize the database on startup
            # since the database is destroyed when the application is restarted
            logger.info('Using in-memory SQLite database for testing, initializing database')
            from .database import init_db

            await init_db()
            logger.info('In-memory database initialized successfully')
        else:
            # For persistent databases, assume migrations have been run separately
            logger.info('Using persistent database, assuming migrations are already run')

        # Set up the container with the session provider
        # This is needed for the new container structure
        from .database import async_session

        # Create a session for the container to use during initialization
        session = async_session()
        try:
            container.session_provider.override(session)
        finally:
            await session.close()

        # Initialize the DI container resources
        container.init_resources()
        logger.info('DI container initialized successfully')

        # Set up cache reference for admin router
        admin.set_cache_reference(get_cache())

        logger.info('=== API SERVER READY ===')
        logger.info('FastAPI application has started and is ready to accept requests')
    except Exception as e:
        logger.error(f'Database initialization failed: {str(e)}', exc_info=True)
        raise
    yield
    # Shutdown: Add any cleanup code here if needed
    # Shutdown container resources
    container.shutdown_resources()
    logger.info('Shutting down application')


# Define a function to get the container for dependency injection
def get_container():
    """Get the dependency injection container.

    This function is used as a FastAPI dependency to provide access to the
    container instance.

    Returns:
        Container: The dependency injection container.
    """
    return container


def create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    This function creates a new FastAPI application, configures it with the
    necessary middleware, and includes all the routers.

    Returns:
        FastAPI: The configured FastAPI application.
    """
    # Create the FastAPI application with metadata and documentation URLs
    app = FastAPI(
        lifespan=lifespan,
        title='Jira Analyzer API',
        description='API for analyzing Jira metrics and configurations',
        version='1.0.0',
        openapi_url='/openapi.json',  # Specify the OpenAPI schema URL
        docs_url='/docs',  # Specify the Swagger UI URL
        redoc_url='/redoc',  # Specify the ReDoc URL
    )

    # Store the container in app.state, which is a properly typed attribute of FastAPI
    # designed for storing arbitrary state
    app.state.container = container

    # Set root path for OpenAPI (critical for proper documentation when behind a proxy)
    app.root_path = '/api'

    # Configure middleware
    settings = get_settings()
    logger.info(f'CORS configured with origins: {settings.cors_origins}')

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    # Check if we're running in test mode
    is_test_env = os.environ.get('USE_MOCK_JIRA', 'false').lower() == 'true'
    use_in_memory_db = os.environ.get('USE_IN_MEMORY_DB', 'false').lower() == 'true'

    # Add rate limiting middleware
    app.add_middleware(
        RateLimiter,
        limit=100,  # 100 requests
        window=60,  # per minute
        exempt_paths=['/ping', '/health'],  # Don't rate limit health check endpoints
        is_test_env=is_test_env,  # Pass test environment flag
    )

    # Configure caching based on environment
    if is_test_env:
        from .services.caching import enable_caching

        # Disable caching in test environment
        enable_caching(False)
        logger.info('Caching disabled in test environment')

    # Include routers
    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(configurations.router)
    app.include_router(jira.router)
    app.include_router(metrics.router)
    app.include_router(admin.router)

    # Only register test-specific routers in test environments
    if is_test_env or use_in_memory_db:
        # Import fixtures to register them - import has side effects (fixture registration)
        from .fixtures import workflow_fixtures  # noqa: F401

        # Register test-only router
        app.include_router(admin_test_router.router)
        logger.info('Test administration endpoints enabled')
    else:
        logger.info('Test administration endpoints disabled')

    return app


# Create the FastAPI application
app = create_app()


if __name__ == '__main__':
    import uvicorn

    settings = get_settings()
    logger.info(f'Starting server on {settings.host}:{settings.port}')
    uvicorn.run(app, host=settings.host, port=settings.port)
