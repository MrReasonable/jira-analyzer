from typing import List, Dict, Any
from app.core.interfaces import IAnalysisComponent
from app.core.models import IssueData

class BaseAnalysisComponent(IAnalysisComponent):
    """Base class for analysis components"""
    def __init__(self, config: Dict[str, Any]):
        self.config = config

    def analyze(self, issues: List[IssueData]) -> Dict[str, Any]:
        """Template method for analysis"""
        if not issues:
            return self._empty_result()
        return self._perform_analysis(issues)

    def _empty_result(self) -> Dict[str, Any]:
        """Return empty result structure"""
        return {}

    def _perform_analysis(self, issues: List[IssueData]) -> Dict[str, Any]:
        """Implement specific analysis logic in subclasses"""
        raise NotImplementedError
