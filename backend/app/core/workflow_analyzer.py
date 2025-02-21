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

    def _ensure_utc(self, dt: datetime) -> datetime:
        """Ensure datetime is in UTC timezone"""
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

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

        # Ensure all transitions have UTC timezone
        sorted_transitions = sorted(
            [StatusChange(
                from_status=t.from_status,
                to_status=t.to_status,
                timestamp=self._ensure_utc(t.timestamp)
            ) for t in transitions],
            key=lambda x: x.timestamp
        )

        # Track current status and its start time
        current_tracking = {
            'status': sorted_transitions[0].from_status,
            'start_time': sorted_transitions[0].timestamp
        }

        # Process each transition
        for i, transition in enumerate(sorted_transitions):
            # Only record periods for statuses in our workflow
            if current_tracking['status'] in self.expected_path:
                end_time = transition.timestamp
                if i == len(sorted_transitions) - 1 and transition.to_status == current_status:
                    end_time = datetime.now(timezone.utc)
                
                # Don't record zero-length periods
                if end_time > current_tracking['start_time']:
                    status_periods[current_tracking['status']].append(
                        (current_tracking['start_time'], end_time)
                    )

            # Update tracking
            current_tracking = {
                'status': transition.to_status,
                'start_time': transition.timestamp
            }

        # Handle final status if it's in our workflow
        if current_tracking['status'] in self.expected_path:
            end_time = datetime.now(timezone.utc)
            if end_time > current_tracking['start_time']:
                status_periods[current_tracking['status']].append(
                    (current_tracking['start_time'], end_time)
                )

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
        # Ensure all dates are in UTC
        start_date = self._ensure_utc(time_range.start_date) if time_range and time_range.start_date else None
        end_date = self._ensure_utc(time_range.end_date) if time_range and time_range.end_date else None

        filtered_transitions = []
        if for_cfd and start_date and end_date:
            # For CFD, include transitions within range plus last transition before range
            pre_range = [t for t in transitions if self._ensure_utc(t.timestamp) < start_date]
            if pre_range:
                last_pre = max(pre_range, key=lambda t: t.timestamp)
                filtered_transitions.append(StatusChange(
                    from_status=last_pre.to_status,
                    to_status=last_pre.to_status,
                    timestamp=start_date
                ))
            
            filtered_transitions.extend([
                t for t in transitions
                if start_date <= self._ensure_utc(t.timestamp) <= end_date
            ])
        else:
            # For cycle time, check completion in range
            if start_date and end_date:
                completed_in_range = any(
                    start_date <= self._ensure_utc(t.timestamp) <= end_date and
                    t.to_status == self.expected_path[-1]
                    for t in transitions
                )
                if not completed_in_range:
                    return 0.0, [], {}
            filtered_transitions = transitions

        # Calculate status periods
        status_periods = self.calculate_status_periods(filtered_transitions, current_status)
        
        # Calculate cycle time and breakdowns
        total_time = 0.0
        breakdowns = []
        transitions_by_status = {status: [] for status in self.expected_path}
        
        for status in self.expected_path:
            periods = status_periods[status]
            if not periods:
                continue
            
            # For CFD, clip periods to time range
            if for_cfd and start_date and end_date:
                periods = [
                    (max(start, start_date), min(end, end_date))
                    for start, end in periods
                    if end > start_date and start < end_date
                ]
            
            status_time = sum(
                (end - start).total_seconds() / 86400  # Convert to days
                for start, end in periods
            )
            
            if status_time > 0:
                transitions_in_status = [
                    t for t in filtered_transitions
                    if t.from_status == status or t.to_status == status
                ]
                breakdowns.append(CycleTimeBreakdown(
                    start_state=status,
                    end_state=status,
                    duration=status_time,
                    transitions=transitions_in_status
                ))
                total_time += status_time
                transitions_by_status[status].extend(transitions_in_status)

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
        max_time = max((b.duration for b in breakdowns), default=0)
        max_transitions = max((len(b.transitions) for b in breakdowns), default=0)
        
        for b in breakdowns:
            if b.duration > 0:
                # Calculate normalized metrics
                time_ratio = b.duration / max_time if max_time > 0 else 0
                transition_ratio = len(b.transitions) / max_transitions if max_transitions > 0 else 0
                
                # Calculate bottleneck score
                bottleneck_score = (time_ratio * 0.7) + (transition_ratio * 0.3)
                
                # Determine impact level
                impact = "High" if bottleneck_score > 0.7 else "Medium" if bottleneck_score > 0.3 else "Low"
                
                bottlenecks.append({
                    'status': b.start_state,
                    'avg_time': b.duration,
                    'times_entered': len(b.transitions),
                    'bottleneck_score': bottleneck_score,
                    'impact': impact
                })
        
        # Sort by bottleneck score
        return sorted(bottlenecks, key=lambda x: x['bottleneck_score'], reverse=True)
