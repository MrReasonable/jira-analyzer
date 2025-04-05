"""Database configuration and session management for the Jira Analyzer application.

This module sets up the SQLAlchemy async database engine and provides utilities
for database initialization and session management. It supports both PostgreSQL
and SQLite with async support through asyncpg/aiosqlite and uses Alembic for
database migrations.
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

from .db_config import get_database_url
from .logger import get_logger
from .models import Base

# Create module-level logger
logger = get_logger(__name__)

# Get database URL from db_config
DATABASE_URL = get_database_url()

# Log the database connection type
if 'sqlite' in DATABASE_URL:
    if ':memory:' in DATABASE_URL:
        logger.info('Using in-memory SQLite database for testing')
    else:
        logger.info(f'Using file-based SQLite database: {DATABASE_URL}')
else:
    # For security, don't log the full connection string with credentials
    db_type = DATABASE_URL.split('://')[0]
    db_host = DATABASE_URL.split('@')[-1].split('/')[0]
    db_name = DATABASE_URL.split('/')[-1]
    logger.info(f'Using {db_type} database at {db_host}, database name: {db_name}')

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
    """Initialize a database using Alembic migrations.

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
            alembic_ini_path = os.path.join(base_dir, 'alembic.ini')
            logger.debug(f'Alembic config path: {alembic_ini_path}')
            alembic_config = Config(alembic_ini_path)

        logger.debug('Alembic configuration loaded')

        # Get the event loop if not provided
        loop = event_loop or asyncio.get_event_loop()

        # Define the migration function
        def run_migrations():
            logger.debug('Starting Alembic migrations')
            try:
                # For SQLite, check if the database file exists
                if 'sqlite' in DATABASE_URL:
                    db_path = './jira_analyzer.db'
                    if os.path.exists(db_path) and os.path.getsize(db_path) > 0:
                        logger.debug(f'SQLite database file exists: {db_path}')
                    else:
                        logger.debug(f'SQLite database file does not exist or is empty: {db_path}')
                else:
                    # For PostgreSQL, we don't need to check for file existence
                    logger.debug('Using PostgreSQL database')

                # Check if the database already has the latest migrations
                # by running a "current" command to see the current revision
                try:
                    logger.debug('Checking current database revision')
                    current = command.current(alembic_config)
                    logger.debug(f'Current database revision: {current}')
                except Exception as e:
                    logger.warning(f'Could not get current revision: {str(e)}')
                    logger.debug('This may be normal for a new database')
                    current = None

                # Run the upgrade to head
                logger.debug('Running upgrade to head')
                command.upgrade(alembic_config, 'head')

                logger.debug('Alembic migrations executed successfully')
            except Exception as e:
                logger.error(f'Error during Alembic migrations: {str(e)}', exc_info=True)
                raise

        # Run the migrations using asyncio to run the command in a thread
        logger.debug('Running migrations in thread pool')
        try:
            with ThreadPoolExecutor() as pool:
                # Add a timeout to prevent hanging
                await asyncio.wait_for(
                    loop.run_in_executor(pool, run_migrations),
                    timeout=30,  # 30 seconds timeout
                )
            logger.info('Database migrations completed successfully')
        except asyncio.TimeoutError:
            logger.error('Database migrations timed out after 30 seconds')
            # Continue with SQLAlchemy fallback
            raise Exception('Database migrations timed out')
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
        # Check if we're using in-memory database
        if ':memory:' in DATABASE_URL:
            await init_in_memory_db()
        else:
            try:
                logger.info('Attempting to initialize database with Alembic migrations')
                await init_file_based_db()
                logger.info('Alembic migrations completed successfully')
            except Exception as migration_error:
                logger.error(f'Alembic migrations failed: {str(migration_error)}', exc_info=True)
                logger.warning('Falling back to SQLAlchemy create_all for database initialization')

                # Fallback to SQLAlchemy create_all if migrations fail
                try:
                    async with engine.begin() as conn:
                        logger.info('Creating database tables with SQLAlchemy')
                        await conn.run_sync(Base.metadata.create_all)
                    logger.info('Database tables created successfully with SQLAlchemy')
                except Exception as fallback_error:
                    logger.error(
                        f'SQLAlchemy fallback failed: {str(fallback_error)}', exc_info=True
                    )
                    raise fallback_error
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
