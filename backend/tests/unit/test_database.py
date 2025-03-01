"""Unit tests for the database module.

This module contains unit tests for the database configuration and session management.
"""

import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session, init_db, init_file_based_db, init_in_memory_db


class TestDatabase:
    """Tests for the database module."""

    @pytest.mark.asyncio
    @patch('app.database.init_file_based_db')
    @patch('app.database.init_in_memory_db')
    async def test_init_db_file_based(self, mock_init_in_memory, mock_init_file_based):
        """Test that init_db calls the correct initialization function for file-based DB."""
        # Mock the environment to use file-based database
        with patch.dict(os.environ, {'USE_IN_MEMORY_DB': 'false'}):
            # Mock the initialization functions
            mock_init_file_based.return_value = None

            # Call init_db
            await init_db()

            # Verify that the file-based initialization was called
            mock_init_file_based.assert_called_once()
            # Verify that the in-memory initialization was not called
            mock_init_in_memory.assert_not_called()

    @pytest.mark.asyncio
    async def test_init_db_in_memory(self):
        """Test that init_db calls the correct initialization function for in-memory DB."""
        # Create mock functions
        mock_init_in_memory = AsyncMock()
        mock_init_file_based = AsyncMock()

        # Patch the module-level USE_IN_MEMORY_DB variable directly
        with patch('app.database.USE_IN_MEMORY_DB', True):
            # Patch the initialization functions
            with patch('app.database.init_in_memory_db', mock_init_in_memory):
                with patch('app.database.init_file_based_db', mock_init_file_based):
                    # Call init_db
                    await init_db()

                    # Verify that the in-memory initialization was called
                    mock_init_in_memory.assert_called_once()
                    # Verify that the file-based initialization was not called
                    mock_init_file_based.assert_not_called()

    @pytest.mark.asyncio
    @patch('asyncio.get_event_loop')
    @patch('app.database.command')
    @patch('app.database.Config')
    @patch('concurrent.futures.ThreadPoolExecutor')
    async def test_init_file_based_db(
        self, mock_executor, mock_config, mock_command, mock_get_event_loop
    ):
        """Test initializing a file-based database."""
        # Mock the ThreadPoolExecutor
        mock_executor_instance = MagicMock()
        mock_executor.return_value.__enter__.return_value = mock_executor_instance

        # Mock asyncio.get_event_loop
        mock_loop = MagicMock()
        mock_get_event_loop.return_value = mock_loop

        # Mock the Config
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance

        # Skip the actual execution by mocking run_in_executor
        mock_loop.run_in_executor = AsyncMock()

        # Call init_file_based_db
        await init_file_based_db()

        # Verify that Alembic was used for migrations
        mock_config.assert_called_once()
        # Verify that run_migrations was called via run_in_executor
        assert mock_loop.run_in_executor.called

    @pytest.mark.asyncio
    @patch('app.database.engine')
    async def test_init_in_memory_db(self, mock_engine):
        """Test initializing an in-memory database."""
        # Create a mock connection
        mock_conn = AsyncMock()
        mock_engine.begin.return_value.__aenter__.return_value = mock_conn

        # Create a mock for Base.metadata.create_all
        mock_create_all = MagicMock()

        # Mock the Base.metadata.create_all method
        with patch('app.database.Base.metadata.create_all', mock_create_all):
            # Call init_in_memory_db
            await init_in_memory_db()

            # Verify that engine.begin() was called
            mock_engine.begin.assert_called_once()

            # Verify that conn.run_sync was called
            mock_conn.run_sync.assert_called_once()

            # Get the function that was passed to run_sync
            create_tables_func = mock_conn.run_sync.call_args[0][0]

            # Call the function with a mock connection
            mock_connection = MagicMock()
            create_tables_func(mock_connection)

            # Verify that Base.metadata.create_all was called with the connection
            mock_create_all.assert_called_once_with(mock_connection)

    @pytest.mark.asyncio
    @patch('app.database.async_session')
    async def test_get_session(self, mock_async_session):
        """Test the get_session function."""
        # Mock the async session
        mock_session = AsyncMock(spec=AsyncSession)
        mock_async_session.return_value.__aenter__.return_value = mock_session

        # Use the get_session context manager
        session_gen = get_session()
        session = await session_gen.__anext__()

        # Verify that the session was created and returned
        assert session is mock_session
        mock_async_session.assert_called_once()

    @pytest.mark.asyncio
    @patch('app.database.async_session')
    async def test_get_session_with_exception(self, mock_async_session):
        """Test the get_session function when an exception occurs."""
        # Mock the async session to raise an exception
        mock_session = AsyncMock(spec=AsyncSession)
        mock_async_session.return_value.__aenter__.return_value = mock_session
        mock_session.execute.side_effect = Exception('Test exception')

        # Use the get_session context manager
        session_gen = get_session()
        session = await session_gen.__anext__()

        # Verify that the session was created
        assert session is mock_session

        # Simulate an exception in the session
        with pytest.raises(Exception, match='Test exception'):
            await session.execute('SELECT 1')

    def test_database_url(self):
        """Test that the database URL is set correctly."""
        # Save original environment
        original_env = os.environ.get('USE_IN_MEMORY_DB')

        try:
            # Test with in-memory database
            os.environ['USE_IN_MEMORY_DB'] = 'true'

            # Need to reload the module to get the updated DATABASE_URL
            import importlib

            import app.database

            importlib.reload(app.database)

            assert app.database.DATABASE_URL == 'sqlite+aiosqlite:///:memory:'

            # Test with file-based database
            os.environ['USE_IN_MEMORY_DB'] = 'false'

            # Need to reload the module to get the updated DATABASE_URL
            importlib.reload(app.database)

            assert app.database.DATABASE_URL == 'sqlite+aiosqlite:///./jira_analyzer.db'
        finally:
            # Restore original environment
            if original_env is not None:
                os.environ['USE_IN_MEMORY_DB'] = original_env
            else:
                del os.environ['USE_IN_MEMORY_DB']
