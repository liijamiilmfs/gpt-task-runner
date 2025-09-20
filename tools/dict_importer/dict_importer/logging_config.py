"""
Logging configuration for the Librán dictionary importer.
Provides structured logging with file rotation and sensitive data sanitization.
"""

import logging
import logging.handlers
import os
import re
from pathlib import Path
from typing import Any, Dict


class SensitiveDataFilter(logging.Filter):
    """Filter to sanitize sensitive data from log records."""
    
    # Patterns for sensitive data that should be redacted
    SENSITIVE_PATTERNS = [
        (r'api[_-]?key', '[API_KEY]'),
        (r'password', '[PASSWORD]'),
        (r'secret', '[SECRET]'),
        (r'token', '[TOKEN]'),
        (r'auth', '[AUTH]'),
        (r'credential', '[CREDENTIAL]'),
        (r'openai[_-]?key', '[OPENAI_KEY]'),
        (r'sk-[a-zA-Z0-9]{20,}', '[OPENAI_KEY]'),  # OpenAI API keys
        (r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '[EMAIL]'),  # Email addresses
        (r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', '[CARD_NUMBER]'),  # Credit card numbers
        (r'\b\d{3}-\d{2}-\d{4}\b', '[SSN]'),  # SSN
    ]
    
    def filter(self, record: logging.LogRecord) -> bool:
        """Filter and sanitize log record."""
        if hasattr(record, 'msg'):
            record.msg = self._sanitize_string(str(record.msg))
        
        if hasattr(record, 'args') and record.args:
            record.args = self._sanitize_args(record.args)
        
        return True
    
    def _sanitize_string(self, text: str) -> str:
        """Sanitize a string by replacing sensitive patterns."""
        for pattern, replacement in self.SENSITIVE_PATTERNS:
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        return text
    
    def _sanitize_args(self, args: Any) -> Any:
        """Recursively sanitize arguments."""
        if isinstance(args, (list, tuple)):
            return [self._sanitize_args(arg) for arg in args]
        elif isinstance(args, dict):
            return {key: self._sanitize_args(value) for key, value in args.items()}
        elif isinstance(args, str):
            return self._sanitize_string(args)
        else:
            return args


def setup_logging(
    log_level: str = 'INFO',
    log_dir: str = 'logs',
    max_file_size: int = 20 * 1024 * 1024,  # 20MB
    backup_count: int = 14,  # Keep 14 days
    error_backup_count: int = 30  # Keep 30 days for errors
) -> logging.Logger:
    """
    Set up logging configuration for the dictionary importer.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: Directory to store log files
        max_file_size: Maximum size of log files before rotation
        backup_count: Number of backup files to keep
        error_backup_count: Number of error backup files to keep
    
    Returns:
        Configured logger instance
    """
    # Create logs directory if it doesn't exist
    log_path = Path(log_dir)
    log_path.mkdir(parents=True, exist_ok=True)
    
    # Create logger
    logger = logging.getLogger('dict_importer')
    logger.setLevel(getattr(logging, log_level.upper()))
    
    # Clear any existing handlers
    logger.handlers.clear()
    
    # Create formatters
    detailed_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
    )
    
    simple_formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Create file handler with rotation
    file_handler = logging.handlers.RotatingFileHandler(
        filename=log_path / 'dict_importer.log',
        maxBytes=max_file_size,
        backupCount=backup_count,
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(detailed_formatter)
    file_handler.addFilter(SensitiveDataFilter())
    
    # Create error file handler
    error_handler = logging.handlers.RotatingFileHandler(
        filename=log_path / 'dict_importer_error.log',
        maxBytes=max_file_size,
        backupCount=error_backup_count,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(detailed_formatter)
    error_handler.addFilter(SensitiveDataFilter())
    
    # Create console handler for development
    if os.getenv('ENVIRONMENT', 'development') != 'production':
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(simple_formatter)
        console_handler.addFilter(SensitiveDataFilter())
        logger.addHandler(console_handler)
    
    # Add handlers to logger
    logger.addHandler(file_handler)
    logger.addHandler(error_handler)
    
    # Prevent propagation to root logger
    logger.propagate = False
    
    return logger


def get_logger(name: str = 'dict_importer') -> logging.Logger:
    """Get a logger instance for a specific module."""
    return logging.getLogger(f'dict_importer.{name}')


# Structured logging methods
class StructuredLogger:
    """Structured logging helper for common operations."""
    
    def __init__(self, logger: logging.Logger):
        self.logger = logger
    
    def api_request(self, method: str, endpoint: str, **meta):
        """Log API request."""
        self.logger.info(f'API Request: {method} {endpoint}', extra={
            'type': 'api_request',
            'method': method,
            'endpoint': endpoint,
            **meta
        })
    
    def api_response(self, method: str, endpoint: str, status_code: int, response_time: float, **meta):
        """Log API response."""
        self.logger.info(f'API Response: {method} {endpoint} {status_code}', extra={
            'type': 'api_response',
            'method': method,
            'endpoint': endpoint,
            'status_code': status_code,
            'response_time': response_time,
            **meta
        })
    
    def file_operation(self, operation: str, file_path: str, **meta):
        """Log file operations."""
        self.logger.info(f'File {operation}: {file_path}', extra={
            'type': 'file_operation',
            'operation': operation,
            'file_path': file_path,
            **meta
        })
    
    def parsing_operation(self, operation: str, page_number: int, entries_count: int, **meta):
        """Log parsing operations."""
        self.logger.info(f'Parsing {operation}: Page {page_number}, {entries_count} entries', extra={
            'type': 'parsing',
            'operation': operation,
            'page_number': page_number,
            'entries_count': entries_count,
            **meta
        })
    
    def validation_operation(self, operation: str, valid_count: int, invalid_count: int, **meta):
        """Log validation operations."""
        self.logger.info(f'Validation {operation}: {valid_count} valid, {invalid_count} invalid', extra={
            'type': 'validation',
            'operation': operation,
            'valid_count': valid_count,
            'invalid_count': invalid_count,
            **meta
        })
    
    def performance(self, operation: str, duration: float, **meta):
        """Log performance metrics."""
        self.logger.info(f'Performance: {operation} took {duration:.3f}s', extra={
            'type': 'performance',
            'operation': operation,
            'duration': duration,
            **meta
        })
    
    def error_with_context(self, error: Exception, context: str, **meta):
        """Log error with context."""
        self.logger.error(f'Error in {context}: {str(error)}', extra={
            'type': 'error',
            'context': context,
            'error_type': type(error).__name__,
            'error_message': str(error),
            **meta
        }, exc_info=True)


# Global logger instance
logger = setup_logging()
structured_logger = StructuredLogger(logger)
