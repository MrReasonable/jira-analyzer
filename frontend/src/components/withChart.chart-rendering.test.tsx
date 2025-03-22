import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@solidjs/testing-library'
import { withChart, ChartData } from './withChart'
import Chart from 'chart.js/auto'
import { createSignal } from 'solid-js'

// Mock Chart.js
vi.mock('chart.js/auto', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      destroy: vi.fn(),
    })),
  }
})

describe('withChart rendering behavior', () => {
  // Sample data for testing
  interface TestChartData extends ChartData {
    values: number[]
    labels: string[]
    error?: string
  }

  const mockData: TestChartData = {
    values: [1, 2, 3, 4, 5],
    labels: ['A', 'B', 'C', 'D', 'E'],
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
    return (
      <div data-testid="metrics">
        Average: {data.values.reduce((a, b) => a + b, 0) / data.values.length}
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

  it('renders chart correctly with valid data', () => {
    // Create a test component using withChart
    const TestChart = withChart<TestChartData>({
      createChartInstance: mockCreateChartInstance,
      renderMetrics: mockRenderMetrics,
    })

    render(() => <TestChart data={mockData} loading={false} title="Test Chart" />)

    // Check for title
    expect(screen.getByText('Test Chart')).toBeInTheDocument()

    // Check for metrics
    expect(screen.getByTestId('metrics')).toBeInTheDocument()

    // Verify chart creation was called
    expect(mockCreateChartInstance).toHaveBeenCalledTimes(1)
    expect(Chart).toHaveBeenCalledTimes(1)

    // Verify no "No data available" message
    const noDataMessage = screen.queryByText(/No data available/)
    expect(noDataMessage).not.toBeInTheDocument()
  })

  it('shows "No data available" message when data is null', () => {
    // Create a test component using withChart
    const TestChart = withChart<TestChartData>({
      createChartInstance: mockCreateChartInstance,
      renderMetrics: mockRenderMetrics,
    })

    render(() => <TestChart data={null} loading={false} title="Test Chart" />)

    // Check for empty state message
    const noDataMessage = screen.getByText(/No data available/)
    expect(noDataMessage).toBeInTheDocument()

    // Verify chart creation was not called
    expect(mockCreateChartInstance).not.toHaveBeenCalled()
  })

  it('shows "No data available" message when data has error', () => {
    // Create a test component with error handling
    const TestChartWithError = withChart<TestChartData>({
      createChartInstance: mockCreateChartInstance,
      renderMetrics: mockRenderMetrics,
      handleError: data => !!data.error,
    })

    // Data with error
    const dataWithError = {
      ...mockData,
      error: 'Something went wrong',
    }

    render(() => <TestChartWithError data={dataWithError} loading={false} title="Test Chart" />)

    // Check for empty state message
    const noDataMessage = screen.getByText(/No data available/)
    expect(noDataMessage).toBeInTheDocument()

    // Verify chart creation was not called
    expect(mockCreateChartInstance).not.toHaveBeenCalled()
  })

  it('shows "No data available" message with empty array data', () => {
    // Create a test component using withChart
    const TestChart = withChart<TestChartData>({
      createChartInstance: mockCreateChartInstance,
      renderMetrics: mockRenderMetrics,
    })

    // Empty data (empty arrays)
    const emptyData: TestChartData = {
      values: [],
      labels: [],
    }

    render(() => <TestChart data={emptyData} loading={false} title="Test Chart" />)

    // With our updated default empty array detection, this should show "No data available"
    const noDataMessage = screen.getByText(/No data available/)
    expect(noDataMessage).toBeInTheDocument()

    // Chart creation should NOT be called due to our default empty array detection
    expect(mockCreateChartInstance).not.toHaveBeenCalled()

    // Metrics should NOT be rendered
    expect(screen.queryByTestId('metrics')).not.toBeInTheDocument()
  })

  it('handles chart creation errors gracefully', () => {
    // Mock chart creation to throw an error
    const mockCreateChartWithError = vi.fn().mockImplementation(() => {
      throw new Error('Chart creation failed')
    })

    // Create a test component using withChart with the error-throwing creation function
    const TestChart = withChart<TestChartData>({
      createChartInstance: mockCreateChartWithError,
      renderMetrics: mockRenderMetrics,
    })

    // Spy on console.error to catch the error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(() => <TestChart data={mockData} loading={false} title="Test Chart" />)

    // The component should not crash, but the chart creation should fail
    expect(mockCreateChartWithError).toHaveBeenCalledTimes(1)

    // Check if console.error was called with the error
    expect(consoleErrorSpy).toHaveBeenCalled()

    // Clean up
    consoleErrorSpy.mockRestore()
  })

  it('handles data transitions correctly', () => {
    // Create a test component using withChart
    const TestChart = withChart<TestChartData>({
      createChartInstance: mockCreateChartInstance,
      renderMetrics: mockRenderMetrics,
    })

    const [data, setData] = createSignal<TestChartData | null>(mockData)
    const [loading, setLoading] = createSignal(false)

    const { unmount } = render(() => <TestChart data={data} loading={loading} title="Test Chart" />)

    // Initially should render chart
    expect(screen.getByTestId('metrics')).toBeInTheDocument()
    expect(mockCreateChartInstance).toHaveBeenCalledTimes(1)

    // Update to loading state
    setLoading(true)
    expect(screen.getByRole('status')).toBeInTheDocument()

    // Update to no data state
    setLoading(false)
    setData(null)
    expect(screen.getByText(/No data available/)).toBeInTheDocument()

    // Update back to having data
    setData(mockData)
    expect(screen.getByTestId('metrics')).toBeInTheDocument()
    // Chart should be created again - with our implementation it's called 3 times
    // due to how SolidJS reactivity works
    expect(mockCreateChartInstance).toHaveBeenCalledTimes(3)

    unmount()
  })
})
