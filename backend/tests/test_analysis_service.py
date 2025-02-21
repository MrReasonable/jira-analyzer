import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch
from app.services.analysis_service import AnalysisService
from app.core.models import JiraConfig, TimeRange, AnalysisResult, CFDData
from app.api.error_handlers import ValidationError, JiraConnectionError

@pytest.fixture
def service():
    """Create analysis service"""
    return AnalysisService()

@pytest.fixture
def sample_request_data():
    """Create sample request data"""
    now = datetime.now(timezone.utc)
    return {
        "jiraUrl": "https://jira.example.com",
        "username": "test",
        "apiToken": "test-token",
        "jqlQuery": "project = TEST",
        "statuses": ["To Do", "In Progress", "Done"],
        "expectedPath": ["To Do", "In Progress", "Done"],
        "startStates": ["To Do"],
        "endStates": ["Done"],
        "activeStatuses": ["In Progress"],
        "startDate": (now - timedelta(days=30)).isoformat(),
        "endDate": now.isoformat(),
        "flowEfficiencyMethod": "active_statuses"
    }

@pytest.fixture
def sample_analysis_result():
    """Create sample analysis result"""
    now = datetime.now(timezone.utc)
    return AnalysisResult(
        total_issues=1,
        flow_metrics={"cycle_time": {"mean": 5.0}},
        workflow_compliance={"compliant": 1},
        bottlenecks=[{"status": "Review"}],
        cycle_time_stats={"mean": 5.0},
        status_distribution={"In Progress": 1},
        end_states=["Done"],
        issues=[{"key": "TEST-1"}],
        workflow={"expected_path": ["To Do", "Done"]},
        cfd_data=CFDData(
            dates=[now],
            status_counts={"To Do": [1]},
            wip_counts=[1]
        )
    )

def test_initialize_from_request(service, sample_request_data):
    """Test service initialization from request data"""
    with patch('app.services.analysis_service.JiraService') as mock_jira:
        mock_jira.return_value.test_connection.return_value = True
        
        service.initialize_from_request(sample_request_data)
        
        assert service.last_request_data == sample_request_data
        assert service.jira_service is not None
        mock_jira.assert_called_once()

def test_initialize_invalid_request(service):
    """Test initialization with invalid request data"""
    invalid_data = {
        "jiraUrl": "invalid-url",
        "username": "",  # Empty username
        "apiToken": "token"
    }
    
    with pytest.raises(ValidationError):
        service.initialize_from_request(invalid_data)

def test_initialize_connection_failure(service, sample_request_data):
    """Test initialization with connection failure"""
    with patch('app.services.analysis_service.JiraService') as mock_jira:
        mock_jira.return_value.test_connection.return_value = False
        
        with pytest.raises(JiraConnectionError):
            service.initialize_from_request(sample_request_data)

def test_validate_connection_success(service):
    """Test successful connection validation"""
    credentials = {
        "jiraUrl": "https://jira.example.com",
        "username": "test",
        "apiToken": "test-token"
    }
    
    with patch('app.services.analysis_service.JiraService') as mock_jira:
        mock_jira.return_value.test_connection.return_value = True
        
        assert service.validate_connection(credentials) is True

def test_validate_connection_failure(service):
    """Test failed connection validation"""
    credentials = {
        "jiraUrl": "https://jira.example.com",
        "username": "test",
        "apiToken": "invalid-token"
    }
    
    with patch('app.services.analysis_service.JiraService') as mock_jira:
        mock_jira.return_value.test_connection.return_value = False
        
        with pytest.raises(JiraConnectionError):
            service.validate_connection(credentials)

def test_analyze_success(service, sample_request_data, sample_analysis_result):
    """Test successful analysis"""
    with patch('app.services.analysis_service.JiraService') as mock_jira, \
         patch('app.services.analysis_service.CycleTimeAnalyzer') as mock_analyzer:
        mock_jira.return_value.test_connection.return_value = True
        mock_analyzer.return_value.analyze_issues.return_value = sample_analysis_result
        
        result, status_code = service.analyze(sample_request_data)
        
        assert status_code == 200
        assert result['status'] == 'success'
        assert result['data']['total_issues'] == 1
        assert 'flow_metrics' in result['data']
        assert 'workflow_compliance' in result['data']

def test_analyze_no_issues(service, sample_request_data):
    """Test analysis with no matching issues"""
    with patch('app.services.analysis_service.JiraService') as mock_jira, \
         patch('app.services.analysis_service.CycleTimeAnalyzer') as mock_analyzer:
        mock_jira.return_value.test_connection.return_value = True
        
        empty_result = Mock(total_issues=0)
        mock_analyzer.return_value.analyze_issues.return_value = empty_result
        
        result, status_code = service.analyze(sample_request_data)
        
        assert status_code == 200
        assert result['status'] == 'warning'
        assert 'No issues found' in result['message']

def test_create_analysis_config(service, sample_request_data):
    """Test analysis configuration creation"""
    config, time_range, jql = service._create_analysis_config(sample_request_data)
    
    assert isinstance(config, JiraConfig)
    assert isinstance(time_range, TimeRange)
    assert isinstance(jql, str)
    assert config.workflow['statuses'] == sample_request_data['statuses']
    assert config.start_states == sample_request_data['startStates']
    assert config.end_states == sample_request_data['endStates']

def test_create_empty_result(service, sample_request_data):
    """Test empty result creation"""
    service.last_request_data = sample_request_data
    time_range = TimeRange(
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc)
    )
    
    result = service.create_empty_result(time_range, "project = TEST", ["Done"])
    
    assert result['total_issues'] == 0
    assert result['cycle_time_stats']['mean'] == 0
    assert result['workflow_compliance']['compliance_rate'] == 0
    assert isinstance(result['timeRange'], dict)
    assert isinstance(result['cfd_data'], dict)

def test_format_analysis_result(service, sample_analysis_result):
    """Test analysis result formatting"""
    time_range = TimeRange(
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc)
    )
    
    formatted = service.format_analysis_result(sample_analysis_result, "project = TEST", time_range)
    
    assert formatted['total_issues'] == sample_analysis_result.total_issues
    assert formatted['flow_metrics'] == sample_analysis_result.flow_metrics
    assert formatted['workflow_compliance'] == sample_analysis_result.workflow_compliance
    assert isinstance(formatted['timeRange'], dict)
    assert isinstance(formatted['cfd_data']['dates'], list)
    assert all(isinstance(d, str) for d in formatted['cfd_data']['dates'])

def test_time_range_handling(service, sample_request_data):
    """Test time range handling"""
    # Test with explicit dates
    config, time_range, _ = service._create_analysis_config(sample_request_data)
    assert time_range.start_date is not None
    assert time_range.end_date is not None
    assert time_range.start_date.tzinfo == timezone.utc
    
    # Test with preset
    sample_request_data.pop('startDate')
    sample_request_data.pop('endDate')
    sample_request_data['timePreset'] = 'two_weeks'
    
    config, time_range, _ = service._create_analysis_config(sample_request_data)
    assert time_range.preset == 'two_weeks'

def test_default_states(service, sample_request_data):
    """Test default state handling"""
    # Remove explicit states
    data = sample_request_data.copy()
    data.pop('startStates')
    data.pop('endStates')
    
    config, _, _ = service._create_analysis_config(data)
    
    assert config.start_states == [data['statuses'][0]]
    assert config.end_states == [data['statuses'][-1]]

@patch('app.services.analysis_service.logger')
def test_error_logging(mock_logger, service, sample_request_data):
    """Test error logging"""
    with patch('app.services.analysis_service.JiraService') as mock_jira:
        mock_jira.return_value.test_connection.side_effect = Exception("Service error")
        
        with pytest.raises(JiraConnectionError):
            service.initialize_from_request(sample_request_data)
        
        mock_logger.error.assert_called()

def test_analysis_type_handling(service, sample_request_data):
    """Test different analysis types"""
    # Test lead time analysis
    data = sample_request_data.copy()
    data['analysisType'] = 'lead_time'
    
    config, _, jql = service._create_analysis_config(data)
    assert 'lead_time' in data['analysisType']
    
    # Test cycle time analysis
    data['analysisType'] = 'cycle_time'
    config, _, jql = service._create_analysis_config(data)
    assert 'cycle_time' in data['analysisType']
