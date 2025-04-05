"""Database configuration for the Jira Analyzer application.

This module provides database configuration settings separate from the main
application settings to avoid circular dependencies.
"""

import os


def get_database_url() -> str:
    """Return the database URL based on environment variables.

    Returns:
        str: The database URL for SQLAlchemy.
    """
    # Check if we should use in-memory database (for testing)
    if os.getenv('USE_IN_MEMORY_DB', '').lower() in ('true', '1', 'yes'):
        return 'sqlite+aiosqlite:///:memory:'

    # Check if we should use SQLite (mainly for development without Docker)
    if os.getenv('USE_SQLITE', '').lower() in ('true', '1', 'yes'):
        return 'sqlite+aiosqlite:///./jira_analyzer.db'

    # Get PostgreSQL connection parameters from environment variables
    postgres_user = os.getenv('POSTGRES_USER', 'postgres')
    postgres_password = os.getenv('POSTGRES_PASSWORD', 'postgres')
    postgres_host = os.getenv('POSTGRES_HOST', 'postgres')  # Service name in docker-compose
    postgres_port = os.getenv('POSTGRES_PORT', '5432')
    postgres_db = os.getenv('POSTGRES_DB', 'jira_analyzer')

    # Default to PostgreSQL with psycopg (v3) driver
    # Use psycopg_async for async operations
    return f'postgresql+psycopg_async://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}'
