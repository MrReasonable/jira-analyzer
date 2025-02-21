import pytest
import logging
import sys
from unittest.mock import Mock, patch, call
from app.utils.logging import setup_logging, get_logger

@pytest.fixture
def reset_logging():
    """Reset logging configuration before each test"""
    root_logger = logging.getLogger()
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    yield
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

def test_setup_logging_basic(reset_logging):
    """Test basic logging setup"""
    setup_logging()
    root_logger = logging.getLogger()
    
    assert root_logger.level == logging.INFO
    assert len(root_logger.handlers) == 2  # stdout and stderr handlers
    
    # Verify handler types and levels
    handlers = root_logger.handlers
    assert any(isinstance(h, logging.StreamHandler) and h.stream == sys.stdout for h in handlers)
    assert any(isinstance(h, logging.StreamHandler) and h.stream == sys.stderr for h in handlers)

def test_setup_logging_custom_level(reset_logging):
    """Test logging setup with custom level"""
    setup_logging("DEBUG")
    root_logger = logging.getLogger()
    
    assert root_logger.level == logging.DEBUG
    stdout_handler = next(h for h in root_logger.handlers if h.stream == sys.stdout)
    assert stdout_handler.level == logging.DEBUG

def test_setup_logging_formatter(reset_logging):
    """Test logging formatter configuration"""
    setup_logging()
    root_logger = logging.getLogger()
    
    for handler in root_logger.handlers:
        formatter = handler.formatter
        assert "%(asctime)s" in formatter._fmt
        assert "%(name)s" in formatter._fmt
        assert "%(levelname)s" in formatter._fmt
        assert "%(filename)s" in formatter._fmt
        assert "%(lineno)d" in formatter._fmt
        assert "%(message)s" in formatter._fmt

def test_setup_logging_flask_integration(reset_logging):
    """Test Flask logger configuration"""
    setup_logging()
    flask_logger = logging.getLogger('flask.app')
    werkzeug_logger = logging.getLogger('werkzeug')
    
    assert flask_logger.level == logging.INFO
    assert werkzeug_logger.level == logging.INFO
    assert flask_logger.propagate is True
    assert werkzeug_logger.propagate is True

def test_setup_logging_app_loggers(reset_logging):
    """Test app-specific logger configuration"""
    setup_logging()
    
    app_loggers = ['app.api', 'app.core', 'app.services']
    for logger_name in app_loggers:
        logger = logging.getLogger(logger_name)
        assert logger.level == logging.INFO
        assert logger.propagate is True

def test_get_logger():
    """Test logger retrieval"""
    logger = get_logger('test.component')
    assert isinstance(logger, logging.Logger)
    assert logger.name == 'test.component'

def test_stderr_handler_level(reset_logging):
    """Test stderr handler level configuration"""
    setup_logging()
    root_logger = logging.getLogger()
    
    stderr_handler = next(h for h in root_logger.handlers if h.stream == sys.stderr)
    assert stderr_handler.level == logging.WARNING

@patch('sys.stdout', new_callable=Mock)
@patch('sys.stderr', new_callable=Mock)
def test_log_output_routing(mock_stderr, mock_stdout, reset_logging):
    """Test log message routing to appropriate outputs"""
    setup_logging()
    logger = get_logger('test')
    
    # Log messages at different levels
    logger.debug("Debug message")
    logger.info("Info message")
    logger.warning("Warning message")
    logger.error("Error message")
    
    # Verify routing
    assert mock_stdout.write.called  # Info messages should go to stdout
    assert mock_stderr.write.called  # Warning/Error messages should go to stderr

def test_multiple_setup_calls(reset_logging):
    """Test multiple calls to setup_logging"""
    setup_logging()
    initial_handlers = len(logging.getLogger().handlers)
    
    setup_logging()  # Second call
    assert len(logging.getLogger().handlers) == initial_handlers

def test_setup_logging_invalid_level(reset_logging):
    """Test setup with invalid log level"""
    with pytest.raises(ValueError):
        setup_logging("INVALID_LEVEL")

def test_logger_hierarchy(reset_logging):
    """Test logger hierarchy and propagation"""
    setup_logging()
    
    parent_logger = get_logger('app')
    child_logger = get_logger('app.component')
    
    assert child_logger.parent == parent_logger
    assert child_logger.propagate is True

@patch('logging.StreamHandler')
def test_handler_creation(mock_handler, reset_logging):
    """Test handler creation and configuration"""
    mock_instance = Mock()
    mock_handler.return_value = mock_instance
    
    setup_logging()
    
    # Verify handler configuration
    assert mock_handler.call_count == 2  # stdout and stderr handlers
    assert mock_instance.setFormatter.called
    assert mock_instance.setLevel.called

def test_logger_name_validation():
    """Test logger name validation"""
    # Empty name
    logger = get_logger("")
    assert isinstance(logger, logging.Logger)
    assert logger.name == ""
    
    # Special characters
    logger = get_logger("test.component-name")
    assert isinstance(logger, logging.Logger)
    assert logger.name == "test.component-name"

def test_setup_logging_thread_safety(reset_logging):
    """Test logging setup thread safety"""
    import threading
    
    def setup_logging_thread():
        setup_logging()
    
    # Create multiple threads to set up logging
    threads = [threading.Thread(target=setup_logging_thread) for _ in range(5)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    
    # Verify only one set of handlers is created
    root_logger = logging.getLogger()
    assert len(root_logger.handlers) == 2  # One stdout, one stderr

def test_logging_performance(reset_logging):
    """Test logging performance"""
    import time
    
    setup_logging()
    logger = get_logger('test.performance')
    
    start_time = time.time()
    for _ in range(1000):
        logger.info("Test message")
    end_time = time.time()
    
    # Logging should be reasonably fast
    assert end_time - start_time < 1.0  # Should take less than 1 second
