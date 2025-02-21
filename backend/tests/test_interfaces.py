import pytest
from datetime import datetime, timezone
from typing import List, Dict, Any
from abc import ABC
from app.core.interfaces import (
    IssueTrackingSystem,
    IssueDataProcessor,
    IMetricsAnalyzer,
    IWorkflowAnalyzer,
    IReportGenerator,
    IAnalysisComponent
)
from app.core.models import IssueData, AnalysisResult, StatusChange

class ValidIssueTracker(IssueTrackingSystem):
    """Valid implementation of IssueTrackingSystem"""
    def fetch_issues(self, query: str, start_at: int, batch_size: int) -> List[Any]:
        return []
    
    def process_issue(self, raw_issue: Any) -> IssueData:
        return IssueData(
            key="TEST-1",
            summary="Test",
            current_status="Done",
            created_date=datetime.now(timezone.utc),
            transitions=[],
            cycle_times={},
            total_cycle_time=0.0,
            time_spent=None,
            original_estimate=None,
            epic_key=None,
            epic_summary=None,
            parent_key=None,
            subtask_keys=[]
        )

class ValidProcessor(IssueDataProcessor):
    """Valid implementation of IssueDataProcessor"""
    def process(self, raw_issue: Any) -> IssueData:
        return IssueData(
            key="TEST-1",
            summary="Test",
            current_status="Done",
            created_date=datetime.now(timezone.utc),
            transitions=[],
            cycle_times={},
            total_cycle_time=0.0,
            time_spent=None,
            original_estimate=None,
            epic_key=None,
            epic_summary=None,
            parent_key=None,
            subtask_keys=[]
        )

class ValidMetricsAnalyzer(IMetricsAnalyzer):
    """Valid implementation of IMetricsAnalyzer"""
    def analyze(self, issues: List[IssueData]) -> Dict[str, Any]:
        return {"metric": "value"}

class ValidWorkflowAnalyzer(IWorkflowAnalyzer):
    """Valid implementation of IWorkflowAnalyzer"""
    def calculate_status_periods(self, transitions: List[StatusChange], current_status: str) -> Dict[str, List[tuple[datetime, datetime]]]:
        return {}
    
    def analyze_flow_efficiency(self, transitions: List[StatusChange], current_status: str, active_statuses: List[str]) -> float:
        return 0.0

class ValidReportGenerator(IReportGenerator):
    """Valid implementation of IReportGenerator"""
    def generate(self, issues: List[IssueData], metrics: Dict[str, Any]) -> AnalysisResult:
        return AnalysisResult(
            total_issues=0,
            flow_metrics={},
            workflow_compliance={},
            bottlenecks=[],
            cycle_time_stats={},
            status_distribution={},
            end_states=[],
            issues=[],
            workflow={}
        )

class ValidAnalysisComponent(IAnalysisComponent):
    """Valid implementation of IAnalysisComponent"""
    def analyze(self, issues: List[IssueData]) -> Dict[str, Any]:
        return {"result": "value"}

def test_issue_tracking_system_interface():
    """Test IssueTrackingSystem interface"""
    # Valid implementation should work
    tracker = ValidIssueTracker()
    assert isinstance(tracker, IssueTrackingSystem)
    
    # Invalid implementation should fail
    with pytest.raises(TypeError):
        class InvalidTracker(IssueTrackingSystem):
            pass
        InvalidTracker()

def test_issue_data_processor_interface():
    """Test IssueDataProcessor interface"""
    # Valid implementation should work
    processor = ValidProcessor()
    assert isinstance(processor, IssueDataProcessor)
    
    # Invalid implementation should fail
    with pytest.raises(TypeError):
        class InvalidProcessor(IssueDataProcessor):
            pass
        InvalidProcessor()

def test_metrics_analyzer_interface():
    """Test IMetricsAnalyzer interface"""
    # Valid implementation should work
    analyzer = ValidMetricsAnalyzer()
    assert isinstance(analyzer, IMetricsAnalyzer)
    
    # Invalid implementation should fail
    with pytest.raises(TypeError):
        class InvalidAnalyzer(IMetricsAnalyzer):
            pass
        InvalidAnalyzer()

def test_workflow_analyzer_interface():
    """Test IWorkflowAnalyzer interface"""
    # Valid implementation should work
    analyzer = ValidWorkflowAnalyzer()
    assert isinstance(analyzer, IWorkflowAnalyzer)
    
    # Invalid implementation should fail
    with pytest.raises(TypeError):
        class InvalidAnalyzer(IWorkflowAnalyzer):
            pass
        InvalidAnalyzer()

def test_report_generator_interface():
    """Test IReportGenerator interface"""
    # Valid implementation should work
    generator = ValidReportGenerator()
    assert isinstance(generator, IReportGenerator)
    
    # Invalid implementation should fail
    with pytest.raises(TypeError):
        class InvalidGenerator(IReportGenerator):
            pass
        InvalidGenerator()

def test_analysis_component_interface():
    """Test IAnalysisComponent interface"""
    # Valid implementation should work
    component = ValidAnalysisComponent()
    assert isinstance(component, IAnalysisComponent)
    
    # Invalid implementation should fail
    with pytest.raises(TypeError):
        class InvalidComponent(IAnalysisComponent):
            pass
        InvalidComponent()

def test_method_signatures():
    """Test interface method signatures"""
    tracker = ValidIssueTracker()
    processor = ValidProcessor()
    metrics_analyzer = ValidMetricsAnalyzer()
    workflow_analyzer = ValidWorkflowAnalyzer()
    report_generator = ValidReportGenerator()
    component = ValidAnalysisComponent()
    
    # Test method calls with correct types
    assert isinstance(tracker.fetch_issues("query", 0, 10), list)
    assert isinstance(tracker.process_issue({}), IssueData)
    assert isinstance(processor.process({}), IssueData)
    assert isinstance(metrics_analyzer.analyze([]), dict)
    assert isinstance(workflow_analyzer.calculate_status_periods([], "status"), dict)
    assert isinstance(workflow_analyzer.analyze_flow_efficiency([], "status", []), float)
    assert isinstance(report_generator.generate([], {}), AnalysisResult)
    assert isinstance(component.analyze([]), dict)

def test_interface_inheritance():
    """Test interface inheritance patterns"""
    # Multiple interface implementation
    class MultiInterface(IMetricsAnalyzer, IWorkflowAnalyzer):
        def analyze(self, issues: List[IssueData]) -> Dict[str, Any]:
            return {}
        
        def calculate_status_periods(self, transitions: List[StatusChange], current_status: str) -> Dict[str, List[tuple[datetime, datetime]]]:
            return {}
        
        def analyze_flow_efficiency(self, transitions: List[StatusChange], current_status: str, active_statuses: List[str]) -> float:
            return 0.0
    
    multi = MultiInterface()
    assert isinstance(multi, IMetricsAnalyzer)
    assert isinstance(multi, IWorkflowAnalyzer)

def test_interface_type_checking():
    """Test interface type checking"""
    def process_with_tracker(tracker: IssueTrackingSystem):
        return tracker.fetch_issues("", 0, 10)
    
    def analyze_with_component(component: IAnalysisComponent):
        return component.analyze([])
    
    # Valid implementations should work
    tracker = ValidIssueTracker()
    component = ValidAnalysisComponent()
    
    assert process_with_tracker(tracker) == []
    assert analyze_with_component(component) == {"result": "value"}
    
    # Invalid types should fail type checking
    class InvalidClass:
        pass
    
    with pytest.raises(TypeError):
        process_with_tracker(InvalidClass())

def test_partial_implementation():
    """Test partial interface implementation"""
    # Partial implementation should fail
    with pytest.raises(TypeError):
        class PartialTracker(IssueTrackingSystem):
            def fetch_issues(self, query: str, start_at: int, batch_size: int) -> List[Any]:
                return []
            # Missing process_issue
        PartialTracker()

def test_interface_method_override():
    """Test interface method override"""
    class ExtendedAnalyzer(ValidMetricsAnalyzer):
        def analyze(self, issues: List[IssueData]) -> Dict[str, Any]:
            base_result = super().analyze(issues)
            base_result.update({"extended": True})
            return base_result
    
    analyzer = ExtendedAnalyzer()
    result = analyzer.analyze([])
    assert result["metric"] == "value"
    assert result["extended"] is True

def test_interface_composition():
    """Test interface composition"""
    class CompositeAnalyzer:
        def __init__(self):
            self.metrics_analyzer = ValidMetricsAnalyzer()
            self.workflow_analyzer = ValidWorkflowAnalyzer()
        
        def analyze(self, issues: List[IssueData]) -> Dict[str, Any]:
            metrics = self.metrics_analyzer.analyze(issues)
            workflow = {
                "periods": self.workflow_analyzer.calculate_status_periods([], "status"),
                "efficiency": self.workflow_analyzer.analyze_flow_efficiency([], "status", [])
            }
            return {"metrics": metrics, "workflow": workflow}
    
    analyzer = CompositeAnalyzer()
    result = analyzer.analyze([])
    assert "metrics" in result
    assert "workflow" in result
