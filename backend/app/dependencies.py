"""Dependency injection functions for the Jira Analyzer API.

This module defines dependency injection functions that can be used with FastAPI's
Depends() function to provide dependencies to route handlers.
"""

from typing import AsyncGenerator, Optional

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from .container import Container, container
from .repositories.configuration_repository import ConfigurationRepository
from .repositories.jira_client_repository import JiraClientRepository
from .services.configuration_service import ConfigurationService
from .services.jira_client_factory import JiraClientFactory
from .services.jira_client_service import JiraClientService


def get_container(request: Request) -> Container:
    """Get the dependency injection container.

    This function is used as a FastAPI dependency to provide access to the
    container instance. It retrieves the container from the app state.

    Args:
        request: The FastAPI request object.

    Returns:
        Container: The dependency injection container.
    """
    return request.app.state.container


# Define common dependency types
# Use a function with Depends() instead of a type annotation to avoid Pydantic validation issues
def get_container_dep(container: Container = Depends(get_container)) -> Container:
    """Get the container dependency.

    This is a wrapper around get_container to avoid Pydantic validation issues.

    Args:
        container: The container from the get_container dependency.

    Returns:
        Container: The dependency injection container.
    """
    return container


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Get a database session.

    This function is used as a FastAPI dependency to provide a database session
    to route handlers. It uses the session generator from database.py to create
    and manage the session lifetime automatically.

    Returns:
        AsyncSession: A database session.
    """
    from .database import get_session

    async for session in get_session():
        yield session


async def get_jira_client_service(
    session: AsyncSession = Depends(get_db_session),
    container_dep: Optional[Container] = Depends(get_container_dep),
) -> JiraClientService:
    """Get a Jira client service instance.

    This function is used as a FastAPI dependency to provide a JiraClientService
    instance to route handlers.

    Args:
        session: The database session.
        container_dep: The dependency injection container from FastAPI dependency.

    Returns:
        JiraClientService: A JiraClientService instance.
    """
    # If container is provided through dependency injection, use it
    # Otherwise, fall back to the global container
    if container_dep:
        container_instance = container_dep
    else:
        container_instance = container

    # Override the session provider with the current session
    container_instance.session_provider.override(session)

    return container_instance.jira_client_service()


async def get_jira_client_factory(
    session: AsyncSession = Depends(get_db_session),
    container_dep: Optional[Container] = Depends(get_container_dep),
) -> JiraClientFactory:
    """Get a Jira client factory instance.

    This function is used as a FastAPI dependency to provide a JiraClientFactory
    instance to route handlers.

    Args:
        session: The database session.
        container_dep: The dependency injection container from FastAPI dependency.

    Returns:
        JiraClientFactory: A JiraClientFactory instance.
    """
    # If container is provided through dependency injection, use it
    # Otherwise, fall back to the global container
    if container_dep:
        container_instance = container_dep
    else:
        container_instance = container

    # Override the session provider with the current session
    container_instance.session_provider.override(session)

    return container_instance.jira_client_factory()


async def get_configuration_service(
    session: AsyncSession = Depends(get_db_session),
    container_dep: Optional[Container] = Depends(get_container_dep),
) -> ConfigurationService:
    """Get a configuration service instance.

    This function is used as a FastAPI dependency to provide a ConfigurationService
    instance to route handlers.

    Args:
        session: The database session.
        container_dep: The dependency injection container from FastAPI dependency.

    Returns:
        ConfigurationService: A ConfigurationService instance.
    """
    # If container is provided through dependency injection, use it
    # Otherwise, fall back to the global container
    if container_dep:
        container_instance = container_dep
    else:
        container_instance = container

    # Override the session provider with the current session
    container_instance.session_provider.override(session)

    return container_instance.configuration_service()


async def get_configuration_repository(
    session: AsyncSession = Depends(get_db_session),
    container_dep: Optional[Container] = Depends(get_container_dep),
) -> ConfigurationRepository:
    """Get a configuration repository instance.

    This function is used as a FastAPI dependency to provide a ConfigurationRepository
    instance to route handlers.

    Args:
        session: The database session.
        container_dep: The dependency injection container from FastAPI dependency.

    Returns:
        ConfigurationRepository: A ConfigurationRepository instance.
    """
    # If container is provided through dependency injection, use it
    # Otherwise, fall back to the global container
    if container_dep:
        container_instance = container_dep
    else:
        container_instance = container

    # Override the session provider with the current session
    container_instance.session_provider.override(session)

    return container_instance.configuration_repository()


async def get_jira_client_repository(
    session: AsyncSession = Depends(get_db_session),
    container_dep: Optional[Container] = Depends(get_container_dep),
) -> JiraClientRepository:
    """Get a Jira client repository instance.

    This function is used as a FastAPI dependency to provide a JiraClientRepository
    instance to route handlers.

    Args:
        session: The database session.
        container_dep: The dependency injection container from FastAPI dependency.

    Returns:
        JiraClientRepository: A JiraClientRepository instance.
    """
    # If container is provided through dependency injection, use it
    # Otherwise, fall back to the global container
    if container_dep:
        container_instance = container_dep
    else:
        container_instance = container

    # Override the session provider with the current session
    container_instance.session_provider.override(session)

    return container_instance.jira_client_repository()
