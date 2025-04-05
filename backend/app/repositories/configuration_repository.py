"""Configuration repository for the Jira Analyzer.

This module provides a repository for accessing and manipulating Jira configurations
stored in the database. It abstracts the data access layer from the business logic.
"""

from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..logger import get_logger
from ..models import JiraConfiguration
from ..schemas import JiraConfigurationCreate, JiraConfigurationUpdate

# Create module-level logger
logger = get_logger(__name__)


class ConfigurationRepository:
    """Repository for Jira configurations.

    This class provides methods for accessing and manipulating Jira configurations
    stored in the database. It abstracts the data access layer from the business logic.

    Attributes:
        session: The database session to use for database operations.
    """

    def __init__(self, session: AsyncSession):
        """Initialize the repository with a database session.

        Args:
            session: The database session to use for database operations.
        """
        self.session = session

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[JiraConfiguration]:
        """Get all Jira configurations with pagination.

        Args:
            skip: Number of items to skip (for pagination).
            limit: Maximum number of items to return (for pagination).

        Returns:
            List[JiraConfiguration]: List of Jira configurations.
        """
        logger.debug(f'Getting all configurations with skip={skip}, limit={limit}')
        stmt = select(JiraConfiguration).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_name(self, name: str) -> Optional[JiraConfiguration]:
        """Get a Jira configuration by name.

        Args:
            name: Name of the configuration to retrieve.

        Returns:
            Optional[JiraConfiguration]: The configuration if found, None otherwise.
        """
        logger.debug(f'Getting configuration by name: {name}')
        stmt = select(JiraConfiguration).where(JiraConfiguration.name == name)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, config: JiraConfigurationCreate) -> JiraConfiguration:
        """Create a new Jira configuration.

        Args:
            config: Configuration data to create.

        Returns:
            JiraConfiguration: The created configuration.
        """
        logger.info(f'Creating new configuration: {config.name}')
        db_config = JiraConfiguration(**config.model_dump())
        self.session.add(db_config)
        await self.session.commit()
        await self.session.refresh(db_config)
        logger.info(f'Configuration created successfully: {config.name}')
        return db_config

    async def update(
        self, name: str, config: JiraConfigurationUpdate
    ) -> Optional[JiraConfiguration]:
        """Update an existing Jira configuration.

        Args:
            name: Name of the configuration to update.
            config: New configuration data.

        Returns:
            Optional[JiraConfiguration]: The updated configuration if found, None otherwise.
        """
        logger.info(f'Updating configuration: {name}')
        db_config = await self.get_by_name(name)
        if not db_config:
            logger.warning(f'Configuration not found: {name}')
            return None

        for key, value in config.model_dump().items():
            setattr(db_config, key, value)

        await self.session.commit()
        await self.session.refresh(db_config)
        logger.info(f'Configuration updated successfully: {name}')
        return db_config

    async def delete(self, name: str) -> bool:
        """Delete a Jira configuration.

        Args:
            name: Name of the configuration to delete.

        Returns:
            bool: True if the configuration was deleted, False otherwise.
        """
        logger.info(f'Deleting configuration: {name}')
        db_config = await self.get_by_name(name)
        if not db_config:
            logger.warning(f'Configuration not found: {name}')
            return False

        await self.session.delete(db_config)
        await self.session.commit()
        logger.info(f'Configuration deleted successfully: {name}')
        return True

    async def count(self) -> int:
        """Count the total number of configurations.

        Returns:
            int: Total number of configurations.
        """
        logger.debug('Counting configurations')
        stmt = select(JiraConfiguration)
        result = await self.session.execute(stmt)
        return len(result.scalars().all())
