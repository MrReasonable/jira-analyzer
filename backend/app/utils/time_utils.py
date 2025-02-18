from datetime import datetime, timedelta, timezone
from app.core.models import TimeRange
from typing import Optional, Dict, List
import re

class JQLParser:
    """Parser for JQL queries to handle date ranges and completion states"""
    
    # Patterns for different JQL components
    DATE_PATTERN = r'(created|updated|resolved)\s*(?:>=|<=|=|>|<)\s*["\']?\d{4}-\d{2}-\d{2}["\']?'
    ORDER_BY_PATTERN = r'\s+ORDER\s+BY\s+.*$'
    
    def __init__(self, query: str):
        self.original_query = query.strip()
        self.conditions: List[str] = []
        self.order_by: str = ''
        self.existing_date_fields: List[str] = []
        self._parse_query()

    def _parse_query(self):
        """Parse the query into components"""
        # Extract ORDER BY clause
        order_match = re.search(self.ORDER_BY_PATTERN, self.original_query, re.IGNORECASE)
        if order_match:
            main_query = self.original_query[:order_match.start()]
            self.order_by = self.original_query[order_match.start():]
        else:
            main_query = self.original_query
            self.order_by = ''

        # Find existing date conditions
        date_matches = re.finditer(self.DATE_PATTERN, main_query, re.IGNORECASE)
        for match in date_matches:
            field = re.match(r'(created|updated|resolved)', match.group(0)).group(1)
            self.existing_date_fields.append(field.lower())

        # Split into conditions
        if main_query:
            # Handle nested conditions with parentheses
            if '(' in main_query or ')' in main_query:
                self.conditions.append(f"({main_query})")
            else:
                self.conditions.append(main_query)

    def add_completion_filter(self, done_statuses: List[str], lead_time_only: bool = False, time_range: Optional[TimeRange] = None):
        """
        Add filter for completed items or in-progress items
        Args:
            done_statuses: List of status names considered "done"
            lead_time_only: If True, only include items that entered done states
            time_range: Optional time range to filter transitions
        """
        if done_statuses:
            if lead_time_only and time_range:
                # For lead time, find items that entered done states during the period
                # We'll get their full history but filter in the analyzer
                start_date, end_date = get_date_range(time_range)
                if start_date and end_date:
                    status_conditions = []
                    for status in done_statuses:
                        status_conditions.append(
                            f'(status WAS "{status}" AND status CHANGED TO "{status}" ' +
                            f'DURING ("{start_date.strftime("%Y-%m-%d")}", "{end_date.strftime("%Y-%m-%d")}")'
                        )
                    self.conditions.append(f"({' OR '.join(status_conditions)})")
                else:
                    # If no time range, just check if it ever reached done status
                    status_conditions = [f'status WAS "{status}"' for status in done_statuses]
                    self.conditions.append(f"({' OR '.join(status_conditions)})")
            else:
                # For CFD, we want items that existed or had transitions in the period
                if time_range and time_range.start_date and time_range.end_date:
                    start_date, end_date = get_date_range(time_range)
                    if start_date and end_date:
                        self.conditions.append(
                            f'(created <= "{end_date.strftime("%Y-%m-%d")}" OR ' +
                            f'status changed DURING ("{start_date.strftime("%Y-%m-%d")}", "{end_date.strftime("%Y-%m-%d")}"))'
                        )

    def add_date_range(self, time_range: TimeRange):
        """Add date range conditions based on time range configuration"""
        if not time_range:
            return

        start_date, end_date = get_date_range(time_range)
        if not start_date and not end_date:
            return

        # For both lead time and CFD analysis, we want to be precise about the time range
        date_conditions = []
        if start_date:
            date_conditions.append(
                f'(updated >= "{start_date.strftime("%Y-%m-%d")}" OR ' +
                f'status changed AFTER "{start_date.strftime("%Y-%m-%d")}" OR ' +
                f'created >= "{start_date.strftime("%Y-%m-%d")}")'
            )
        if end_date:
            date_conditions.append(
                f'(updated <= "{end_date.strftime("%Y-%m-%d")}" OR ' +
                f'status changed BEFORE "{end_date.strftime("%Y-%m-%d")}" OR ' +
                f'created <= "{end_date.strftime("%Y-%m-%d")}")'
            )

        if date_conditions:
            self.conditions.append(f"({' AND '.join(date_conditions)})")

    def build_query(self) -> str:
        """Build the final JQL query"""
        if not self.conditions:
            return ""
        
        return " AND ".join(self.conditions) + self.order_by

def get_date_range(time_range: TimeRange) -> tuple[Optional[datetime], Optional[datetime]]:
    """Get start and end dates based on time range configuration"""
    end_date = datetime.now(timezone.utc)
    
    if time_range.start_date and time_range.end_date:
        # Use provided dates if they exist, but ensure proper time boundaries
        start_date = time_range.start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = time_range.end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        return start_date, end_date
    elif time_range.preset:
        # Calculate dates based on preset
        if time_range.preset == 'two_weeks':
            start_date = end_date - timedelta(days=14)
        elif time_range.preset == 'quarter':
            start_date = end_date - timedelta(days=90)
        elif time_range.preset == 'half_year':
            start_date = end_date - timedelta(days=180)
        elif time_range.preset == 'year':
            start_date = end_date - timedelta(days=365)
        else:
            return None, None
        
        # Set time to start/end of day
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        return start_date, end_date
    else:
        return None, None

def build_analysis_jql(base_query: str, time_range: TimeRange, done_statuses: List[str], lead_time_only: bool = False) -> str:
    """
    Build JQL query for cycle time analysis
    
    Args:
        base_query: Base JQL query
        time_range: TimeRange configuration
        done_statuses: List of status names considered "done"
        lead_time_only: If True, only include items in done states (for lead time calculations)
        
    Returns:
        Complete JQL query for analysis
    """
    parser = JQLParser(base_query)
    parser.add_completion_filter(done_statuses, lead_time_only, time_range)
    parser.add_date_range(time_range)
    return parser.build_query()
