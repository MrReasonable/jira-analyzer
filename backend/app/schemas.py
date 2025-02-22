from typing import List
from pydantic import BaseModel, Field

class JiraConfigurationBase(BaseModel):
    name: str = Field(..., description="Unique name for this configuration")
    jira_server: str = Field(..., description="Jira server URL")
    jira_email: str = Field(..., description="Jira email/username")
    jira_api_token: str = Field(..., description="Jira API token")
    jql_query: str = Field(..., description="Default JQL query")
    workflow_states: List[str] = Field(..., description="List of workflow states")
    lead_time_start_state: str = Field(..., description="Starting state for lead time")
    lead_time_end_state: str = Field(..., description="Ending state for lead time")
    cycle_time_start_state: str = Field(..., description="Starting state for cycle time")
    cycle_time_end_state: str = Field(..., description="Ending state for cycle time")

class JiraConfigurationCreate(JiraConfigurationBase):
    pass

class JiraConfigurationUpdate(JiraConfigurationBase):
    pass

class JiraConfiguration(JiraConfigurationBase):
    id: int

    class Config:
        from_attributes = True

class JiraConfigurationList(BaseModel):
    name: str
    jira_server: str
    jira_email: str

    class Config:
        from_attributes = True
