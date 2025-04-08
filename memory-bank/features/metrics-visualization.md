# Metrics Visualization

## Overview

The Metrics Visualization feature is the core analytical component of Jira Analyzer, transforming raw Jira issue data into meaningful, visual representations of team performance metrics. It provides various chart types that help teams understand workflow efficiency, identify bottlenecks, and make data-driven decisions to improve their development processes.

## Available Chart Types

### 1. Lead Time Chart

**Purpose**: Visualize how long issues take from creation to completion.

**Implementation**:

- Uses a scatter plot with trend line
- X-axis represents completion date
- Y-axis represents lead time in days
- Each point represents a single issue
- Includes percentile markers (50th, 85th, 95th)

**Component**: `LeadTimeChart`

### 2. Cycle Time Chart

**Purpose**: Measure the time issues spend in specific workflow states.

**Implementation**:

- Uses a stacked bar chart
- X-axis represents issue key/ID
- Y-axis represents time in days
- Each segment of a bar represents time in a specific workflow state
- Color-coded by workflow state

**Component**: `CycleTimeChart`

### 3. Throughput Chart

**Purpose**: Track completion rates over time.

**Implementation**:

- Uses a column chart
- X-axis represents time periods (days, weeks, months)
- Y-axis represents number of completed issues
- Includes a rolling average line
- Optionally includes a target line

**Component**: `ThroughputChart`

### 4. WIP (Work in Progress) Chart

**Purpose**: Monitor the number of issues in progress at any given time.

**Implementation**:

- Uses a line chart
- X-axis represents time
- Y-axis represents number of issues in progress
- Includes average and limit markers
- Optionally includes annotations for significant events

**Component**: `WipChart`

### 5. CFD (Cumulative Flow Diagram)

**Purpose**: Visualize workflow distribution and identify bottlenecks.

**Implementation**:

- Uses a stacked area chart
- X-axis represents time
- Y-axis represents cumulative count of issues
- Each color represents a different workflow state
- Area between curves shows issues in each state

**Component**: `CfdChart`

## Technical Implementation

### Chart Rendering Architecture

The application uses a higher-order component (HOC) pattern with the `withChart` HOC to provide common functionality to all chart components:

```typescript
// Higher-order component for chart functionality
export function withChart<T extends ChartProps>(
  WrappedComponent: Component<T>,
  options: ChartOptions = {}
) {
  return (props: T) => {
    const [dimensions, setDimensions] = createSignal({ width: 0, height: 0 });
    const chartRef = createRef<HTMLDivElement>();
    const [mousePosition, setMousePosition] = createSignal<MousePosition | null>(null);

    // Common logic for all charts...

    return (
      <div
        class="chart-container relative w-full h-full"
        ref={chartRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePosition(null)}
      >
        <Show when={!props.loading && !isEmpty(props.data)} fallback={renderFallback()}>
          <WrappedComponent {...props} dimensions={dimensions()} mousePosition={mousePosition()} />
        </Show>
      </div>
    );
  };
}
```

### Data Processing Flow

1. Raw Jira issue data is fetched from the backend
2. Data is processed by metric-specific services
3. Processed data is formatted for chart consumption
4. Charts render the data with appropriate visual elements
5. Interactive elements provide detailed information on hover/click

### Common Features Across Charts

- **Loading States**: Consistent loading indicators
- **Empty States**: User-friendly messaging when no data is available
- **Error Handling**: Clear error states with retry options
- **Responsiveness**: Charts adapt to different container sizes
- **Tooltips**: Detailed information on hover
- **Accessibility**: Screen reader support and keyboard navigation
- **Export Options**: Ability to download charts as images

## Integration with Workflow Configuration

Metrics visualization is tightly integrated with the workflow configuration:

- Lead time calculations use the configured start and end states
- Cycle time analysis uses workflow state transitions
- WIP count is based on configured "in progress" states
- CFD shows distribution across all configured workflow states

## Edge Cases and Limitations

- **Large Datasets**: Performance may degrade with very large issue sets (>10,000 issues)
- **Date Ranges**: Very long time ranges may reduce visual clarity
- **Outliers**: Extreme outliers can skew visualizations
- **State Transitions**: Incomplete Jira history can affect accuracy
- **Mobile Viewing**: Complex charts may have reduced usability on small screens

## Best Practices

1. **Chart Interpretation**

   - Lead Time: Look for trends over time and outliers
   - Cycle Time: Identify which states contribute most to total time
   - Throughput: Watch for patterns and correlate with team events
   - WIP: Monitor against established WIP limits
   - CFD: Watch for widening bands indicating bottlenecks

2. **Data Selection**
   - Use focused JQL queries to analyze specific work types
   - Compare similar time periods for consistent analysis
   - Consider excluding extreme outliers for clearer patterns
   - Use date filters to zoom in on specific timeframes

## Future Enhancements

- Advanced filtering within visualizations
- Custom chart configurations and layouts
- Statistical analysis (e.g., cycle time percentile predictions)
- Historical comparison with previous time periods
- Annotations for significant events (releases, process changes)
- Dashboard customization with preferred charts
- Automated insights and recommendations based on metrics
