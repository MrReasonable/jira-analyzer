import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from app.main import app

client = TestClient(app)

class TestInputValidation:
    """Test suite for input validation and error handling"""

    def test_invalid_jql_query(self):
        """Test handling of invalid JQL queries"""
        invalid_queries = [
            "",  # Empty query
            "invalid syntax",  # Invalid syntax
            "project = ",  # Incomplete query
            "project = 'TEST' ORDER BY invalid",  # Invalid order by
        ]
        
        for query in invalid_queries:
            response = client.get(f"/api/metrics/lead-time?jql={query}")
            assert response.status_code == 400
            assert "detail" in response.json()

    def test_jql_injection_prevention(self):
        """Test prevention of JQL injection attempts"""
        malicious_queries = [
            "project = TEST; DROP TABLE issues",
            "project = TEST' OR '1'='1",
            "project = TEST UNION SELECT *",
        ]
        
        for query in malicious_queries:
            response = client.get(f"/api/metrics/lead-time?jql={query}")
            assert response.status_code == 400
            assert "detail" in response.json()

    def test_authentication_errors(self):
        """Test handling of Jira authentication errors"""
        error_cases = [
            {
                'error': 'AUTHENTICATION_FAILED',
                'message': 'Invalid credentials'
            },
            {
                'error': 'TOKEN_EXPIRED',
                'message': 'API token has expired'
            },
            {
                'error': 'UNAUTHORIZED',
                'message': 'User not authorized'
            }
        ]
        
        for case in error_cases:
            with patch('jira.JIRA') as MockJira:
                mock_jira = Mock()
                mock_jira.search_issues.side_effect = Exception(case['message'])
                MockJira.return_value = mock_jira
                
                response = client.get("/api/metrics/lead-time?jql=project=TEST")
                assert response.status_code == 401
                assert case['message'] in response.json()['detail']

    def test_rate_limiting(self):
        """Test handling of rate limiting responses"""
        with patch('jira.JIRA') as MockJira:
            mock_jira = Mock()
            mock_jira.search_issues.side_effect = Exception('Too many requests')
            MockJira.return_value = mock_jira
            
            response = client.get("/api/metrics/lead-time?jql=project=TEST")
            assert response.status_code == 429
            assert "rate limit" in response.json()['detail'].lower()

    def test_invalid_date_formats(self):
        """Test handling of invalid date formats in responses"""
        with patch('jira.JIRA') as MockJira:
            mock_jira = Mock()
            mock_jira.search_issues.return_value = [
                Mock(
                    fields=Mock(
                        created="invalid-date",
                        resolutiondate="2024-01-01",
                        status=Mock(name="Done")
                    )
                )
            ]
            MockJira.return_value = mock_jira
            
            response = client.get("/api/metrics/lead-time?jql=project=TEST")
            assert response.status_code == 500
            assert "date format" in response.json()['detail'].lower()

    def test_missing_required_fields(self):
        """Test handling of missing required fields"""
        with patch('jira.JIRA') as MockJira:
            mock_jira = Mock()
            # Issue missing 'created' field
            mock_jira.search_issues.return_value = [
                Mock(
                    fields=Mock(
                        resolutiondate="2024-01-01",
                        status=Mock(name="Done")
                    )
                )
            ]
            MockJira.return_value = mock_jira
            
            response = client.get("/api/metrics/lead-time?jql=project=TEST")
            assert response.status_code == 500
            assert "missing" in response.json()['detail'].lower()

    def test_invalid_status_transitions(self):
        """Test handling of invalid status transitions"""
        with patch('jira.JIRA') as MockJira:
            mock_jira = Mock()
            # Issue with invalid status transition
            mock_jira.search_issues.return_value = [
                Mock(
                    fields=Mock(
                        created="2024-01-01T00:00:00.000+0000",
                        resolutiondate="2024-01-02T00:00:00.000+0000",
                        status=Mock(name="Invalid Status")
                    )
                )
            ]
            MockJira.return_value = mock_jira
            
            response = client.get("/api/metrics/wip?jql=project=TEST")
            data = response.json()
            assert response.status_code == 200
            assert "Invalid Status" in data["status"]

    def test_large_dataset_handling(self):
        """Test handling of large datasets"""
        with patch('jira.JIRA') as MockJira:
            mock_jira = Mock()
            # Create a large number of issues
            mock_jira.search_issues.return_value = [
                Mock(
                    fields=Mock(
                        created="2024-01-01T00:00:00.000+0000",
                        resolutiondate="2024-01-02T00:00:00.000+0000",
                        status=Mock(name="Done")
                    )
                )
                for _ in range(1000)
            ]
            MockJira.return_value = mock_jira
            
            response = client.get("/api/metrics/lead-time?jql=project=TEST")
            assert response.status_code == 200
            data = response.json()
            assert len(data["data"]) == 1000

    def test_concurrent_requests(self):
        """Test handling of concurrent requests"""
        import concurrent.futures
        
        def make_request():
            return client.get("/api/metrics/lead-time?jql=project=TEST")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(5)]
            responses = [f.result() for f in futures]
            
            # All requests should complete successfully
            assert all(r.status_code == 200 for r in responses)

    def test_error_response_format(self):
        """Test consistency of error response format"""
        error_endpoints = [
            "/api/metrics/lead-time",
            "/api/metrics/throughput",
            "/api/metrics/wip",
            "/api/metrics/cfd"
        ]
        
        with patch('jira.JIRA') as MockJira:
            mock_jira = Mock()
            mock_jira.search_issues.side_effect = Exception("Test error")
            MockJira.return_value = mock_jira
            
            for endpoint in error_endpoints:
                response = client.get(f"{endpoint}?jql=project=TEST")
                error_data = response.json()
                
                assert "detail" in error_data
                assert isinstance(error_data["detail"], str)
                assert response.status_code >= 400
