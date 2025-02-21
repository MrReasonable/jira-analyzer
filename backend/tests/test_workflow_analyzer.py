import pytest
from datetime import datetime, timezone, timedelta
from app.core.workflow_analyzer import WorkflowAnalyzer
from app.core.models import StatusChange, TimeRange

@pytest.fixture
def analyzer():
    """Create workflow analyzer with standard workflow"""
    return WorkflowAnalyzer(["To Do", "In Progress", "Review", "Done"])

@pytest.fixture
def sample_datetime():
    """Create sample datetime"""
    return datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)

@pytest.fixture
def sample_transitions(sample_datetime):
    """Create sample transitions through workflow"""
    return [
        StatusChange("To Do", "To Do", sample_datetime),  # Initial state
        StatusChange("To Do", "In Progress", sample_datetime + timedelta(days=1)),
        StatusChange("In Progress", "Review", sample_datetime + timedelta(days=2)),
        StatusChange("Review", "Done", sample_datetime + timedelta(days=3))
    ]

def test_workflow_initialization():
    """Test workflow analyzer initialization"""
    expected_path = ["To Do", "In Progress", "Done"]
    analyzer = WorkflowAnalyzer(expected_path)
    
    assert analyzer.expected_path == expected_path
    assert analyzer.status_order == {"To Do": 0, "In Progress": 1, "Done": 2}

def test_forward_transition(analyzer):
    """Test forward transition detection"""
    assert analyzer._is_forward_transition("To Do", "In Progress") is True
    assert analyzer._is_forward_transition("In Progress", "Review") is True
    assert analyzer._is_forward_transition("Review", "Done") is True
    
    # Invalid transitions
    assert analyzer._is_forward_transition("Done", "To Do") is False
    assert analyzer._is_forward_transition("Invalid", "To Do") is False

def test_backward_transition(analyzer):
    """Test backward transition detection"""
    assert analyzer._is_backward_transition("In Progress", "To Do") is True
    assert analyzer._is_backward_transition("Done", "Review") is True
    
    # Invalid transitions
    assert analyzer._is_backward_transition("To Do", "In Progress") is False
    assert analyzer._is_backward_transition("Invalid", "To Do") is False

def test_calculate_status_periods(analyzer, sample_transitions):
    """Test status periods calculation"""
    periods = analyzer.calculate_status_periods(sample_transitions, "Done")
    
    assert "To Do" in periods
    assert "In Progress" in periods
    assert "Review" in periods
    assert "Done" in periods
    
    # Verify period durations
    to_do_periods = periods["To Do"]
    assert len(to_do_periods) == 1
    assert (to_do_periods[0][1] - to_do_periods[0][0]).days == 1

def test_calculate_cycle_time(analyzer, sample_transitions):
    """Test cycle time calculation"""
    total_time, breakdowns, periods = analyzer.calculate_cycle_time(
        sample_transitions, "Done"
    )
    
    assert total_time > 0
    assert len(breakdowns) > 0
    assert all(b.duration > 0 for b in breakdowns)
    assert sum(b.duration for b in breakdowns) == pytest.approx(total_time)
    
    # Verify breakdown structure
    for breakdown in breakdowns:
        assert isinstance(breakdown.start_state, str)
        assert isinstance(breakdown.end_state, str)
        assert isinstance(breakdown.duration, float)
        assert isinstance(breakdown.transitions, list)
        assert all(isinstance(t, StatusChange) for t in breakdown.transitions)
        
    # Verify period structure
    for status, status_periods in periods.items():
        assert isinstance(status, str)
        assert isinstance(status_periods, list)
        for start, end in status_periods:
            assert isinstance(start, datetime)
            assert isinstance(end, datetime)
            assert start.tzinfo == timezone.utc
            assert end.tzinfo == timezone.utc

def test_cycle_time_with_time_range(analyzer, sample_transitions, sample_datetime):
    """Test cycle time calculation with time range"""
    time_range = TimeRange(
        start_date=sample_datetime,
        end_date=sample_datetime + timedelta(days=2)
    )
    
    total_time, breakdowns, periods = analyzer.calculate_cycle_time(
        sample_transitions, "Done", time_range
    )
    
    assert total_time > 0
    assert total_time <= 2.0  # Should only count time within range

def test_cycle_time_for_cfd(analyzer, sample_transitions, sample_datetime):
    """Test cycle time calculation for CFD"""
    time_range = TimeRange(
        start_date=sample_datetime,
        end_date=sample_datetime + timedelta(days=4)
    )
    
    total_time, breakdowns, periods = analyzer.calculate_cycle_time(
        sample_transitions, "Done", time_range, for_cfd=True
    )
    
    assert total_time > 0
    assert len(periods) == 4  # All statuses should have periods

def test_flow_efficiency(analyzer, sample_transitions):
    """Test flow efficiency calculation"""
    active_statuses = ["In Progress", "Review"]
    efficiency = analyzer.analyze_flow_efficiency(
        sample_transitions, "Done", active_statuses
    )
    
    assert 0 <= efficiency <= 100
    assert efficiency > 0  # Should have some active time

def test_flow_efficiency_no_active_time(analyzer, sample_transitions):
    """Test flow efficiency with no active time"""
    active_statuses = ["Invalid Status"]
    efficiency = analyzer.analyze_flow_efficiency(
        sample_transitions, "Done", active_statuses
    )
    
    assert efficiency == 0

def test_detect_bottlenecks(analyzer, sample_transitions):
    """Test bottleneck detection"""
    bottlenecks = analyzer.detect_bottlenecks(sample_transitions, "Done")
    
    assert isinstance(bottlenecks, list)
    assert len(bottlenecks) > 0
    
    # Verify structure and types of each bottleneck
    for bottleneck in bottlenecks:
        assert isinstance(bottleneck, dict)
        assert 'status' in bottleneck
        assert 'avg_time' in bottleneck
        assert 'bottleneck_score' in bottleneck
        assert 'impact' in bottleneck
        assert 'times_entered' in bottleneck
        
        assert isinstance(bottleneck['status'], str)
        assert isinstance(bottleneck['avg_time'], float)
        assert isinstance(bottleneck['bottleneck_score'], float)
        assert isinstance(bottleneck['impact'], str)
        assert isinstance(bottleneck['times_entered'], int)
        
        # Verify value ranges
        assert bottleneck['avg_time'] >= 0
        assert bottleneck['bottleneck_score'] >= 0
        assert bottleneck['times_entered'] > 0
        assert bottleneck['impact'] in ['Low', 'Medium', 'High']
    
    # Verify bottlenecks are sorted by score
    scores = [b['bottleneck_score'] for b in bottlenecks]
    assert scores == sorted(scores, reverse=True)

def test_status_periods_with_skipped_states(analyzer, sample_datetime):
    """Test status periods with skipped states"""
    # Create transitions that skip a state
    transitions = [
        StatusChange("To Do", "To Do", sample_datetime),
        StatusChange("To Do", "Review", sample_datetime + timedelta(days=1)),  # Skip In Progress
        StatusChange("Review", "Done", sample_datetime + timedelta(days=2))
    ]
    
    periods = analyzer.calculate_status_periods(transitions, "Done")
    assert "In Progress" in periods
    assert len(periods["In Progress"]) == 0  # Should have empty periods for skipped state

def test_cycle_time_with_backward_transitions(analyzer, sample_datetime):
    """Test cycle time with backward transitions"""
    transitions = [
        StatusChange("To Do", "To Do", sample_datetime),
        StatusChange("To Do", "In Progress", sample_datetime + timedelta(days=1)),
        StatusChange("In Progress", "To Do", sample_datetime + timedelta(days=2)),  # Backward
        StatusChange("To Do", "In Progress", sample_datetime + timedelta(days=3)),
        StatusChange("In Progress", "Done", sample_datetime + timedelta(days=4))
    ]
    
    total_time, breakdowns, periods = analyzer.calculate_cycle_time(
        transitions, "Done"
    )
    
    assert total_time > 0
    assert len(breakdowns) > 0
    # Should include time in repeated states
    assert sum(len(periods[status]) for status in periods) > len(analyzer.expected_path)

def test_bottleneck_scoring(analyzer, sample_datetime):
    """Test bottleneck scoring system"""
    transitions = [
        StatusChange("To Do", "To Do", sample_datetime),
        StatusChange("To Do", "In Progress", sample_datetime + timedelta(days=1)),
        StatusChange("In Progress", "Review", sample_datetime + timedelta(days=3)),  # Long review
        StatusChange("Review", "In Progress", sample_datetime + timedelta(days=4)),  # Back to In Progress
        StatusChange("In Progress", "Review", sample_datetime + timedelta(days=5)),  # Multiple entries
        StatusChange("Review", "Done", sample_datetime + timedelta(days=7))
    ]
    
    bottlenecks = analyzer.detect_bottlenecks(transitions, "Done")
    
    # Review should be top bottleneck due to long duration and multiple entries
    assert bottlenecks[0]['status'] == "Review"
    assert bottlenecks[0]['times_entered'] > 1

def test_empty_transitions(analyzer):
    """Test handling of empty transitions"""
    total_time, breakdowns, periods = analyzer.calculate_cycle_time([], "To Do")
    
    assert total_time == 0
    assert len(breakdowns) == 0
    assert all(len(periods[status]) == 0 for status in periods)

def test_timezone_handling(analyzer):
    """Test handling of different timezones"""
    # Create transitions with different timezone offsets
    utc_time = datetime.now(timezone.utc)
    est_time = datetime.now(timezone(timedelta(hours=-5)))
    
    transitions = [
        StatusChange("To Do", "To Do", utc_time),
        StatusChange("To Do", "In Progress", est_time),
        StatusChange("In Progress", "Done", utc_time + timedelta(days=1))
    ]
    
    total_time, breakdowns, periods = analyzer.calculate_cycle_time(
        transitions, "Done"
    )
    
    assert total_time > 0
    # Verify all period timestamps are in UTC
    for status, status_periods in periods.items():
        for start, end in status_periods:
            assert start.tzinfo == timezone.utc
            assert end.tzinfo == timezone.utc

def test_flow_efficiency_with_time_range(analyzer, sample_transitions, sample_datetime):
    """Test flow efficiency calculation with time range"""
    time_range = TimeRange(
        start_date=sample_datetime,
        end_date=sample_datetime + timedelta(days=2)
    )
    
    active_statuses = ["In Progress", "Review"]
    total_time, breakdowns, _ = analyzer.calculate_cycle_time(
        sample_transitions, "Done", time_range
    )
    
    efficiency = analyzer.analyze_flow_efficiency(
        sample_transitions, "Done", active_statuses
    )
    
    assert 0 <= efficiency <= 100
    assert efficiency > 0
