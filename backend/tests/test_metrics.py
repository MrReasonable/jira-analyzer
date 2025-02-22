from datetime import datetime, timedelta
import pytest
from app.main import app
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

client = TestClient(app)

@pytest.fixture
def mock_jira_issues():
    return [
        Mock(
            fields=Mock(
                created='2024-01-01T10:00:00.000+0000',
                resolutiondate='2024-01-05T15:00:00.000+0000',
                status=Mock(name='Done')
            )
        ),
        Mock(
            fields=Mock(
                created='2024-01-02T09:00:00.000+0000',
                resolutiondate='2024-01-04T16:00:00.000+0000',
                status=Mock(name='Done')
            )
        ),
        Mock(
            fields=Mock(
                created='2024-01-03T11:00:00.000+0000',
                resolutiondate=None,
                status=Mock(name='In Progress')
            )
        )
    ]

@pytest.mark.asyncio
async def test_lead_time_calculation(mock_jira_issues):
    """
    Test that lead time metrics are correctly calculated from issue data.
    This tests the behavior of calculating lead times, not the implementation details.
    """
    with patch('jira.JIRA') as MockJira:
        mock_jira = Mock()
        mock_jira.search_issues.return_value = mock_jira_issues
        MockJira.return_value = mock_jira

        response = client.get("/api/metrics/lead-time?jql=project=TEST")
        assert response.status_code == 200
        
        data = response.json()
        assert "average" in data
        assert "median" in data
        assert "min" in data
        assert "max" in data
        assert "data" in data
        
        # Only completed issues should be included
        assert len(data["data"]) == 2
        
        # Verify the calculations are correct
        assert data["min"] == 2  # Shortest lead time
        assert data["max"] == 4  # Longest lead time
        assert data["average"] == 3  # Average of 2 and 4 days

@pytest.mark.asyncio
async def test_throughput_calculation(mock_jira_issues):
    """
    Test that throughput metrics correctly count completed issues per day.
    """
    with patch('jira.JIRA') as MockJira:
        mock_jira = Mock()
        mock_jira.search_issues.return_value = mock_jira_issues
        MockJira.return_value = mock_jira

        response = client.get("/api/metrics/throughput?jql=project=TEST")
        assert response.status_code == 200
        
        data = response.json()
        assert "dates" in data
        assert "counts" in data
        assert "average" in data
        
        # Verify we're counting completed issues per day
        assert len(data["dates"]) == len(set(issue.fields.resolutiondate[:10] 
            for issue in mock_jira_issues 
            if issue.fields.resolutiondate))

@pytest.mark.asyncio
async def test_wip_calculation(mock_jira_issues):
    """
    Test that WIP metrics correctly count issues by status.
    """
    with patch('jira.JIRA') as MockJira:
        mock_jira = Mock()
        mock_jira.search_issues.return_value = mock_jira_issues
        MockJira.return_value = mock_jira

        response = client.get("/api/metrics/wip?jql=project=TEST")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert "counts" in data
        assert "total" in data
        
        # Verify status counts
        status_dict = {}
        for issue in mock_jira_issues:
            status = issue.fields.status.name
            status_dict[status] = status_dict.get(status, 0) + 1
            
        assert len(data["status"]) == len(status_dict)
        assert data["total"] == len(mock_jira_issues)

@pytest.mark.asyncio
async def test_cfd_calculation(mock_jira_issues):
    """
    Test that CFD metrics correctly show cumulative issue counts over time.
    """
    with patch('jira.JIRA') as MockJira:
        mock_jira = Mock()
        mock_jira.search_issues.return_value = mock_jira_issues
        MockJira.return_value = mock_jira

        response = client.get("/api/metrics/cfd?jql=project=TEST")
        assert response.status_code == 200
        
        data = response.json()
        assert "statuses" in data
        assert "data" in data
        
        # Verify we have data points for each day
        assert len(data["data"]) > 0
        assert all("date" in point for point in data["data"])
        
        # Verify cumulative nature
        for i in range(1, len(data["data"])):
            current = data["data"][i]
            previous = data["data"][i-1]
            # Ensure counts never decrease
            for status in data["statuses"]:
                assert current.get(status, 0) >= previous.get(status, 0)

@pytest.mark.asyncio
async def test_error_handling():
    """
    Test that API endpoints handle errors gracefully.
    """
    with patch('jira.JIRA') as MockJira:
        mock_jira = Mock()
        mock_jira.search_issues.side_effect = Exception("Jira API Error")
        MockJira.return_value = mock_jira

        endpoints = [
            "/api/metrics/lead-time",
            "/api/metrics/throughput",
            "/api/metrics/wip",
            "/api/metrics/cfd"
        ]
        
        for endpoint in endpoints:
            response = client.get(f"{endpoint}?jql=project=TEST")
            assert response.status_code == 500
            assert "detail" in response.json()
