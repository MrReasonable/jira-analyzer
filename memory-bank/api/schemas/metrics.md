# Metrics Schemas

> **Executive Summary:** This document defines the JSON schemas for metrics data returned by the Jira Analyzer API. It includes detailed specifications for lead time, cycle time, throughput, work in progress (WIP), and cumulative flow diagram (CFD) metrics, along with examples of each response format.

<!--
Last Updated: 08/04/2025
Related Documents:
- [Memory Bank Index](../../INDEX.md)
- [Backend API](../backend-api.md)
- [Error Handling](../error-handling.md)
- [Jira Integration](../jira-integration.md)
- [Metrics Visualization](../../features/metrics-visualization.md)
-->

## Table of Contents

- [Overview](#overview)
- [Common Metrics Parameters](#common-metrics-parameters)
- [Lead Time Response Schema](#lead-time-response-schema)
- [Cycle Time Response Schema](#cycle-time-response-schema)
- [Throughput Response Schema](#throughput-response-schema)
- [WIP Response Schema](#wip-response-schema)
- [CFD Response Schema](#cfd-response-schema)
- [Examples](#examples)

## Overview

This document defines the JSON schemas for metrics-related requests and responses in the Jira Analyzer API. These schemas are used for validation and documentation purposes.

## Common Metrics Parameters

All metrics endpoints accept the following common query parameters:

```json
{
  "jql": {
    "type": "string",
    "description": "JQL query to filter issues"
  },
  "config_name": {
    "type": "string",
    "description": "Name of a stored Jira configuration to use"
  },
  "start_date": {
    "type": "string",
    "format": "date",
    "description": "Start date for metrics calculation (YYYY-MM-DD)"
  },
  "end_date": {
    "type": "string",
    "format": "date",
    "description": "End date for metrics calculation (YYYY-MM-DD)"
  }
}
```

## Lead Time Response Schema

```json
{
  "type": "object",
  "required": ["average", "median", "min", "max", "data"],
  "properties": {
    "average": {
      "type": "number",
      "description": "Average lead time in days"
    },
    "median": {
      "type": "number",
      "description": "Median lead time in days"
    },
    "min": {
      "type": "number",
      "description": "Minimum lead time in days"
    },
    "max": {
      "type": "number",
      "description": "Maximum lead time in days"
    },
    "data": {
      "type": "array",
      "items": {
        "type": "number"
      },
      "description": "Array of individual lead times in days"
    }
  }
}
```

## Cycle Time Response Schema

```json
{
  "type": "object",
  "required": ["average", "median", "min", "max", "data", "start_state", "end_state"],
  "properties": {
    "average": {
      "type": "number",
      "description": "Average cycle time in days"
    },
    "median": {
      "type": "number",
      "description": "Median cycle time in days"
    },
    "min": {
      "type": "number",
      "description": "Minimum cycle time in days"
    },
    "max": {
      "type": "number",
      "description": "Maximum cycle time in days"
    },
    "data": {
      "type": "array",
      "items": {
        "type": "number"
      },
      "description": "Array of individual cycle times in days"
    },
    "start_state": {
      "type": "string",
      "description": "Starting workflow state for cycle time calculation"
    },
    "end_state": {
      "type": "string",
      "description": "Ending workflow state for cycle time calculation"
    }
  }
}
```

## Throughput Response Schema

```json
{
  "type": "object",
  "required": ["dates", "counts", "average"],
  "properties": {
    "dates": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "date"
      },
      "description": "Array of dates in the format YYYY-MM-DD"
    },
    "counts": {
      "type": "array",
      "items": {
        "type": "integer",
        "minimum": 0
      },
      "description": "Array of issue counts corresponding to each date"
    },
    "average": {
      "type": "number",
      "description": "Average throughput per day"
    }
  }
}
```

## WIP Response Schema

```json
{
  "type": "object",
  "required": ["status", "counts", "total"],
  "properties": {
    "status": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Array of workflow status names"
    },
    "counts": {
      "type": "array",
      "items": {
        "type": "integer",
        "minimum": 0
      },
      "description": "Array of issue counts corresponding to each status"
    },
    "total": {
      "type": "integer",
      "minimum": 0,
      "description": "Total number of issues across all statuses"
    }
  }
}
```

## CFD Response Schema

```json
{
  "type": "object",
  "required": ["statuses", "data"],
  "properties": {
    "statuses": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Array of workflow status names"
    },
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["date"],
        "properties": {
          "date": {
            "type": "string",
            "format": "date",
            "description": "Date in the format YYYY-MM-DD"
          },
          "additionalProperties": {
            "type": "integer",
            "minimum": 0,
            "description": "Count of issues in each status on this date"
          }
        }
      },
      "description": "Array of data points for each date"
    }
  }
}
```

## Examples

### Lead Time Response Example

```json
{
  "average": 7.5,
  "median": 6.2,
  "min": 1.0,
  "max": 21.3,
  "data": [4.2, 6.1, 8.3, 3.5, 15.2]
}
```

### Cycle Time Response Example

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

### Throughput Response Example

```json
{
  "dates": ["2024-03-01", "2024-03-02", "2024-03-03", "2024-03-04", "2024-03-05"],
  "counts": [5, 3, 7, 2, 6],
  "average": 4.6
}
```

### WIP Response Example

```json
{
  "status": ["Backlog", "In Progress", "Review", "Done"],
  "counts": [12, 5, 3, 20],
  "total": 40
}
```

### CFD Response Example

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
