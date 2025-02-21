import pytest
from datetime import datetime, timezone
from typing import Dict, Any, List
from app.core.analysis.base import BaseAnalysisComponent
from app.core.models import IssueData, StatusChange
from app.core.interfaces import IAnalysisComponent

@pytest.fixture
def sample_config():
    """Create sample configuration"""
    return {
        "workflow": {
            "statuses": ["To Do", "In Progress", "Done"],
            "expected_path": ["To Do", "In Progress", "Done"]
        },
        "start_states": ["To Do"],
        "end_states": ["Done"],
        "active_statuses": ["In Progress"]
    }

@pytest.fixture
def sample_issue():
    """Create sample issue data"""
    return IssueData(
        key="TEST-1",
        summary="Test Issue",
        current_status="Done",
        created_date=datetime.now(timezone.utc),
        cycle_times={"In Progress": 1.0},
        total_cycle_time=2.0,
        transitions=[
            StatusChange("To Do", "In Progress", datetime.now(timezone.utc))
        ]
    )

def test_base_component_initialization(sample_config):
    """Test base component initialization"""
    class TestComponent(BaseAnalysisComponent):
        def _perform_analysis(self, issues):
            return {"test": True}
    
    component = TestComponent(sample_config)
    assert isinstance(component, IAnalysisComponent)
    assert component.config == sample_config

def test_empty_result():
    """Test empty result handling"""
    class TestComponent(BaseAnalysisComponent):
        def _perform_analysis(self, issues):
            return {"test": True}
        
        def _empty_result(self):
            return {"empty": True}
    
    component = TestComponent({})
    result = component.analyze([])
    
    assert result == {"empty": True}

def test_perform_analysis(sample_config, sample_issue):
    """Test analysis execution"""
    class TestComponent(BaseAnalysisComponent):
        def _perform_analysis(self, issues):
            return {
                "issue_count": len(issues),
                "first_key": issues[0].key if issues else None
            }
    
    component = TestComponent(sample_config)
    result = component.analyze([sample_issue])
    
    assert result["issue_count"] == 1
    assert result["first_key"] == "TEST-1"

def test_not_implemented_error(sample_config):
    """Test NotImplementedError for abstract method"""
    component = BaseAnalysisComponent(sample_config)
    
    with pytest.raises(NotImplementedError):
        component.analyze([sample_issue])

def test_config_access(sample_config):
    """Test configuration access in subclass"""
    class TestComponent(BaseAnalysisComponent):
        def _perform_analysis(self, issues):
            return {
                "workflow": self.config["workflow"],
                "start_states": self.config["start_states"]
            }
    
    component = TestComponent(sample_config)
    result = component.analyze([])  # Empty analysis to test config access
    
    assert result["workflow"] == sample_config["workflow"]
    assert result["start_states"] == sample_config["start_states"]

def test_multiple_instances(sample_config):
    """Test multiple component instances"""
    class TestComponent(BaseAnalysisComponent):
        def _perform_analysis(self, issues):
            return {"instance_id": id(self)}
    
    component1 = TestComponent(sample_config)
    component2 = TestComponent(sample_config)
    
    result1 = component1.analyze([])
    result2 = component2.analyze([])
    
    assert result1["instance_id"] != result2["instance_id"]

def test_config_isolation(sample_config):
    """Test configuration isolation between instances"""
    class TestComponent(BaseAnalysisComponent):
        def _perform_analysis(self, issues):
            return {"config_id": id(self.config)}
    
    component1 = TestComponent(sample_config)
    
    # Modify config for second instance
    modified_config = sample_config.copy()
    modified_config["new_field"] = "test"
    component2 = TestComponent(modified_config)
    
    assert component1.config != component2.config
    assert "new_field" not in component1.config
    assert "new_field" in component2.config

def test_inheritance_chain():
    """Test inheritance chain"""
    class BaseTestComponent(BaseAnalysisComponent):
        def _perform_analysis(self, issues):
            return {"base": True}
    
    class DerivedTestComponent(BaseTestComponent):
        def _perform_analysis(self, issues):
            base_result = super()._perform_analysis(issues)
            base_result.update({"derived": True})
            return base_result
    
    component = DerivedTestComponent({})
    result = component.analyze([])
    
    assert result["base"] is True
    assert result["derived"] is True

def test_empty_config():
    """Test handling of empty configuration"""
    class TestComponent(BaseAnalysisComponent):
        def _perform_analysis(self, issues):
            return {"config_empty": not bool(self.config)}
    
    component = TestComponent({})
    result = component.analyze([])
    
    assert result["config_empty"] is True

def test_analysis_error_handling(sample_config):
    """Test error handling in analysis"""
    class ErrorComponent(BaseAnalysisComponent):
        def _perform_analysis(self, issues):
            raise ValueError("Analysis error")
    
    component = ErrorComponent(sample_config)
    
    with pytest.raises(ValueError) as exc:
        component.analyze([sample_issue])
    assert "Analysis error" in str(exc.value)

def test_custom_empty_result(sample_config):
    """Test custom empty result implementation"""
    class CustomEmptyComponent(BaseAnalysisComponent):
        def _empty_result(self):
            return {
                "status": "empty",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        def _perform_analysis(self, issues):
            return {"status": "analyzed"}
    
    component = CustomEmptyComponent(sample_config)
    result = component.analyze([])
    
    assert result["status"] == "empty"
    assert "timestamp" in result

def test_analysis_template_method(sample_config, sample_issue):
    """Test template method pattern"""
    analysis_steps = []
    
    class TemplateComponent(BaseAnalysisComponent):
        def _empty_result(self):
            analysis_steps.append("empty_check")
            return super()._empty_result()
        
        def _perform_analysis(self, issues):
            analysis_steps.append("analysis")
            return {"done": True}
    
    component = TemplateComponent(sample_config)
    component.analyze([])  # Empty case
    component.analyze([sample_issue])  # Non-empty case
    
    assert analysis_steps == ["empty_check", "analysis"]
