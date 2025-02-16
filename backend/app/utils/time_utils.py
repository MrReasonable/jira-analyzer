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

    def add_completion_filter(self, done_statuses: List[str], lead_time_only: bool = False):
        """
        Add filter for completed items or in-progress items
        Args:
            done_statuses: List of status names considered "done"
            lead_time_only: If True, only include items that entered done states
        """
        if done_statuses:
            if lead_time_only:
                # For lead time, find items that entered done states during the period
                status_conditions = [f'status WAS "{status}"' for status in done_statuses]
                self.conditions.append(f"({' OR '.join(status_conditions)})")
            else:
                # For cycle time, include current done states and in-progress items
                current_status = ' OR '.join([f'status = "{status}"' for status in done_statuses])
                was_status = ' OR '.join([f'status WAS "{status}"' for status in done_statuses])
                self.conditions.append(f"({current_status} OR {was_status})")

    def add_date_range(self, time_range: TimeRange):
        """Add date range conditions to capture items in progress or completed during the period"""
        start_date, end_date = get_date_range(time_range)
        
        if start_date and end_date:
            # Use status history to find items that were worked on during the period
            date_conditions = []
            
            # Items that had status changes during the period
            date_conditions.append(
                f'status CHANGED DURING ("{start_date.strftime("%Y-%m-%d")}", "{end_date.strftime("%Y-%m-%d")}")'
            )
            
            # Items that were created during the period
            if 'created' not in self.existing_date_fields:
                date_conditions.append(
                    f'created >= "{start_date.strftime("%Y-%m-%d")}" AND ' +
                    f'created <= "{end_date.strftime("%Y-%m-%d")}"'
                )
            
            if date_conditions:
                self.conditions.append(f"({' OR '.join(date_conditions)})")

    def build_query(self) -> str:
        """Build the final JQL query"""
        if not self.conditions:
            return ""
        
        return " AND ".join(self.conditions) + self.order_by

def get_date_range(time_range: TimeRange) -> tuple[Optional[datetime], Optional[datetime]]:
    """Get start and end dates based on time range configuration"""
    if time_range.start_date and time_range.end_date:
        return time_range.start_date, time_range.end_date
    
    end_date = datetime.now(timezone.utc)
    
    if time_range.preset:
        if time_range.preset == 'two_weeks':
            start_date = end_date - timedelta(weeks=2)
        elif time_range.preset == 'quarter':
            start_date = end_date - timedelta(weeks=13)
        elif time_range.preset == 'half_year':
            start_date = end_date - timedelta(weeks=26)
        elif time_range.preset == 'year':
            start_date = end_date - timedelta(weeks=52)
        else:
            start_date = None
    else:
        start_date = None
    
    return start_date, end_date

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
    parser.add_completion_filter(done_statuses, lead_time_only)
    parser.add_date_range(time_range)
    return parser.build_query()
