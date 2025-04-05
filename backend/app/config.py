"""Configuration management for the Jira Analyzer application.

This module handles all configuration settings for the application, including server
configuration, CORS settings, database settings, and Jira-specific parameters.
It uses pydantic_settings for type-safe configuration management with environment
variable support.
"""

import json
import os
from functools import lru_cache
from typing import List

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
    cors_origins_default: List[str] = ['http://localhost:5173']  # Default Vite dev server

    @property
    def cors_origins(self) -> List[str]:
        """Return the CORS origins, ensuring they are loaded from the environment if specified."""
        env_value = os.getenv('CORS_ORIGINS')
        if env_value:
            try:
                return json.loads(env_value)
            except json.JSONDecodeError:
                raise ValueError('Invalid JSON format for CORS_ORIGINS environment variable')
        return self.cors_origins_default

    # Database Configuration is now handled in db_config.py to avoid circular dependencies

    # JWT Configuration
    jwt_secret_key: str = 'supersecretkey'  # Should be overridden in production via env var
    jwt_algorithm: str = 'HS256'
    jwt_expiration_minutes: int = 60 * 24  # 24 hours

    # Default workflow states for metrics calculations
    # These are used as fallbacks if not specified in the database configuration
    workflow_states: List[str] = ['Backlog', 'In Progress', 'Done']
    lead_time_start_state: str = 'Backlog'
    lead_time_end_state: str = 'Done'
    cycle_time_start_state: str = 'In Progress'
    cycle_time_end_state: str = 'Done'

    model_config = {
        'env_file': '.env',
        'extra': 'allow'
        if os.getenv('TEST_ENVIRONMENT', '').lower() in ('true', '1', 'yes')
        else 'ignore',  # Only allow extra fields in test environment
    }


@lru_cache()
def get_settings():
    """Create and return a cached instance of the application settings.

    Returns:
        Settings: A cached Settings instance containing all application configuration.
    """
    return Settings()
