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

// Define a type for the canvas context
export type CanvasContext = {
  canvas: HTMLCanvasElement
  clearRect: (x: number, y: number, width: number, height: number) => void
  fillRect: (x: number, y: number, width: number, height: number) => void
  // Add other necessary properties as needed
}

// Configuration for chart creation
export interface ChartConfig<T extends ChartData> {
  createChartInstance: (ctx: CanvasContext, data: T) => Chart
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
      return config.handleError ? config.handleError(data as T & { error?: string }) : false
    })

    const createChart = () => {
      const data = getData()
      if (!data || !chartRef || hasError()) return

      // Always destroy previous instance
      if (chartInstance) {
        chartInstance.destroy()
        chartInstance = undefined
      }

      const ctx = chartRef.getContext('2d')
      if (!ctx) return

      // Cast the context to our CanvasContext type
      chartInstance = config.createChartInstance(ctx as unknown as CanvasContext, data as T)
    }

    createEffect(() => {
      // Trigger effect on both loading and data changes
      const data = getData()
      const loading = isLoading()

      if (!loading && data && !hasError()) {
        // Create chart directly in the effect
        createChart()
      }
    })

    onCleanup(() => {
      if (chartInstance) {
        chartInstance.destroy()
        chartInstance = undefined
      }
    })

    return (
      <div class="card">
        <div class="space-y-4">
          <h2 class="text-xl font-bold">{props.title}</h2>
          {isLoading() ? (
            <div class="flex justify-center py-4" role="status" aria-label="Loading">
              <div class="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : hasError() || !getData() ? (
            <p class="py-4 text-center text-gray-500">
              No data available. Configure Jira and run analysis to see results.
            </p>
          ) : (
            <>
              <canvas ref={el => (chartRef = el)} />
              {config.renderMetrics(getData() as T)}
            </>
          )}
        </div>
      </div>
    )
  }
}
