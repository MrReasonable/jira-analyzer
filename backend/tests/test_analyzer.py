import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch, call
from app.core.analyzer import CycleTimeAnalyzer
from app.core.models import (
    JiraConfig, IssueData, AnalysisResult, StatusChange,
    CFDData, FlowEfficiencyData, EpicData
)
from app.core.interfaces import IssueTrackingSystem

@pytest.fixture
def sample_config():
    """Create sample configuration"""
    return JiraConfig(
        url="https://jira.example.com",
        username="test",
        api_token="test-token",
        workflow={"statuses": ["To Do", "In Progress", "Done"]},
        start_states=["To Do"],
        end_states=["Done"],
        active_statuses=["In Progress"]
    )

@pytest.fixture
def sample_datetime():
    """Create sample datetime"""
    return datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)

@pytest.fixture
def sample_issue_data(sample_datetime):
    """Create sample issue data"""
    return IssueData(
        key="TEST-1",
        summary="Test Issue",
        current_status="Done",
        created_date=sample_datetime,
        cycle_times={"In Progress": 1.0},
        total_cycle_time=2.0,
        transitions=[
            StatusChange("To Do", "In Progress", sample_datetime),
            StatusChange("In Progress", "Done", sample_datetime + timedelta(days=1))
        ],
        time_spent=3600,
        original_estimate=7200
    )

@pytest.fixture
def mock_issue_tracker():
    """Create mock issue tracker"""
    tracker = Mock(spec=IssueTrackingSystem)
    return tracker

@patch('app.core.analyzer.JiraService')
def test_analyzer_initialization(mock_jira_service, sample_config):
    """Test analyzer initialization"""
    # Mock JiraService instance
    mock_instance = Mock()
    mock_jira_service.return_value = mock_instance
    
    analyzer = CycleTimeAnalyzer(sample_config)
    
    # Verify initialization
    assert analyzer.config == sample_config
    assert analyzer.issue_tracker == mock_instance
    assert analyzer.components is not None
    
    # Verify JiraService was initialized with correct config
    mock_jira_service.assert_called_once_with(sample_config)

def test_analyzer_with_custom_tracker(sample_config, mock_issue_tracker):
    """Test analyzer with custom issue tracker"""
    analyzer = CycleTimeAnalyzer(sample_config, mock_issue_tracker)
    
    assert analyzer.issue_tracker == mock_issue_tracker

def test_fetch_all_issues(sample_config, mock_issue_tracker):
    """Test issue fetching with pagination"""
    # Mock two pages of results
    mock_issue_tracker.fetch_issues.side_effect = [
        ["Issue1", "Issue2"],  # First page
        ["Issue3"],            # Second page
        []                     # No more results
    ]
    
    analyzer = CycleTimeAnalyzer(sample_config, mock_issue_tracker)
    issues = analyzer._fetch_all_issues("project = TEST")
    
    assert len(issues) == 3
    assert mock_issue_tracker.fetch_issues.call_count == 3

def test_analyze_issues(sample_config, mock_issue_tracker, sample_issue_data):
    """Test full issue analysis"""
    # Mock issue fetching and processing
    mock_issue_tracker.fetch_issues.return_value = ["RawIssue1"]
    mock_issue_tracker.process_issue.return_value = sample_issue_data
    
    # Mock analysis components
    mock_component = Mock()
    mock_component.analyze.return_value = {
        "flow_metrics": {"cycle_time": {"mean": 2.0}},
        "workflow_compliance": {"compliant": 1},
        "bottlenecks": [{"status": "Review"}],
        "status_distribution": {"In Progress": 1}
    }
    
    with patch('app.core.analyzer.AnalysisComponentFactory') as mock_factory:
        mock_factory.create_all.return_value = {"test_component": mock_component}
        
        analyzer = CycleTimeAnalyzer(sample_config, mock_issue_tracker)
        result = analyzer.analyze_issues("project = TEST")
        
        assert isinstance(result, AnalysisResult)
        assert result.total_issues == 1
        assert "cycle_time" in result.flow_metrics
        assert "compliant" in result.workflow_compliance
        assert len(result.bottlenecks) == 1
        assert "In Progress" in result.status_distribution

@patch('app.core.analyzer.JiraService')
def test_generate_report(mock_jira_service, sample_config, sample_issue_data):
    """Test report generation"""
    # Mock JiraService instance
    mock_instance = Mock()
    mock_jira_service.return_value = mock_instance
    
    analyzer = CycleTimeAnalyzer(sample_config)
    
    # Mock component results
    mock_component = Mock()
    mock_component.analyze.return_value = {
        "flow_metrics": {
            "cycle_time": {
                "mean": 2.0,
                "median": 1.5
            }
        },
        "workflow_compliance": {
            "compliant": 1,
            "non_compliant": 0
        },
        "cfd_data": CFDData(
            dates=[datetime.now(timezone.utc)],
            status_counts={"To Do": [1]},
            wip_counts=[1]
        ),
        "flow_efficiency_data": [
            FlowEfficiencyData(
                issue_key="TEST-1",
                total_time=2.0,
                active_time=1.0,
                efficiency=50.0
            )
        ]
    }
    
    analyzer.components = {"test_component": mock_component}
    result = analyzer._generate_report([sample_issue_data])
    
    assert result.total_issues == 1
    assert isinstance(result.flow_metrics, dict)
    assert isinstance(result.workflow_compliance, dict)
    assert isinstance(result.cfd_data, CFDData)
    assert len(result.flow_efficiency_data) == 1

@patch('app.core.analyzer.JiraService')
def test_issue_data_formatting(mock_jira_service, sample_config, sample_issue_data):
    """Test issue data formatting in report"""
    # Mock JiraService instance
    mock_instance = Mock()
    mock_jira_service.return_value = mock_instance
    
    analyzer = CycleTimeAnalyzer(sample_config)
    
    # Mock minimal component results
    mock_component = Mock()
    mock_component.analyze.return_value = {
        "flow_metrics": {},
        "workflow_compliance": {}
    }
    
    analyzer.components = {"test_component": mock_component}
    result = analyzer._generate_report([sample_issue_data])
    
    issue_data = result.issues[0]
    assert issue_data["key"] == sample_issue_data.key
    assert issue_data["summary"] == sample_issue_data.summary
    assert isinstance(issue_data["cycleTime"], float)
    assert isinstance(issue_data["statusTimes"], dict)
    assert "created" in issue_data
    assert "timeSpent" in issue_data
    assert "originalEstimate" in issue_data

@patch('app.core.analyzer.JiraService')
def test_component_registration(mock_jira_service, sample_config):
    """Test analysis component registration"""
    # Mock JiraService instance
    mock_instance = Mock()
    mock_jira_service.return_value = mock_instance
    
    analyzer = CycleTimeAnalyzer(sample_config)
    
    # Create mock component class
    mock_component_class = Mock()
    
    # Register new component
    analyzer.register_component("new_component", mock_component_class)
    
    # Verify component was registered and components were recreated
    assert "new_component" in analyzer.components

@patch('app.core.analyzer.logger')
def test_fetch_issues_logging(mock_logger, sample_config, mock_issue_tracker):
    """Test logging during issue fetching"""
    # Mock multiple pages of results
    mock_issue_tracker.fetch_issues.side_effect = [
        ["Issue1"] * 100,  # First page
        ["Issue2"] * 50,   # Second page
        []                 # No more results
    ]
    
    analyzer = CycleTimeAnalyzer(sample_config, mock_issue_tracker)
    issues = analyzer._fetch_all_issues("project = TEST")
    
    assert len(issues) == 150
    mock_logger.info.assert_called()
    assert "Fetched" in mock_logger.info.call_args[0][0]

def test_empty_result_handling(sample_config, mock_issue_tracker):
    """Test handling of empty results"""
    mock_issue_tracker.fetch_issues.return_value = []
    
    analyzer = CycleTimeAnalyzer(sample_config, mock_issue_tracker)
    result = analyzer.analyze_issues("project = TEST")
    
    assert result.total_issues == 0
    assert result.flow_metrics == {}
    assert result.workflow_compliance == {}
    assert result.issues == []

def test_epic_data_handling(sample_config, mock_issue_tracker, sample_issue_data):
    """Test epic data handling in report"""
    mock_issue_tracker.fetch_issues.return_value = ["RawIssue1"]
    mock_issue_tracker.process_issue.return_value = sample_issue_data
    
    # Mock component with epic data
    mock_component = Mock()
    mock_component.analyze.return_value = {
        "flow_metrics": {},
        "workflow_compliance": {},
        "epic_data": [
            EpicData(
                key="EPIC-1",
                summary="Test Epic",
                children=["TEST-1"],
                lead_time=3.0
            )
        ]
    }
    
    with patch('app.core.analyzer.AnalysisComponentFactory') as mock_factory:
        mock_factory.create_all.return_value = {"test_component": mock_component}
        
        analyzer = CycleTimeAnalyzer(sample_config, mock_issue_tracker)
        result = analyzer.analyze_issues("project = TEST")
        
        assert result.epic_data is not None
        assert len(result.epic_data) == 1
        assert result.epic_data[0].key == "EPIC-1"

def test_workflow_config_in_result(sample_config, mock_issue_tracker, sample_issue_data):
    """Test workflow configuration in analysis result"""
    mock_issue_tracker.fetch_issues.return_value = ["RawIssue1"]
    mock_issue_tracker.process_issue.return_value = sample_issue_data
    
    # Mock minimal component
    mock_component = Mock()
    mock_component.analyze.return_value = {
        "flow_metrics": {},
        "workflow_compliance": {}
    }
    
    with patch('app.core.analyzer.AnalysisComponentFactory') as mock_factory:
        mock_factory.create_all.return_value = {"test_component": mock_component}
        
        analyzer = CycleTimeAnalyzer(sample_config, mock_issue_tracker)
        result = analyzer.analyze_issues("project = TEST")
        
        assert result.workflow == sample_config.workflow
        assert result.end_states == sample_config.end_states

def test_analysis_result_serialization(sample_config, sample_datetime):
    """Test JSON serialization of analysis results"""
    from app.utils.json_encoder import NumpyJSONProvider
    import json
    
    # Create a complete analysis result with all data types
    result = AnalysisResult(
        total_issues=1,
        flow_metrics={
            "cycle_time": {
                "mean": 2.0,
                "median": 1.5,
                "p85": 3.0
            }
        },
        workflow_compliance={
            "compliant": 1,
            "non_compliant": 0,
            "compliance_rate": 100.0
        },
        bottlenecks=[
            {
                "status": "Review",
                "avg_time": 2.5,
                "bottleneck_score": 0.8,
                "impact": "High"
            }
        ],
        cycle_time_stats={
            "mean": 2.0,
            "std_dev": 0.5
        },
        status_distribution={
            "To Do": 0,
            "In Progress": 1,
            "Done": 0
        },
        end_states=["Done"],
        issues=[{
            "key": "TEST-1",
            "summary": "Test Issue",
            "cycleTime": 2.0,
            "created": sample_datetime,
            "completed": sample_datetime + timedelta(days=2)
        }],
        workflow={"statuses": ["To Do", "In Progress", "Done"]},
        cfd_data=CFDData(
            dates=[sample_datetime, sample_datetime + timedelta(days=1)],
            status_counts={"To Do": [1, 0], "In Progress": [0, 1]},
            wip_counts=[1, 1]
        ),
        flow_efficiency_data=[
            FlowEfficiencyData(
                issue_key="TEST-1",
                total_time=2.0,
                active_time=1.0,
                efficiency=50.0
            )
        ],
        epic_data=[
            EpicData(
                key="EPIC-1",
                summary="Test Epic",
                children=["TEST-1"],
                start_time=sample_datetime,
                end_time=sample_datetime + timedelta(days=2),
                lead_time=2.0
            )
        ]
    )
    
    # Try to serialize using our custom JSON encoder
    encoder = NumpyJSONProvider()
    json_str = encoder.dumps(result)
    parsed = json.loads(json_str)
    
    # Verify all components are properly serialized
    assert isinstance(parsed, dict)
    assert parsed["total_issues"] == 1
    assert isinstance(parsed["flow_metrics"], dict)
    assert isinstance(parsed["workflow_compliance"], dict)
    assert isinstance(parsed["bottlenecks"], list)
    assert isinstance(parsed["cfd_data"], dict)
    assert isinstance(parsed["flow_efficiency_data"], list)
    assert isinstance(parsed["epic_data"], list)
    
    # Verify datetime serialization
    assert all(isinstance(d, str) and d.endswith('Z') for d in parsed["cfd_data"]["dates"])
    assert parsed["issues"][0]["created"].endswith('Z')
    assert parsed["epic_data"][0]["start_time"].endswith('Z')
    
    # Verify numeric types
    assert isinstance(parsed["flow_metrics"]["cycle_time"]["mean"], float)
    assert isinstance(parsed["workflow_compliance"]["compliance_rate"], float)
    assert isinstance(parsed["flow_efficiency_data"][0]["efficiency"], float)
    assert isinstance(parsed["epic_data"][0]["lead_time"], float)
