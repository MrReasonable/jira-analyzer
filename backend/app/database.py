"""Database configuration and session management for the Jira Analyzer application.

This module sets up the SQLAlchemy async database engine and provides utilities
for database initialization and session management. It uses SQLite with async
support through aiosqlite and Alembic for database migrations.
"""

import os

from alembic import command
from alembic.config import Config
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Use SQLite database
DATABASE_URL = 'sqlite+aiosqlite:///./jira_analyzer.db'

engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    """Initialize the database by running migrations.

    This function runs Alembic migrations to ensure the database schema
    is up to date. It should be called when the application starts.
    """
    # Get the directory of the current file
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # Create an Alembic configuration object
    alembic_cfg = Config(os.path.join(base_dir, 'alembic.ini'))

    # Run the migrations
    command.upgrade(alembic_cfg, 'head')


async def get_session() -> AsyncSession:
    """Create and yield a new database session.

    This is an async context manager that provides a database session
    for use in FastAPI dependency injection.

    Yields:
        AsyncSession: An async SQLAlchemy session for database operations.
    """
    async with async_session() as session:
        yield session
