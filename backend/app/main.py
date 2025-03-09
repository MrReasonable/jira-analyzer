"""FastAPI application for the Jira Analyzer.

This module implements the REST API endpoints for the Jira Analyzer application.
It provides functionality for managing Jira configurations and calculating various
metrics like lead time, cycle time, throughput, and cumulative flow diagrams.
"""

import os
import re
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from jira import JIRA
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import Settings, get_settings
from .database import get_session, init_db
from .logger import get_logger
from .metrics import (
    calculate_cfd,
    calculate_cycle_time,
    calculate_lead_time,
    calculate_throughput,
    calculate_wip,
)

# Import the mock Jira client
from .mock_jira import get_mock_jira_client
from .models import JiraConfiguration
from .schemas import JiraConfiguration as JiraConfigSchema
from .schemas import (
    JiraConfigurationCreate,
    JiraConfigurationList,
    JiraConfigurationUpdate,
)

# Check if we're running in test mode
USE_MOCK_JIRA = os.environ.get('USE_MOCK_JIRA', 'false').lower() == 'true'


# Create module-level logger
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for the FastAPI application.

    This handles startup and shutdown events for the application.
    On startup, it initializes the database by creating all required tables.
    """
    # Startup: Initialize the database
    logger.info('Starting application, initializing database')
    await init_db()
    logger.info('Database initialized successfully')
    yield
    # Shutdown: Add any cleanup code here if needed
    logger.info('Shutting down application')


# Use the lifespan context manager
app = FastAPI(
    lifespan=lifespan,
    title='Jira Analyzer API',
    description='API for analyzing Jira metrics and configurations',
    version='1.0.0',
    openapi_url='/openapi.json',  # Specify the OpenAPI schema URL
    docs_url='/docs',  # Specify the Swagger UI URL
    redoc_url='/redoc',  # Specify the ReDoc URL
)

# Set root path for OpenAPI (critical for proper documentation when behind a proxy)
app.root_path = '/api'

# Enable CORS
settings = get_settings()
logger.info(f'CORS configured with origins: {settings.cors_origins}')

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


async def get_jira_client(
    session: AsyncSession = Depends(get_session),
    config_name: Optional[str] = None,
) -> JIRA:
    """Create a JIRA client instance using a named configuration from the database.

    If USE_MOCK_JIRA environment variable is set to 'true', this will return a mock
    Jira client instead of connecting to the actual Jira API.

    Args:
        session: Database session for retrieving named configurations.
        config_name: Name of a stored Jira configuration to use.

    Returns:
        JIRA: Authenticated JIRA client instance or MockJira instance.

    Raises:
        HTTPException: If connection fails or named configuration is not found.
    """
    if not config_name:
        logger.warning('JIRA client request missing configuration name')
        raise HTTPException(
            status_code=400,
            detail='A configuration name is required. Please provide a valid configuration name.',
        )

    logger.debug(f'Creating JIRA client using configuration: {config_name}')

    # Use mock Jira client if in test mode
    if USE_MOCK_JIRA:
        logger.info(f'Using mock JIRA client for configuration: {config_name}')
        return await get_mock_jira_client(session, config_name)

    try:
        # Use named configuration
        stmt = select(JiraConfiguration).where(JiraConfiguration.name == config_name)
        result = await session.execute(stmt)
        config = result.scalar_one_or_none()
        if not config:
            logger.warning(f'Configuration not found: {config_name}')
            raise HTTPException(status_code=404, detail=f"Configuration '{config_name}' not found")

        logger.debug(f'Connecting to JIRA server: {config.jira_server}')
        jira_client = JIRA(
            server=str(config.jira_server),
            basic_auth=(str(config.jira_email), str(config.jira_api_token)),
        )
        logger.info(f'Successfully connected to JIRA using configuration: {config_name}')
        return jira_client
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f'Failed to connect to JIRA: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=f'Failed to connect to Jira: {str(e)}')


# Configuration endpoints
@app.post('/configurations', response_model=JiraConfigSchema)
async def create_configuration(
    config: JiraConfigurationCreate, session: AsyncSession = Depends(get_session)
):
    """Create a new Jira configuration.

    Args:
        config: Configuration data to create.
        session: Database session for the operation.

    Returns:
        JiraConfigSchema: The created configuration.

    Raises:
        HTTPException: If configuration creation fails.
    """
    logger.info(f'Creating new configuration: {config.name}')
    db_config = JiraConfiguration(**config.model_dump())
    session.add(db_config)
    try:
        await session.commit()
        await session.refresh(db_config)
        logger.info(f'Configuration created successfully: {config.name}')
        return db_config
    except Exception as e:
        await session.rollback()
        logger.error(f'Failed to create configuration: {str(e)}', exc_info=True)
        raise HTTPException(status_code=400, detail=f'Could not create configuration: {str(e)}')


@app.get('/configurations', response_model=List[JiraConfigurationList])
async def list_configurations(session: AsyncSession = Depends(get_session)):
    """List all Jira configurations.

    Args:
        session: Database session for the operation.

    Returns:
        List[JiraConfigurationList]: List of all stored configurations.
    """
    logger.info('Listing all configurations')
    stmt = select(JiraConfiguration)
    result = await session.execute(stmt)
    configs = result.scalars().all()
    logger.debug(f'Found {len(configs)} configurations')
    return configs


@app.get('/configurations/{name}', response_model=JiraConfigSchema)
async def get_configuration(name: str, session: AsyncSession = Depends(get_session)):
    """Retrieve a specific Jira configuration by name.

    Args:
        name: Name of the configuration to retrieve.
        session: Database session for the operation.

    Returns:
        JiraConfigSchema: The requested configuration.

    Raises:
        HTTPException: If configuration is not found.
    """
    logger.info(f'Getting configuration: {name}')
    stmt = select(JiraConfiguration).where(JiraConfiguration.name == name)
    result = await session.execute(stmt)
    config = result.scalar_one_or_none()
    if not config:
        logger.warning(f'Configuration not found: {name}')
        raise HTTPException(status_code=404, detail=f"Configuration '{name}' not found")
    logger.debug(f'Configuration found: {name}')
    return config


@app.put('/configurations/{name}', response_model=JiraConfigSchema)
async def update_configuration(
    name: str, config: JiraConfigurationUpdate, session: AsyncSession = Depends(get_session)
):
    """Update an existing Jira configuration.

    Args:
        name: Name of the configuration to update.
        config: New configuration data.
        session: Database session for the operation.

    Returns:
        JiraConfigSchema: The updated configuration.

    Raises:
        HTTPException: If configuration is not found or update fails.
    """
    logger.info(f'Updating configuration: {name}')
    stmt = select(JiraConfiguration).where(JiraConfiguration.name == name)
    result = await session.execute(stmt)
    db_config = result.scalar_one_or_none()
    if not db_config:
        logger.warning(f'Configuration not found: {name}')
        raise HTTPException(status_code=404, detail=f"Configuration '{name}' not found")

    for key, value in config.model_dump().items():
        setattr(db_config, key, value)

    try:
        await session.commit()
        await session.refresh(db_config)
        logger.info(f'Configuration updated successfully: {name}')
        return db_config
    except Exception as e:
        await session.rollback()
        logger.error(f'Failed to update configuration: {str(e)}', exc_info=True)
        raise HTTPException(status_code=400, detail=f'Could not update configuration: {str(e)}')


@app.delete('/configurations/{name}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_configuration(name: str, session: AsyncSession = Depends(get_session)):
    """Delete a Jira configuration.

    Args:
        name: Name of the configuration to delete.
        session: Database session for the operation.

    Raises:
        HTTPException: If configuration is not found or deletion fails.
    """
    logger.info(f'Deleting configuration: {name}')
    stmt = select(JiraConfiguration).where(JiraConfiguration.name == name)
    result = await session.execute(stmt)
    db_config = result.scalar_one_or_none()
    if not db_config:
        logger.warning(f'Configuration not found: {name}')
        raise HTTPException(status_code=404, detail=f"Configuration '{name}' not found")

    try:
        await session.delete(db_config)
        await session.commit()
        logger.info(f'Configuration deleted successfully: {name}')
    except Exception as e:
        await session.rollback()
        logger.error(f'Failed to delete configuration: {str(e)}', exc_info=True)
        raise HTTPException(status_code=400, detail=f'Could not delete configuration: {str(e)}')


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


@app.get('/metrics/lead-time')
async def get_lead_time(jql: str, jira: JIRA = Depends(get_jira_client)):
    """Calculate lead time metrics for issues matching the JQL query.

    Lead time is measured from issue creation to resolution.

    Args:
        jql: JQL query to select issues.
        jira: JIRA client instance.

    Returns:
        dict: Lead time statistics including average, median, min, max, and raw data.

    Raises:
        HTTPException: If the JIRA API request fails.
    """
    logger.info(f'Calculating lead time metrics with JQL: {jql}')
    try:
        # Validate and sanitize the JQL query
        sanitized_jql = validate_jql_query(jql)

        logger.debug('Fetching issues from JIRA')
        issues = jira.search_issues(
            sanitized_jql, maxResults=1000, fields=['created', 'resolutiondate']
        )
        logger.debug(f'Found {len(issues)} issues')

        logger.debug('Calculating lead time metrics')
        result = calculate_lead_time(list(issues))
        logger.info(
            f'Lead time calculation complete: avg={result.get("average")}, median={result.get("median")}'
        )
        return result
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f'Failed to calculate lead time: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/metrics/throughput')
async def get_throughput(jql: str, jira: JIRA = Depends(get_jira_client)):
    """Calculate throughput metrics for issues matching the JQL query.

    Throughput is measured as the number of issues completed per day.

    Args:
        jql: JQL query to select issues.
        jira: JIRA client instance.

    Returns:
        dict: Throughput data including dates, counts, and average.

    Raises:
        HTTPException: If the JIRA API request fails.
    """
    logger.info(f'Calculating throughput metrics with JQL: {jql}')
    try:
        # Validate and sanitize the JQL query
        sanitized_jql = validate_jql_query(jql)

        logger.debug('Fetching issues from JIRA')
        issues = jira.search_issues(
            sanitized_jql, maxResults=1000, fields=['created', 'resolutiondate', 'status']
        )
        logger.debug(f'Found {len(issues)} issues')

        logger.debug('Calculating throughput metrics')
        result = calculate_throughput(list(issues))
        logger.info(f'Throughput calculation complete: avg={result.get("average")}')
        return result
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f'Failed to calculate throughput: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/metrics/wip')
async def get_wip(
    jql: str, jira: JIRA = Depends(get_jira_client), settings: Settings = Depends(get_settings)
):
    """Calculate Work in Progress (WIP) metrics for issues matching the JQL query.

    WIP is counted as the number of issues in each status.

    Args:
        jql: JQL query to select issues.
        jira: JIRA client instance.
        settings: Application settings for workflow state configuration.

    Returns:
        dict: WIP data including status counts and total.

    Raises:
        HTTPException: If the JIRA API request fails.
    """
    logger.info(f'Calculating WIP metrics with JQL: {jql}')
    try:
        # Validate and sanitize the JQL query
        sanitized_jql = validate_jql_query(jql)

        logger.debug('Fetching issues from JIRA')
        issues = jira.search_issues(sanitized_jql, maxResults=1000, fields=['status'])
        logger.debug(f'Found {len(issues)} issues')

        workflow_states = settings.workflow_states if hasattr(settings, 'workflow_states') else None
        logger.debug(f'Using workflow states: {workflow_states}')

        logger.debug('Calculating WIP metrics')
        result = calculate_wip(list(issues), workflow_states)
        logger.info(f'WIP calculation complete: total={result.get("total")}')
        return result
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f'Failed to calculate WIP: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/metrics/cycle-time')
async def get_cycle_time(
    jql: str, jira: JIRA = Depends(get_jira_client), settings: Settings = Depends(get_settings)
):
    """Calculate cycle time metrics for issues matching the JQL query.

    Cycle time is measured from when work begins (entering start state)
    to completion (entering end state).

    Args:
        jql: JQL query to select issues.
        jira: JIRA client instance.
        settings: Application settings for cycle time state configuration.

    Returns:
        dict: Cycle time statistics including average, median, min, max, and raw data.

    Raises:
        HTTPException: If the JIRA API request fails.
    """
    logger.info(f'Calculating cycle time metrics with JQL: {jql}')
    try:
        # Validate and sanitize the JQL query
        sanitized_jql = validate_jql_query(jql)

        logger.debug('Fetching issues from JIRA with changelog')
        issues = jira.search_issues(
            sanitized_jql,
            maxResults=1000,
            fields=['created', 'resolutiondate', 'status', 'changelog'],
            expand='changelog',
        )
        logger.debug(f'Found {len(issues)} issues')

        start_state = (
            settings.cycle_time_start_state
            if hasattr(settings, 'cycle_time_start_state')
            else 'In Progress'
        )
        end_state = (
            settings.cycle_time_end_state if hasattr(settings, 'cycle_time_end_state') else 'Done'
        )
        logger.debug(f'Using cycle time states: start={start_state}, end={end_state}')

        logger.debug('Calculating cycle time metrics')
        result = calculate_cycle_time(list(issues), start_state, end_state)

        # Add state information to the result
        if 'error' not in result:
            result['start_state'] = start_state
            result['end_state'] = end_state
            logger.info(
                f'Cycle time calculation complete: avg={result.get("average")}, median={result.get("median")}'
            )
        else:
            result['start_state'] = start_state
            result['end_state'] = end_state
            logger.warning(f'Cycle time calculation returned error: {result.get("error")}')

        return result
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f'Failed to calculate cycle time: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/metrics/cfd')
async def get_cfd(
    jql: str, jira: JIRA = Depends(get_jira_client), settings: Settings = Depends(get_settings)
):
    """Generate Cumulative Flow Diagram (CFD) data for issues matching the JQL query.

    The CFD shows the number of issues in each status over time, with a 30-day
    window. The data is cumulative, showing the total number of issues that have
    passed through each status.

    Args:
        jql: JQL query to select issues.
        jira: JIRA client instance.
        settings: Application settings for workflow state configuration.

    Returns:
        dict: CFD data including status list and cumulative counts per date.

    Raises:
        HTTPException: If the JIRA API request fails.
    """
    logger.info(f'Generating CFD data with JQL: {jql}')
    try:
        # Validate and sanitize the JQL query
        sanitized_jql = validate_jql_query(jql)

        logger.debug('Fetching issues from JIRA')
        issues = jira.search_issues(
            sanitized_jql,
            maxResults=1000,
            fields=['status', 'created', 'resolutiondate'],
        )
        logger.debug(f'Found {len(issues)} issues')

        workflow_states = settings.workflow_states if hasattr(settings, 'workflow_states') else None
        period_days = 30  # Default to 30 days
        logger.debug(f'Using workflow states: {workflow_states}, period: {period_days} days')

        logger.debug('Calculating CFD data')
        result = calculate_cfd(list(issues), workflow_states, period_days)

        # Convert to the expected format for the frontend
        if 'data' in result and 'dates' in result:
            statuses = list(result['data'][0].keys()) if result['data'] else []
            cumulative_data = []

            for i, date in enumerate(result['dates']):
                data_point = {'date': date}
                for status in statuses:
                    data_point[status] = result['data'][i][status]
                cumulative_data.append(data_point)

            logger.info(
                f'CFD calculation complete: {len(statuses)} statuses, {len(result["dates"])} dates'
            )
            return {'statuses': statuses, 'data': cumulative_data}

        logger.warning('CFD calculation returned unexpected format')
        return result
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f'Failed to generate CFD: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == '__main__':
    import uvicorn

    settings = get_settings()
    logger.info(f'Starting server on {settings.host}:{settings.port}')
    uvicorn.run(app, host=settings.host, port=settings.port)
