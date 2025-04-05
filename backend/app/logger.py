"""Logging configuration for the Jira Analyzer application.

This module provides a centralized logging configuration for the application,
with support for different log levels and formatters. It configures loggers
for various components of the application.
"""

import logging
import os
import sys
from enum import Enum
from typing import Optional


# Define log levels as an enum for better type hinting and consistency
class LogLevel(str, Enum):
    """Log levels supported by the application."""

    DEBUG = 'DEBUG'
    INFO = 'INFO'
    WARNING = 'WARNING'
    ERROR = 'ERROR'
    CRITICAL = 'CRITICAL'


# Map string log levels to logging module constants (case-insensitive)
LOG_LEVEL_MAP = {
    LogLevel.DEBUG.lower(): logging.DEBUG,
    LogLevel.INFO.lower(): logging.INFO,
    LogLevel.WARNING.lower(): logging.WARNING,
    LogLevel.ERROR.lower(): logging.ERROR,
    LogLevel.CRITICAL.lower(): logging.CRITICAL,
}


def get_logger(name: str, level: Optional[LogLevel] = None) -> logging.Logger:
    """Get a configured logger instance.

    Args:
        name: Name of the logger, typically the module name.
        level: Optional log level to override the default.

    Returns:
        logging.Logger: Configured logger instance.
    """
    # If running tests, use CRITICAL level to suppress most logs
    if os.environ.get('PYTEST_CURRENT_TEST') is not None:
        log_level = logging.CRITICAL
    else:
        # Determine log level from environment or use INFO as default
        env_level_str = os.environ.get('LOG_LEVEL', LogLevel.INFO)
        # Convert to lowercase for case-insensitive comparison
        env_level_lower = env_level_str.lower()
        # Check if it's a valid log level
        if env_level_lower in LOG_LEVEL_MAP:
            selected_level_lower = level.lower() if level else env_level_lower
            log_level = LOG_LEVEL_MAP.get(selected_level_lower, logging.INFO)
        else:
            # Default to INFO if not valid
            log_level = logging.INFO

    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(log_level)

    # Check if handlers are already configured to avoid duplicate handlers
    if not logger.handlers:
        # Create console handler
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(log_level)

        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)

        # Add handler to logger
        logger.addHandler(handler)

    return logger


# Create a default logger for the application
logger = get_logger('jira_analyzer')


def configure_logging(level: Optional[LogLevel] = None) -> None:
    """Configure global logging settings.

    Args:
        level: Optional log level to set for all loggers.
    """
    # Define the config_level variable once
    config_level: LogLevel

    # If running tests, use CRITICAL level to suppress most logs
    if os.environ.get('PYTEST_CURRENT_TEST') is not None:
        log_level = logging.CRITICAL
        # Use the level parameter for logging the configuration message
        config_level = level or LogLevel.CRITICAL
    else:
        # Determine log level from parameter or environment
        env_level_str = os.environ.get('LOG_LEVEL', LogLevel.INFO)
        # Convert to lowercase for case-insensitive comparison
        env_level_lower = env_level_str.lower()
        # Check if it's a valid log level
        if env_level_lower in LOG_LEVEL_MAP:
            selected_level_lower = level.lower() if level else env_level_lower
            log_level = LOG_LEVEL_MAP.get(selected_level_lower, logging.INFO)
            config_level = level or LogLevel(env_level_str.upper())
        else:
            # Default to INFO if not valid
            log_level = logging.INFO
            config_level = LogLevel.INFO

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Remove existing handlers to avoid duplicates
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Create console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(log_level)

    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)

    # Add handler to root logger
    root_logger.addHandler(handler)

    # Log the configuration
    logger.info(f'Logging configured with level: {config_level}')


# Configure logging when the module is imported
if os.environ.get('TESTING') != 'true':
    configure_logging()
