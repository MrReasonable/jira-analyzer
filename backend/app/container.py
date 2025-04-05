"""Dependency Injection container for the Jira Analyzer API.

This module defines the DI container using dependency-injector, which provides
a centralized way to manage dependencies and their lifecycles.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dependency_injector import containers, providers
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .database import async_session
from .repositories.configuration_repository import ConfigurationRepository
from .repositories.jira_client_repository import JiraClientRepository
from .services.configuration_service import ConfigurationService
from .services.jira_client_factory import JiraClientFactory
from .services.jira_client_service import JiraClientService


@asynccontextmanager
async def get_session_context() -> AsyncGenerator[AsyncSession, None]:
    """Create a database session context manager.

    This function creates a database session and ensures it's properly closed
    after use, even if an exception occurs. It's used by the DI container
    to manage database session lifecycle.

    Yields:
        AsyncSession: An async SQLAlchemy session for database operations.
    """
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


class Container(containers.DeclarativeContainer):
    """DI container for the application.

    This container defines all the services and their dependencies,
    providing a centralized way to manage object creation and lifecycle.
    """

    # Configuration
    config = providers.Singleton(get_settings)

    # Database - Use a factory instead of a resource to avoid async generator issues
    db_session_factory = providers.Factory(get_session_context)

    # Session provider that can be used in tests to inject a mock session
    session_provider = providers.Dependency(AsyncSession)

    # Repositories
    jira_client_repository = providers.Factory(
        JiraClientRepository,
        session=session_provider,
    )

    configuration_repository = providers.Factory(
        ConfigurationRepository,
        session=session_provider,
    )

    # Services
    jira_client_factory = providers.Factory(
        JiraClientFactory,
        session=session_provider,
    )

    jira_client_service = providers.Factory(
        JiraClientService,
        session=session_provider,
        jira_client_factory=jira_client_factory,
        repository=jira_client_repository,
    )

    configuration_service = providers.Factory(
        ConfigurationService,
        session=session_provider,
        repository=configuration_repository,
    )


# Create a global container instance
container = Container()

# Wire the container to the application
# This is done in main.py
