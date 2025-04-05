"""Jira client repository for the Jira Analyzer.

This module provides a repository for accessing Jira configurations
stored in the database. It abstracts the data access layer from the business logic.
"""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..logger import get_logger
from ..models import JiraConfiguration

# Create module-level logger
logger = get_logger(__name__)


class JiraClientRepository:
    """Repository for Jira client configurations.

    This class provides methods for accessing Jira configurations
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

    async def get_by_name(self, config_name: str) -> Optional[JiraConfiguration]:
        """Get a Jira configuration by name.

        Args:
            config_name: Name of the configuration to retrieve.

        Returns:
            Optional[JiraConfiguration]: The configuration if found, None otherwise.
        """
        logger.debug(f'Getting configuration by name: {config_name}')
        stmt = select(JiraConfiguration).where(JiraConfiguration.name == config_name)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
