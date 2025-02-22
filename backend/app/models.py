from sqlalchemy import Column, Integer, String, JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class JiraConfiguration(Base):
    __tablename__ = "jira_configurations"

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
