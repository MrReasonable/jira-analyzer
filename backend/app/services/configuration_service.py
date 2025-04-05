"""Configuration service for the Jira Analyzer API.

This module provides a service for managing Jira configurations. It encapsulates
the business logic for configuration management and uses the repository for data access.
"""

from typing import Any, Dict, cast

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..logger import get_logger
from ..repositories.configuration_repository import ConfigurationRepository
from ..schemas import JiraConfiguration as JiraConfigSchema
from ..schemas import (
    JiraConfigurationCreate,
    JiraConfigurationList,
    JiraConfigurationUpdate,
    PaginatedResponse,
)

# Create module-level logger
logger = get_logger(__name__)


class ConfigurationService:
    """Service for managing Jira configurations.

    This class provides methods for managing Jira configurations. It encapsulates
    the business logic for configuration management and uses the repository for data access.

    Attributes:
        session: The database session to use for database operations.
        repository: The repository to use for data access.
    """

    def __init__(self, session: AsyncSession, repository: ConfigurationRepository):
        """Initialize the service with a database session and repository.

        Args:
            session: The database session to use for database operations.
            repository: The repository to use for data access.
        """
        self.session = session
        self.repository = repository

    async def get_all_paginated(
        self, skip: int = 0, limit: int = 10
    ) -> PaginatedResponse[JiraConfigurationList]:
        """Get all Jira configurations with pagination.

        Args:
            skip: Number of items to skip (for pagination).
            limit: Maximum number of items to return (for pagination).

        Returns:
            PaginatedResponse[JiraConfigurationList]: Paginated list of configurations.
        """
        logger.info(f'Getting all configurations with pagination: skip={skip}, limit={limit}')
        configs = await self.repository.get_all(skip, limit)
        total = await self.repository.count()
        logger.debug(f'Found {len(configs)} configurations (total: {total})')

        # Create a properly typed response using type annotation
        result: Dict[str, Any] = {
            'items': configs,
            'total': total,
            'skip': skip,
            'limit': limit,
        }
        # Cast the result to the expected return type
        return cast(PaginatedResponse[JiraConfigurationList], result)

    async def get_by_name(self, name: str) -> JiraConfigSchema:
        """Get a Jira configuration by name.

        Args:
            name: Name of the configuration to retrieve.

        Returns:
            JiraConfigSchema: The configuration.

        Raises:
            HTTPException: If the configuration is not found.
        """
        logger.info(f'Getting configuration: {name}')
        config = await self.repository.get_by_name(name)
        if not config:
            logger.warning(f'Configuration not found: {name}')
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Configuration '{name}' not found",
            )
        logger.debug(f'Configuration found: {name}')
        # Cast the model to the schema type
        return cast(JiraConfigSchema, config)

    async def create(self, config: JiraConfigurationCreate) -> JiraConfigSchema:
        """Create a new Jira configuration.

        Args:
            config: Configuration data to create.

        Returns:
            JiraConfigSchema: The created configuration.

        Raises:
            HTTPException: If the configuration creation fails.
        """
        logger.info(f'Creating new configuration: {config.name}')

        # Validate project_key is present
        if not config.project_key:
            logger.error('Missing required field: project_key')
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail='Missing required field: project_key. This field is required for all configurations.',
            )

        try:
            result = await self.repository.create(config)
            # Cast the model to the schema type
            return cast(JiraConfigSchema, result)
        except Exception as e:
            logger.error(f'Failed to create configuration: {str(e)}', exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Could not create configuration: {str(e)}',
            )

    async def update(self, name: str, config: JiraConfigurationUpdate) -> JiraConfigSchema:
        """Update an existing Jira configuration.

        Args:
            name: Name of the configuration to update.
            config: New configuration data.

        Returns:
            JiraConfigSchema: The updated configuration.

        Raises:
            HTTPException: If the configuration is not found or update fails.
        """
        logger.info(f'Updating configuration: {name}')
        try:
            updated_config = await self.repository.update(name, config)
            if not updated_config:
                logger.warning(f'Configuration not found: {name}')
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Configuration '{name}' not found",
                )
            logger.info(f'Configuration updated successfully: {name}')
            # Cast the model to the schema type
            return cast(JiraConfigSchema, updated_config)
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            logger.error(f'Failed to update configuration: {str(e)}', exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Could not update configuration: {str(e)}',
            )

    async def delete(self, name: str) -> None:
        """Delete a Jira configuration.

        Args:
            name: Name of the configuration to delete.

        Raises:
            HTTPException: If the configuration is not found or deletion fails.
        """
        logger.info(f'Deleting configuration: {name}')
        try:
            success = await self.repository.delete(name)
            if not success:
                logger.warning(f'Configuration not found: {name}')
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Configuration '{name}' not found",
                )
            logger.info(f'Configuration deleted successfully: {name}')
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            logger.error(f'Failed to delete configuration: {str(e)}', exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Could not delete configuration: {str(e)}',
            )
