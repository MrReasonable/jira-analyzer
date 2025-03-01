"""Unit tests for the logger module.

This module contains unit tests for the logging configuration and utilities.
"""

import logging
import os
from unittest.mock import MagicMock, patch

from app.logger import LogLevel, configure_logging, get_logger


class TestLogger:
    """Tests for the logger module."""

    def test_get_logger_default_level(self):
        """Test that get_logger returns a logger with the default level."""
        # Save original environment
        original_env = os.environ.get('LOG_LEVEL')
        original_pytest_env = os.environ.get('PYTEST_CURRENT_TEST')

        try:
            # Clear the environment variables
            if 'LOG_LEVEL' in os.environ:
                del os.environ['LOG_LEVEL']
            if 'PYTEST_CURRENT_TEST' in os.environ:
                del os.environ['PYTEST_CURRENT_TEST']

            # Get a logger
            logger = get_logger('test_logger')

            # Verify that the logger has the default level (INFO)
            assert logger.level == logging.INFO

            # Verify that the logger has a handler
            assert len(logger.handlers) > 0

            # Verify that the handler has a formatter
            assert logger.handlers[0].formatter is not None
        finally:
            # Restore original environment
            if original_env is not None:
                os.environ['LOG_LEVEL'] = original_env
            elif 'LOG_LEVEL' in os.environ:
                del os.environ['LOG_LEVEL']
            if original_pytest_env is not None:
                os.environ['PYTEST_CURRENT_TEST'] = original_pytest_env
            elif 'PYTEST_CURRENT_TEST' in os.environ:
                del os.environ['PYTEST_CURRENT_TEST']

    def test_get_logger_custom_level(self):
        """Test that get_logger respects a custom level."""
        # Save original pytest environment
        original_pytest_env = os.environ.get('PYTEST_CURRENT_TEST')

        try:
            # Clear the PYTEST_CURRENT_TEST environment variable
            if 'PYTEST_CURRENT_TEST' in os.environ:
                del os.environ['PYTEST_CURRENT_TEST']

            # Get a logger with a custom level
            logger = get_logger('test_logger_custom', level=LogLevel.DEBUG)

            # Verify that the logger has the custom level
            assert logger.level == logging.DEBUG
        finally:
            # Restore original environment
            if original_pytest_env is not None:
                os.environ['PYTEST_CURRENT_TEST'] = original_pytest_env
            elif 'PYTEST_CURRENT_TEST' in os.environ:
                del os.environ['PYTEST_CURRENT_TEST']

    def test_get_logger_environment_level(self):
        """Test that get_logger respects the LOG_LEVEL environment variable."""
        # Save original environment
        original_env = os.environ.get('LOG_LEVEL')
        original_pytest_env = os.environ.get('PYTEST_CURRENT_TEST')

        try:
            # Set the LOG_LEVEL environment variable and clear PYTEST_CURRENT_TEST
            os.environ['LOG_LEVEL'] = 'ERROR'
            if 'PYTEST_CURRENT_TEST' in os.environ:
                del os.environ['PYTEST_CURRENT_TEST']

            # Get a logger
            logger = get_logger('test_logger_env')

            # Verify that the logger has the environment level
            assert logger.level == logging.ERROR
        finally:
            # Restore original environment
            if original_env is not None:
                os.environ['LOG_LEVEL'] = original_env
            elif 'LOG_LEVEL' in os.environ:
                del os.environ['LOG_LEVEL']
            if original_pytest_env is not None:
                os.environ['PYTEST_CURRENT_TEST'] = original_pytest_env
            elif 'PYTEST_CURRENT_TEST' in os.environ:
                del os.environ['PYTEST_CURRENT_TEST']

    def test_get_logger_invalid_environment_level(self):
        """Test that get_logger handles invalid LOG_LEVEL values."""
        # Save original environment
        original_env = os.environ.get('LOG_LEVEL')
        original_pytest_env = os.environ.get('PYTEST_CURRENT_TEST')

        try:
            # Set an invalid LOG_LEVEL environment variable and clear PYTEST_CURRENT_TEST
            os.environ['LOG_LEVEL'] = 'INVALID_LEVEL'
            if 'PYTEST_CURRENT_TEST' in os.environ:
                del os.environ['PYTEST_CURRENT_TEST']

            # Get a logger
            logger = get_logger('test_logger_invalid')

            # Verify that the logger has the default level (INFO)
            assert logger.level == logging.INFO
        finally:
            # Restore original environment
            if original_env is not None:
                os.environ['LOG_LEVEL'] = original_env
            elif 'LOG_LEVEL' in os.environ:
                del os.environ['LOG_LEVEL']
            if original_pytest_env is not None:
                os.environ['PYTEST_CURRENT_TEST'] = original_pytest_env
            elif 'PYTEST_CURRENT_TEST' in os.environ:
                del os.environ['PYTEST_CURRENT_TEST']

    def test_get_logger_pytest_environment(self):
        """Test that get_logger uses CRITICAL level in pytest environment."""
        # Save original environment
        original_env = os.environ.get('PYTEST_CURRENT_TEST')

        try:
            # Set the PYTEST_CURRENT_TEST environment variable
            os.environ['PYTEST_CURRENT_TEST'] = (
                'test_logger.py::TestLogger::test_get_logger_pytest_environment'
            )

            # Get a logger
            logger = get_logger('test_logger_pytest')

            # Verify that the logger has the CRITICAL level
            assert logger.level == logging.CRITICAL
        finally:
            # Restore original environment
            if original_env is not None:
                os.environ['PYTEST_CURRENT_TEST'] = original_env
            elif 'PYTEST_CURRENT_TEST' in os.environ:
                del os.environ['PYTEST_CURRENT_TEST']

    @patch('app.logger.logging.getLogger')
    def test_get_logger_existing_handlers(self, mock_getLogger):
        """Test that get_logger doesn't add handlers if they already exist."""
        # Create a mock logger with existing handlers
        mock_logger = MagicMock()
        mock_logger.handlers = [MagicMock()]
        mock_getLogger.return_value = mock_logger

        # Get a logger
        logger = get_logger('test_logger_existing')

        # Verify that no new handlers were added
        assert len(logger.handlers) == 1

    def test_configure_logging(self):
        """Test that configure_logging sets up the root logger."""
        # Save original root logger configuration and environment
        root_logger = logging.getLogger()
        original_level = root_logger.level
        original_handlers = root_logger.handlers.copy()
        original_pytest_env = os.environ.get('PYTEST_CURRENT_TEST')

        try:
            # Remove existing handlers and clear PYTEST_CURRENT_TEST
            for handler in root_logger.handlers[:]:
                root_logger.removeHandler(handler)
            if 'PYTEST_CURRENT_TEST' in os.environ:
                del os.environ['PYTEST_CURRENT_TEST']

            # Configure logging
            configure_logging(level=LogLevel.WARNING)

            # Verify that the root logger has the custom level
            assert root_logger.level == logging.WARNING

            # Verify that the root logger has a handler
            assert len(root_logger.handlers) > 0

            # Verify that the handler has a formatter
            assert root_logger.handlers[0].formatter is not None
        finally:
            # Restore original root logger configuration
            root_logger.setLevel(original_level)

            # Remove current handlers
            for handler in root_logger.handlers[:]:
                root_logger.removeHandler(handler)

            # Restore original handlers
            for handler in original_handlers:
                root_logger.addHandler(handler)

            # Restore original environment
            if original_pytest_env is not None:
                os.environ['PYTEST_CURRENT_TEST'] = original_pytest_env
            elif 'PYTEST_CURRENT_TEST' in os.environ:
                del os.environ['PYTEST_CURRENT_TEST']

    def test_configure_logging_environment_level(self):
        """Test that configure_logging respects the LOG_LEVEL environment variable."""
        # Save original environment and root logger configuration
        original_env = os.environ.get('LOG_LEVEL')
        original_pytest_env = os.environ.get('PYTEST_CURRENT_TEST')
        root_logger = logging.getLogger()
        original_level = root_logger.level
        original_handlers = root_logger.handlers.copy()

        try:
            # Set the LOG_LEVEL environment variable and clear PYTEST_CURRENT_TEST
            os.environ['LOG_LEVEL'] = 'ERROR'
            if 'PYTEST_CURRENT_TEST' in os.environ:
                del os.environ['PYTEST_CURRENT_TEST']

            # Remove existing handlers
            for handler in root_logger.handlers[:]:
                root_logger.removeHandler(handler)

            # Configure logging
            configure_logging()

            # Verify that the root logger has the environment level
            assert root_logger.level == logging.ERROR
        finally:
            # Restore original environment
            if original_env is not None:
                os.environ['LOG_LEVEL'] = original_env
            elif 'LOG_LEVEL' in os.environ:
                del os.environ['LOG_LEVEL']
            if original_pytest_env is not None:
                os.environ['PYTEST_CURRENT_TEST'] = original_pytest_env
            elif 'PYTEST_CURRENT_TEST' in os.environ:
                del os.environ['PYTEST_CURRENT_TEST']

            # Restore original root logger configuration
            root_logger.setLevel(original_level)

            # Remove current handlers
            for handler in root_logger.handlers[:]:
                root_logger.removeHandler(handler)

            # Restore original handlers
            for handler in original_handlers:
                root_logger.addHandler(handler)

    def test_log_level_enum(self):
        """Test the LogLevel enum."""
        # Verify that the enum values match the logging module constants
        assert LogLevel.DEBUG.value == 'DEBUG'
        assert LogLevel.INFO.value == 'INFO'
        assert LogLevel.WARNING.value == 'WARNING'
        assert LogLevel.ERROR.value == 'ERROR'
        assert LogLevel.CRITICAL.value == 'CRITICAL'
