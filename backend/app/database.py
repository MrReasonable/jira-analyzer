"""Database configuration and session management for the Jira Analyzer application.

This module sets up the SQLAlchemy async database engine and provides utilities
for database initialization and session management. It uses SQLite with async
support through aiosqlite and Alembic for database migrations.
"""

import asyncio
import os
from concurrent.futures import ThreadPoolExecutor
from typing import AsyncGenerator, Optional

from alembic import command
from alembic.config import Config
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from .logger import get_logger
from .models import Base

# Create module-level logger
logger = get_logger(__name__)

# Check if we're running in test mode
USE_IN_MEMORY_DB = os.environ.get('USE_IN_MEMORY_DB', 'false').lower() == 'true'

# Use in-memory SQLite database for tests, file-based for normal operation
if USE_IN_MEMORY_DB:
    DATABASE_URL = 'sqlite+aiosqlite:///:memory:'
    logger.info('Using in-memory database for testing')
else:
    DATABASE_URL = 'sqlite+aiosqlite:///./jira_analyzer.db'
    logger.info(f'Using file-based database: {DATABASE_URL}')

# Set echo=False in production to reduce log noise
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(bind=engine, expire_on_commit=False)
logger.debug('Database engine and session factory created')


async def init_in_memory_db(db_engine: Optional[AsyncEngine] = None) -> None:
    """Initialize an in-memory database by creating all tables.

    Args:
        db_engine: The database engine to use. If None, the default engine is used.
    """
    try:
        logger.info('Initializing in-memory database with SQLAlchemy')

        # Use the provided engine or the default one
        engine_to_use = db_engine or engine

        async with engine_to_use.begin() as conn:
            # Create all tables defined in the models
            await conn.run_sync(Base.metadata.create_all)

        logger.info('In-memory database tables created successfully')
    except Exception as e:
        logger.error(f'In-memory database initialization failed: {str(e)}', exc_info=True)
        raise


async def init_file_based_db(
    event_loop: Optional[asyncio.AbstractEventLoop] = None, alembic_config: Optional[Config] = None
) -> None:
    """Initialize a file-based database using Alembic migrations.

    Args:
        event_loop: The event loop to use. If None, the current event loop is used.
        alembic_config: The Alembic configuration to use. If None, a new one is created.
    """
    try:
        logger.info('Initializing database with Alembic migrations')

        # Get or create the Alembic configuration
        if alembic_config is None:
            # Get the directory of the current file
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            logger.debug(f'Base directory: {base_dir}')

            # Create an Alembic configuration object
            alembic_config = Config(os.path.join(base_dir, 'alembic.ini'))

        logger.debug('Alembic configuration loaded')

        # Get the event loop if not provided
        loop = event_loop or asyncio.get_event_loop()

        # Define the migration function
        def run_migrations():
            command.upgrade(alembic_config, 'head')

        # Run the migrations using asyncio to run the command in a thread
        with ThreadPoolExecutor() as pool:
            await loop.run_in_executor(pool, run_migrations)

        logger.info('Database migrations completed successfully')
    except Exception as e:
        logger.error(f'File-based database initialization failed: {str(e)}', exc_info=True)
        raise


async def init_db() -> None:
    """Initialize the database.

    For file-based databases, this runs Alembic migrations to ensure the schema
    is up to date. For in-memory databases, it creates all tables directly using
    SQLAlchemy's create_all method.

    This function should be called when the application starts.
    """
    try:
        if USE_IN_MEMORY_DB:
            await init_in_memory_db()
        else:
            await init_file_based_db()
    except Exception as e:
        logger.error(f'Database initialization failed: {str(e)}', exc_info=True)
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
