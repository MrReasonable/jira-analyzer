"""Test-only administrative endpoints.

This module defines endpoints that are ONLY used for testing purposes.
These endpoints are not registered in production environments.
"""

from fastapi import APIRouter, HTTPException, Query, Request, status

from ..fixtures import get_available_fixtures, is_test_environment, load_fixture
from ..logger import get_logger

logger = get_logger(__name__)

router = APIRouter(
    prefix='/admin/test',
    tags=['Testing'],
)


def _verify_test_environment(request: Request):
    """Verify that we're running in a test environment and have the test header.

    Args:
        request: The FastAPI request object.

    Raises:
        HTTPException: If not in a test environment or missing the test header.
    """
    # Check if we're in a test environment
    if not is_test_environment():
        logger.error('Test endpoint accessed in non-test environment')
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='This endpoint is only available in test environments',
        )

    # Check for test header
    if request.headers.get('x-test-request') != 'true':
        logger.warning('Test endpoint accessed without test header')
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Invalid request')


@router.post(
    '/fixtures/load',
    status_code=status.HTTP_200_OK,
    summary='Load a test fixture',
    description='Loads a predefined fixture into the database for testing purposes. '
    'This endpoint is only available in test environments.',
    response_description='Result of the fixture loading operation',
    response_model=None,
    responses={
        401: {'description': 'Unauthorized, admin credentials required'},
        403: {'description': 'Forbidden, only available in test environments'},
        404: {'description': 'Fixture not found'},
        500: {'description': 'Error loading fixture'},
    },
)
async def load_test_fixture(
    request: Request,
    fixture: str = Query(..., description='ID of the fixture to load'),
    clear_existing: bool = Query(True, description='Clear existing data before loading fixture'),
):
    """Load a test fixture.

    This endpoint is only available in test environments.
    It loads a predefined fixture into the database to set up a specific test scenario.

    Args:
        request: The FastAPI request object.
        fixture: ID of the fixture to load.
        clear_existing: Whether to clear existing data before loading the fixture.

    Returns:
        dict: Result of the fixture loading operation.

    Raises:
        HTTPException: If not in a test environment or if the fixture loading fails.
    """
    # Verify we're in a test environment
    _verify_test_environment(request)

    # Load the fixture
    result = await load_fixture(fixture, {'clear_existing': clear_existing})

    if not result['success']:
        status_code = (
            status.HTTP_404_NOT_FOUND
            if 'not found' in result.get('error', '')
            else status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        raise HTTPException(
            status_code=status_code,
            detail=result.get('error', 'Unknown error loading fixture'),
        )

    logger.info(f'Fixture loaded successfully: {fixture}')
    return {
        'status': 'success',
        'message': f'Fixture loaded: {fixture}',
        'result': result.get('result', {}),
    }


@router.get(
    '/fixtures/list',
    status_code=status.HTTP_200_OK,
    summary='List available test fixtures',
    description='Lists all available test fixtures that can be loaded. '
    'This endpoint is only available in test environments.',
    response_description='List of available fixtures',
    response_model=None,
)
async def list_fixtures(request: Request):
    """List available test fixtures.

    This endpoint is only available in test environments.

    Args:
        request: The FastAPI request object.

    Returns:
        dict: List of available fixtures.

    Raises:
        HTTPException: If not in a test environment.
    """
    # Verify we're in a test environment
    _verify_test_environment(request)

    # Get available fixtures
    fixtures = get_available_fixtures()
    return {'fixtures': fixtures}
