from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: List[str] = ["http://localhost:5173"]  # Default Vite dev server
    
    # Jira Configuration
    jira_server: str
    jira_email: str
    jira_api_token: str
    jql_query: str = "project = PROJ AND type = Story"  # Default JQL
    workflow_states: List[str] = ["Backlog", "In Progress", "Done"]  # Default workflow
    lead_time_start_state: str = "Backlog"
    lead_time_end_state: str = "Done"
    cycle_time_start_state: str = "In Progress"
    cycle_time_end_state: str = "Done"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
