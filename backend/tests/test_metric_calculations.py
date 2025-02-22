from datetime import datetime, timedelta
import pytest
from app.main import app
from fastapi.testclient import TestClient
from unittest.mock import Mock

client = TestClient(app)

def create_mock_issue(created_date, resolution_date=None, status="In Progress"):
    """Helper function to create mock Jira issues"""
    return Mock(
        fields=Mock(
            created=created_date.strftime('%Y-%m-%dT%H:%M:%S.000+0000'),
            resolutiondate=resolution_date.strftime('%Y-%m-%dT%H:%M:%S.000+0000') if resolution_date else None,
            status=Mock(name=status)
        )
    )

class TestMetricCalculations:
    """Test suite for metric calculation logic"""
    
    def test_lead_time_edge_cases(self):
        """Test lead time calculation with various edge cases"""
        # Issue completed same day
        same_day = datetime.now()
        issue1 = create_mock_issue(same_day, same_day)
        
        # Issue completed after long time
        old_date = datetime.now() - timedelta(days=100)
        issue2 = create_mock_issue(old_date, datetime.now())
        
        # Issue not completed
        issue3 = create_mock_issue(datetime.now())
        
        mock_issues = [issue1, issue2, issue3]
        
        response = client.get("/api/metrics/lead-time?jql=project=TEST")
        data = response.json()
        
        assert response.status_code == 200
        assert "data" in data
        assert len(data["data"]) == 2  # Only completed issues
        assert data["min"] == 0  # Same day completion
        assert data["max"] == 100  # Long running issue

    def test_throughput_calculation_periods(self):
        """Test throughput calculation over different time periods"""
        today = datetime.now()
        issues = [
            # Today
            create_mock_issue(today - timedelta(days=5), today, "Done"),
            create_mock_issue(today - timedelta(days=10), today, "Done"),
            # Yesterday
            create_mock_issue(today - timedelta(days=7), today - timedelta(days=1), "Done"),
            # Last week
            create_mock_issue(today - timedelta(days=14), today - timedelta(days=7), "Done"),
        ]
        
        response = client.get("/api/metrics/throughput?jql=project=TEST")
        data = response.json()
        
        assert response.status_code == 200
        assert len(data["dates"]) > 0
        assert len(data["counts"]) == len(data["dates"])
        assert data["average"] > 0

    def test_wip_status_transitions(self):
        """Test WIP calculations with various status transitions"""
        issues = [
            create_mock_issue(datetime.now(), status="To Do"),
            create_mock_issue(datetime.now(), status="In Progress"),
            create_mock_issue(datetime.now(), status="In Progress"),
            create_mock_issue(datetime.now(), status="Review"),
            create_mock_issue(datetime.now(), status="Done"),
        ]
        
        response = client.get("/api/metrics/wip?jql=project=TEST")
        data = response.json()
        
        assert response.status_code == 200
        assert "To Do" in data["status"]
        assert "In Progress" in data["status"]
        assert "Review" in data["status"]
        assert "Done" in data["status"]
        assert data["total"] == 5

    def test_cfd_data_consistency(self):
        """Test CFD data consistency and calculations"""
        today = datetime.now()
        week_ago = today - timedelta(days=7)
        
        issues = [
            # Started a week ago, still in progress
            create_mock_issue(week_ago, status="In Progress"),
            # Started a week ago, completed today
            create_mock_issue(week_ago, today, "Done"),
            # Started 3 days ago, in review
            create_mock_issue(today - timedelta(days=3), status="Review"),
        ]
        
        response = client.get("/api/metrics/cfd?jql=project=TEST")
        data = response.json()
        
        assert response.status_code == 200
        assert len(data["data"]) > 0
        
        # Verify cumulative nature
        for i in range(1, len(data["data"])):
            current = data["data"][i]
            previous = data["data"][i-1]
            
            # Total count should never decrease
            current_total = sum(current[status] for status in data["statuses"])
            previous_total = sum(previous[status] for status in data["statuses"])
            assert current_total >= previous_total

    def test_metric_calculations_with_empty_data(self):
        """Test metric calculations with empty or minimal data"""
        empty_issues = []
        single_issue = [create_mock_issue(datetime.now())]
        
        # Test lead time
        response = client.get("/api/metrics/lead-time?jql=project=TEST")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert len(data["data"]) == 0
        
        # Test throughput
        response = client.get("/api/metrics/throughput?jql=project=TEST")
        assert response.status_code == 200
        data = response.json()
        assert data["average"] == 0
        
        # Test WIP
        response = client.get("/api/metrics/wip?jql=project=TEST")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        
        # Test CFD
        response = client.get("/api/metrics/cfd?jql=project=TEST")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) > 0  # Should have date range even if empty

    def test_date_handling(self):
        """Test date handling across different timezones and formats"""
        dates = [
            "2024-01-01T00:00:00.000+0000",
            "2024-01-01T00:00:00.000-0500",
            "2024-01-01T00:00:00.000+0100",
        ]
        
        issues = [
            Mock(
                fields=Mock(
                    created=created_date,
                    resolutiondate="2024-01-02T00:00:00.000+0000",
                    status=Mock(name="Done")
                )
            )
            for created_date in dates
        ]
        
        # Test lead time calculation handles different timezones
        response = client.get("/api/metrics/lead-time?jql=project=TEST")
        assert response.status_code == 200
        data = response.json()
        assert len(set(data["data"])) == 1  # All should resolve to same lead time

    def test_status_normalization(self):
        """Test status name normalization and mapping"""
        status_variations = [
            "In Progress",
            "IN PROGRESS",
            "in_progress",
            "In-Progress",
        ]
        
        issues = [
            create_mock_issue(datetime.now(), status=status)
            for status in status_variations
        ]
        
        response = client.get("/api/metrics/wip?jql=project=TEST")
        data = response.json()
        
        # Should normalize to a single status name
        status_counts = {s: c for s, c in zip(data["status"], data["counts"])}
        assert len(status_counts) == 1
        assert list(status_counts.values())[0] == len(status_variations)

    def test_data_aggregation(self):
        """Test data aggregation logic"""
        today = datetime.now()
        
        # Create issues completed on same day
        issues = [
            create_mock_issue(today - timedelta(days=1), today, "Done"),
            create_mock_issue(today - timedelta(days=2), today, "Done"),
            create_mock_issue(today - timedelta(days=3), today, "Done"),
        ]
        
        response = client.get("/api/metrics/throughput?jql=project=TEST")
        data = response.json()
        
        # Should aggregate all completions on same day
        assert data["counts"][-1] == 3
        
        # Test CFD aggregation
        response = client.get("/api/metrics/cfd?jql=project=TEST")
        data = response.json()
        
        # Verify cumulative counting
        last_day = data["data"][-1]
        assert last_day["Done"] == 3

    def test_cycle_time_calculation(self):
        """Test cycle time calculation with various scenarios"""
        today = datetime.now()
        
        def create_mock_changelog(transitions):
            histories = []
            for date, from_status, to_status in transitions:
                histories.append(
                    Mock(
                        created=date.strftime('%Y-%m-%dT%H:%M:%S.000+0000'),
                        items=[
                            Mock(
                                field='status',
                                fromString=from_status,
                                toString=to_status
                            )
                        ]
                    )
                )
            return Mock(histories=histories)
        
        # Issue with normal flow
        issue1 = create_mock_issue(
            today - timedelta(days=5),
            today,
            "Done"
        )
        issue1.changelog = create_mock_changelog([
            (today - timedelta(days=4), "Backlog", "In Progress"),
            (today - timedelta(days=2), "In Progress", "Review"),
            (today - timedelta(days=1), "Review", "Done")
        ])
        
        # Issue that skipped states
        issue2 = create_mock_issue(
            today - timedelta(days=3),
            today,
            "Done"
        )
        issue2.changelog = create_mock_changelog([
            (today - timedelta(days=2), "Backlog", "In Progress"),
            (today - timedelta(days=1), "In Progress", "Done")
        ])
        
        # Issue that went back to previous state
        issue3 = create_mock_issue(
            today - timedelta(days=6),
            today,
            "Done"
        )
        issue3.changelog = create_mock_changelog([
            (today - timedelta(days=5), "Backlog", "In Progress"),
            (today - timedelta(days=4), "In Progress", "Review"),
            (today - timedelta(days=3), "Review", "In Progress"),
            (today - timedelta(days=2), "In Progress", "Done")
        ])
        
        response = client.get("/api/metrics/cycle-time?jql=project=TEST")
        data = response.json()
        
        assert response.status_code == 200
        assert "average" in data
        assert "median" in data
        assert "min" in data
        assert "max" in data
        assert "data" in data
        assert "start_state" in data
        assert "end_state" in data
        
        # Verify cycle times are calculated correctly
        assert len(data["data"]) == 3
        assert min(data["data"]) >= 0  # Cycle time should never be negative

    def test_cycle_time_edge_cases(self):
        """Test cycle time calculation with edge cases"""
        today = datetime.now()
        
        def create_mock_changelog(transitions):
            histories = []
            for date, from_status, to_status in transitions:
                histories.append(
                    Mock(
                        created=date.strftime('%Y-%m-%dT%H:%M:%S.000+0000'),
                        items=[
                            Mock(
                                field='status',
                                fromString=from_status,
                                toString=to_status
                            )
                        ]
                    )
                )
            return Mock(histories=histories)
        
        # Issue completed same day
        issue1 = create_mock_issue(today, today)
        issue1.changelog = create_mock_changelog([
            (today, "Backlog", "In Progress"),
            (today, "In Progress", "Done")
        ])
        
        # Issue with no cycle time start state
        issue2 = create_mock_issue(
            today - timedelta(days=2),
            today
        )
        issue2.changelog = create_mock_changelog([
            (today - timedelta(days=1), "Backlog", "Review"),
            (today, "Review", "Done")
        ])
        
        # Issue with no cycle time end state
        issue3 = create_mock_issue(
            today - timedelta(days=3),
            None,
            "Review"
        )
        issue3.changelog = create_mock_changelog([
            (today - timedelta(days=2), "Backlog", "In Progress"),
            (today - timedelta(days=1), "In Progress", "Review")
        ])
        
        response = client.get("/api/metrics/cycle-time?jql=project=TEST")
        data = response.json()
        
        assert response.status_code == 200
        # Should only include issue1 as others don't have valid cycle times
        assert len(data["data"]) == 1
        assert data["data"][0] == 0  # Same day completion
