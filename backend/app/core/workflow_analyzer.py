from datetime import datetime
from typing import List, Dict, Optional, Tuple
from app.core.models import StatusChange, CycleTimeBreakdown

class WorkflowAnalyzer:
    def __init__(self, expected_path: List[str]):
        """
        Initialize workflow analyzer with expected status order
        
        Args:
            expected_path: List of statuses in expected order
        """
        self.expected_path = expected_path
        self.status_order = {status: idx for idx, status in enumerate(expected_path)}

    def _is_forward_transition(self, from_status: str, to_status: str) -> bool:
        """Check if a transition moves forward in the workflow"""
        if from_status not in self.status_order or to_status not in self.status_order:
            return False
        return self.status_order[to_status] > self.status_order[from_status]

    def _is_backward_transition(self, from_status: str, to_status: str) -> bool:
        """Check if a transition moves backward in the workflow"""
        if from_status not in self.status_order or to_status not in self.status_order:
            return False
        return self.status_order[to_status] < self.status_order[from_status]

    def calculate_cycle_time(
        self,
        transitions: List[StatusChange],
        current_status: str
    ) -> Tuple[float, List[CycleTimeBreakdown], Dict[str, List[Tuple[datetime, datetime]]]]:
        """
        Calculate cycle time respecting workflow order
        
        Args:
            transitions: List of status changes
            current_status: Current issue status
            
        Returns:
            Tuple of (total_cycle_time, breakdowns, status_periods)
        """
        if not transitions:
            return 0.0, [], {}

        # Sort transitions by timestamp
        sorted_transitions = sorted(transitions, key=lambda x: x.timestamp)
        
        # Track time periods spent in each status
        status_periods: Dict[str, List[Tuple[datetime, datetime]]] = {
            status: [] for status in self.expected_path
        }
        
        # Track current period for each status
        current_periods: Dict[str, Optional[datetime]] = {
            status: None for status in self.expected_path
        }

        # Process transitions
        for i, transition in enumerate(sorted_transitions):
            from_status = transition.from_status
            to_status = transition.to_status
            
            # Close period for previous status if it exists
            if from_status in current_periods and current_periods[from_status] is not None:
                status_periods[from_status].append((
                    current_periods[from_status],
                    transition.timestamp
                ))
                current_periods[from_status] = None
            
            # Start period for new status
            if to_status in current_periods:
                current_periods[to_status] = transition.timestamp

        # Close any open periods
        now = datetime.utcnow()
        for status, start_time in current_periods.items():
            if start_time is not None:
                status_periods[status].append((start_time, now))

        # Calculate cycle time and breakdowns
        total_time = 0.0
        breakdowns = []
        
        for status in self.expected_path:
            status_time = 0.0
            periods = status_periods[status]
            
            for start, end in periods:
                period_time = (end - start).total_seconds() / 86400  # Convert to days
                status_time += period_time
            
            if status_time > 0:
                breakdowns.append(CycleTimeBreakdown(
                    status=status,
                    time=status_time,
                    periods=periods
                ))
                total_time += status_time

        return total_time, breakdowns, status_periods

    def analyze_flow_efficiency(
        self,
        transitions: List[StatusChange],
        current_status: str,
        active_statuses: List[str]
    ) -> float:
        """
        Calculate flow efficiency (active time / total time)
        
        Args:
            transitions: List of status changes
            current_status: Current issue status
            active_statuses: List of statuses considered "active work"
            
        Returns:
            Flow efficiency as a percentage
        """
        total_time, breakdowns, _ = self.calculate_cycle_time(transitions, current_status)
        
        if total_time <= 0:
            return 0.0
            
        active_time = sum(
            b.time for b in breakdowns 
            if b.status in active_statuses
        )
        
        return (active_time / total_time) * 100

    def detect_bottlenecks(
        self,
        transitions: List[StatusChange],
        current_status: str
    ) -> List[Dict]:
        """
        Detect workflow bottlenecks
        
        Args:
            transitions: List of status changes
            current_status: Current issue status
            
        Returns:
            List of bottleneck states with metrics
        """
        _, breakdowns, _ = self.calculate_cycle_time(transitions, current_status)
        
        bottlenecks = []
        for b in breakdowns:
            if b.time > 0:
                # Calculate metrics for bottleneck detection
                avg_time_in_status = b.time
                num_times_entered = len(b.periods)
                if num_times_entered > 1:
                    # Multiple entries might indicate a problem
                    bottleneck_score = avg_time_in_status * (num_times_entered - 1)
                else:
                    bottleneck_score = avg_time_in_status
                
                bottlenecks.append({
                    'status': b.status,
                    'avg_time': avg_time_in_status,
                    'times_entered': num_times_entered,
                    'bottleneck_score': bottleneck_score
                })
        
        # Sort by bottleneck score
        return sorted(bottlenecks, key=lambda x: x['bottleneck_score'], reverse=True)