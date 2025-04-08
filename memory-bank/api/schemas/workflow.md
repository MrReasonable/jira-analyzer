# Workflow Schemas

> **Executive Summary:** This document defines the JSON schemas for workflow state objects used throughout the Jira Analyzer API. It includes detailed specifications for workflow state configuration, creation, update, and retrieval operations, along with validation rules and example payloads.

<!--
Last Updated: 08/04/2025
Related Documents:
- [Memory Bank Index](../../INDEX.md)
- [Backend API](../backend-api.md)
- [Error Handling](../error-handling.md)
- [Jira Integration](../jira-integration.md)
- [Workflow Editor](../../features/workflow-editor.md)
-->

## Table of Contents

- [Overview](#overview)
- [Workflow State Object](#workflow-state-object)
- [Workflow Configuration Schemas](#workflow-configuration-schemas)
- [Workflow Request Schemas](#workflow-request-schemas)
- [Workflow Response Schemas](#workflow-response-schemas)
- [Validation Rules](#validation-rules)
- [Examples](#examples)

## Overview

This document defines the JSON schemas for workflow state-related requests and responses in the Jira Analyzer API. These schemas are used for validation and documentation purposes.

## Workflow State Object

The core WorkflowState object has the following structure:

```typescript
interface WorkflowState {
  id?: string; // Optional ID from Jira
  name: string; // Required, display name of the state
  category?: string; // Optional category (To Do, In Progress, Done)
  position: number; // Required, position in the workflow
  color?: string; // Optional color for UI display (hex code)
  description?: string; // Optional description
}
```

## Workflow Configuration Schemas

Workflow states are typically configured as part of a Jira configuration:

```json
{
  "type": "object",
  "properties": {
    "workflow_states": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "position"],
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string",
            "minLength": 1
          },
          "category": {
            "type": "string",
            "enum": ["To Do", "In Progress", "Done"]
          },
          "position": {
            "type": "integer",
            "minimum": 0
          },
          "color": {
            "type": "string",
            "pattern": "^#[0-9A-Fa-f]{6}$"
          },
          "description": {
            "type": "string"
          }
        }
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

## Workflow Request Schemas

### Create Workflow Request

```json
{
  "type": "object",
  "required": ["name", "position"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    },
    "category": {
      "type": "string",
      "enum": ["To Do", "In Progress", "Done"]
    },
    "position": {
      "type": "integer",
      "minimum": 0
    },
    "color": {
      "type": "string",
      "pattern": "^#[0-9A-Fa-f]{6}$"
    },
    "description": {
      "type": "string"
    }
  }
}
```

### Update Workflow Request

Same as Create Workflow Request, but all fields are optional.

## Workflow Response Schemas

### Workflow List Response

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "required": ["name", "position"],
    "properties": {
      "id": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "category": {
        "type": "string"
      },
      "position": {
        "type": "integer"
      },
      "color": {
        "type": "string"
      },
      "description": {
        "type": "string"
      }
    }
  }
}
```

## Validation Rules

1. **Name Uniqueness**: Workflow state names must be unique within a configuration
2. **Position Uniqueness**: Workflow state positions must be unique within a configuration
3. **State References**:
   - `lead_time_start_state` must match a workflow state name
   - `lead_time_end_state` must match a workflow state name
   - `cycle_time_start_state` must match a workflow state name
   - `cycle_time_end_state` must match a workflow state name
4. **Color Format**: If provided, color must be a valid hex code (e.g., "#FF5733")

## Examples

### Workflow States Example

```json
[
  {
    "id": "",
    "name": "Backlog",
    "category": "To Do",
    "position": 0,
    "color": "#4287f5",
    "description": "Issues that are ready to be worked on"
  },
  {
    "id": "",
    "name": "In Progress",
    "category": "In Progress",
    "position": 1,
    "color": "#f5d142",
    "description": "Issues that are currently being worked on"
  },
  {
    "id": "",
    "name": "Review",
    "category": "In Progress",
    "position": 2,
    "color": "#42f5b3",
    "description": "Issues that are being reviewed"
  },
  {
    "id": "",
    "name": "Done",
    "category": "Done",
    "position": 3,
    "color": "#42f54e",
    "description": "Issues that are completed"
  }
]
```

### Workflow Configuration Example

```json
{
  "workflow_states": [
    {
      "name": "Backlog",
      "category": "To Do",
      "position": 0
    },
    {
      "name": "In Progress",
      "category": "In Progress",
      "position": 1
    },
    {
      "name": "Review",
      "category": "In Progress",
      "position": 2
    },
    {
      "name": "Done",
      "category": "Done",
      "position": 3
    }
  ],
  "lead_time_start_state": "Backlog",
  "lead_time_end_state": "Done",
  "cycle_time_start_state": "In Progress",
  "cycle_time_end_state": "Done"
}
```
