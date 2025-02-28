"""Database configuration and session management for the Jira Analyzer application.

This module sets up the SQLAlchemy async database engine and provides utilities
for database initialization and session management. It uses SQLite with async
support through aiosqlite and Alembic for database migrations.
"""

import os
from typing import AsyncGenerator

from alembic import command
from alembic.config import Config
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .logger import get_logger

# Create module-level logger
logger = get_logger(__name__)

# Use SQLite database
DATABASE_URL = 'sqlite+aiosqlite:///./jira_analyzer.db'
logger.info(f'Using database: {DATABASE_URL}')

# Set echo=False in production to reduce log noise
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(bind=engine, expire_on_commit=False)
logger.debug('Database engine and session factory created')


async def init_db():
    """Initialize the database by running migrations.

    This function runs Alembic migrations to ensure the database schema
    is up to date. It should be called when the application starts.
    """
    logger.info('Initializing database with Alembic migrations')
    try:
        # Get the directory of the current file
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        logger.debug(f'Base directory: {base_dir}')

        # Create an Alembic configuration object
        alembic_cfg = Config(os.path.join(base_dir, 'alembic.ini'))
        logger.debug('Alembic configuration loaded')

        # Run the migrations
        command.upgrade(alembic_cfg, 'head')
        logger.info('Database migrations completed successfully')
    except Exception as e:
        logger.error(f'Database migration failed: {str(e)}', exc_info=True)
        raise


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Create and yield a new database session.

    This is an async context manager that provides a database session
    for use in FastAPI dependency injection.

    Yields:
        AsyncSession: An async SQLAlchemy session for database operations.
    """
    logger.debug('Creating new database session')
    async with async_session() as session:
        try:
            yield session
            logger.debug('Database session closed')
        except Exception as e:
            logger.error(f'Error in database session: {str(e)}', exc_info=True)
            raise
