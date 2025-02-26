"""SQLAlchemy models for the Jira Analyzer application.

This module defines the database models used to store Jira configurations
and related data. It uses SQLAlchemy's declarative base system for model
definitions.
"""

from sqlalchemy import JSON, Column, Integer, String
from sqlalchemy.orm import DeclarativeBase


# Create a base class for models
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    pass


class JiraConfiguration(Base):
    """Database model for storing Jira instance configurations.

    This model stores the connection details and workflow configuration for
    a Jira instance. Each configuration includes authentication details,
    JQL queries, and workflow state definitions used for metrics calculations.

    Attributes:
        id (int): Primary key for the configuration.
        name (str): Unique name identifying this configuration.
        jira_server (str): URL of the Jira server.
        jira_email (str): Email address for Jira authentication.
        jira_api_token (str): API token for Jira authentication.
        jql_query (str): Default JQL query for fetching issues.
        workflow_states (List[str]): Ordered list of workflow states.
        lead_time_start_state (str): Starting state for lead time calculation.
        lead_time_end_state (str): Ending state for lead time calculation.
        cycle_time_start_state (str): Starting state for cycle time calculation.
        cycle_time_end_state (str): Ending state for cycle time calculation.
    """

    __tablename__ = 'jira_configurations'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    jira_server = Column(String, nullable=False)
    jira_email = Column(String, nullable=False)
    jira_api_token = Column(String, nullable=False)
    jql_query = Column(String, nullable=False)
    workflow_states = Column(JSON, nullable=False)  # List of states
    lead_time_start_state = Column(String, nullable=False)
    lead_time_end_state = Column(String, nullable=False)
    cycle_time_start_state = Column(String, nullable=False)
    cycle_time_end_state = Column(String, nullable=False)
