"""Configuration management for the Jira Analyzer application.

This module handles all configuration settings for the application, including server
configuration, CORS settings, and Jira-specific parameters. It uses pydantic_settings
for type-safe configuration management with environment variable support.
"""

from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings and configuration parameters.

    This class defines all configurable parameters for the application, including
    server settings, CORS configuration, and Jira-specific settings. All settings
    can be overridden through environment variables.
    """

    # Server Configuration
    # Using 0.0.0.0 to bind to all interfaces is necessary for Docker containerization
    # This is safe because the application is intended to run in a containerized environment
    # where network access is controlled by Docker networking
    host: str = '0.0.0.0'  # nosec B104
    port: int = 8000
    cors_origins: List[str] = ['http://localhost:5173']  # Default Vite dev server

    # Jira Configuration - Optional since we'll use database configurations
    jira_server: Optional[str] = None
    jira_email: Optional[str] = None
    jira_api_token: Optional[str] = None
    jql_query: str = 'project = PROJ AND type = Story'  # Default JQL
    workflow_states: List[str] = ['Backlog', 'In Progress', 'Done']  # Default workflow
    lead_time_start_state: str = 'Backlog'
    lead_time_end_state: str = 'Done'
    cycle_time_start_state: str = 'In Progress'
    cycle_time_end_state: str = 'Done'

    model_config = {'env_file': '.env'}


@lru_cache()
def get_settings():
    """Create and return a cached instance of the application settings.

    Returns:
        Settings: A cached Settings instance containing all application configuration.
    """
    return Settings()
