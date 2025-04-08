# Backend API

## Overview

Documentation of FastAPI endpoints exposed by the Jira Analyzer backend. This API provides functionalities for managing Jira configurations, interacting with the Jira API, and retrieving workflow metrics.

## Base URL

All API endpoints are accessible under the base URL:

```
http://localhost/api
```

Or the value specified in the `VITE_API_URL` environment variable.

## Authentication

The Jira Analyzer API uses JWT token-based authentication, which is handled through:

- **HTTP-only cookies**: Tokens are stored as secure HTTP-only cookies after successful validation of Jira credentials
- **Authorization header**: Requests must include an `Authorization` header with the format: `Bearer <jwt_token>`

### Token Management

- Tokens are automatically issued when validating Jira credentials
- Tokens contain encoded configuration information to identify the Jira connection being used
- Tokens are validated for each authenticated endpoint request

## Endpoints

### Configuration Endpoints

#### GET /configurations

Lists all configurations with pagination.

**Query Parameters:**

- `skip` (optional): Number of items to skip (default: 0)
- `limit` (optional): Maximum number of items to return (default: 10, max: 100)

**Response:**

```json
{
  "items": [
    {
      "name": "My Jira Config",
      "jira_server": "https://company.atlassian.net",
      "jira_email": "user@example.com"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 10
}
```

**Status Codes:**

- `200 OK`: Successful response

#### POST /configurations

Creates a new Jira configuration.

**Request Body:**

```json
{
  "name": "My Jira Config",
  "jira_server": "https://company.atlassian.net",
  "jira_email": "user@example.com",
  "jira_api_token": "api-token-value",
  "jql_query": "project = PROJ AND updated >= -90d",
  "project_key": "PROJ",
  "workflow_states": ["Backlog", "In Progress", "Review", "Done"],
  "lead_time_start_state": "Backlog",
  "lead_time_end_state": "Done",
  "cycle_time_start_state": "In Progress",
  "cycle_time_end_state": "Done"
}
```

**Response:**

```json
{
  "id": 1,
  "name": "My Jira Config",
  "jira_server": "https://company.atlassian.net",
  "jira_email": "user@example.com",
  "jira_api_token": "********",
  "jql_query": "project = PROJ AND updated >= -90d",
  "project_key": "PROJ",
  "workflow_states": ["Backlog", "In Progress", "Review", "Done"],
  "lead_time_start_state": "Backlog",
  "lead_time_end_state": "Done",
  "cycle_time_start_state": "In Progress",
  "cycle_time_end_state": "Done"
}
```

**Status Codes:**

- `201 Created`: Configuration successfully created
- `400 Bad Request`: Could not create configuration
- `422 Unprocessable Entity`: Validation error, missing required fields

#### GET /configurations/{name}

Retrieves a specific Jira configuration by name.

**Path Parameters:**

- `name`: Name of the configuration to retrieve

**Response:**

```json
{
  "id": 1,
  "name": "My Jira Config",
  "jira_server": "https://company.atlassian.net",
  "jira_email": "user@example.com",
  "jira_api_token": "********",
  "jql_query": "project = PROJ AND updated >= -90d",
  "project_key": "PROJ",
  "workflow_states": ["Backlog", "In Progress", "Review", "Done"],
  "lead_time_start_state": "Backlog",
  "lead_time_end_state": "Done",
  "cycle_time_start_state": "In Progress",
  "cycle_time_end_state": "Done"
}
```

**Status Codes:**

- `200 OK`: Successful response
- `404 Not Found`: Configuration not found

#### PUT /configurations/{name}

Updates an existing Jira configuration.

**Path Parameters:**

- `name`: Name of the configuration to update

**Request Body:**

```json
{
  "name": "My Jira Config",
  "jira_server": "https://company.atlassian.net",
  "jira_email": "user@example.com",
  "jira_api_token": "new-api-token-value",
  "jql_query": "project = PROJ AND updated >= -120d",
  "project_key": "PROJ",
  "workflow_states": ["Backlog", "In Progress", "Review", "Done"],
  "lead_time_start_state": "Backlog",
  "lead_time_end_state": "Done",
  "cycle_time_start_state": "In Progress",
  "cycle_time_end_state": "Done"
}
```

**Response:**

```json
{
  "id": 1,
  "name": "My Jira Config",
  "jira_server": "https://company.atlassian.net",
  "jira_email": "user@example.com",
  "jira_api_token": "********",
  "jql_query": "project = PROJ AND updated >= -120d",
  "project_key": "PROJ",
  "workflow_states": ["Backlog", "In Progress", "Review", "Done"],
  "lead_time_start_state": "Backlog",
  "lead_time_end_state": "Done",
  "cycle_time_start_state": "In Progress",
  "cycle_time_end_state": "Done"
}
```

**Status Codes:**

- `200 OK`: Configuration successfully updated
- `400 Bad Request`: Could not update configuration
- `404 Not Found`: Configuration not found

#### DELETE /configurations/{name}

Deletes a specific Jira configuration by name.

**Path Parameters:**

- `name`: Name of the configuration to delete

**Status Codes:**

- `204 No Content`: Configuration successfully deleted
- `400 Bad Request`: Could not delete configuration
- `404 Not Found`: Configuration not found

### Jira Connection Endpoints

#### POST /validate-credentials

Validates the provided Jira credentials by attempting to connect to the Jira instance.

**Request Body:**

```json
{
  "name": "My Jira Config",
  "jira_server": "https://company.atlassian.net",
  "jira_email": "user@example.com",
  "jira_api_token": "api-token-value"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Connection is valid"
}
```

**Status Codes:**

- `200 OK`: Credentials validated successfully
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Failed to connect to Jira

#### GET /jira/validate-connection

Validates the connection to Jira using a stored configuration or token credentials.

**Query Parameters:**

- `config_name` (optional): Name of a stored Jira configuration to use

**Response:**

```json
{
  "status": "success",
  "message": "Connection is valid"
}
```

**Status Codes:**

- `200 OK`: Connection validated successfully
- `400 Bad Request`: Missing configuration name
- `404 Not Found`: Configuration not found
- `500 Internal Server Error`: Failed to connect to Jira

#### GET /jira/projects

Fetches all projects from a Jira instance using stored configuration.

**Query Parameters:**

- `config_name` (optional): Name of a stored Jira configuration to use

**Response:**

```json
[
  {
    "key": "PROJ",
    "name": "Project Name"
  },
  {
    "key": "DEMO",
    "name": "Demo Project"
  }
]
```

**Status Codes:**

- `200 OK`: Projects fetched successfully
- `400 Bad Request`: Missing configuration name
- `404 Not Found`: Configuration not found
- `500 Internal Server Error`: Failed to connect to Jira or fetch projects

#### POST /jira/projects-with-credentials

Fetches all projects from a Jira instance using direct credentials.

**Request Body:**

```json
{
  "name": "My Jira Config",
  "jira_server": "https://company.atlassian.net",
  "jira_email": "user@example.com",
  "jira_api_token": "api-token-value"
}
```

**Response:**

```json
[
  {
    "key": "PROJ",
    "name": "Project Name"
  },
  {
    "key": "DEMO",
    "name": "Demo Project"
  }
]
```

**Status Codes:**

- `200 OK`: Projects fetched successfully
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Failed to connect to Jira or fetch projects

#### GET /jira/workflows

Fetches workflow and status data for a Jira project.

**Query Parameters:**

- `project_key` (required): The project key to fetch workflow data for
- `config_name` (optional): Name of a stored Jira configuration to use

**Response:**

```json
[
  {
    "id": "",
    "name": "Backlog",
    "category": "To Do"
  },
  {
    "id": "",
    "name": "In Progress",
    "category": "In Progress"
  },
  {
    "id": "",
    "name": "Done",
    "category": "Done"
  }
]
```

**Status Codes:**

- `200 OK`: Workflow data fetched successfully
- `400 Bad Request`: Missing project key or configuration name
- `404 Not Found`: Configuration not found
- `500 Internal Server Error`: Failed to connect to Jira or fetch workflow data

#### POST /jira/workflows-with-credentials

Fetches workflow statuses using direct credentials.

**Request Body:**

```json
{
  "name": "My Jira Config",
  "jira_server": "https://company.atlassian.net",
  "jira_email": "user@example.com",
  "jira_api_token": "api-token-value",
  "project_key": "PROJ"
}
```

**Response:**

```json
[
  {
    "id": "",
    "name": "Backlog",
    "category": "To Do"
  },
  {
    "id": "",
    "name": "In Progress",
    "category": "In Progress"
  },
  {
    "id": "",
    "name": "Done",
    "category": "Done"
  }
]
```

**Status Codes:**

- `200 OK`: Workflow data fetched successfully
- `400 Bad Request`: Missing project key
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Failed to connect to Jira or fetch workflow data

### Metrics Endpoints

#### GET /metrics/lead-time

Retrieves lead time metrics for a Jira project based on the provided JQL query.

**Query Parameters:**

- `jql` (required): JQL query to filter issues
- `config_name` (optional): Name of a stored Jira configuration to use

**Response:**

```json
{
  "average": 7.5,
  "median": 6.2,
  "min": 1.0,
  "max": 21.3,
  "data": [4.2, 6.1, 8.3, 3.5, 15.2]
}
```

**Status Codes:**

- `200 OK`: Metrics fetched successfully
- `400 Bad Request`: Missing required parameters
- `500 Internal Server Error`: Failed to fetch metrics from Jira

#### GET /metrics/cycle-time

Retrieves cycle time metrics for a Jira project based on the provided JQL query.

**Query Parameters:**

- `jql` (required): JQL query to filter issues
- `config_name` (optional): Name of a stored Jira configuration to use

**Response:**

```json
{
  "average": 4.3,
  "median": 3.8,
  "min": 0.5,
  "max": 12.7,
  "data": [2.2, 4.1, 3.5, 7.5],
  "start_state": "In Progress",
  "end_state": "Done"
}
```

**Status Codes:**

- `200 OK`: Metrics fetched successfully
- `400 Bad Request`: Missing required parameters
- `500 Internal Server Error`: Failed to fetch metrics from Jira

#### GET /metrics/throughput

Retrieves throughput metrics for a Jira project based on the provided JQL query.

**Query Parameters:**

- `jql` (required): JQL query to filter issues
- `config_name` (optional): Name of a stored Jira configuration to use

**Response:**

```json
{
  "dates": ["2024-03-01", "2024-03-02", "2024-03-03", "2024-03-04", "2024-03-05"],
  "counts": [5, 3, 7, 2, 6],
  "average": 4.6
}
```

**Status Codes:**

- `200 OK`: Metrics fetched successfully
- `400 Bad Request`: Missing required parameters
- `500 Internal Server Error`: Failed to fetch metrics from Jira

#### GET /metrics/wip

Retrieves Work in Progress (WIP) metrics for a Jira project based on the provided JQL query.

**Query Parameters:**

- `jql` (required): JQL query to filter issues
- `config_name` (optional): Name of a stored Jira configuration to use

**Response:**

```json
{
  "status": ["Backlog", "In Progress", "Review", "Done"],
  "counts": [12, 5, 3, 20],
  "total": 40
}
```

**Status Codes:**

- `200 OK`: Metrics fetched successfully
- `400 Bad Request`: Missing required parameters
- `500 Internal Server Error`: Failed to fetch metrics from Jira

#### GET /metrics/cfd

Retrieves Cumulative Flow Diagram (CFD) data for a Jira project based on the provided JQL query.

**Query Parameters:**

- `jql` (required): JQL query to filter issues
- `config_name` (optional): Name of a stored Jira configuration to use

**Response:**

```json
{
  "statuses": ["Backlog", "In Progress", "Review", "Done"],
  "data": [
    {
      "date": "2024-03-01",
      "Backlog": 15,
      "In Progress": 4,
      "Review": 2,
      "Done": 10
    },
    {
      "date": "2024-03-02",
      "Backlog": 14,
      "In Progress": 5,
      "Review": 3,
      "Done": 10
    },
    {
      "date": "2024-03-03",
      "Backlog": 12,
      "In Progress": 6,
      "Review": 2,
      "Done": 12
    }
  ]
}
```

**Status Codes:**

- `200 OK`: Metrics fetched successfully
- `400 Bad Request`: Missing required parameters
- `500 Internal Server Error`: Failed to fetch metrics from Jira

## Request Rate Limiting

The Jira Analyzer implements rate limiting to:

1. Protect the backend API from excessive requests
2. Ensure compliance with Jira API rate limits

### Rate Limiting Implementation

- Configuration request caching: Responses are cached to reduce API calls
- Caching is particularly important for configuration listings
- Cache is cleared when configurations are created, updated, or deleted

### Cache Access Pattern

```python
@cache_result(
    namespace='configurations',
    key_func=lambda *args, **kwargs: f'list:{kwargs.get("skip", 0)}:{kwargs.get("limit", 10)}',
)
```

### Jira API Rate Limiting Handling

- Batched requests for historical data collection
- Implemented retry mechanisms with exponential backoff
- Configurable timeouts to handle slow responses

## Error Responses

The API returns standardized error responses in JSON format.

### Standard Error Format

```json
{
  "detail": "Error message describing the issue"
}
```

### Common Error Codes

- `400 Bad Request`: Invalid parameters or request format
- `401 Unauthorized`: Authentication failed or invalid credentials
- `404 Not Found`: Requested resource does not exist
- `422 Unprocessable Entity`: Validation error, request data failed validation
- `500 Internal Server Error`: Server-side error when processing the request

### Jira-Specific Errors

The API also handles Jira-specific errors and translates them into appropriate HTTP status codes:

- Connection errors: Transformed into 500 errors with descriptive messages
- Authentication failures: Returned as 401 errors
- Rate limiting from Jira: Transformed into 429 Too Many Requests
