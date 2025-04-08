# Jira Analyzer Project Brief

> **Executive Summary:** Jira Analyzer is a specialized analytics tool that extracts, processes, and visualizes workflow metrics from Jira. It provides customizable workflow analysis, intuitive visualizations, and reusable configurations to help teams gain actionable insights into their development processes.

<!--
Last Updated: 08/04/2025
Related Documents:
- [Memory Bank Index](./INDEX.md)
- [Product Context](./productContext.md)
- [System Patterns](./systemPatterns.md)
- [Tech Context](./techContext.md)
- [Active Context](./activeContext.md)
- [Progress](./progress.md)
-->

## Table of Contents

- [Project Definition](#project-definition)
- [Core Requirements](#core-requirements)
  - [Primary Goals](#primary-goals)
  - [Technical Requirements](#technical-requirements)
  - [Metrics Requirements](#metrics-requirements)
- [Project Scope](#project-scope)
  - [Included](#included)
  - [Excluded](#excluded)
- [Success Criteria](#success-criteria)
- [Constraints](#constraints)
- [Architectural Standards](#architectural-standards)

## Project Definition

Jira Analyzer is a specialized analytics tool that extracts, processes, and visualizes workflow metrics from Jira to help teams gain insights into their development processes.

## Core Requirements

### Primary Goals

1. Provide accurate, actionable metrics derived from Jira issue data
2. Support customizable workflow analysis for different team processes
3. Present metrics through intuitive visualizations
4. Enable teams to save and reuse analysis configurations
5. Maintain secure handling of Jira credentials and data

### Technical Requirements

1. Web-based application with responsive interface
2. Secure integration with Jira's API
3. Persistent storage for configurations
4. Containerized deployment for consistent environments
5. Comprehensive test coverage for reliability

### Metrics Requirements

1. Lead Time tracking from issue creation to completion
2. Cycle Time measurement for specific workflow transitions
3. Throughput analysis to track completion rates
4. Work in Progress (WIP) monitoring
5. Cumulative Flow Diagram for visualizing workflow distribution

## Project Scope

### Included

- JQL-based filtering and analysis
- Secure storage of Jira credentials
- Configuration management (create, edit, save, delete)
- Workflow state definition and customization
- Chart generation for all required metrics
- User-friendly, responsive interface
- Docker-based deployment
- CI/CD pipeline for automated testing and deployment

### Excluded

- Direct modification of Jira issues or workflows
- Generation of custom reports beyond the defined metrics
- Integration with non-Jira issue tracking systems
- Historical trend analysis beyond the data available in Jira

## Success Criteria

1. Users can connect to any Jira instance with proper credentials
2. Configurations are correctly saved and retrieved
3. All specified metrics are accurately calculated and visualized
4. Interface is intuitive and responsive
5. Analysis can be performed on different projects with different workflows
6. Application performs efficiently even with large datasets

## Constraints

1. Must work with both Jira Cloud and Jira Server instances
2. Must handle Jira rate limiting appropriately
3. Must process data efficiently without excessive memory usage
4. Must secure sensitive credential information

## Architectural Standards

The Jira Analyzer project adheres to the following architectural standards to ensure code quality, maintainability, and scalability:

### SOLID Principles

All code must follow SOLID principles:

1. **Single Responsibility Principle**: Each class/module has one reason to change
2. **Open/Closed Principle**: Open for extension, closed for modification
3. **Liskov Substitution Principle**: Subtypes must be substitutable for base types
4. **Interface Segregation Principle**: Clients shouldn't depend on interfaces they don't use
5. **Dependency Inversion Principle**: Depend on abstractions, not concretions

See [SOLID Principles Documentation](./patterns/solid.md) for implementation details.

### Command Query Responsibility Segregation (CQRS)

The application implements CQRS to separate read and write operations:

1. **Command Side**: Handles operations that change state

   - Explicit command objects
   - Validation before processing
   - Dedicated command handlers
   - Focus on data consistency

2. **Query Side**: Handles operations that read state
   - Optimized for reading
   - Potentially cached
   - No side effects

See [CQRS Pattern Documentation](./patterns/cqrs.md) for implementation details.

### Functional Programming

Where appropriate, functional programming principles are applied:

1. **Pure Functions**: Same output for same input, no side effects
2. **Immutability**: Create new data structures instead of modifying existing ones
3. **Function Composition**: Build complex functions from simple ones
4. **Higher-Order Functions**: Functions that take/return other functions
5. **Declarative Programming**: Express what to do, not how to do it

See [Functional Programming Documentation](./patterns/functional-programming.md) for implementation details.

### Testing Standards

All code must be thoroughly tested following these principles:

1. **FIRST Principles**: Fast, Independent, Repeatable, Self-validating, Timely
2. **Test Coverage**: Minimum 90% line coverage for new code
3. **Behavior Testing**: Focus on testing behavior, not implementation details
4. **Test All Paths**: Cover success paths, error paths, and edge cases

See [Testing Documentation](./testing/unit-testing.md) for implementation details.

### No Workarounds

The project strictly prohibits workarounds or "quick fixes" that compromise code quality or architectural integrity. All solutions must:

1. Address the root cause of issues
2. Maintain architectural consistency
3. Follow established patterns and principles
4. Be properly tested and documented

### Critical Thinking and Questioning

The development process must include critical thinking and questioning of decisions, even when they come from authority figures. This principle ensures that:

1. All technical decisions are subject to scrutiny and validation
2. Suggestions that appear to contradict best practices are questioned
3. Potential issues are identified early through constructive challenge
4. The team functions as collaborative partners rather than order-takers
5. Quality and correctness take precedence over agreement

When faced with instructions or suggestions that seem problematic:

1. Identify specific concerns with clear technical reasoning
2. Propose alternative approaches that better align with best practices
3. Ask clarifying questions to ensure full understanding
4. Provide evidence or references to support your position
5. Maintain a respectful, collaborative tone while being direct about concerns
