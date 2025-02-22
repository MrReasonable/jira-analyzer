 from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from jira import JIRA
from datetime import datetime, timedelta
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .config import get_settings, Settings
from .database import get_session, init_db
from .models import JiraConfiguration
from .schemas import (
    JiraConfigurationCreate,
    JiraConfigurationUpdate,
    JiraConfiguration as JiraConfigSchema,
    JiraConfigurationList
)
from typing import List, Dict, Any
import json

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    await init_db()

# Enable CORS
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_jira_client(
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(get_session),
    config_name: str = None
) -> JIRA:
    try:
        if config_name:
            # Use named configuration
            stmt = select(JiraConfiguration).where(JiraConfiguration.name == config_name)
            result = await session.execute(stmt)
            config = result.scalar_one_or_none()
            if not config:
                raise HTTPException(
                    status_code=404,
                    detail=f"Configuration '{config_name}' not found"
                )
            return JIRA(
                server=config.jira_server,
                basic_auth=(config.jira_email, config.jira_api_token)
            )
        else:
            # Use default settings
            return JIRA(
                server=settings.jira_server,
                basic_auth=(settings.jira_email, settings.jira_api_token)
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to Jira: {str(e)}")

# Configuration endpoints
@app.post("/api/configurations", response_model=JiraConfigSchema)
async def create_configuration(
    config: JiraConfigurationCreate,
    session: AsyncSession = Depends(get_session)
):
    db_config = JiraConfiguration(**config.model_dump())
    session.add(db_config)
    try:
        await session.commit()
        await session.refresh(db_config)
        return db_config
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Could not create configuration: {str(e)}"
        )

@app.get("/api/configurations", response_model=List[JiraConfigurationList])
async def list_configurations(session: AsyncSession = Depends(get_session)):
    stmt = select(JiraConfiguration)
    result = await session.execute(stmt)
    return result.scalars().all()

@app.get("/api/configurations/{name}", response_model=JiraConfigSchema)
async def get_configuration(name: str, session: AsyncSession = Depends(get_session)):
    stmt = select(JiraConfiguration).where(JiraConfiguration.name == name)
    result = await session.execute(stmt)
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(
            status_code=404,
            detail=f"Configuration '{name}' not found"
        )
    return config

@app.put("/api/configurations/{name}", response_model=JiraConfigSchema)
async def update_configuration(
    name: str,
    config: JiraConfigurationUpdate,
    session: AsyncSession = Depends(get_session)
):
    stmt = select(JiraConfiguration).where(JiraConfiguration.name == name)
    result = await session.execute(stmt)
    db_config = result.scalar_one_or_none()
    if not db_config:
        raise HTTPException(
            status_code=404,
            detail=f"Configuration '{name}' not found"
        )
    
    for key, value in config.model_dump().items():
        setattr(db_config, key, value)
    
    try:
        await session.commit()
        await session.refresh(db_config)
        return db_config
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Could not update configuration: {str(e)}"
        )

@app.delete("/api/configurations/{name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_configuration(name: str, session: AsyncSession = Depends(get_session)):
    stmt = select(JiraConfiguration).where(JiraConfiguration.name == name)
    result = await session.execute(stmt)
    db_config = result.scalar_one_or_none()
    if not db_config:
        raise HTTPException(
            status_code=404,
            detail=f"Configuration '{name}' not found"
        )
    
    try:
        await session.delete(db_config)
        await session.commit()
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Could not delete configuration: {str(e)}"
        )

@app.get("/api/metrics/lead-time")
async def get_lead_time(jql: str, jira: JIRA = Depends(get_jira_client)):
    try:
        issues = jira.search_issues(jql, maxResults=1000, fields=['created', 'resolutiondate'])
        lead_times = []
        
        for issue in issues:
            if hasattr(issue.fields, 'resolutiondate') and issue.fields.resolutiondate:
                created = datetime.strptime(issue.fields.created[:10], '%Y-%m-%d')
                resolved = datetime.strptime(issue.fields.resolutiondate[:10], '%Y-%m-%d')
                lead_time = (resolved - created).days
                lead_times.append(lead_time)
        
        if lead_times:
            return {
                "average": sum(lead_times) / len(lead_times),
                "median": sorted(lead_times)[len(lead_times)//2],
                "min": min(lead_times),
                "max": max(lead_times),
                "data": lead_times
            }
        return {"error": "No completed issues found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metrics/throughput")
async def get_throughput(jql: str, jira: JIRA = Depends(get_jira_client)):
    try:
        issues = jira.search_issues(jql, maxResults=1000, fields=['resolutiondate'])
        dates = {}
        
        for issue in issues:
            if hasattr(issue.fields, 'resolutiondate') and issue.fields.resolutiondate:
                date = issue.fields.resolutiondate[:10]
                dates[date] = dates.get(date, 0) + 1
        
        # Convert to time series
        df = pd.Series(dates).sort_index()
        return {
            "dates": list(df.index),
            "counts": list(df.values),
            "average": df.mean()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metrics/wip")
async def get_wip(jql: str, jira: JIRA = Depends(get_jira_client)):
    try:
        issues = jira.search_issues(jql, maxResults=1000, fields=['status'])
        status_counts = {}
        
        for issue in issues:
            status = issue.fields.status.name
            status_counts[status] = status_counts.get(status, 0) + 1
            
        return {
            "status": list(status_counts.keys()),
            "counts": list(status_counts.values()),
            "total": sum(status_counts.values())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metrics/cycle-time")
async def get_cycle_time(jql: str, jira: JIRA = Depends(get_jira_client), settings: Settings = Depends(get_settings)):
    try:
        issues = jira.search_issues(
            jql,
            maxResults=1000,
            fields=['created', 'resolutiondate', 'status', 'changelog'],
            expand='changelog'
        )
        cycle_times = []
        
        for issue in issues:
            if not hasattr(issue.fields, 'resolutiondate') or not issue.fields.resolutiondate:
                continue
                
            # Get all status changes from changelog
            status_changes = []
            for history in issue.changelog.histories:
                for item in history.items:
                    if item.field == 'status':
                        status_changes.append({
                            'date': datetime.strptime(history.created[:19], '%Y-%m-%dT%H:%M:%S'),
                            'from_status': item.fromString,
                            'to_status': item.toString
                        })
            
            # Sort changes by date
            status_changes.sort(key=lambda x: x['date'])
            
            # Find when the issue entered start state and end state
            start_date = None
            end_date = None
            
            for change in status_changes:
                if change['to_status'] == settings.cycle_time_start_state and not start_date:
                    start_date = change['date']
                elif change['to_status'] == settings.cycle_time_end_state and start_date:
                    end_date = change['date']
                    break
            
            # If we found both dates, calculate cycle time
            if start_date and end_date:
                cycle_time = (end_date - start_date).days
                if cycle_time >= 0:  # Only include valid cycle times
                    cycle_times.append(cycle_time)
        
        if cycle_times:
            return {
                "average": sum(cycle_times) / len(cycle_times),
                "median": sorted(cycle_times)[len(cycle_times)//2],
                "min": min(cycle_times),
                "max": max(cycle_times),
                "data": cycle_times,
                "start_state": settings.cycle_time_start_state,
                "end_state": settings.cycle_time_end_state
            }
        return {
            "error": "No completed issues found",
            "start_state": settings.cycle_time_start_state,
            "end_state": settings.cycle_time_end_state
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metrics/cfd")
async def get_cfd(jql: str, jira: JIRA = Depends(get_jira_client)):
    try:
        issues = jira.search_issues(
            jql,
            maxResults=1000,
            fields=['status', 'created', 'resolutiondate', 'statuscategorychangedate']
        )
        
        # Create date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')
        
        # Initialize status tracking
        status_data = {date.strftime('%Y-%m-%d'): {} for date in date_range}
        
        for issue in issues:
            created_date = datetime.strptime(issue.fields.created[:10], '%Y-%m-%d')
            resolved_date = None
            if hasattr(issue.fields, 'resolutiondate') and issue.fields.resolutiondate:
                resolved_date = datetime.strptime(issue.fields.resolutiondate[:10], '%Y-%m-%d')
            
            for date in date_range:
                date_str = date.strftime('%Y-%m-%d')
                if created_date <= date:
                    status = 'Done' if (resolved_date and resolved_date <= date) else issue.fields.status.name
                    status_data[date_str][status] = status_data[date_str].get(status, 0) + 1
        
        # Convert to cumulative data
        statuses = list(set([status for day in status_data.values() for status in day.keys()]))
        cumulative_data = []
        
        for date, counts in status_data.items():
            data_point = {'date': date}
            cumulative = 0
            for status in statuses:
                cumulative += counts.get(status, 0)
                data_point[status] = cumulative
            cumulative_data.append(data_point)
        
        return {
            "statuses": statuses,
            "data": cumulative_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(app, host=settings.host, port=settings.port)
