import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@solidjs/testing-library'
import { CycleTimeChart } from './CycleTimeChart'
import { Chart, ChartConfiguration } from 'chart.js/auto'
import { createSignal } from 'solid-js'

describe('CycleTimeChart', () => {
  const mockData = {
    average: 5.5,
    median: 5,
    min: 2,
    max: 10,
    data: [2, 4, 5, 5, 7, 10],
    start_state: 'In Progress',
    end_state: 'Done',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state correctly with boolean', () => {
    render(() => <CycleTimeChart data={null} loading={true} />)
    // Check for the loading spinner instead of text
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders loading state correctly with accessor', () => {
    const [loading] = createSignal(true)
    render(() => <CycleTimeChart data={null} loading={loading} />)
    // Check for the loading spinner instead of text
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders no data message when data is null with boolean', () => {
    render(() => <CycleTimeChart data={null} loading={false} />)
    expect(screen.getByText(/No data available/)).toBeInTheDocument()
  })

  it('renders no data message when data is null with accessor', () => {
    const [data] = createSignal(null)
    const [loading] = createSignal(false)
    render(() => <CycleTimeChart data={data} loading={loading} />)
    expect(screen.getByText(/No data available/)).toBeInTheDocument()
  })

  it('renders chart and metrics when data is provided as direct object', () => {
    render(() => <CycleTimeChart data={mockData} loading={false} />)

    // Check if metrics are displayed
    expect(screen.getByText('Average: 5.5 days')).toBeInTheDocument()
    expect(screen.getByText('Median: 5 days')).toBeInTheDocument()
    expect(screen.getByText('Range: 2-10 days')).toBeInTheDocument()
    expect(screen.getByText('From In Progress to Done')).toBeInTheDocument()

    // Check if canvas is rendered
    expect(document.querySelector('canvas')).toBeInTheDocument()
  })

  it('renders chart and metrics when data is provided as accessor', () => {
    const [data] = createSignal(mockData)
    const [loading] = createSignal(false)

    render(() => <CycleTimeChart data={data} loading={loading} />)

    // Check if metrics are displayed
    expect(screen.getByText('Average: 5.5 days')).toBeInTheDocument()
    expect(screen.getByText('Median: 5 days')).toBeInTheDocument()
    expect(screen.getByText('Range: 2-10 days')).toBeInTheDocument()
    expect(screen.getByText('From In Progress to Done')).toBeInTheDocument()

    // Check if canvas is rendered
    expect(document.querySelector('canvas')).toBeInTheDocument()
  })

  it('creates chart with correct configuration using direct data', () => {
    render(() => <CycleTimeChart data={mockData} loading={false} />)

    const chartCalls = vi.mocked(Chart).mock.calls
    expect(chartCalls.length).toBe(1)

    const [, config] = chartCalls[0] as [HTMLCanvasElement, ChartConfiguration]
    expect(config.type).toBe('bar')
    expect(config.options?.responsive).toBe(true)
    expect(config.options?.plugins?.title?.text).toBe('Cycle Time Distribution')
  })

  it('creates chart with correct configuration using accessor data', () => {
    const [data] = createSignal(mockData)

    render(() => <CycleTimeChart data={data} loading={false} />)

    const chartCalls = vi.mocked(Chart).mock.calls
    expect(chartCalls.length).toBe(1)

    const [, config] = chartCalls[0] as [HTMLCanvasElement, ChartConfiguration]
    expect(config.type).toBe('bar')
    expect(config.options?.responsive).toBe(true)
    expect(config.options?.plugins?.title?.text).toBe('Cycle Time Distribution')
  })

  it('cleans up chart on unmount', () => {
    const { unmount } = render(() => <CycleTimeChart data={mockData} loading={false} />)

    const chartInstance = vi.mocked(Chart).mock.results[0].value
    unmount()

    expect(chartInstance.destroy).toHaveBeenCalled()
  })

  it('updates chart when direct data changes', async () => {
    const { unmount } = render(() => <CycleTimeChart data={mockData} loading={false} />)

    const newData = {
      ...mockData,
      average: 6.5,
      data: [3, 5, 6, 7, 8, 10],
      start_state: 'Doing',
      end_state: 'Complete',
    }

    unmount()
    render(() => <CycleTimeChart data={newData} loading={false} />)

    // Should destroy old chart and create new one
    const chartInstance = vi.mocked(Chart).mock.results[0].value
    expect(chartInstance.destroy).toHaveBeenCalled()
    expect(Chart).toHaveBeenCalledTimes(2)

    // Check if new state labels are displayed
    expect(screen.getByText('From Doing to Complete')).toBeInTheDocument()
  })

  it('updates chart when accessor data changes', async () => {
    const newData = {
      ...mockData,
      average: 6.5,
      data: [3, 5, 6, 7, 8, 10],
      start_state: 'Doing',
      end_state: 'Complete',
    }

    const [data, setData] = createSignal(mockData)
    const [loading] = createSignal(false)

    render(() => <CycleTimeChart data={data} loading={loading} />)

    // Initial render
    expect(screen.getByText('From In Progress to Done')).toBeInTheDocument()

    // Update data
    setData(newData)

    // Check if new state labels are displayed
    expect(screen.getByText('From Doing to Complete')).toBeInTheDocument()
  })

  it('handles empty data array', () => {
    const emptyData = {
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      data: [],
      start_state: 'In Progress',
      end_state: 'Done',
    }

    render(() => <CycleTimeChart data={emptyData} loading={false} />)

    // Should still render chart container but with zero values
    expect(screen.getByText('Average: 0.0 days')).toBeInTheDocument()
    expect(screen.getByText('From In Progress to Done')).toBeInTheDocument()
    expect(document.querySelector('canvas')).toBeInTheDocument()
  })

  it('displays error message when data has error with direct object', () => {
    const errorData = {
      error: 'Failed to fetch cycle time data',
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      data: [],
      start_state: 'In Progress',
      end_state: 'Done',
    }

    render(() => <CycleTimeChart data={errorData} loading={false} />)
    expect(screen.getByText(/No data available/)).toBeInTheDocument()
  })

  it('displays error message when data has error with accessor', () => {
    const errorData = {
      error: 'Failed to fetch cycle time data',
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      data: [],
      start_state: 'In Progress',
      end_state: 'Done',
    }

    const [data] = createSignal(errorData)
    const [loading] = createSignal(false)

    render(() => <CycleTimeChart data={data} loading={loading} />)
    expect(screen.getByText(/No data available/)).toBeInTheDocument()
  })
})
