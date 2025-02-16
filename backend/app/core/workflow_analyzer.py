from datetime import datetime, timezone
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

    def calculate_status_periods(
        self,
        transitions: List[StatusChange],
        current_status: str
    ) -> Dict[str, List[Tuple[datetime, datetime]]]:
        """
        Calculate time periods spent in each status, respecting workflow order
        
        Args:
            transitions: List of status changes
            current_status: Current issue status
            
        Returns:
            Dictionary mapping status to list of (start_time, end_time) tuples
        """
        status_periods: Dict[str, List[Tuple[datetime, datetime]]] = {
            status: [] for status in self.expected_path
        }
        
        if not transitions:
            # Handle items with no transitions - count time in current status if it's in workflow
            if current_status in self.expected_path:
                # For items with no transitions, we need their creation date
                # This will be provided by the first transition's from_status timestamp
                # or handled by the caller for completely new items
                return status_periods
            return status_periods

        sorted_transitions = sorted(transitions, key=lambda x: x.timestamp)
        first_transition = sorted_transitions[0]
        
        # Track the current status and its start time
        current_status_tracking = {
            'status': first_transition.from_status,
            'start_time': first_transition.timestamp
        }

        # Process transitions
        for transition in sorted_transitions:
            # If the current status is in our workflow, record the time period
            if current_status_tracking['status'] in self.expected_path:
                status_periods[current_status_tracking['status']].append((
                    current_status_tracking['start_time'],
                    transition.timestamp
                ))
            
            # Update tracking for new status
            current_status_tracking = {
                'status': transition.to_status,
                'start_time': transition.timestamp
            }

        # Handle the final/current status
        now = datetime.now(timezone.utc)
        if current_status_tracking['status'] in self.expected_path:
            status_periods[current_status_tracking['status']].append((
                current_status_tracking['start_time'],
                now
            ))

        return status_periods

    def calculate_cycle_time(
        self,
        transitions: List[StatusChange],
        current_status: str
    ) -> Tuple[float, List[CycleTimeBreakdown], Dict[str, List[Tuple[datetime, datetime]]]]:
        """
        Calculate cycle time respecting workflow order and handling skipped statuses
        
        Args:
            transitions: List of status changes
            current_status: Current issue status
            
        Returns:
            Tuple of (total_cycle_time, breakdowns, status_periods)
        """
        status_periods = self.calculate_status_periods(transitions, current_status)
        
        # Calculate cycle time and breakdowns
        total_time = 0.0
        breakdowns = []
        
        for status in self.expected_path:
            periods = status_periods[status]
            if not periods:
                continue
                
            status_time = sum(
                (end - start).total_seconds() / 86400  # Convert to days
                for start, end in periods
            )
            
            if status_time > 0:
                breakdowns.append(CycleTimeBreakdown(
                    start_state=status,
                    end_state=status,  # Same since this is time in a single status
                    duration=status_time,
                    transitions=[]  # We don't track individual transitions within a status
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
            b.duration for b in breakdowns 
            if b.start_state in active_statuses
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
            if b.duration > 0:
                # Calculate metrics for bottleneck detection
                avg_time_in_status = b.duration
                num_times_entered = len(b.transitions) + 1  # Add 1 since transitions list may be empty
                if num_times_entered > 1:
                    # Multiple entries might indicate a problem
                    bottleneck_score = avg_time_in_status * (num_times_entered - 1)
                else:
                    bottleneck_score = avg_time_in_status
                
                bottlenecks.append({
                    'status': b.start_state,  # Use start_state since it's the same as end_state for single status
                    'avg_time': avg_time_in_status,
                    'times_entered': num_times_entered,
                    'bottleneck_score': bottleneck_score
                })
        
        # Sort by bottleneck score
        return sorted(bottlenecks, key=lambda x: x['bottleneck_score'], reverse=True)
