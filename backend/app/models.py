"""SQLAlchemy models for the Jira Analyzer application.

This module defines the database models used to store Jira configurations
and related data. It uses SQLAlchemy's declarative base system for model
definitions.
"""

from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import DeclarativeBase, relationship


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
    project_key = Column(String, nullable=False)  # Selected Jira project key
    workflow_states = Column(JSON, nullable=False)  # List of states
    lead_time_start_state = Column(String, nullable=False)
    lead_time_end_state = Column(String, nullable=False)
    cycle_time_start_state = Column(String, nullable=False)
    cycle_time_end_state = Column(String, nullable=False)

    # Relationships
    metrics_analyses = relationship(
        'MetricsAnalysis', back_populates='configuration', cascade='all, delete-orphan'
    )


class MetricsAnalysis(Base):
    """Database model for storing metrics analysis results.

    This model stores the results of metrics calculations for a specific
    configuration, time period, and JQL query. It includes the raw metrics
    data as well as metadata about when the analysis was performed.

    Attributes:
        id (str): Primary key for the analysis (UUID).
        configuration_id (int): Foreign key to the JiraConfiguration.
        start_date (datetime): Start date for the analysis period.
        end_date (datetime): End date for the analysis period.
        jql_query (str): JQL query used for this analysis.
        created_at (datetime): When this analysis was created.
        updated_at (datetime): When this analysis was last updated.
        metrics_data (JSON): Raw metrics data from the analysis.
    """

    __tablename__ = 'metrics_analyses'

    id = Column(String, primary_key=True, index=True)
    configuration_id = Column(Integer, ForeignKey('jira_configurations.id'), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    jql_query = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)
    metrics_data = Column(JSON, nullable=False)

    # Relationships
    configuration = relationship('JiraConfiguration', back_populates='metrics_analyses')
