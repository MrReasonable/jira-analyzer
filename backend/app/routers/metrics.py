"""Metrics endpoints for the Jira Analyzer API.

This module defines the metrics endpoints for the API, which calculate
various metrics for Jira issues.
"""

from typing import Optional

from dependency_injector.wiring import inject
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials

from ..auth import security
from ..config import Settings, get_settings
from ..dependencies import get_jira_client_service
from ..logger import get_logger
from ..metrics import (
    calculate_cfd,
    calculate_cycle_time,
    calculate_lead_time,
    calculate_throughput,
    calculate_wip,
)
from ..services.caching import cache_result
from ..services.jira_client_service import JiraClientService
from ..services.jql_validator import validate_jql_query

# Create module-level logger
logger = get_logger(__name__)

# Create router
router = APIRouter(
    prefix='/metrics',
    tags=['Metrics'],
)


@router.get(
    '/lead-time',
    summary='Calculate lead time metrics',
    description='Calculates lead time metrics for issues matching the provided JQL query. '
    'Lead time is measured from issue creation to resolution.',
    response_description='Lead time statistics including average, median, min, max, and raw data',
    responses={
        400: {'description': 'Invalid JQL query or missing configuration name'},
        500: {'description': 'Failed to calculate lead time'},
    },
)
@cache_result(
    namespace='metrics', key_func=lambda *args, **kwargs: f'lead_time:{kwargs.get("jql", "")}'
)
@inject
async def get_lead_time(
    jql: str,
    request: Request,
    config_name: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings: Settings = Depends(get_settings),
    jira_client_service: JiraClientService = Depends(get_jira_client_service),
):
    """Calculate lead time metrics for issues matching the JQL query.

    Lead time is measured from issue creation to resolution.

    Args:
        jql: JQL query to select issues.
        request: The FastAPI request object.
        config_name: Name of the Jira configuration to use.
        credentials: HTTP authorization credentials from the request.
        settings: Application settings.
        jira_client_service: Service for creating Jira client instances.

    Returns:
        dict: Lead time statistics including average, median, min, max, and raw data.

    Raises:
        HTTPException: If the JIRA API request fails.
    """
    logger.info(f'Calculating lead time metrics with JQL: {jql}')
    try:
        # Get the JIRA client from the service
        jira = await jira_client_service.get_client_from_auth(
            request, credentials, settings, config_name
        )

        # Validate and sanitize the JQL query
        sanitized_jql = validate_jql_query(jql)

        logger.debug('Fetching issues from JIRA')
        try:
            issues = jira.search_issues(
                sanitized_jql, maxResults=1000, fields=['created', 'resolutiondate']
            )
            logger.debug(f'Found {len(issues)} issues')
        except Exception as e:
            logger.error(f'Failed to fetch issues from JIRA: {str(e)}', exc_info=True)
            raise HTTPException(status_code=500, detail=f'JIRA API error: {str(e)}')

        logger.debug('Calculating lead time metrics')
        result = calculate_lead_time(list(issues))

        # Check if there was an error in the calculation
        if 'error' in result:
            logger.warning(f'Lead time calculation returned error: {result["error"]}')
            return result

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


@router.get(
    '/throughput',
    summary='Calculate throughput metrics',
    description='Calculates throughput metrics for issues matching the provided JQL query. '
    'Throughput is measured as the number of issues completed per day.',
    response_description='Throughput data including dates, counts, and average',
    responses={
        400: {'description': 'Invalid JQL query or missing configuration name'},
        500: {'description': 'Failed to calculate throughput'},
    },
)
@cache_result(
    namespace='metrics', key_func=lambda *args, **kwargs: f'throughput:{kwargs.get("jql", "")}'
)
@inject
async def get_throughput(
    jql: str,
    request: Request,
    config_name: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings: Settings = Depends(get_settings),
    jira_client_service: JiraClientService = Depends(get_jira_client_service),
):
    """Calculate throughput metrics for issues matching the JQL query.

    Throughput is measured as the number of issues completed per day.

    Args:
        jql: JQL query to select issues.
        request: The FastAPI request object.
        config_name: Name of the Jira configuration to use.
        credentials: HTTP authorization credentials from the request.
        settings: Application settings.
        jira_client_service: Service for creating Jira client instances.

    Returns:
        dict: Throughput data including dates, counts, and average.

    Raises:
        HTTPException: If the JIRA API request fails.
    """
    logger.info(f'Calculating throughput metrics with JQL: {jql}')
    try:
        # Get the JIRA client from the service
        jira = await jira_client_service.get_client_from_auth(
            request, credentials, settings, config_name
        )

        # Validate and sanitize the JQL query
        sanitized_jql = validate_jql_query(jql)

        logger.debug('Fetching issues from JIRA')
        try:
            issues = jira.search_issues(
                sanitized_jql, maxResults=1000, fields=['created', 'resolutiondate', 'status']
            )
            logger.debug(f'Found {len(issues)} issues')
        except Exception as e:
            logger.error(f'Failed to fetch issues from JIRA: {str(e)}', exc_info=True)
            raise HTTPException(status_code=500, detail=f'JIRA API error: {str(e)}')

        logger.debug('Calculating throughput metrics')
        result = calculate_throughput(list(issues))

        # Check if there was an error in the calculation
        if 'error' in result:
            logger.warning(f'Throughput calculation returned error: {result["error"]}')
            return result

        logger.info(f'Throughput calculation complete: avg={result.get("average")}')
        return result
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f'Failed to calculate throughput: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    '/wip',
    summary='Calculate Work in Progress (WIP) metrics',
    description='Calculates WIP metrics for issues matching the provided JQL query. '
    'WIP is counted as the number of issues in each status.',
    response_description='WIP data including status counts and total',
    responses={
        400: {'description': 'Invalid JQL query or missing configuration name'},
        500: {'description': 'Failed to calculate WIP'},
    },
)
@cache_result(namespace='metrics', key_func=lambda *args, **kwargs: f'wip:{kwargs.get("jql", "")}')
@inject
async def get_wip(
    jql: str,
    request: Request,
    config_name: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings: Settings = Depends(get_settings),
    jira_client_service: JiraClientService = Depends(get_jira_client_service),
):
    """Calculate Work in Progress (WIP) metrics for issues matching the JQL query.

    WIP is counted as the number of issues in each status.

    Args:
        jql: JQL query to select issues.
        request: The FastAPI request object.
        config_name: Name of the Jira configuration to use.
        credentials: HTTP authorization credentials from the request.
        settings: Application settings for workflow state configuration.
        jira_client_service: Service for creating Jira client instances.

    Returns:
        dict: WIP data including status counts and total.

    Raises:
        HTTPException: If the JIRA API request fails.
    """
    logger.info(f'Calculating WIP metrics with JQL: {jql}')
    try:
        # Get the JIRA client from the service
        jira = await jira_client_service.get_client_from_auth(
            request, credentials, settings, config_name
        )

        # Validate and sanitize the JQL query
        sanitized_jql = validate_jql_query(jql)

        logger.debug('Fetching issues from JIRA')
        try:
            issues = jira.search_issues(sanitized_jql, maxResults=1000, fields=['status'])
            logger.debug(f'Found {len(issues)} issues')
        except Exception as e:
            logger.error(f'Failed to fetch issues from JIRA: {str(e)}', exc_info=True)
            raise HTTPException(status_code=500, detail=f'JIRA API error: {str(e)}')

        workflow_states = settings.workflow_states if hasattr(settings, 'workflow_states') else None
        logger.debug(f'Using workflow states: {workflow_states}')

        logger.debug('Calculating WIP metrics')
        result = calculate_wip(list(issues), workflow_states)

        # Check if there was an error in the calculation
        if 'error' in result:
            logger.warning(f'WIP calculation returned error: {result["error"]}')
            return result

        logger.info(f'WIP calculation complete: total={result.get("total")}')
        return result
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f'Failed to calculate WIP: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    '/cycle-time',
    summary='Calculate cycle time metrics',
    description='Calculates cycle time metrics for issues matching the provided JQL query. '
    'Cycle time is measured from when work begins (entering start state) '
    'to completion (entering end state).',
    response_description='Cycle time statistics including average, median, min, max, and raw data',
    responses={
        400: {'description': 'Invalid JQL query or missing configuration name'},
        500: {'description': 'Failed to calculate cycle time'},
    },
)
@cache_result(
    namespace='metrics', key_func=lambda *args, **kwargs: f'cycle_time:{kwargs.get("jql", "")}'
)
@inject
async def get_cycle_time(
    jql: str,
    request: Request,
    config_name: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings: Settings = Depends(get_settings),
    jira_client_service: JiraClientService = Depends(get_jira_client_service),
):
    """Calculate cycle time metrics for issues matching the JQL query.

    Cycle time is measured from when work begins (entering start state)
    to completion (entering end state).

    Args:
        jql: JQL query to select issues.
        request: The FastAPI request object.
        config_name: Name of the Jira configuration to use.
        credentials: HTTP authorization credentials from the request.
        settings: Application settings for cycle time state configuration.
        jira_client_service: Service for creating Jira client instances.

    Returns:
        dict: Cycle time statistics including average, median, min, max, and raw data.

    Raises:
        HTTPException: If the JIRA API request fails.
    """
    logger.info(f'Calculating cycle time metrics with JQL: {jql}')
    try:
        # Get the JIRA client from the service
        jira = await jira_client_service.get_client_from_auth(
            request, credentials, settings, config_name
        )

        # Validate and sanitize the JQL query
        sanitized_jql = validate_jql_query(jql)

        logger.debug('Fetching issues from JIRA with changelog')
        try:
            issues = jira.search_issues(
                sanitized_jql,
                maxResults=1000,
                fields=['created', 'resolutiondate', 'status', 'changelog'],
                expand='changelog',
            )
            logger.debug(f'Found {len(issues)} issues')
        except Exception as e:
            logger.error(f'Failed to fetch issues from JIRA: {str(e)}', exc_info=True)
            raise HTTPException(status_code=500, detail=f'JIRA API error: {str(e)}')

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


@router.get(
    '/cfd',
    summary='Generate Cumulative Flow Diagram (CFD) data',
    description='Generates CFD data for issues matching the provided JQL query. '
    'The CFD shows the number of issues in each status over time, with a 30-day '
    'window. The data is cumulative, showing the total number of issues that have '
    'passed through each status.',
    response_description='CFD data including status list and cumulative counts per date',
    responses={
        400: {'description': 'Invalid JQL query or missing configuration name'},
        500: {'description': 'Failed to generate CFD'},
    },
)
@cache_result(namespace='metrics', key_func=lambda *args, **kwargs: f'cfd:{kwargs.get("jql", "")}')
@inject
async def get_cfd(
    jql: str,
    request: Request,
    config_name: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings: Settings = Depends(get_settings),
    jira_client_service: JiraClientService = Depends(get_jira_client_service),
):
    """Generate Cumulative Flow Diagram (CFD) data for issues matching the JQL query.

    The CFD shows the number of issues in each status over time, with a 30-day
    window. The data is cumulative, showing the total number of issues that have
    passed through each status.

    Args:
        jql: JQL query to select issues.
        request: The FastAPI request object.
        config_name: Name of the Jira configuration to use.
        credentials: HTTP authorization credentials from the request.
        settings: Application settings for workflow state configuration.
        jira_client_service: Service for creating Jira client instances.

    Returns:
        dict: CFD data including status list and cumulative counts per date.

    Raises:
        HTTPException: If the JIRA API request fails.
    """
    logger.info(f'Generating CFD data with JQL: {jql}')
    try:
        # Get the JIRA client from the service
        jira = await jira_client_service.get_client_from_auth(
            request, credentials, settings, config_name
        )

        # Validate and sanitize the JQL query
        sanitized_jql = validate_jql_query(jql)

        logger.debug('Fetching issues from JIRA')
        try:
            issues = jira.search_issues(
                sanitized_jql,
                maxResults=1000,
                fields=['status', 'created', 'resolutiondate'],
            )
            logger.debug(f'Found {len(issues)} issues')
        except Exception as e:
            logger.error(f'Failed to fetch issues from JIRA: {str(e)}', exc_info=True)
            raise HTTPException(status_code=500, detail=f'JIRA API error: {str(e)}')

        workflow_states = settings.workflow_states if hasattr(settings, 'workflow_states') else None
        period_days = 30  # Default to 30 days
        logger.debug(f'Using workflow states: {workflow_states}, period: {period_days} days')

        logger.debug('Calculating CFD data')
        result = calculate_cfd(list(issues), workflow_states, period_days)

        # Check if there was an error in the calculation
        if 'error' in result:
            logger.warning(f'CFD calculation returned error: {result["error"]}')
            return result

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
