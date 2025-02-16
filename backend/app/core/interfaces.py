from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.core.models import IssueData, AnalysisResult, StatusChange

class IssueTrackingSystem(ABC):
    """Interface for issue tracking systems like Jira"""
    @abstractmethod
    def fetch_issues(self, query: str, start_at: int, batch_size: int) -> List[Any]:
        """Fetch issues matching the query"""
        pass

    @abstractmethod
    def process_issue(self, raw_issue: Any) -> IssueData:
        """Process a raw issue into standardized IssueData"""
        pass

class IssueDataProcessor(ABC):
    """Interface for processing raw issue data"""
    @abstractmethod
    def process(self, raw_issue: Any) -> IssueData:
        """Process a raw issue into standardized IssueData"""
        pass

class IMetricsAnalyzer(ABC):
    """Interface for analyzing specific metrics"""
    @abstractmethod
    def analyze(self, issues: List[IssueData]) -> Dict[str, Any]:
        """Analyze issues and return metrics"""
        pass

class IWorkflowAnalyzer(ABC):
    """Interface for analyzing workflow patterns"""
    @abstractmethod
    def calculate_status_periods(self, transitions: List[StatusChange], current_status: str) -> Dict[str, List[tuple[datetime, datetime]]]:
        """Calculate time periods spent in each status"""
        pass

    @abstractmethod
    def analyze_flow_efficiency(self, transitions: List[StatusChange], current_status: str, active_statuses: List[str]) -> float:
        """Calculate flow efficiency"""
        pass

class IReportGenerator(ABC):
    """Interface for generating analysis reports"""
    @abstractmethod
    def generate(self, issues: List[IssueData], metrics: Dict[str, Any]) -> AnalysisResult:
        """Generate analysis report"""
        pass

class IAnalysisComponent(ABC):
    """Interface for analysis components"""
    @abstractmethod
    def analyze(self, issues: List[IssueData]) -> Dict[str, Any]:
        """Analyze issues and return component-specific metrics"""
        pass
