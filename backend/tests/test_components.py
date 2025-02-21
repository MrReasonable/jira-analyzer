import pytest
from datetime import datetime, timezone, timedelta
import numpy as np
from unittest.mock import Mock, patch
from app.core.analysis.components import (
    FlowMetricsAnalyzer, BottleneckAnalyzer, CFDAnalyzer,
    FlowEfficiencyAnalyzer, WorkflowComplianceAnalyzer, EpicAnalyzer
)
from app.core.models import IssueData, StatusChange, TimeRange

@pytest.fixture
def sample_config():
    """Create sample configuration"""
    return {
        "workflow": {
            "statuses": ["To Do", "In Progress", "Review", "Done"],
            "expected_path": ["To Do", "In Progress", "Review", "Done"]
        },
        "start_states": ["To Do"],
        "end_states": ["Done"],
        "active_statuses": ["In Progress", "Review"]
    }

@pytest.fixture
def sample_datetime():
    """Create sample datetime"""
    return datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)

@pytest.fixture
def sample_issue(sample_datetime):
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
            StatusChange("In Progress", "Review", sample_datetime + timedelta(days=1)),
            StatusChange("Review", "Done", sample_datetime + timedelta(days=2))
        ],
        time_spent=3600,
        original_estimate=7200
    )

def test_flow_metrics_analyzer(sample_config, sample_issue):
    """Test flow metrics analysis"""
    analyzer = FlowMetricsAnalyzer(sample_config)
    result = analyzer.analyze([sample_issue])
    
    assert "flow_metrics" in result
    assert "cycle_time" in result["flow_metrics"]
    assert result["throughput"] == 1
    assert all(key in result["cycle_time"] for key in ["mean", "median", "p85", "p95", "std_dev"])
    assert all(isinstance(value, float) for value in result["cycle_time"].values())

def test_flow_metrics_empty_result(sample_config):
    """Test flow metrics with no issues"""
    analyzer = FlowMetricsAnalyzer(sample_config)
    result = analyzer.analyze([])
    
    assert result["throughput"] == 0
    assert all(value == 0.0 for value in result["cycle_time"].values())

def test_bottleneck_analyzer(sample_config, sample_issue):
    """Test bottleneck analysis"""
    analyzer = BottleneckAnalyzer(sample_config)
    result = analyzer.analyze([sample_issue])
    
    assert "bottlenecks" in result
    assert "status_distribution" in result
    assert len(result["bottlenecks"]) > 0
    assert all(key in b for key in ["status", "avg_time", "bottleneck_score", "impact"] for b in result["bottlenecks"])

def test_bottleneck_scoring(sample_config, sample_datetime):
    """Test bottleneck scoring system"""
    # Create issue with significant time in review
    issue = IssueData(
        key="TEST-1",
        summary="Test Issue",
        current_status="Done",
        created_date=sample_datetime,
        cycle_times={"Review": 5.0},
        total_cycle_time=7.0,
        transitions=[
            StatusChange("To Do", "In Progress", sample_datetime),
            StatusChange("In Progress", "Review", sample_datetime + timedelta(days=1)),
            StatusChange("Review", "In Progress", sample_datetime + timedelta(days=4)),
            StatusChange("In Progress", "Review", sample_datetime + timedelta(days=5)),
            StatusChange("Review", "Done", sample_datetime + timedelta(days=7))
        ]
    )
    
    analyzer = BottleneckAnalyzer(sample_config)
    result = analyzer.analyze([issue])
    
    bottlenecks = result["bottlenecks"]
    assert len(bottlenecks) > 0
    review_bottleneck = next(b for b in bottlenecks if b["status"] == "Review")
    assert review_bottleneck["impact"] == "High"  # Should be high impact due to time spent

def test_cfd_analyzer(sample_config, sample_issue):
    """Test CFD analysis"""
    analyzer = CFDAnalyzer(sample_config)
    result = analyzer.analyze([sample_issue])
    
    assert "cfd_data" in result
    cfd_data = result["cfd_data"]
    
    # Verify dates
    assert len(cfd_data.dates) > 0
    assert all(isinstance(d, datetime) for d in cfd_data.dates)
    assert all(d.tzinfo == timezone.utc for d in cfd_data.dates)
    assert all(isinstance(d.timestamp(), float) for d in cfd_data.dates)  # Ensure serializable
    
    # Verify status counts
    assert all(status in cfd_data.status_counts for status in sample_config["workflow"]["statuses"])
    for status, counts in cfd_data.status_counts.items():
        assert isinstance(status, str)
        assert isinstance(counts, list)
        assert len(counts) == len(cfd_data.dates)
        assert all(isinstance(count, int) for count in counts)
        assert all(count >= 0 for count in counts)
    
    # Verify WIP counts
    assert len(cfd_data.wip_counts) == len(cfd_data.dates)
    assert all(isinstance(count, int) for count in cfd_data.wip_counts)
    assert all(count >= 0 for count in cfd_data.wip_counts)
    
    # Verify data consistency
    for i in range(len(cfd_data.dates)):
        total_issues = sum(counts[i] for counts in cfd_data.status_counts.values())
        assert total_issues >= cfd_data.wip_counts[i]  # WIP should never exceed total issues

def test_cfd_with_time_range(sample_config, sample_issue):
    """Test CFD analysis with time range"""
    config = sample_config.copy()
    config["time_range"] = TimeRange(
        start_date=sample_issue.created_date,
        end_date=sample_issue.created_date + timedelta(days=3)
    )
    
    analyzer = CFDAnalyzer(config)
    result = analyzer.analyze([sample_issue])
    
    assert len(result["cfd_data"].dates) == 4  # start date + 3 days

def test_flow_efficiency_analyzer(sample_config, sample_issue):
    """Test flow efficiency analysis"""
    analyzer = FlowEfficiencyAnalyzer(sample_config)
    result = analyzer.analyze([sample_issue])
    
    assert "flow_efficiency_data" in result
    assert len(result["flow_efficiency_data"]) == 1
    
    # Verify structure and types of efficiency data
    efficiency_data = result["flow_efficiency_data"][0]
    assert isinstance(efficiency_data, dict)
    
    # Check required fields
    required_fields = ["issue_key", "total_time", "active_time", "efficiency"]
    assert all(key in efficiency_data for key in required_fields)
    
    # Verify field types
    assert isinstance(efficiency_data["issue_key"], str)
    assert isinstance(efficiency_data["total_time"], float)
    assert isinstance(efficiency_data["active_time"], float)
    assert isinstance(efficiency_data["efficiency"], float)
    
    # Verify value ranges
    assert efficiency_data["total_time"] >= 0
    assert efficiency_data["active_time"] >= 0
    assert 0 <= efficiency_data["efficiency"] <= 100
    assert efficiency_data["active_time"] <= efficiency_data["total_time"]
    
    # Verify efficiency calculation
    if efficiency_data["total_time"] > 0:
        expected_efficiency = (efficiency_data["active_time"] / efficiency_data["total_time"]) * 100
        assert abs(efficiency_data["efficiency"] - expected_efficiency) < 0.001  # Allow for floating point precision

def test_flow_efficiency_methods(sample_config, sample_issue):
    """Test different flow efficiency calculation methods"""
    # Test active_statuses method
    config1 = sample_config.copy()
    config1["flow_efficiency_method"] = "active_statuses"
    analyzer1 = FlowEfficiencyAnalyzer(config1)
    result1 = analyzer1.analyze([sample_issue])
    
    # Test time_logged method
    config2 = sample_config.copy()
    config2["flow_efficiency_method"] = "time_logged"
    analyzer2 = FlowEfficiencyAnalyzer(config2)
    result2 = analyzer2.analyze([sample_issue])
    
    assert result1["flow_efficiency_data"][0]["efficiency"] != result2["flow_efficiency_data"][0]["efficiency"]

def test_workflow_compliance_analyzer(sample_config, sample_issue):
    """Test workflow compliance analysis"""
    analyzer = WorkflowComplianceAnalyzer(sample_config)
    result = analyzer.analyze([sample_issue])
    
    assert "workflow_compliance" in result
    compliance = result["workflow_compliance"]
    assert all(key in compliance for key in ["compliant_issues", "compliance_rate", "non_compliant_paths"])
    assert isinstance(compliance["compliance_rate"], float)
    assert 0 <= compliance["compliance_rate"] <= 100

def test_workflow_compliance_with_deviation(sample_config, sample_datetime):
    """Test workflow compliance with path deviation"""
    # Create issue that deviates from expected path
    issue = IssueData(
        key="TEST-1",
        summary="Test Issue",
        current_status="Done",
        created_date=sample_datetime,
        cycle_times={},
        total_cycle_time=3.0,
        transitions=[
            StatusChange("To Do", "Review", sample_datetime),  # Skips In Progress
            StatusChange("Review", "Done", sample_datetime + timedelta(days=1))
        ]
    )
    
    analyzer = WorkflowComplianceAnalyzer(sample_config)
    result = analyzer.analyze([issue])
    
    compliance = result["workflow_compliance"]
    assert compliance["compliant_issues"] == 0
    assert len(compliance["non_compliant_paths"]) == 1

def test_epic_analyzer(sample_config, sample_datetime):
    """Test epic analysis"""
    # Create epic with child issues
    child_issues = [
        IssueData(
            key="CHILD-1",
            summary="Child 1",
            current_status="Done",
            created_date=sample_datetime,
            cycle_times={},
            total_cycle_time=2.0,
            transitions=[
                StatusChange("To Do", "In Progress", sample_datetime),
                StatusChange("In Progress", "Done", sample_datetime + timedelta(days=2))
            ],
            epic_key="EPIC-1",
            epic_summary="Test Epic"
        ),
        IssueData(
            key="CHILD-2",
            summary="Child 2",
            current_status="Done",
            created_date=sample_datetime,
            cycle_times={},
            total_cycle_time=3.0,
            transitions=[
                StatusChange("To Do", "In Progress", sample_datetime + timedelta(days=1)),
                StatusChange("In Progress", "Done", sample_datetime + timedelta(days=4))
            ],
            epic_key="EPIC-1",
            epic_summary="Test Epic"
        )
    ]
    
    analyzer = EpicAnalyzer(sample_config)
    result = analyzer.analyze(child_issues)
    
    assert "epic_data" in result
    assert len(result["epic_data"]) == 1
    
    # Verify epic data structure
    epic = result["epic_data"][0]
    assert isinstance(epic.key, str)
    assert isinstance(epic.summary, str)
    assert isinstance(epic.children, list)
    assert isinstance(epic.start_time, datetime)
    assert isinstance(epic.end_time, datetime)
    assert isinstance(epic.lead_time, float)
    
    # Verify field values
    assert epic.key == "EPIC-1"
    assert epic.summary == "Test Epic"
    assert len(epic.children) == 2
    assert all(isinstance(child, str) for child in epic.children)
    assert all(child.startswith("CHILD-") for child in epic.children)
    
    # Verify timestamps
    assert epic.start_time.tzinfo == timezone.utc
    assert epic.end_time.tzinfo == timezone.utc
    assert epic.start_time <= epic.end_time
    
    # Verify lead time calculation
    expected_lead_time = (epic.end_time - epic.start_time).total_seconds() / 86400  # Convert to days
    assert abs(epic.lead_time - expected_lead_time) < 0.001  # Allow for floating point precision
    assert epic.lead_time > 0

def test_epic_analyzer_with_time_range(sample_config, sample_datetime):
    """Test epic analysis with time range"""
    config = sample_config.copy()
    config["time_range"] = TimeRange(
        start_date=sample_datetime,
        end_date=sample_datetime + timedelta(days=2)
    )
    
    child_issues = [
        IssueData(
            key="CHILD-1",
            summary="Child 1",
            current_status="Done",
            created_date=sample_datetime,
            cycle_times={},
            total_cycle_time=1.0,
            transitions=[
                StatusChange("To Do", "Done", sample_datetime + timedelta(days=1))
            ],
            epic_key="EPIC-1"
        )
    ]
    
    analyzer = EpicAnalyzer(config)
    result = analyzer.analyze(child_issues)
    
    assert len(result["epic_data"]) == 1
    assert result["epic_data"][0].lead_time <= 2.0  # Should be limited by time range

@patch('app.core.analysis.components.logger')
def test_component_logging(mock_logger, sample_config, sample_issue):
    """Test component logging"""
    analyzers = [
        FlowMetricsAnalyzer(sample_config),
        BottleneckAnalyzer(sample_config),
        CFDAnalyzer(sample_config),
        FlowEfficiencyAnalyzer(sample_config),
        WorkflowComplianceAnalyzer(sample_config),
        EpicAnalyzer(sample_config)
    ]
    
    for analyzer in analyzers:
        analyzer.analyze([sample_issue])
    
    assert mock_logger.info.called
