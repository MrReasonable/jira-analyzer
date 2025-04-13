import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@solidjs/testing-library'
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

describe('withChart', () => {
  // Sample data for testing
  interface TestChartData extends ChartData {
    values: number[]
    labels: string[]
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
    // Use a more specific type for the Chart configuration
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

  // Create a test component using withChart
  const TestChart = withChart<TestChartData>({
    createChartInstance: mockCreateChartInstance,
    renderMetrics: mockRenderMetrics,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock getContext on HTMLCanvasElement
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCanvasContext)
  })

  it('renders loading state when loading is true', () => {
    render(() => <TestChart data={mockData} loading={true} title="Test Chart" />)

    // Check for loading spinner
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
  })

  it('renders chart and metrics when data is provided and not loading', () => {
    render(() => <TestChart data={mockData} loading={false} title="Test Chart" />)

    // Check for title
    expect(screen.getByText('Test Chart')).toBeInTheDocument()

    // Check for metrics
    expect(screen.getByTestId('metrics')).toBeInTheDocument()
    expect(screen.getByText(/Average:/)).toBeInTheDocument()

    // Verify chart creation was called
    expect(mockCreateChartInstance).toHaveBeenCalled()
    expect(Chart).toHaveBeenCalled()
  })

  it('renders empty state when data is null', () => {
    render(() => <TestChart data={null} loading={false} title="Test Chart" />)

    // Check for empty state message
    expect(screen.getByText(/No data available/)).toBeInTheDocument()

    // Verify chart creation was not called
    expect(mockCreateChartInstance).not.toHaveBeenCalled()
  })

  it('handles accessor props correctly', () => {
    const [data, setData] = createSignal<TestChartData | null>(mockData)
    const [loading, setLoading] = createSignal(false)

    render(() => <TestChart data={data} loading={loading} title="Test Chart" />)

    // Initially should render chart
    expect(screen.getByTestId('metrics')).toBeInTheDocument()
    expect(mockCreateChartInstance).toHaveBeenCalledTimes(1)

    // Update to loading state
    setLoading(true)
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()

    // Update to no data state
    setLoading(false)
    setData(null)
    expect(screen.getByText(/No data available/)).toBeInTheDocument()
  })

  it('destroys chart instance when component is unmounted', () => {
    const { unmount } = render(() => (
      <TestChart data={mockData} loading={false} title="Test Chart" />
    ))

    // Get the chart instance that was created
    const chartInstance = (
      Chart as unknown as { mock: { results: Array<{ value: { destroy: () => void } }> } }
    ).mock.results[0].value

    // Unmount the component
    unmount()

    // Verify destroy was called
    expect(chartInstance.destroy).toHaveBeenCalled()
  })

  it('handles error state when handleError returns true', () => {
    // Create a chart component with error handling
    const TestChartWithError = withChart<TestChartData & { error?: string }>({
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
    expect(screen.getByText(/No data available/)).toBeInTheDocument()

    // Verify chart creation was not called
    expect(mockCreateChartInstance).not.toHaveBeenCalled()
  })
})
