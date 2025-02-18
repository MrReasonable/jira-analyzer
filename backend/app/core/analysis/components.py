from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
import numpy as np
import logging
from app.core.analysis.base import BaseAnalysisComponent
from app.core.models import IssueData, CFDData, EpicData
from app.core.workflow_analyzer import WorkflowAnalyzer

logger = logging.getLogger(__name__)

class FlowMetricsAnalyzer(BaseAnalysisComponent):
    """Analyzes flow metrics like cycle time and throughput"""
    def _empty_result(self) -> Dict[str, Any]:
        cycle_time_stats = {
            "mean": 0.0,
            "median": 0.0,
            "p85": 0.0,
            "p95": 0.0,
            "std_dev": 0.0
        }
        return {
            "throughput": 0,
            "cycle_time": cycle_time_stats,
            "distribution": {},
            "flow_metrics": {
                "cycle_time": cycle_time_stats
            }
        }

    def _perform_analysis(self, issues: List[IssueData]) -> Dict[str, Any]:
        workflow_analyzer = WorkflowAnalyzer(self.config["workflow"]["expected_path"])
        time_range = None
        if self.config.get("time_range"):
            time_range = self.config["time_range"]

        cycle_times = []
        for issue in issues:
            # For lead time, we want the full history of completed items
            total_time, breakdowns, _ = workflow_analyzer.calculate_cycle_time(
                issue.transitions,
                issue.current_status,
                time_range,
                for_cfd=False
            )
            if total_time > 0:  # Only include if we got valid cycle time
                cycle_times.append(float(total_time))
        
        median = float(np.median(cycle_times))
        p85 = float(np.percentile(cycle_times, 85))
        p95 = float(np.percentile(cycle_times, 95))

        ranges = {
            "within_50th": [t for t in cycle_times if t <= median],
            "50th_to_85th": [t for t in cycle_times if median < t <= p85],
            "above_85th": [t for t in cycle_times if t > p85]
        }

        cycle_time_stats = {
            "mean": float(np.mean(cycle_times)),
            "median": median,
            "p85": p85,
            "p95": p95,
            "std_dev": float(np.std(cycle_times))
        }

        return {
            "throughput": len(issues),
            "cycle_time": cycle_time_stats,
            "distribution": {
                "within_50th": len(ranges["within_50th"]),
                "50th_to_85th": len(ranges["50th_to_85th"]),
                "above_85th": len(ranges["above_85th"])
            },
            "flow_metrics": {
                "cycle_time": cycle_time_stats
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
        workflow_analyzer = WorkflowAnalyzer(self.config["workflow"]["expected_path"])
        time_range = None
        if self.config.get("time_range"):
            time_range = self.config["time_range"]

        status_times = {}
        for issue in issues:
            _, breakdowns, _ = workflow_analyzer.calculate_cycle_time(
                issue.transitions,
                issue.current_status,
                time_range
            )
            for breakdown in breakdowns:
                if breakdown.start_state not in status_times:
                    status_times[breakdown.start_state] = []
                status_times[breakdown.start_state].append(float(breakdown.duration))

        distribution = {}
        bottlenecks = []
        
        for status, times in status_times.items():
            if not times:
                continue

            # Sort times for percentile calculations
            sorted_times = sorted(times)
            median = float(np.median(sorted_times))
            p85 = float(np.percentile(sorted_times, 85))
            p95 = float(np.percentile(sorted_times, 95))
            
            # Calculate averages for each range
            p50_85_times = [t for t in sorted_times if median < t <= p85]
            p85_95_times = [t for t in sorted_times if p85 < t <= p95]
            p95_100_times = [t for t in sorted_times if t > p95]
            
            metrics = {
                "mean": float(np.mean(sorted_times)),
                "median": median,
                "p85": p85,
                "p95": p95,
                "std_dev": float(np.std(sorted_times)),
                "p50_85_avg": float(np.mean(p50_85_times)) if p50_85_times else 0,
                "p85_95_avg": float(np.mean(p85_95_times)) if p85_95_times else 0,
                "p95_100_avg": float(np.mean(p95_100_times)) if p95_100_times else 0
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
        # Get time range from config
        time_range = self.config.get("time_range")

        # Generate all dates in range
        dates = []
        if time_range and time_range.start_date and time_range.end_date:
            current = time_range.start_date.date()
            while current <= time_range.end_date.date():
                dates.append(current)
                current += timedelta(days=1)
        else:
            # If no time range, use min/max dates from issues
            all_dates = set()
            for issue in issues:
                all_dates.add(issue.created_date.date())
                for transition in issue.transitions:
                    all_dates.add(transition.timestamp.date())
            if all_dates:
                min_date = min(all_dates)
                max_date = max(all_dates)
                current = min_date
                while current <= max_date:
                    dates.append(current)
                    current += timedelta(days=1)

        ordered_statuses = self.config["workflow"]["statuses"]
        status_counts = {status: [0] * len(dates) for status in ordered_statuses}
        wip_counts = [0] * len(dates)

        # Initialize arrays to track issue states over time
        issue_states = {issue.key: [None] * len(dates) for issue in issues}
        
        # First pass: Determine state for each issue on each date
        for issue in issues:
            # Find initial state at or before start date
            current_status = None
            if issue.created_date.date() <= dates[0]:
                before_start = [t for t in issue.transitions if t.timestamp.date() <= dates[0]]
                if before_start:
                    current_status = max(before_start, key=lambda t: t.timestamp).to_status
                else:
                    current_status = issue.transitions[0].from_status if issue.transitions else issue.current_status
            
            # Fill in states for each date
            for date_idx, date in enumerate(dates):
                # If issue not created yet, skip
                if date < issue.created_date.date():
                    continue
                    
                # Find any transitions on this date
                days_transitions = sorted(
                    [t for t in issue.transitions if t.timestamp.date() == date],
                    key=lambda t: t.timestamp
                )
                
                if days_transitions:
                    # Use final state for this day
                    current_status = days_transitions[-1].to_status
                
                # Record the state for this day
                issue_states[issue.key][date_idx] = current_status
        
        # Second pass: Calculate cumulative counts
        for date_idx in range(len(dates)):
            # Count issues in each status for this date
            status_totals = {status: 0 for status in ordered_statuses}
            
            for issue_key, states in issue_states.items():
                if states[date_idx] and states[date_idx] in ordered_statuses:
                    status_idx = ordered_statuses.index(states[date_idx])
                    # Add to this status and all earlier statuses
                    for i in range(status_idx + 1):
                        status_totals[ordered_statuses[i]] += 1
            
            # Update the cumulative counts
            for status in ordered_statuses:
                status_counts[status][date_idx] = status_totals[status]
                
            # Update WIP count
            wip_count = sum(
                1 for states in issue_states.values()
                if states[date_idx] 
                and states[date_idx] not in self.config["end_states"]
                and states[date_idx] not in self.config["start_states"]
            )
            wip_counts[date_idx] = wip_count

        return {
            "cfd_data": CFDData(
                dates=[datetime.combine(d, datetime.min.time()).replace(tzinfo=timezone.utc) for d in dates],
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

        time_range = None
        if self.config.get("time_range"):
            time_range = self.config["time_range"]

        for issue in issues:
            total_time, breakdowns, status_periods = workflow_analyzer.calculate_cycle_time(
                issue.transitions,
                issue.current_status,
                time_range
            )

            # Calculate active time based on selected method
            method = self.config.get("flow_efficiency_method", "active_statuses")
            active_time = 0
            efficiency = 0

            if method == "time_logged":
                # Calculate using time logged (convert from seconds to days)
                active_time = float(issue.time_spent) / 86400.0 if issue.time_spent else 0.0
                efficiency = (active_time / total_time * 100.0) if total_time > 0 else 0.0
            else:  # method == "active_statuses"
                # Calculate using active statuses
                for status, periods in status_periods.items():
                    if status in self.config.get("active_statuses", []):
                        active_time += sum(
                            (end - start).total_seconds() / 86400
                            for start, end in periods
                        )
                efficiency = (active_time / total_time * 100) if total_time > 0 else 0

            logger.info(f"Flow efficiency for {issue.key}: method={method}, time_spent={issue.time_spent}, total_time={total_time}, active_time={active_time}, efficiency={efficiency}")
            efficiency_data.append({
                "issue_key": issue.key,
                "total_time": total_time,
                "active_time": active_time,
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

class EpicAnalyzer(BaseAnalysisComponent):
    """Analyzes epic metrics and relationships"""
    def _empty_result(self) -> Dict[str, Any]:
        return {
            "epic_data": []
        }

    def _perform_analysis(self, issues: List[IssueData]) -> Dict[str, Any]:
        # Get time range
        time_range = self.config.get("time_range")

        # Group issues by epic
        epic_issues = {}
        for issue in issues:
            if issue.epic_key:
                if issue.epic_key not in epic_issues:
                    epic_issues[issue.epic_key] = []
                epic_issues[issue.epic_key].append(issue)

        # Calculate epic metrics
        epic_data = []
        for epic_key, epic_children in epic_issues.items():
            # Filter transitions to time range
            filtered_children = []
            for issue in epic_children:
                filtered_transitions = []
                for transition in issue.transitions:
                    if time_range and time_range.start_date and time_range.end_date:
                        transition_time = transition.timestamp.replace(tzinfo=timezone.utc) if transition.timestamp.tzinfo is None else transition.timestamp
                        if time_range.start_date <= transition_time <= time_range.end_date:
                            filtered_transitions.append(transition)
                    else:
                        filtered_transitions.append(transition)
                if filtered_transitions:
                    issue.transitions = filtered_transitions
                    filtered_children.append(issue)

            if not filtered_children:
                continue

            # Check if all stories are done
            all_stories_done = all(issue.current_status in self.config["end_states"] for issue in filtered_children)
            if not all_stories_done:
                continue

            # Find start time (first time any story started)
            start_times = []
            for issue in filtered_children:
                if issue.transitions:
                    first_active_transition = None
                    for transition in issue.transitions:
                        if transition.to_status not in self.config["end_states"]:
                            first_active_transition = transition
                            break
                    if first_active_transition:
                        start_times.append(first_active_transition.timestamp)

            # Find end time (last time any story moved to done)
            end_times = []
            for issue in filtered_children:
                if issue.transitions:
                    last_transition = max(issue.transitions, key=lambda t: t.timestamp)
                    if last_transition.to_status in self.config["end_states"]:
                        end_times.append(last_transition.timestamp)

            if not start_times or not end_times:  # Skip if no valid times found
                continue

            start_time = min(start_times)
            end_time = max(end_times)
            
            # Calculate lead time
            lead_time = (end_time - start_time).total_seconds() / 86400  # Convert to days

            epic_data.append(EpicData(
                key=epic_key,
                summary=epic_children[0].epic_summary if hasattr(epic_children[0], 'epic_summary') else "",
                children=[issue.key for issue in epic_children],
                start_time=start_time,
                end_time=end_time,
                lead_time=lead_time
            ))

        return {
            "epic_data": epic_data
        }
