"""Pydantic schemas for the Jira Analyzer application.

This module defines the Pydantic models used for request/response validation
and serialization. These schemas ensure type safety and data validation for
the API endpoints.
"""

from typing import Generic, List, TypeVar

from pydantic import BaseModel, Field

# Define a generic type variable for use with PaginatedResponse
T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic schema for paginated responses.

    This model is used for endpoints that return paginated lists of items.
    It includes metadata about the pagination state along with the items.

    Attributes:
        items: List of items of type T.
        total: Total number of items available.
        skip: Number of items skipped (for pagination).
        limit: Maximum number of items returned (for pagination).
    """

    items: List[T] = Field(..., description='List of items')
    total: int = Field(..., description='Total number of items available')
    skip: int = Field(..., description='Number of items skipped')
    limit: int = Field(..., description='Maximum number of items returned')


class JiraCredentials(BaseModel):
    """Schema for validating Jira credentials.

    This model is used for the first step of configuration where only
    credentials are validated without requiring project selection.
    """

    name: str = Field(..., description='Unique name for this configuration')
    jira_server: str = Field(..., description='Jira server URL')
    jira_email: str = Field(..., description='Jira email/username')
    jira_api_token: str = Field(..., description='Jira API token')


class CredentialsResponse(BaseModel):
    """Response schema for the credentials validation endpoint.

    The JWT token is set as an HTTP-only cookie and not included in the response body.
    """

    status: str = Field(..., description='Status of the validation')
    message: str = Field(..., description='Success or error message')


class JiraConfigurationBase(BaseModel):
    """Base Pydantic model for Jira configuration data.

    This model defines the common fields shared by all Jira configuration
    schemas. It includes fields for connection details and workflow settings.
    """

    name: str = Field(..., description='Unique name for this configuration')
    jira_server: str = Field(..., description='Jira server URL')
    jira_email: str = Field(..., description='Jira email/username')
    jira_api_token: str = Field(..., description='Jira API token')
    jql_query: str = Field(..., description='Default JQL query')
    project_key: str = Field(..., description='Selected Jira project key')
    workflow_states: List[str] = Field(..., description='List of workflow states')
    lead_time_start_state: str = Field(..., description='Starting state for lead time')
    lead_time_end_state: str = Field(..., description='Ending state for lead time')
    cycle_time_start_state: str = Field(..., description='Starting state for cycle time')
    cycle_time_end_state: str = Field(..., description='Ending state for cycle time')


class JiraConfigurationCreate(JiraConfigurationBase):
    """Schema for creating a new Jira configuration.

    Inherits all fields from JiraConfigurationBase without modification.
    Used for validating POST requests to create new configurations.
    """

    pass


class JiraConfigurationUpdate(JiraConfigurationBase):
    """Schema for updating an existing Jira configuration.

    Inherits all fields from JiraConfigurationBase without modification.
    Used for validating PUT requests to update existing configurations.
    """

    pass


class JiraConfiguration(JiraConfigurationBase):
    """Complete Jira configuration schema including database ID.

    Extends the base configuration schema to include the database ID.
    Used for responses when returning complete configuration details.
    """

    id: int

    model_config = {'from_attributes': True}


class JiraConfigurationList(BaseModel):
    """Simplified Jira configuration schema for list views.

    Contains only the essential fields needed for displaying configurations
    in a list format, omitting sensitive details like API tokens.
    """

    name: str
    jira_server: str
    jira_email: str

    model_config = {'from_attributes': True}
