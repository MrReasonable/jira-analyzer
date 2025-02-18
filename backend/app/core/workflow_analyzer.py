from datetime import datetime, timezone
from typing import List, Dict, Optional, Tuple, TYPE_CHECKING
from app.core.models import StatusChange, CycleTimeBreakdown

if TYPE_CHECKING:
    from app.core.models import TimeRange

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
            return status_periods

        sorted_transitions = sorted(transitions, key=lambda x: x.timestamp)
        first_transition = sorted_transitions[0]
        now = datetime.now(timezone.utc)
        
        # The first transition is always the creation date transition
        # added by JiraIssueTracker
        if first_transition.from_status in self.expected_path:
            # For the first status, count time from creation until first real transition
            # or until now if there are no other transitions
            # Ensure timezone-aware timestamps
            first_time = first_transition.timestamp.replace(tzinfo=timezone.utc) if first_transition.timestamp.tzinfo is None else first_transition.timestamp
            if len(sorted_transitions) > 1:
                end_time = sorted_transitions[1].timestamp.replace(tzinfo=timezone.utc) if sorted_transitions[1].timestamp.tzinfo is None else sorted_transitions[1].timestamp
            else:
                end_time = now
            status_periods[first_transition.from_status].append((first_time, end_time))

        # Track the current status and its start time
        current_status_tracking = {
            'status': first_transition.from_status,
            'start_time': first_transition.timestamp
        }

        # Process transitions
        for i, transition in enumerate(sorted_transitions):
            # If the current status is in our workflow, record the time period
            if current_status_tracking['status'] in self.expected_path:
                # For the last transition, use current time as end time
                # Ensure timezone-aware timestamps
                start_time = current_status_tracking['start_time'].replace(tzinfo=timezone.utc) if current_status_tracking['start_time'].tzinfo is None else current_status_tracking['start_time']
                if i < len(sorted_transitions) - 1:
                    end_time = transition.timestamp.replace(tzinfo=timezone.utc) if transition.timestamp.tzinfo is None else transition.timestamp
                else:
                    end_time = datetime.now(timezone.utc)
                status_periods[current_status_tracking['status']].append((start_time, end_time))
            
            # Update tracking for new status
            current_status_tracking = {
                'status': transition.to_status,
                'start_time': transition.timestamp
            }


        return status_periods

    def calculate_cycle_time(
        self,
        transitions: List[StatusChange],
        current_status: str,
        time_range: Optional['TimeRange'] = None,
        for_cfd: bool = False
    ) -> Tuple[float, List[CycleTimeBreakdown], Dict[str, List[Tuple[datetime, datetime]]]]:
        """
        Calculate cycle time respecting workflow order and handling skipped statuses
        
        Args:
            transitions: List of status changes
            current_status: Current issue status
            time_range: Optional time range to filter transitions
            for_cfd: If True, only consider time within the range (for CFD calculation)
            
        Returns:
            Tuple of (total_cycle_time, breakdowns, status_periods)
        """
        start_date = time_range.start_date if time_range else None
        end_date = time_range.end_date if time_range else None

        if for_cfd:
            # For CFD, we only want transitions within the time range
            if start_date and end_date:
                # Find the last transition before the time range to establish initial state
                pre_range_transitions = [
                    t for t in transitions 
                    if (t.timestamp.replace(tzinfo=timezone.utc) if t.timestamp.tzinfo is None else t.timestamp) < start_date
                ]
                range_transitions = [
                    t for t in transitions 
                    if start_date <= (t.timestamp.replace(tzinfo=timezone.utc) if t.timestamp.tzinfo is None else t.timestamp) <= end_date
                ]
                
                if not range_transitions:
                    return 0.0, [], {}
                
                if pre_range_transitions:
                    # Add the last pre-range transition with adjusted timestamp
                    last_pre_range = max(pre_range_transitions, key=lambda t: t.timestamp)
                    initial_state = StatusChange(
                        timestamp=start_date,
                        from_status=last_pre_range.to_status,
                        to_status=last_pre_range.to_status
                    )
                    transitions = [initial_state] + range_transitions
                else:
                    # If no pre-range transitions, use the first transition's from_status
                    initial_state = StatusChange(
                        timestamp=start_date,
                        from_status=transitions[0].from_status,
                        to_status=transitions[0].from_status
                    )
                    transitions = [initial_state] + range_transitions
        else:
            # For lead/cycle time, use all transitions if the issue completed in range
            completed_in_range = False
            if start_date and end_date:
                # First, check if the issue was completed in range
                for t in transitions:
                    # Ensure timezone-aware comparison
                    transition_time = t.timestamp.replace(tzinfo=timezone.utc) if t.timestamp.tzinfo is None else t.timestamp
                    if (start_date <= transition_time <= end_date and 
                        t.to_status in self.expected_path[-1:]):  # Check if transitioned to final state
                        completed_in_range = True
                        break
                
                if not completed_in_range:
                    return 0.0, [], {}
                
                # If completed in range, filter transitions to only include those before completion
                completion_time = None
                for t in reversed(transitions):
                    if t.to_status in self.expected_path[-1:]:
                        completion_time = t.timestamp.replace(tzinfo=timezone.utc) if t.timestamp.tzinfo is None else t.timestamp
                        break
                
                if completion_time:
                    transitions = [
                        t for t in transitions 
                        if (t.timestamp.replace(tzinfo=timezone.utc) if t.timestamp.tzinfo is None else t.timestamp) <= completion_time
                    ]

        # Calculate status periods
        status_periods = self.calculate_status_periods(transitions, current_status)
        
        # Calculate cycle time and breakdowns
        total_time = 0.0
        breakdowns = []
        
        for status in self.expected_path:
            periods = status_periods[status]
            if not periods:
                continue
            
            # For CFD, clip periods to time range
            if for_cfd and start_date and end_date:
                filtered_periods = []
                for period_start, period_end in periods:
                    # Ensure timezone-aware comparison
                    period_start_aware = period_start.replace(tzinfo=timezone.utc) if period_start.tzinfo is None else period_start
                    period_end_aware = period_end.replace(tzinfo=timezone.utc) if period_end.tzinfo is None else period_end
                    
                    if period_end_aware < start_date or period_start_aware > end_date:
                        continue
                    period_start = max(period_start_aware, start_date)
                    period_end = min(period_end_aware, end_date)
                    filtered_periods.append((period_start, period_end))
                periods = filtered_periods
            
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
