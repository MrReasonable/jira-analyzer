import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@solidjs/testing-library'
import { LeadTimeChart } from './LeadTimeChart'
import { Chart, ChartConfiguration } from 'chart.js/auto'

describe('LeadTimeChart', () => {
  const mockData = {
    average: 5.5,
    median: 5,
    min: 2,
    max: 10,
    data: [2, 4, 5, 5, 7, 10],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state correctly', () => {
    render(() => <LeadTimeChart data={null} loading={true} />)
    // Check for the loading spinner instead of text
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders no data message when data is null', () => {
    render(() => <LeadTimeChart data={null} loading={false} />)
    expect(screen.getByText(/No data available/)).toBeInTheDocument()
  })

  it('renders chart and metrics when data is provided', () => {
    render(() => <LeadTimeChart data={mockData} loading={false} />)

    // Check if metrics are displayed
    expect(screen.getByText('Average: 5.5 days')).toBeInTheDocument()
    expect(screen.getByText('Median: 5 days')).toBeInTheDocument()
    expect(screen.getByText('Range: 2-10 days')).toBeInTheDocument()

    // Check if canvas is rendered
    expect(document.querySelector('canvas')).toBeInTheDocument()
  })

  it('creates chart with correct configuration', async () => {
    render(() => <LeadTimeChart data={mockData} loading={false} />)

    // Wait for microtask queue to process chart creation
    await Promise.resolve()

    const chartCalls = vi.mocked(Chart).mock.calls
    expect(chartCalls.length).toBe(1)

    const [, config] = chartCalls[0]
    const chartConfig = config as Required<ChartConfiguration<'bar', number[], string>>

    expect(chartConfig.type).toBe('bar')
    expect(chartConfig.options?.responsive).toBe(true)
    expect(chartConfig.options?.plugins?.title?.text).toBe('Lead Time Distribution')

    // Calculate expected bins
    const binSize = 5
    const bins: { [key: string]: number } = {}
    mockData.data.forEach(days => {
      const binIndex = Math.floor(days / binSize) * binSize
      const binLabel = `${binIndex}-${binIndex + binSize}`
      bins[binLabel] = (bins[binLabel] || 0) + 1
    })

    expect(chartConfig.data.labels).toEqual(Object.keys(bins))
    expect(chartConfig.data.datasets[0].data).toEqual(Object.values(bins))
  })

  it('cleans up chart on unmount', async () => {
    const { unmount } = render(() => <LeadTimeChart data={mockData} loading={false} />)

    // Wait for microtask queue to process chart creation
    await new Promise(resolve => window.setTimeout(resolve, 10))

    expect(Chart).toHaveBeenCalledTimes(1)

    const chartInstance = vi.mocked(Chart).mock.results[0].value
    unmount()

    // Wait for cleanup to execute
    await new Promise(resolve => window.setTimeout(resolve, 10))

    expect(chartInstance.destroy).toHaveBeenCalled()
  })

  it('updates chart when data changes', async () => {
    const { unmount } = render(() => <LeadTimeChart data={mockData} loading={false} />)

    // Wait for initial chart creation
    await new Promise(resolve => window.setTimeout(resolve, 10))
    expect(Chart).toHaveBeenCalledTimes(1)

    const chartInstance = vi.mocked(Chart).mock.results[0].value

    const newData = {
      ...mockData,
      average: 6.5,
      data: [3, 5, 6, 7, 8, 10],
    }

    unmount()

    // Wait for cleanup
    await new Promise(resolve => window.setTimeout(resolve, 10))

    expect(chartInstance.destroy).toHaveBeenCalled()

    render(() => <LeadTimeChart data={newData} loading={false} />)

    // Wait for second chart creation
    await new Promise(resolve => window.setTimeout(resolve, 10))

    // Should create new chart
    expect(Chart).toHaveBeenCalledTimes(2)

    // Verify new chart configuration
    const lastCallConfig = vi.mocked(Chart).mock.calls[1][1] as Required<
      ChartConfiguration<'bar', number[], string>
    >

    // Calculate expected bins (same logic as in component)
    const binSize = 5
    const bins: { [key: string]: number } = {}
    newData.data.forEach(days => {
      const binIndex = Math.floor(days / binSize) * binSize
      const binLabel = `${binIndex}-${binIndex + binSize}`
      bins[binLabel] = (bins[binLabel] || 0) + 1
    })

    expect(lastCallConfig.data.labels).toEqual(Object.keys(bins))
    expect(lastCallConfig.data.datasets[0].data).toEqual(Object.values(bins))
  })

  it('handles empty data array', async () => {
    const emptyData = {
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      data: [],
    }

    render(() => <LeadTimeChart data={emptyData} loading={false} />)

    // Wait for chart creation
    await Promise.resolve()

    // Should still render chart container but with zero values
    expect(screen.getByText('Average: 0.0 days')).toBeInTheDocument()
    expect(document.querySelector('canvas')).toBeInTheDocument()
  })
})
