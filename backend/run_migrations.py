#!/usr/bin/env python
"""Database migration script for the Jira Analyzer.

This script runs database migrations using Alembic. It should be executed
before starting the application to ensure the database schema is up to date.

Usage:
    python run_migrations.py

The script will:
1. Check if the database exists
2. Run Alembic migrations to update the schema
3. Verify the migrations were successful
"""

import asyncio
import os
import sys
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Add the current directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.logger import get_logger, configure_logging

# Configure logging
configure_logging()
logger = get_logger("db_migrations")


async def check_database_connection(database_url):
    """Check if the database is accessible.

    Args:
        database_url: The database URL to connect to.

    Returns:
        bool: True if the database is accessible, False otherwise.
    """
    engine = create_async_engine(database_url)
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            logger.info("Database connection successful")
            return True
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        return False
    finally:
        await engine.dispose()


def run_alembic_migrations(alembic_cfg):
    """Run Alembic migrations to update the database schema.

    Args:
        alembic_cfg: The Alembic configuration object.

    Returns:
        bool: True if migrations were successful, False otherwise.
    """
    try:
        logger.info("Running Alembic migrations")

        # Use the Alembic command API to run the migrations
        command.upgrade(alembic_cfg, "head")

        logger.info("Alembic migrations completed successfully")
        return True
    except Exception as e:
        logger.error(f"Error during Alembic migrations: {str(e)}")
        return False


async def main():
    """Run database migrations."""
    logger.info("Starting database migrations")

    # Get the base directory
    base_dir = Path(__file__).parent

    # Create an Alembic configuration object
    alembic_ini_path = base_dir / "alembic.ini"
    if not alembic_ini_path.exists():
        logger.error(f"Alembic config not found at {alembic_ini_path}")
        return False

    alembic_cfg = Config(str(alembic_ini_path))
    logger.info(f"Using Alembic config from {alembic_ini_path}")

    # Check if we're using an in-memory database for tests
    use_in_memory_db = os.environ.get("USE_IN_MEMORY_DB", "false").lower() == "true"

    # Set the database URL
    if use_in_memory_db:
        database_url = "sqlite+aiosqlite:///:memory:"
        logger.info("Using in-memory database for testing")
    else:
        database_url = "sqlite+aiosqlite:///./jira_analyzer.db"
        logger.info(f"Using file-based database: {database_url}")

    # Check database connection
    if not await check_database_connection(database_url):
        logger.error("Database connection failed, cannot run migrations")
        return False

    # Run migrations
    if run_alembic_migrations(alembic_cfg):
        logger.info("Database migrations completed successfully")
        return True
    else:
        logger.error("Database migrations failed")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
