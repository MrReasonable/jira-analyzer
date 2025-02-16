from typing import Dict, Any, Type
from app.core.interfaces import IAnalysisComponent
from app.core.analysis.components import (
    FlowMetricsAnalyzer,
    BottleneckAnalyzer,
    CFDAnalyzer,
    FlowEfficiencyAnalyzer,
    WorkflowComplianceAnalyzer,
    EpicAnalyzer
)

class AnalysisComponentFactory:
    """Factory for creating analysis components"""
    
    _components: Dict[str, Type[IAnalysisComponent]] = {
        "flow_metrics": FlowMetricsAnalyzer,
        "bottlenecks": BottleneckAnalyzer,
        "cfd": CFDAnalyzer,
        "flow_efficiency": FlowEfficiencyAnalyzer,
        "workflow_compliance": WorkflowComplianceAnalyzer,
        "epics": EpicAnalyzer
    }

    @classmethod
    def create(cls, component_type: str, config: Dict[str, Any]) -> IAnalysisComponent:
        """Create an analysis component of the specified type"""
        if component_type not in cls._components:
            raise ValueError(f"Unknown component type: {component_type}")
        
        component_class = cls._components[component_type]
        return component_class(config)

    @classmethod
    def create_all(cls, config: Dict[str, Any]) -> Dict[str, IAnalysisComponent]:
        """Create all registered analysis components"""
        return {
            name: component_class(config)
            for name, component_class in cls._components.items()
        }

    @classmethod
    def register(cls, name: str, component_class: Type[IAnalysisComponent]) -> None:
        """Register a new component type"""
        cls._components[name] = component_class
