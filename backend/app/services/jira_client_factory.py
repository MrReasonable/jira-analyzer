"""Jira client factory service.

This module provides a factory for creating Jira clients, either real or mock
depending on the environment.
"""

import os
from typing import Optional, Tuple, Union

from jira import JIRA
from sqlalchemy.ext.asyncio import AsyncSession

from ..logger import get_logger
from ..mock_jira import MockJira

# Check if we're running in test mode
USE_MOCK_JIRA = os.environ.get('USE_MOCK_JIRA', 'false').lower() == 'true'

# Create module-level logger
logger = get_logger(__name__)


class JiraClientFactory:
    """Factory for creating Jira clients.

    This class provides methods for creating either real or mock Jira clients
    depending on the environment.
    """

    def __init__(self, session: Optional[AsyncSession] = None):
        """Initialize the Jira client factory.

        Args:
            session: Database session for retrieving configurations.
        """
        self.session = session

    async def create_client(
        self,
        server: str,
        auth: Tuple[str, str],
        config_name: Optional[str] = None,
    ) -> Union[JIRA, MockJira]:
        """Create a Jira client.

        This method creates either a real or mock Jira client depending on the
        environment.

        Args:
            server: Jira server URL.
            auth: Tuple of (email, api_token) for authentication.
            config_name: Optional name of the configuration for logging.

        Returns:
            JIRA: A Jira client instance (either real or mock).
        """
        if USE_MOCK_JIRA:
            logger.info(f'Creating mock JIRA client for configuration: {config_name or "unnamed"}')
            return MockJira(server=server, basic_auth=auth)

        logger.debug(f'Creating real JIRA client for configuration: {config_name or "unnamed"}')
        return JIRA(server=server, basic_auth=auth)

    async def create_client_from_credentials(
        self,
        jira_server: str,
        jira_email: str,
        jira_api_token: str,
        config_name: Optional[str] = None,
    ) -> Union[JIRA, MockJira]:
        """Create a Jira client from individual credentials.

        This is a convenience method that formats the credentials and calls create_client.

        Args:
            jira_server: Jira server URL.
            jira_email: Jira user email.
            jira_api_token: Jira API token.
            config_name: Optional name of the configuration for logging.

        Returns:
            JIRA: A Jira client instance (either real or mock).
        """
        return await self.create_client(
            server=str(jira_server),
            auth=(str(jira_email), str(jira_api_token)),
            config_name=config_name,
        )
