# JQL Builder

## Overview

The JQL (Jira Query Language) Builder feature allows users to create, validate, and manage JQL queries that filter which Jira issues are included in metrics calculations. JQL is a powerful, SQL-like language that allows for precise selection of issues based on various criteria such as project, issue type, status, and custom fields.

## User Workflow

1. **Creating JQL Queries**

   - Enter JQL directly into the JQL input field
   - Access the query through the configuration form or analytics section
   - Save queries as part of configurations for reuse

2. **Validation and Feedback**

   - Receive real-time validation feedback
   - See syntax highlighting for easier error identification
   - Get suggestions for valid field names and operators

3. **Using JQL in Analysis**
   - Apply JQL to filter issues for metrics calculations
   - Modify queries to refine analysis scope
   - Compare metrics across different JQL filters

## Technical Implementation

### Components Involved

- `JqlInput` - Main component for JQL entry and validation
- `useJiraMetrics` - Hook that uses JQL for fetching metrics
- `jiraApi` - API layer that sends JQL to backend

### Component Structure

The JQL input component provides a text area for entering queries with validation feedback:

```typescript
// Simplified JqlInput component structure
export const JqlInput: Component<JqlInputProps> = (props) => {
  const [error, setError] = createSignal<string | null>(null);
  const [isValid, setIsValid] = createSignal(true);

  // Validate JQL when it changes
  const handleJqlChange = (event: Event) => {
    const input = event.target as HTMLTextAreaElement;
    const jql = input.value;

    // Basic validation
    if (jql.trim() === "") {
      setError(null);
      setIsValid(true);
      props.onChange(jql);
      return;
    }

    try {
      // More complex validation could call the backend
      validateJql(jql);
      setError(null);
      setIsValid(true);
      props.onChange(jql);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JQL");
      setIsValid(false);
    }
  };

  return (
    <div class="jql-input-container">
      <label for="jql-input">JQL Query</label>
      <textarea
        id="jql-input"
        value={props.value}
        onInput={handleJqlChange}
        class={`jql-textarea ${!isValid() ? "error" : ""}`}
        placeholder="Enter JQL query (e.g., project = 'PROJ' AND status = 'Done')"
      />
      <Show when={error()}>
        <div class="error-message">{error()}</div>
      </Show>
      <div class="help-text">
        Filter issues using Jira Query Language.{" "}
        <a
          href="https://support.atlassian.com/jira-software-cloud/docs/advanced-search-reference-jql-fields/"
          target="_blank"
        >
          Learn more about JQL
        </a>
      </div>
    </div>
  );
};
```

### JQL Validation Flow

JQL validation occurs at multiple levels:

1. **Frontend Validation**:

   - Basic syntax checking
   - Required field presence
   - Well-formed query structure

2. **Backend Validation**:

   - Comprehensive syntax validation
   - Field existence checking
   - Permission verification
   - Query execution validation

3. **Jira API Validation**:
   - Final validation occurs when the query is sent to Jira
   - Ensures compatibility with specific Jira instance

## Common JQL Patterns

### Project Filtering

```sql
project = "PROJECT_KEY"
```

### Status Filtering

```sql
status IN ("In Progress", "Review", "Testing")
```

### Date Range Filtering

```sql
created >= "2023-01-01" AND created <= "2023-12-31"
```

### Issue Type Filtering

```sql
issuetype IN ("Story", "Bug", "Task")
```

### Complex Filtering

```sql
project = "PROJECT_KEY" AND issuetype = "Story" AND status CHANGED TO "Done" DURING ("2023-01-01", "2023-12-31") ORDER BY resolved DESC
```

## Edge Cases and Limitations

- **JQL Complexity**: Very complex JQL can impact performance
- **Field Availability**: Not all fields may be available in all Jira instances
- **Custom Fields**: Custom field names vary between Jira instances
- **Permission Issues**: Users may not have access to all fields
- **Query Length**: There are limits to JQL query length

## Best Practices

1. **Query Optimization**

   - Include project filters when possible
   - Limit date ranges to manageable periods
   - Use IN clauses for multiple value comparisons
   - Avoid unnecessary OR conditions

2. **Common Use Cases**

   - Team velocity: `project = "X" AND sprint in openSprints()`
   - Bug analysis: `project = "X" AND issuetype = "Bug" AND created >= -90d`
   - Release scope: `project = "X" AND fixVersion = "1.0"`
   - Recent completions: `project = "X" AND status = "Done" AND statusChanged >= -30d`

3. **Security Considerations**
   - JQL can expose sensitive data if not properly restricted
   - Always consider what data is visible to different user roles

## Future Enhancements

- Visual JQL builder with drag-and-drop interface
- JQL templates for common metric scenarios
- Query history and favorites
- Enhanced syntax highlighting
- Auto-completion for field names, operators, and values
- JQL sharing between configurations
- Advanced validation with field type awareness
