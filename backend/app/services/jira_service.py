from jira import JIRA
from typing import Optional, List, Dict, Set
import logging
from app.core.models import JiraConfig, WorkflowConfig
from urllib.parse import unquote


logger = logging.getLogger(__name__)

class JiraService:
    def __init__(self, config: JiraConfig):
        """Initialize Jira service with configuration"""
        self.config = config
        self.client = self._create_client()

    def _create_client(self) -> JIRA:
        """Create a Jira client instance"""
        return JIRA(
            server=self.config.url,
            basic_auth=(self.config.username, self.config.api_token),
            options={
                'verify': True,
                'timeout': 30,  # 30 second timeout for requests
                'max_retries': 3
            }
        )

    def test_connection(self) -> bool:
        """Test the Jira connection"""
        try:
            self.client.server_info()
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Jira: {str(e)}")
            return False

    def get_teams(self) -> List[Dict]:
        """Get list of teams/projects from Jira"""
        try:
            projects = self.client.projects()
            return [{
                'id': project.id,
                'key': project.key,
                'name': project.name,
                'type': getattr(project, 'projectTypeKey', 'software'),
                'category': getattr(project.projectCategory, 'name', None) if hasattr(project, 'projectCategory') else None
            } for project in projects]
        except Exception as e:
            logger.error(f"Error fetching teams: {str(e)}")
            raise

    def get_filters(self) -> List[Dict]:
            """Get list of available filters"""
            try:
                # Get favorite filters
                favourite_filters = self.client.favourite_filters()
                
                # For now, just use favourite filters as the Jira Python library
                # doesn't provide a direct method to get all filters
                all_filters = {}
                
                # Process favorite filters
                for f in favourite_filters:
                    owner_name = getattr(f.owner, 'displayName', 'Unknown') if hasattr(f, 'owner') else 'Unknown'
                    all_filters[f.id] = {
                        'id': f.id,
                        'name': f.name,
                        'jql': getattr(f, 'jql', ''),
                        'owner': owner_name,
                        'favourite': True
                    }

                logger.info(f"Found {len(all_filters)} filters")
                return list(all_filters.values())
            except Exception as e:
                logger.error(f"Error fetching filters: {str(e)}")
                raise

    def validate_filter(self, filter_name: str) -> Optional[Dict]:
        """Validate and get details of a Jira filter"""
        try:
            # Get all available filters
            filters = self.get_filters()
            
            # Find the matching filter
            matching_filter = next(
                (f for f in filters if f['name'].lower() == filter_name.lower()),
                None
            )
            
            if matching_filter:
                # Try to get the full filter details using the ID
                try:
                    filter_obj = self.client.filter(matching_filter['id'])
                    return {
                        'id': filter_obj.id,
                        'name': filter_obj.name,
                        'jql': getattr(filter_obj, 'jql', ''),
                        'owner': getattr(filter_obj.owner, 'displayName', 'Unknown') if hasattr(filter_obj, 'owner') else 'Unknown',
                        'favourite': True  # Since we only have access to favourite filters
                    }
                except:
                    # Fall back to the basic filter info if we can't get details
                    return matching_filter
            
            return None
        except Exception as e:
            logger.error(f"Error validating filter: {str(e)}")
            raise

    def extract_workflow(self, project_key: str) -> WorkflowConfig:
        """Extract workflow configuration from a Jira project using the workflow API"""
        try:
            # Get all statuses and transitions by analyzing existing issues
            jql = f"project = {project_key} ORDER BY created DESC"
            issues = self.client.search_issues(jql, maxResults=100, expand='changelog')
            
            # Track all statuses and transitions
            all_statuses = set()
            transitions = {}
            initial_statuses = set()
            final_statuses = set()
            
            # Analyze issue histories to build workflow
            for issue in issues:
                current_status = issue.fields.status.name
                all_statuses.add(current_status)
                
                # Get status history from changelog
                previous_status = None
                for history in issue.changelog.histories:
                    for item in history.items:
                        if item.field == 'status':
                            from_status = item.fromString
                            to_status = item.toString
                            
                            all_statuses.add(from_status)
                            all_statuses.add(to_status)
                            
                            # Track first status as potential start
                            if previous_status is None:
                                initial_statuses.add(from_status)
                            
                            # Record transition
                            if from_status not in transitions:
                                transitions[from_status] = set()
                            transitions[from_status].add(to_status)
                            
                            previous_status = to_status
                
                # Track last status as potential end
                if previous_status is not None:
                    final_statuses.add(previous_status)
                final_statuses.add(current_status)
            
            # Get additional workflow info from project configuration
            project = self.client.project(project_key)
            statuses = self.client._get_json(f'project/{project.id}/statuses')
            
            # Add any statuses from project configuration that weren't in issues
            for issue_type in statuses:
                for status in issue_type['statuses']:
                    status_name = status['name']
                    all_statuses.add(status_name)
                    
                    # First status in configuration is typically initial
                    if len(initial_statuses) == 0:
                        initial_statuses.add(status_name)
            
            # Convert sets to sorted lists and normalize status names
            status_list = sorted(list(all_statuses))
            
            # Normalize initial statuses to prevent duplicates with different casing
            normalized_initial_statuses = {status.lower(): status for status in initial_statuses}
            initial_statuses = set(normalized_initial_statuses.values())
            
            # Build suggested flow starting from initial statuses
            suggested_flow = []
            if initial_statuses:
                current = sorted(list(initial_statuses))[0]
                visited = {current}
                suggested_flow.append(current)
                
                while current in transitions:
                    next_states = transitions[current]
                    if not next_states:
                        break
                    
                    # Get next unvisited state
                    next_state = None
                    for state in sorted(next_states):
                        if state not in visited:
                            next_state = state
                            break
                    
                    if next_state is None:
                        break
                    
                    current = next_state
                    visited.add(current)
                    suggested_flow.append(current)
            
            return WorkflowConfig(
                all_statuses=status_list,
                suggested_flow=suggested_flow,
                initial_statuses=sorted(list(initial_statuses)),  # Using normalized and deduplicated initial_statuses
                final_statuses=sorted(list(final_statuses)),
                transitions={k: sorted(list(v)) for k, v in transitions.items()}
            )
            
        except Exception as e:
            logger.error(f"Error extracting workflow: {str(e)}")
            raise

    def fetch_issues(self, jql_query: str, start_at: int = 0, max_results: int = 100) -> List[Dict]:
        """Fetch issues matching the query"""
        try:
            fields = [
                'summary',
                'status',
                'created',
                'timeoriginalestimate',
                'timespent',
                'parent',
                'subtasks',
                'customfield_10014',  # Epic Link field (may need to adjust field ID)
                'customfield_10015'   # Epic Name field (may need to adjust field ID)
            ]
            return self.client.search_issues(
                jql_query,
                startAt=start_at,
                maxResults=max_results,
                expand='changelog',
                fields=','.join(fields)
            )
        except Exception as e:
            logger.error(f"Error fetching issues: {str(e)}")
            raise
