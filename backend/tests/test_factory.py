import pytest
from unittest.mock import Mock, patch
from app.core.analysis.factory import AnalysisComponentFactory
from app.core.interfaces import IAnalysisComponent
from app.core.analysis.components import (
    FlowMetricsAnalyzer,
    BottleneckAnalyzer,
    CFDAnalyzer,
    FlowEfficiencyAnalyzer,
    WorkflowComplianceAnalyzer,
    EpicAnalyzer
)

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

def test_create_component(sample_config):
    """Test creating individual components"""
    component_types = [
        "flow_metrics",
        "bottlenecks",
        "cfd",
        "flow_efficiency",
        "workflow_compliance",
        "epics"
    ]
    
    for component_type in component_types:
        component = AnalysisComponentFactory.create(component_type, sample_config)
        assert isinstance(component, IAnalysisComponent)
        assert component.config == sample_config

def test_create_invalid_component(sample_config):
    """Test creating invalid component type"""
    with pytest.raises(ValueError) as exc:
        AnalysisComponentFactory.create("invalid_type", sample_config)
    assert "Unknown component type" in str(exc.value)

def test_create_all_components(sample_config):
    """Test creating all registered components"""
    components = AnalysisComponentFactory.create_all(sample_config)
    
    assert isinstance(components, dict)
    assert "flow_metrics" in components
    assert "bottlenecks" in components
    assert "cfd" in components
    assert "flow_efficiency" in components
    assert "workflow_compliance" in components
    assert "epics" in components
    
    assert all(isinstance(c, IAnalysisComponent) for c in components.values())
    assert all(c.config == sample_config for c in components.values())

def test_component_registration():
    """Test registering new component"""
    # Create mock component class
    class MockComponent(IAnalysisComponent):
        def __init__(self, config):
            self.config = config
        
        def analyze(self, issues):
            return {"mock_result": True}
    
    # Register new component
    AnalysisComponentFactory.register("mock_component", MockComponent)
    
    # Verify registration
    assert "mock_component" in AnalysisComponentFactory._components
    assert AnalysisComponentFactory._components["mock_component"] == MockComponent

def test_component_override():
    """Test overriding existing component"""
    original_component = AnalysisComponentFactory._components["flow_metrics"]
    
    try:
        # Create and register mock component
        class MockComponent(IAnalysisComponent):
            def __init__(self, config):
                self.config = config
            
            def analyze(self, issues):
                return {"mock_result": True}
        
        AnalysisComponentFactory.register("flow_metrics", MockComponent)
        
        # Verify override
        assert AnalysisComponentFactory._components["flow_metrics"] == MockComponent
        assert AnalysisComponentFactory._components["flow_metrics"] != original_component
        
    finally:
        # Restore original component
        AnalysisComponentFactory._components["flow_metrics"] = original_component

def test_component_initialization(sample_config):
    """Test component initialization with config"""
    component = AnalysisComponentFactory.create("flow_metrics", sample_config)
    
    assert isinstance(component, FlowMetricsAnalyzer)
    assert component.config == sample_config
    assert "workflow" in component.config
    assert "start_states" in component.config
    assert "end_states" in component.config

def test_factory_state_isolation():
    """Test factory state isolation between tests"""
    initial_components = set(AnalysisComponentFactory._components.keys())
    
    # Add temporary component
    class TempComponent(IAnalysisComponent):
        def __init__(self, config):
            self.config = config
        
        def analyze(self, issues):
            return {"temp_result": True}
    
    AnalysisComponentFactory.register("temp_component", TempComponent)
    
    # Verify temporary component added
    assert "temp_component" in AnalysisComponentFactory._components
    
    # Remove temporary component
    del AnalysisComponentFactory._components["temp_component"]
    
    # Verify state restored
    assert set(AnalysisComponentFactory._components.keys()) == initial_components

def test_component_type_validation():
    """Test component type validation"""
    class InvalidComponent:  # Does not implement IAnalysisComponent
        def __init__(self, config):
            self.config = config
    
    with pytest.raises(TypeError):
        AnalysisComponentFactory.register("invalid", InvalidComponent)

def test_default_components():
    """Test default component registration"""
    default_components = {
        "flow_metrics": FlowMetricsAnalyzer,
        "bottlenecks": BottleneckAnalyzer,
        "cfd": CFDAnalyzer,
        "flow_efficiency": FlowEfficiencyAnalyzer,
        "workflow_compliance": WorkflowComplianceAnalyzer,
        "epics": EpicAnalyzer
    }
    
    for name, component_class in default_components.items():
        assert name in AnalysisComponentFactory._components
        assert AnalysisComponentFactory._components[name] == component_class

def test_component_creation_error_handling(sample_config):
    """Test error handling during component creation"""
    # Mock component that raises error during initialization
    class ErrorComponent(IAnalysisComponent):
        def __init__(self, config):
            raise ValueError("Initialization error")
        
        def analyze(self, issues):
            return {}
    
    AnalysisComponentFactory.register("error_component", ErrorComponent)
    
    with pytest.raises(ValueError) as exc:
        AnalysisComponentFactory.create("error_component", sample_config)
    assert "Initialization error" in str(exc.value)

def test_create_all_with_partial_failure(sample_config):
    """Test create_all with some components failing"""
    # Mock component that raises error
    class ErrorComponent(IAnalysisComponent):
        def __init__(self, config):
            raise ValueError("Initialization error")
        
        def analyze(self, issues):
            return {}
    
    # Register error component
    original_component = AnalysisComponentFactory._components["flow_metrics"]
    AnalysisComponentFactory._components["flow_metrics"] = ErrorComponent
    
    try:
        # Should still create other components even if one fails
        components = AnalysisComponentFactory.create_all(sample_config)
        
        assert "bottlenecks" in components
        assert "cfd" in components
        assert "flow_metrics" not in components
        
    finally:
        # Restore original component
        AnalysisComponentFactory._components["flow_metrics"] = original_component

def test_component_registration_thread_safety():
    """Test thread safety of component registration"""
    import threading
    
    class ThreadSafeComponent(IAnalysisComponent):
        def __init__(self, config):
            self.config = config
        
        def analyze(self, issues):
            return {"thread_safe": True}
    
    def register_component():
        AnalysisComponentFactory.register(
            f"thread_component_{threading.get_ident()}",
            ThreadSafeComponent
        )
    
    # Create multiple threads to register components
    threads = [threading.Thread(target=register_component) for _ in range(5)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    
    # Verify all components were registered
    thread_components = [name for name in AnalysisComponentFactory._components.keys()
                        if name.startswith("thread_component_")]
    assert len(thread_components) == 5
