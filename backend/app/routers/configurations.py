"""Configuration endpoints for the Jira Analyzer API.

This module defines the configuration endpoints for the API, which manage
Jira configurations stored in the database.
"""

from dependency_injector.wiring import inject
from fastapi import APIRouter, Depends, Query, status

from ..dependencies import get_configuration_service
from ..logger import get_logger
from ..schemas import JiraConfiguration as JiraConfigSchema
from ..schemas import (
    JiraConfigurationCreate,
    JiraConfigurationList,
    JiraConfigurationUpdate,
    PaginatedResponse,
)
from ..services.caching import cache_result, clear_cache
from ..services.configuration_service import ConfigurationService

# Create module-level logger
logger = get_logger(__name__)

# Create router
router = APIRouter(
    prefix='/configurations',
    tags=['Configurations'],
)


@router.post(
    '',
    response_model=JiraConfigSchema,
    summary='Create a new Jira configuration',
    description='Creates a new Jira configuration with the provided data.',
    response_description='The created configuration',
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {'description': 'Could not create configuration'},
        422: {'description': 'Validation error, missing required fields'},
    },
)
@inject
async def create_configuration(
    config: JiraConfigurationCreate,
    config_service: ConfigurationService = Depends(get_configuration_service),
):
    """Create a new Jira configuration.

    Args:
        config: Configuration data to create.
        config_service: Configuration service for the operation.

    Returns:
        JiraConfigSchema: The created configuration.

    Raises:
        HTTPException: If configuration creation fails.
    """
    result = await config_service.create(config)
    # Clear configurations cache after creating a new configuration
    clear_cache('configurations')
    logger.info('Cleared configurations cache after creating new configuration')
    return result


@router.get(
    '',
    response_model=PaginatedResponse[JiraConfigurationList],
    summary='List all Jira configurations',
    description='Retrieves a paginated list of all stored Jira configurations.',
    response_description='Paginated list of stored configurations',
)
@cache_result(
    namespace='configurations',
    key_func=lambda *args, **kwargs: f'list:{kwargs.get("skip", 0)}:{kwargs.get("limit", 10)}',
)
@inject
async def list_configurations(
    config_service: ConfigurationService = Depends(get_configuration_service),
    skip: int = Query(0, ge=0, description='Number of items to skip'),
    limit: int = Query(10, ge=1, le=100, description='Number of items to return'),
):
    """List all Jira configurations with pagination.

    Args:
        config_service: Configuration service for the operation.
        skip: Number of items to skip (for pagination).
        limit: Maximum number of items to return (for pagination).

    Returns:
        PaginatedResponse[JiraConfigurationList]: Paginated list of configurations.
    """
    return await config_service.get_all_paginated(skip, limit)


@router.get(
    '/{name}',
    response_model=JiraConfigSchema,
    summary='Get a specific Jira configuration',
    description='Retrieves a specific Jira configuration by name.',
    response_description='The requested configuration',
    responses={
        404: {'description': 'Configuration not found'},
    },
)
@inject
async def get_configuration(
    name: str, config_service: ConfigurationService = Depends(get_configuration_service)
):
    """Retrieve a specific Jira configuration by name.

    Args:
        name: Name of the configuration to retrieve.
        config_service: Configuration service for the operation.

    Returns:
        JiraConfigSchema: The requested configuration.

    Raises:
        HTTPException: If configuration is not found.
    """
    return await config_service.get_by_name(name)


@router.put(
    '/{name}',
    response_model=JiraConfigSchema,
    summary='Update a Jira configuration',
    description='Updates an existing Jira configuration with the provided data.',
    response_description='The updated configuration',
    responses={
        400: {'description': 'Could not update configuration'},
        404: {'description': 'Configuration not found'},
    },
)
@inject
async def update_configuration(
    name: str,
    config: JiraConfigurationUpdate,
    config_service: ConfigurationService = Depends(get_configuration_service),
):
    """Update an existing Jira configuration.

    Args:
        name: Name of the configuration to update.
        config: New configuration data.
        config_service: Configuration service for the operation.

    Returns:
        JiraConfigSchema: The updated configuration.

    Raises:
        HTTPException: If configuration is not found or update fails.
    """
    result = await config_service.update(name, config)
    # Clear configurations cache after updating a configuration
    clear_cache('configurations')
    logger.info('Cleared configurations cache after updating configuration')
    return result


@router.delete(
    '/{name}',
    status_code=status.HTTP_204_NO_CONTENT,
    summary='Delete a Jira configuration',
    description='Deletes a specific Jira configuration by name.',
    response_description='No content, the configuration was successfully deleted',
    responses={
        400: {'description': 'Could not delete configuration'},
        404: {'description': 'Configuration not found'},
    },
)
@inject
async def delete_configuration(
    name: str, config_service: ConfigurationService = Depends(get_configuration_service)
):
    """Delete a Jira configuration.

    Args:
        name: Name of the configuration to delete.
        config_service: Configuration service for the operation.

    Raises:
        HTTPException: If configuration is not found or deletion fails.
    """
    await config_service.delete(name)
    # Clear configurations cache after deleting a configuration
    clear_cache('configurations')
    logger.info('Cleared configurations cache after deleting configuration')
