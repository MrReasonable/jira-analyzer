import { createEffect, onCleanup, createMemo, Accessor, JSX } from 'solid-js'
import Chart from 'chart.js/auto'

// Generic type for chart data - make it more flexible
export type ChartData = object

// Props that all chart components share
export interface ChartProps<T extends ChartData> {
  data: Accessor<T | null> | T | null
  loading: Accessor<boolean> | boolean
  title: string
}

// Configuration for chart creation
export interface ChartConfig<T extends ChartData> {
  createChartInstance: (ctx: CanvasRenderingContext2D, data: T) => Chart
  renderMetrics: (data: T) => JSX.Element
  handleError?: (data: T & { error?: string }) => boolean
}

export function withChart<T extends ChartData>(config: ChartConfig<T>) {
  return (props: ChartProps<T>) => {
    let chartRef: HTMLCanvasElement | undefined
    let chartInstance: Chart | undefined

    // Helper functions to handle both accessor and non-accessor props
    const getData = createMemo(() => {
      if (typeof props.data === 'function') {
        return props.data()
      }
      return props.data
    })

    const isLoading = createMemo(() => {
      if (typeof props.loading === 'function') {
        return props.loading()
      }
      return props.loading
    })

    const hasError = createMemo(() => {
      const data = getData()
      if (!data) return false

      // Check for error property
      if (config.handleError) {
        return config.handleError(data as T & { error?: string })
      }

      // Default empty data check if no custom handler
      // Check if data has empty arrays for common properties
      const isEmpty = Object.entries(data).some(([key, value]) => {
        return (
          Array.isArray(value) &&
          value.length === 0 &&
          ['data', 'dates', 'counts', 'values', 'status'].includes(key)
        )
      })

      return isEmpty
    })

    const createChart = () => {
      const data = getData()
      if (!data || !chartRef || hasError()) {
        // Cannot create chart: missing data, chart reference, or has error
        return
      }

      const ctx = chartRef.getContext('2d')
      if (!ctx) {
        console.error('Failed to get canvas context')
        return
      }

      try {
        // Use the native CanvasRenderingContext2D
        chartInstance = config.createChartInstance(ctx, data)

        // Chart created successfully
      } catch (error) {
        // Log the error but don't crash the component
        console.error('Error creating chart:', error)
        // Clean up any partial chart instance
        if (chartInstance) {
          chartInstance.destroy()
          chartInstance = undefined
        }
      }
    }

    createEffect(() => {
      // Trigger effect on both loading and data changes
      const data = getData()
      const loading = isLoading()
      const currentHasData = !loading && !!data && !hasError()

      // Always destroy previous chart instance if it exists
      if (chartInstance) {
        chartInstance.destroy()
        chartInstance = undefined
      }

      // Create chart if we have data
      if (currentHasData) {
        // In tests, create chart immediately to ensure it's available for assertions
        createChart()
      }
    })

    onCleanup(() => {
      if (chartInstance) {
        chartInstance.destroy()
        chartInstance = undefined
      }
    })

    // Render content based on component state
    const renderContent = () => {
      if (isLoading()) {
        return (
          <output class="flex justify-center py-4" aria-label="Loading">
            <div class="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </output>
        )
      }

      if (hasError() || !getData()) {
        return (
          <div data-testid="no-data-message">
            <p class="py-4 text-center text-gray-500">
              No data available. Configure Jira and run analysis to see results.
            </p>
          </div>
        )
      }

      return (
        <>
          <canvas ref={el => (chartRef = el)} />
          <div class="metrics-container">{config.renderMetrics(getData() as T)}</div>
        </>
      )
    }

    return (
      <div class="card">
        <div class="space-y-4">
          <h2 class="text-xl font-bold">{props.title}</h2>
          {renderContent()}
        </div>
      </div>
    )
  }
}
