import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@solidjs/testing-library'
import { withChart, ChartData } from './withChart'
import Chart from 'chart.js/auto'

// Mock Chart.js
vi.mock('chart.js/auto', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      destroy: vi.fn(),
    })),
  }
})

describe('withChart empty data handling', () => {
  // Sample data types for testing
  interface TestChartData extends ChartData {
    data: number[] | null
    labels: string[] | null
    error?: string
  }

  // Mock canvas context
  const mockCanvasContext = {
    canvas: document.createElement('canvas'),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D

  // Mock chart instance creation function
  const mockCreateChartInstance = vi.fn().mockImplementation(() => {
    return new Chart(mockCanvasContext, {
      type: 'line',
      data: { datasets: [] },
    })
  })

  // Mock metrics rendering function
  const mockRenderMetrics = vi.fn().mockImplementation((data: TestChartData) => {
    if (!data.data || data.data.length === 0) {
      return <div data-testid="empty-metrics">No metrics available</div>
    }
    return (
      <div data-testid="metrics">
        Average: {data.data.reduce((a, b) => a + b, 0) / data.data.length}
      </div>
    )
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock getContext on HTMLCanvasElement
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCanvasContext)
  })

  afterEach(() => {
    cleanup()
  })

  it('shows "No data available" message with null data', () => {
    // Create a test component using withChart
    const TestChart = withChart<TestChartData>({
      createChartInstance: mockCreateChartInstance,
      renderMetrics: mockRenderMetrics,
    })

    render(() => <TestChart data={null} loading={false} title="Empty Data Test" />)

    // Check for empty state message
    const noDataMessage = screen.getByText(/No data available/)
    expect(noDataMessage).toBeInTheDocument()

    // Verify chart creation was not called
    expect(mockCreateChartInstance).not.toHaveBeenCalled()
  })

  it('shows "No data available" message with empty arrays', () => {
    // Create a test component with custom error handling for empty arrays
    const TestChartWithEmptyCheck = withChart<TestChartData>({
      createChartInstance: mockCreateChartInstance,
      renderMetrics: mockRenderMetrics,
      // Add custom error handling to detect empty arrays
      handleError: data => !data.data || data.data.length === 0,
    })

    // Empty data (empty arrays)
    const emptyData: TestChartData = {
      data: [],
      labels: [],
    }

    render(() => (
      <TestChartWithEmptyCheck data={emptyData} loading={false} title="Empty Data Test" />
    ))

    // Check for empty state message
    const noDataMessage = screen.getByText(/No data available/)
    expect(noDataMessage).toBeInTheDocument()

    // Verify chart creation was not called due to our custom error handler
    expect(mockCreateChartInstance).not.toHaveBeenCalled()
  })

  it('shows "No data available" message when no error handler is provided but data has empty arrays', () => {
    // Create a test component WITHOUT custom error handling for empty arrays
    const TestChart = withChart<TestChartData>({
      createChartInstance: mockCreateChartInstance,
      renderMetrics: mockRenderMetrics,
      // No handleError function provided
    })

    // Empty data (empty arrays)
    const emptyData: TestChartData = {
      data: [],
      labels: [],
    }

    render(() => <TestChart data={emptyData} loading={false} title="Empty Data Test" />)

    // SHOULD show "No data available" message due to our default empty array detection
    const noDataMessage = screen.getByText(/No data available/)
    expect(noDataMessage).toBeInTheDocument()

    // Should NOT show metrics since we're showing the no data message
    expect(screen.queryByTestId('empty-metrics')).not.toBeInTheDocument()

    // Verify chart creation was NOT called due to our default empty array detection
    expect(mockCreateChartInstance).not.toHaveBeenCalled()
  })

  it('handles undefined data properties correctly', () => {
    // Create a test component with error handling for undefined properties
    const TestChartWithUndefinedCheck = withChart<TestChartData>({
      createChartInstance: mockCreateChartInstance,
      renderMetrics: mockRenderMetrics,
      // Add custom error handling to detect undefined properties
      handleError: data => !data.data || !data.labels,
    })

    // Data with undefined properties
    const incompleteData: TestChartData = {
      data: undefined as unknown as null,
      labels: ['A', 'B', 'C'],
    }

    render(() => (
      <TestChartWithUndefinedCheck
        data={incompleteData}
        loading={false}
        title="Incomplete Data Test"
      />
    ))

    // Check for empty state message
    const noDataMessage = screen.getByText(/No data available/)
    expect(noDataMessage).toBeInTheDocument()

    // Verify chart creation was not called
    expect(mockCreateChartInstance).not.toHaveBeenCalled()
  })

  it('handles data with zero values correctly', () => {
    // Create a test component using withChart
    const TestChart = withChart<TestChartData>({
      createChartInstance: mockCreateChartInstance,
      renderMetrics: mockRenderMetrics,
    })

    // Data with zero values (valid data, just all zeros)
    const zeroData: TestChartData = {
      data: [0, 0, 0],
      labels: ['A', 'B', 'C'],
    }

    render(() => <TestChart data={zeroData} loading={false} title="Zero Data Test" />)

    // Should NOT show "No data available" message
    const noDataMessage = screen.queryByText(/No data available/)
    expect(noDataMessage).not.toBeInTheDocument()

    // Should show metrics
    expect(screen.getByTestId('metrics')).toBeInTheDocument()

    // Verify chart creation was called
    expect(mockCreateChartInstance).toHaveBeenCalledTimes(1)
  })

  it('prevents chart creation errors with empty data by showing no data message', () => {
    // Mock chart creation to throw an error with empty data
    const mockCreateChartWithError = vi.fn().mockImplementation((ctx, data: TestChartData) => {
      if (!data.data || data.data.length === 0) {
        throw new Error('Cannot create chart with empty data')
      }
      return new Chart(ctx, {
        type: 'line',
        data: { datasets: [] },
      })
    })

    // Create a test component using withChart with the error-throwing creation function
    const TestChart = withChart<TestChartData>({
      createChartInstance: mockCreateChartWithError,
      renderMetrics: mockRenderMetrics,
    })

    // Empty data
    const emptyData: TestChartData = {
      data: [],
      labels: [],
    }

    // Spy on console.error to catch the error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(() => <TestChart data={emptyData} loading={false} title="Error Test" />)

    // The component should not crash, and should show the no data message
    expect(screen.getByText(/No data available/)).toBeInTheDocument()

    // Chart creation should NOT be called due to our default empty array detection
    expect(mockCreateChartWithError).not.toHaveBeenCalled()

    // Console.error should not be called since we prevent the error
    expect(consoleErrorSpy).not.toHaveBeenCalled()

    // Clean up
    consoleErrorSpy.mockRestore()
  })
})
