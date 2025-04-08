# Custom Hook Patterns

> **Executive Summary:** Jira Analyzer uses several custom hook patterns to manage state and side effects in the frontend. These include data fetching hooks, form management hooks, state management hooks with reducers, hook composition for combining functionality, validation hooks, and lifecycle hooks. Each pattern follows a specific structure and has clear use cases.

<!--
Last Updated: 08/04/2025
Related Documents:
- [Code Pattern Examples](./README.md)
- [React Component Patterns](./react-component-patterns.md)
- [State Management Patterns](./state-management-patterns.md)
- [SOLID Principles](../patterns/solid.md)
- [Functional Programming](../patterns/functional-programming.md)
-->

## Quick Reference

| Hook Pattern         | Purpose                             | Example                   | When to Use                                |
| -------------------- | ----------------------------------- | ------------------------- | ------------------------------------------ |
| **Data Fetching**    | Handle API data loading with states | `useJiraConfigurations()` | When fetching data from APIs               |
| **Form Management**  | Manage form state and validation    | `useConfigurationForm()`  | When handling form inputs and submission   |
| **State Management** | Complex state with reducers         | `useWorkflowManager()`    | When state has multiple operations         |
| **Composition**      | Combine multiple hooks              | `useComposedHook()`       | When functionality spans multiple concerns |
| **Validation**       | Validate user input                 | `useJqlValidation()`      | When input requires validation             |
| **Lifecycle**        | Manage component lifecycle          | `usePageTracking()`       | When tracking mount/unmount events         |

## Table of Contents

- [Data Fetching Hook Pattern](#data-fetching-hook-pattern)
- [Form Management Hook Pattern](#form-management-hook-pattern)
- [State Management Hook Pattern](#state-management-hook-pattern)
- [Composition Pattern](#composition-pattern)
- [Validation Hook Pattern](#validation-hook-pattern)
- [Lifecycle Hook Pattern](#lifecycle-hook-pattern)

## Data Fetching Hook Pattern

This pattern is used for hooks that fetch data from APIs. It handles loading states, errors, and caching.

```typescript
function useDataFetching<T>(fetchFn: () => Promise<T>, dependencies: any[] = [], initialData?: T) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchFn()
      .then((result) => {
        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return { data, loading, error, refetch: fetchFn };
}

// Example usage
function useJiraConfigurations() {
  return useDataFetching<Configuration[]>(() => jiraApi.getConfigurations(), []);
}
```

### When to Use

- When fetching data from APIs
- When you need to handle loading and error states
- When you want to encapsulate API calls in a reusable hook

## Form Management Hook Pattern

This pattern is used for hooks that manage form state and validation.

```typescript
function useFormManagement<T>(initialValues: T, validationSchema?: any) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleChange = (field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));

    // Validate on change if schema provided
    if (validationSchema) {
      try {
        validationSchema.validateSyncAt(field as string, { [field]: value });
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      } catch (error) {
        setErrors((prev) => ({ ...prev, [field]: error.message }));
      }
    }
  };

  const handleBlur = (field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Validate on blur if schema provided
    if (validationSchema) {
      try {
        validationSchema.validateSyncAt(field as string, values);
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      } catch (error) {
        setErrors((prev) => ({ ...prev, [field]: error.message }));
      }
    }
  };

  const validateForm = () => {
    if (!validationSchema) return true;

    try {
      validationSchema.validateSync(values, { abortEarly: false });
      setErrors({});
      return true;
    } catch (error) {
      const validationErrors = {};
      error.inner.forEach((err) => {
        validationErrors[err.path] = err.message;
      });
      setErrors(validationErrors);
      return false;
    }
  };

  const handleSubmit = async (onSubmit: (values: T) => Promise<void>) => {
    setIsSubmitting(true);

    if (validateForm()) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error("Form submission error:", error);
      }
    }

    setIsSubmitting(false);
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    validateForm,
  };
}

// Example usage
function useConfigurationForm() {
  const initialValues = {
    name: "",
    projectKey: "",
    jql: "",
    credentials: { username: "", apiToken: "" },
  };

  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    projectKey: Yup.string().required("Project key is required"),
    credentials: Yup.object({
      username: Yup.string().required("Username is required"),
      apiToken: Yup.string().required("API token is required"),
    }),
  });

  return useFormManagement(initialValues, validationSchema);
}
```

### When to Use

- When managing form state and validation
- When you need to handle form submission
- When you want to encapsulate form logic in a reusable hook

## State Management Hook Pattern

This pattern is used for hooks that manage complex state with reducers.

```typescript
function useStateManagement<S, A>(
  reducer: (state: S, action: A) => S,
  initialState: S,
  middleware?: (state: S, action: A) => void
) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const enhancedDispatch = useCallback(
    (action: A) => {
      if (middleware) {
        middleware(state, action);
      }
      dispatch(action);
    },
    [state, middleware]
  );

  return [state, enhancedDispatch] as const;
}

// Example usage
function useWorkflowManager(initialStates: WorkflowState[]) {
  type State = {
    states: WorkflowState[];
    selectedStateId: number | null;
  };

  type Action =
    | { type: "ADD_STATE"; state: WorkflowState }
    | { type: "UPDATE_STATE"; id: number; updates: Partial<WorkflowState> }
    | { type: "REMOVE_STATE"; id: number }
    | { type: "SELECT_STATE"; id: number }
    | { type: "REORDER_STATES"; newOrder: WorkflowState[] };

  const reducer = (state: State, action: Action): State => {
    switch (action.type) {
      case "ADD_STATE":
        return {
          ...state,
          states: [...state.states, action.state],
        };
      case "UPDATE_STATE":
        return {
          ...state,
          states: state.states.map((s) => (s.id === action.id ? { ...s, ...action.updates } : s)),
        };
      case "REMOVE_STATE":
        return {
          ...state,
          states: state.states.filter((s) => s.id !== action.id),
          selectedStateId: state.selectedStateId === action.id ? null : state.selectedStateId,
        };
      case "SELECT_STATE":
        return {
          ...state,
          selectedStateId: action.id,
        };
      case "REORDER_STATES":
        return {
          ...state,
          states: action.newOrder,
        };
      default:
        return state;
    }
  };

  const logMiddleware = (state: State, action: Action) => {
    console.log("Action:", action.type, action);
    console.log("Previous State:", state);
  };

  const [state, dispatch] = useStateManagement(
    reducer,
    { states: initialStates, selectedStateId: null },
    logMiddleware
  );

  return {
    states: state.states,
    selectedStateId: state.selectedStateId,
    addState: (state: WorkflowState) => dispatch({ type: "ADD_STATE", state }),
    updateState: (id: number, updates: Partial<WorkflowState>) =>
      dispatch({ type: "UPDATE_STATE", id, updates }),
    removeState: (id: number) => dispatch({ type: "REMOVE_STATE", id }),
    selectState: (id: number) => dispatch({ type: "SELECT_STATE", id }),
    reorderStates: (newOrder: WorkflowState[]) => dispatch({ type: "REORDER_STATES", newOrder }),
  };
}
```

### When to Use

- When managing complex state with multiple operations
- When you need to track state changes with middleware
- When you want to encapsulate state logic in a reusable hook

## Composition Pattern

This pattern is used to compose multiple hooks into a single hook.

```typescript
function useComposedHook() {
  // Compose multiple hooks
  const { data: configurations, loading: configurationsLoading } = useJiraConfigurations();
  const { data: projects, loading: projectsLoading } = useJiraProjects();
  const form = useConfigurationForm();

  // Derive additional state or behavior
  const isLoading = configurationsLoading || projectsLoading;
  const hasConfigurations = configurations && configurations.length > 0;

  // Provide additional functionality
  const handleSave = async () => {
    if (form.validateForm()) {
      await saveConfiguration(form.values);
      form.resetForm();
    }
  };

  // Return combined state and behavior
  return {
    configurations,
    projects,
    form,
    isLoading,
    hasConfigurations,
    handleSave,
  };
}
```

### When to Use

- When you need to combine multiple hooks
- When you want to derive additional state or behavior
- When you want to provide a unified interface for related functionality

## Validation Hook Pattern

This pattern is used for hooks that perform validation.

```typescript
function useValidation<T>(
  value: T,
  validationFn: (value: T) => string | null,
  validateOnChange = true
) {
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  useEffect(() => {
    if (validateOnChange && isDirty) {
      setError(validationFn(value));
    }
  }, [value, validationFn, validateOnChange, isDirty]);

  const validate = () => {
    setIsDirty(true);
    const validationError = validationFn(value);
    setError(validationError);
    return !validationError;
  };

  return { error, isDirty, validate };
}

// Example usage
function useJqlValidation(jql: string) {
  return useValidation(jql, (value) => {
    if (!value) return null;

    // Simple JQL validation
    const hasValidSyntax =
      /^[a-zA-Z]+ (=|!=|>|<|>=|<=) "[^"]*"( (AND|OR) [a-zA-Z]+ (=|!=|>|<|>=|<=) "[^"]*")*$/.test(
        value
      );

    if (!hasValidSyntax) {
      return "Invalid JQL syntax";
    }

    return null;
  });
}
```

### When to Use

- When you need to validate user input
- When you want to encapsulate validation logic
- When you need to track validation state

## Lifecycle Hook Pattern

This pattern is used for hooks that manage component lifecycle.

```typescript
function useLifecycle(onMount?: () => void | (() => void), onUnmount?: () => void) {
  useEffect(() => {
    const cleanup = onMount?.();

    return () => {
      cleanup?.();
      onUnmount?.();
    };
  }, []);
}

// Example usage
function usePageTracking(pageName: string) {
  useLifecycle(
    () => {
      // On mount
      console.log(`Page ${pageName} mounted`);
      analytics.trackPageView(pageName);

      // Return cleanup function
      return () => {
        console.log(`Page ${pageName} will unmount`);
      };
    },
    () => {
      // On unmount
      console.log(`Page ${pageName} unmounted`);
      analytics.trackPageExit(pageName);
    }
  );
}
```

### When to Use

- When you need to perform actions on component mount/unmount
- When you want to encapsulate lifecycle logic
- When you need to track component lifecycle events
