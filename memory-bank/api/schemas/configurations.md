# Configuration Schemas

> **Executive Summary:** This document defines the JSON schemas for Jira configuration objects used throughout the API. It includes detailed specifications for configuration creation, update, and retrieval operations, along with validation rules and example payloads.

<!--
Last Updated: 08/04/2025
Related Documents:
- [Memory Bank Index](../../INDEX.md)
- [Backend API](../backend-api.md)
- [Error Handling](../error-handling.md)
- [Jira Integration](../jira-integration.md)
- [Configuration Management](../../features/configuration-management.md)
-->

## Table of Contents

- [Overview](#overview)
- [Configuration Object](#configuration-object)
- [Configuration Request Schemas](#configuration-request-schemas)
- [Configuration Response Schemas](#configuration-response-schemas)
- [Validation Rules](#validation-rules)
- [Examples](#examples)

## Overview

This document defines the JSON schemas for configuration-related requests and responses in the Jira Analyzer API. These schemas are used for validation and documentation purposes.

## Configuration Object

The core Configuration object has the following structure:

```typescript
interface Configuration {
  id?: number; // Auto-generated, not required for creation
  name: string; // Required, unique identifier
  jira_server: string; // Required, valid URL
  jira_email: string; // Required, valid email
  jira_api_token: string; // Required for creation, masked in responses
  project_key?: string; // Optional, but recommended
  jql_query?: string; // Optional JQL filter
  workflow_states: string[]; // Required, at least 2 states
  lead_time_start_state: string; // Required, must be in workflow_states
  lead_time_end_state: string; // Required, must be in workflow_states
  cycle_time_start_state: string; // Required, must be in workflow_states
  cycle_time_end_state: string; // Required, must be in workflow_states
  created_at?: string; // Auto-generated timestamp
  updated_at?: string; // Auto-generated timestamp
}
```

### Field Definitions

<!-- CODE-REF: backend/app/schemas.py#CONFIG_NAME_FIELD -->

**name**
`string` - Unique identifier for the configuration
Example: `"Team Alpha Sprint Metrics"`
Validation rules:

- Required
- Must be unique
- 1-100 characters
- Alphanumeric, spaces, hyphens, and underscores only

<!-- CODE-REF: backend/app/schemas.py#CONFIG_SERVER_FIELD -->

**jira_server**
`string` - URL of the Jira server
Example: `"https://company.atlassian.net"`
Validation rules:

- Required
- Must be a valid URL

<!-- CODE-REF: backend/app/schemas.py#CONFIG_EMAIL_FIELD -->

**jira_email**
`string` - Email address for Jira authentication
Example: `"user@example.com"`
Validation rules:

- Required
- Must be a valid email format

<!-- CODE-REF: backend/app/schemas.py#CONFIG_TOKEN_FIELD -->

**jira_api_token**
`string` - API token for Jira authentication
Example: `"api-token-value"` (masked in responses)
Validation rules:

- Required for creation
- Masked as `"********"` in responses

<!-- CODE-REF: backend/app/schemas.py#CONFIG_PROJECT_FIELD -->

**project_key**
`string` - Jira project key
Example: `"ALPHA"`
Validation rules:

- Required
- Must be a valid Jira project key

<!-- CODE-REF: backend/app/schemas.py#CONFIG_JQL_FIELD -->

**jql_query**
`string` - JQL query for filtering issues
Example: `"project = ALPHA AND updated >= -90d"`
Validation rules:

- Required
- Must be valid JQL syntax

<!-- CODE-REF: backend/app/schemas.py#CONFIG_WORKFLOW_FIELD -->

**workflow_states**
`string[]` - List of workflow states to track
Example: `["Backlog", "In Progress", "Review", "Done"]`
Validation rules:

- Required
- Must contain at least 2 states

<!-- CODE-REF: backend/app/schemas.py#CONFIG_LEAD_START_FIELD -->

**lead_time_start_state**
`string` - Starting state for lead time calculation
Example: `"Backlog"`
Validation rules:

- Required
- Must be one of the workflow_states

<!-- CODE-REF: backend/app/schemas.py#CONFIG_LEAD_END_FIELD -->

**lead_time_end_state**
`string` - Ending state for lead time calculation
Example: `"Done"`
Validation rules:

- Required
- Must be one of the workflow_states

<!-- CODE-REF: backend/app/schemas.py#CONFIG_CYCLE_START_FIELD -->

**cycle_time_start_state**
`string` - Starting state for cycle time calculation
Example: `"In Progress"`
Validation rules:

- Required
- Must be one of the workflow_states

<!-- CODE-REF: backend/app/schemas.py#CONFIG_CYCLE_END_FIELD -->

**cycle_time_end_state**
`string` - Ending state for cycle time calculation
Example: `"Done"`
Validation rules:

- Required
- Must be one of the workflow_states

## Configuration Request Schemas

### Create Configuration Request

```json
{
  "type": "object",
  "required": [
    "name",
    "jira_server",
    "jira_email",
    "jira_api_token",
    "workflow_states",
    "lead_time_start_state",
    "lead_time_end_state",
    "cycle_time_start_state",
    "cycle_time_end_state"
  ],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "pattern": "^[a-zA-Z0-9_\\- ]+$"
    },
    "jira_server": {
      "type": "string",
      "format": "uri"
    },
    "jira_email": {
      "type": "string",
      "format": "email"
    },
    "jira_api_token": {
      "type": "string",
      "minLength": 1
    },
    "project_key": {
      "type": "string"
    },
    "jql_query": {
      "type": "string"
    },
    "workflow_states": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "minItems": 2
    },
    "lead_time_start_state": {
      "type": "string"
    },
    "lead_time_end_state": {
      "type": "string"
    },
    "cycle_time_start_state": {
      "type": "string"
    },
    "cycle_time_end_state": {
      "type": "string"
    }
  }
}
```

### Update Configuration Request

Same as Create Configuration Request, but all fields are optional.

## Configuration Response Schemas

### Configuration List Response

```json
{
  "type": "object",
  "required": ["items", "total", "skip", "limit"],
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "jira_server", "jira_email"],
        "properties": {
          "name": {
            "type": "string"
          },
          "jira_server": {
            "type": "string"
          },
          "jira_email": {
            "type": "string"
          }
        }
      }
    },
    "total": {
      "type": "integer",
      "minimum": 0
    },
    "skip": {
      "type": "integer",
      "minimum": 0
    },
    "limit": {
      "type": "integer",
      "minimum": 1
    }
  }
}
```

### Single Configuration Response

Same as Configuration Object, but with `jira_api_token` masked as `"********"`.

## Validation Rules

1. **Name Uniqueness**: Configuration names must be unique
2. **State Validation**:
   - `lead_time_start_state` must be in `workflow_states`
   - `lead_time_end_state` must be in `workflow_states`
   - `cycle_time_start_state` must be in `workflow_states`
   - `cycle_time_end_state` must be in `workflow_states`
3. **JQL Validation**: If provided, `jql_query` must be valid JQL syntax
4. **Credential Validation**: Credentials are validated against Jira API before saving

## Examples

### Create Configuration Request Example

```json
{
  "name": "Team Alpha Sprint Metrics",
  "jira_server": "https://company.atlassian.net",
  "jira_email": "user@example.com",
  "jira_api_token": "api-token-value",
  "project_key": "ALPHA",
  "jql_query": "project = ALPHA AND updated >= -90d",
  "workflow_states": ["Backlog", "In Progress", "Review", "Done"],
  "lead_time_start_state": "Backlog",
  "lead_time_end_state": "Done",
  "cycle_time_start_state": "In Progress",
  "cycle_time_end_state": "Done"
}
```

### Configuration List Response Example

```json
{
  "items": [
    {
      "name": "Team Alpha Sprint Metrics",
      "jira_server": "https://company.atlassian.net",
      "jira_email": "user@example.com"
    },
    {
      "name": "Bug Analysis",
      "jira_server": "https://company.atlassian.net",
      "jira_email": "user@example.com"
    }
  ],
  "total": 2,
  "skip": 0,
  "limit": 10
}
```
