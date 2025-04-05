"""JQL query validation and sanitization.

This module provides functions for validating and sanitizing JQL queries
to prevent injection attacks and handle invalid syntax.
"""

import re

from fastapi import HTTPException

from ..logger import get_logger

# Create module-level logger
logger = get_logger(__name__)


def validate_jql_query(jql: str) -> str:
    """Validate and sanitize a JQL query to prevent injection attacks and handle invalid syntax.

    Args:
        jql: The JQL query to validate.

    Returns:
        str: The sanitized JQL query.

    Raises:
        HTTPException: If the JQL query is invalid or contains disallowed patterns.
    """
    # Handle empty queries
    if not jql or jql.strip() == '':
        logger.warning('Empty JQL query provided')
        return jql  # Return as is, will be handled by the metrics calculation

    # Check for semicolons which could be used for injection
    if ';' in jql:
        logger.warning(f'JQL injection attempt detected: {jql}')
        raise HTTPException(
            status_code=400,
            detail='Invalid JQL query: Semicolons (;) are not allowed in JQL queries.',
        )

    # Check for other suspicious patterns that might indicate injection attempts
    suspicious_patterns = [
        r'DROP\s+TABLE',
        r'DELETE\s+FROM',
        r'INSERT\s+INTO',
        r'UPDATE\s+.*\s+SET',
        r'UNION\s+SELECT',
        r"'\s*OR\s*'\s*[0-9a-zA-Z]+\s*'='",  # Pattern like ' OR '1'='1
    ]

    for pattern in suspicious_patterns:
        if re.search(pattern, jql, re.IGNORECASE):
            logger.warning(f'JQL injection attempt detected: {jql}')
            raise HTTPException(
                status_code=400,
                detail='Invalid JQL query: The query contains suspicious patterns that are not allowed.',
            )

    # Basic syntax validation for common JQL errors
    # Check for incomplete expressions like "project = " without a value
    incomplete_expr_pattern = r'=\s*$'
    if re.search(incomplete_expr_pattern, jql):
        logger.warning(f'Invalid JQL syntax detected: {jql}')
        raise HTTPException(
            status_code=400,
            detail='Invalid JQL query: Incomplete expression. Expected a value after the operator.',
        )

    return jql
