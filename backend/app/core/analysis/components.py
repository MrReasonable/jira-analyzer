from typing import List, Dict, Any
from datetime import datetime
import numpy as np
from app.core.analysis.base import BaseAnalysisComponent
from app.core.models import IssueData, CFDData
from app.core.workflow_analyzer import WorkflowAnalyzer

class FlowMetricsAnalyzer(BaseAnalysisComponent):
    """Analyzes flow metrics like cycle time and throughput"""
    def _empty_result(self) -> Dict[str, Any]:
        return {
            "throughput": 0,
            "cycle_time": {
                "mean": 0.0,
                "median": 0.0,
                "p85": 0.0,
                "p95": 0.0,
                "std_dev": 0.0
            },
            "distribution": {}
        }

    def _perform_analysis(self, issues: List[IssueData]) -> Dict[str, Any]:
        cycle_times = [float(issue.total_cycle_time) for issue in issues]
        
        median = float(np.median(cycle_times))
        p85 = float(np.percentile(cycle_times, 85))
        p95 = float(np.percentile(cycle_times, 95))

        ranges = {
            "within_50th": [t for t in cycle_times if t <= median],
            "50th_to_85th": [t for t in cycle_times if median < t <= p85],
            "above_85th": [t for t in cycle_times if t > p85]
        }

        return {
            "throughput": len(issues),
            "cycle_time": {
                "mean": float(np.mean(cycle_times)),
                "median": median,
                "p85": p85,
                "p95": p95,
                "std_dev": float(np.std(cycle_times))
            },
            "distribution": {
                "within_50th": len(ranges["within_50th"]),
                "50th_to_85th": len(ranges["50th_to_85th"]),
                "above_85th": len(ranges["above_85th"])
            }
        }

class BottleneckAnalyzer(BaseAnalysisComponent):
    """Analyzes workflow bottlenecks"""
    def _empty_result(self) -> Dict[str, Any]:
        return {
            "bottlenecks": [],
            "status_distribution": {}
        }

    def _perform_analysis(self, issues: List[IssueData]) -> Dict[str, Any]:
        status_times = {}
        for issue in issues:
            for status, time in issue.cycle_times.items():
                if status not in status_times:
                    status_times[status] = []
                status_times[status].append(float(time))

        distribution = {}
        bottlenecks = []
        
        for status, times in status_times.items():
            if not times:
                continue

            metrics = {
                "mean": float(np.mean(times)),
                "median": float(np.median(times)),
                "std_dev": float(np.std(times))
            }
            
            bottleneck_score = (metrics["mean"] * metrics["std_dev"]) / metrics["median"] if metrics["median"] > 0 else 0
            
            distribution[status] = metrics
            bottlenecks.append({
                "status": status,
                "avg_time": metrics["mean"],
                "std_dev": metrics["std_dev"],
                "bottleneck_score": bottleneck_score,
                "impact": "High" if bottleneck_score > 5 else "Medium" if bottleneck_score > 2 else "Low"
            })

        bottlenecks.sort(key=lambda x: x["bottleneck_score"], reverse=True)
        
        return {
            "bottlenecks": bottlenecks,
            "status_distribution": distribution
        }

class CFDAnalyzer(BaseAnalysisComponent):
    """Analyzes Cumulative Flow Diagram data"""
    def _empty_result(self) -> Dict[str, Any]:
        return {
            "cfd_data": CFDData(
                dates=[],
                status_counts={},
                wip_counts=[]
            )
        }

    def _perform_analysis(self, issues: List[IssueData]) -> Dict[str, Any]:
        all_dates = set()
        for issue in issues:
            all_dates.add(issue.created_date.date())
            for transition in issue.transitions:
                all_dates.add(transition.timestamp.date())
        
        dates = sorted(list(all_dates))
        ordered_statuses = self.config["workflow"]["statuses"]
        
        status_counts = {status: [0] * len(dates) for status in ordered_statuses}
        wip_counts = [0] * len(dates)
        
        for issue in issues:
            current_status = None
            transitions_by_date = {t.timestamp.date(): t for t in issue.transitions}
            
            for i, date in enumerate(dates):
                if date < issue.created_date.date():
                    continue
                    
                if date in transitions_by_date:
                    current_status = transitions_by_date[date].to_status
                elif current_status is None:
                    current_status = issue.transitions[0].from_status if issue.transitions else issue.current_status
                
                if current_status in status_counts:
                    status_counts[current_status][i] += 1
                    if current_status not in self.config["end_states"]:
                        wip_counts[i] += 1

        return {
            "cfd_data": CFDData(
                dates=[datetime.combine(d, datetime.min.time()) for d in dates],
                status_counts=status_counts,
                wip_counts=wip_counts
            )
        }

class FlowEfficiencyAnalyzer(BaseAnalysisComponent):
    """Analyzes flow efficiency metrics"""
    def _empty_result(self) -> Dict[str, Any]:
        return {
            "flow_efficiency_data": []
        }

    def _perform_analysis(self, issues: List[IssueData]) -> Dict[str, Any]:
        workflow_analyzer = WorkflowAnalyzer(self.config["workflow"]["expected_path"])
        efficiency_data = []

        for issue in issues:
            efficiency = workflow_analyzer.analyze_flow_efficiency(
                issue.transitions,
                issue.current_status,
                self.config.get("active_statuses", [])
            )

            efficiency_data.append({
                "issue_key": issue.key,
                "total_time": issue.total_cycle_time,
                "active_time": issue.time_spent / 86400 if issue.time_spent else 0,
                "efficiency": efficiency
            })

        return {
            "flow_efficiency_data": efficiency_data
        }

class WorkflowComplianceAnalyzer(BaseAnalysisComponent):
    """Analyzes workflow compliance"""
    def _empty_result(self) -> Dict[str, Any]:
        return {
            "workflow_compliance": {
                "compliant_issues": 0,
                "compliance_rate": 0.0,
                "non_compliant_paths": []
            }
        }

    def _perform_analysis(self, issues: List[IssueData]) -> Dict[str, Any]:
        expected_path = self.config["workflow"]["expected_path"]
        expected_upper = [s.upper() for s in expected_path]
        compliance_data = []
        
        for issue in issues:
            transitions = issue.transitions
            actual_path = [t.to_status for t in transitions]
            
            compliant = True
            current_idx = 0
            
            for status in actual_path:
                if current_idx >= len(expected_path):
                    compliant = False
                    break
                    
                status_upper = status.upper()
                if status_upper != expected_upper[current_idx]:
                    if status_upper in expected_upper[:current_idx]:
                        continue
                    elif status_upper in expected_upper[current_idx:]:
                        current_idx = expected_upper.index(status_upper)
                    else:
                        compliant = False
                        break
                else:
                    current_idx += 1
            
            compliance_data.append({
                "issue_key": issue.key,
                "compliant": compliant,
                "actual_path": " -> ".join(actual_path)
            })

        compliant_count = sum(1 for d in compliance_data if d["compliant"])
        
        return {
            "workflow_compliance": {
                "compliant_issues": compliant_count,
                "compliance_rate": (compliant_count / len(issues) * 100) if issues else 0.0,
                "non_compliant_paths": [d["actual_path"] for d in compliance_data if not d["compliant"]]
            }
        }
