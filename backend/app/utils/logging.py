import logging
import sys
from typing import Optional
from flask import Flask

def setup_logging(level: str = "INFO") -> None:
    """
    Setup application logging configuration.
    
    Args:
        level: Logging level (default: INFO)
    """
    # Create formatter with detailed format
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
    )

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Remove any existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Create console handlers for both stdout and stderr
    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setFormatter(formatter)
    stdout_handler.setLevel(level)
    root_logger.addHandler(stdout_handler)

    stderr_handler = logging.StreamHandler(sys.stderr)
    stderr_handler.setFormatter(formatter)
    stderr_handler.setLevel(logging.WARNING)  # Warnings and errors go to stderr
    root_logger.addHandler(stderr_handler)

    # Configure Flask's logger
    flask_logger = logging.getLogger('flask.app')
    flask_logger.setLevel(level)
    flask_logger.propagate = True

    # Configure Werkzeug logger
    werkzeug_logger = logging.getLogger('werkzeug')
    werkzeug_logger.setLevel(level)
    werkzeug_logger.propagate = True

    # Configure our app loggers
    app_loggers = ['app.api', 'app.core', 'app.services']
    for logger_name in app_loggers:
        logger = logging.getLogger(logger_name)
        logger.setLevel(level)
        logger.propagate = True

def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a specific component.
    
    Args:
        name: Logger name (e.g., 'app.api', 'app.core.analyzer')
        
    Returns:
        Logger instance configured to write to stdout
    """
    if not name:
        # Create a new logger with empty name instead of returning root logger
        logger = logging.Logger('')
        # Copy handlers from root logger
        root_logger = logging.getLogger()
        for handler in root_logger.handlers:
            logger.addHandler(handler)
        return logger
    return logging.getLogger(name)
