import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@solidjs/testing-library'
import { MetricsSection } from './MetricsSection'
import Chart from 'chart.js/auto'
import { createSignal } from 'solid-js'
import type {
  LeadTimeMetrics,
  ThroughputMetrics,
  WipMetrics,
  CfdMetrics,
  CycleTimeMetrics,
} from '@api/jiraApi'

// Mock Chart.js
vi.mock('chart.js/auto', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      destroy: vi.fn(),
    })),
  }
})

describe('MetricsSection chart rendering', () => {
  // Mock canvas context
  const mockCanvasContext = {
    canvas: document.createElement('canvas'),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock getContext on HTMLCanvasElement
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCanvasContext)
  })

  it('renders all charts when data is available', () => {
    // Create accessor signals for each metric
    const [loading] = createSignal(false)
    const [leadTimeData] = createSignal<LeadTimeMetrics>({
      data: [1, 2, 3, 4, 5],
      average: 3,
      median: 3,
      min: 1,
      max: 5,
    })
    const [throughputData] = createSignal<ThroughputMetrics>({
      dates: ['2023-01-01', '2023-01-02'],
      counts: [5, 3],
      average: 4,
    })
    const [wipData] = createSignal<WipMetrics>({
      status: ['Backlog', 'In Progress', 'Done'],
      counts: [2, 3, 1],
      total: 6,
    })
    const [cfdData] = createSignal<CfdMetrics>({
      data: [
        { date: '2023-01-01', Backlog: 5, 'In Progress': 2, Done: 0 },
        { date: '2023-01-02', Backlog: 3, 'In Progress': 3, Done: 1 },
      ],
      statuses: ['Backlog', 'In Progress', 'Done'],
    })
    const [cycleTimeData] = createSignal<CycleTimeMetrics>({
      data: [1, 2, 3, 4, 5],
      average: 3,
      median: 3,
      min: 1,
      max: 5,
      start_state: 'In Progress',
      end_state: 'Done',
    })

    render(() => (
      <MetricsSection
        loading={loading}
        leadTimeData={leadTimeData}
        throughputData={throughputData}
        wipData={wipData}
        cfdData={cfdData}
        cycleTimeData={cycleTimeData}
      />
    ))

    // Check for all chart headings
    expect(screen.getByText('Lead Time Analysis')).toBeInTheDocument()
    expect(screen.getByText('Throughput Analysis')).toBeInTheDocument()
    expect(screen.getByText('Work in Progress')).toBeInTheDocument()
    expect(screen.getByText('Cumulative Flow Diagram')).toBeInTheDocument()
    expect(screen.getByText('Cycle Time Analysis')).toBeInTheDocument()

    // Verify no "No data available" messages
    const noDataMessages = screen.queryAllByText(/No data available/)
    expect(noDataMessages.length).toBe(0)

    // Verify Chart.js was called multiple times (once for each chart)
    expect(Chart).toHaveBeenCalledTimes(5)
  })

  it('renders "No data available" messages when data is empty', () => {
    // Create accessor signals with null values
    const [loading] = createSignal(false)
    const [leadTimeData] = createSignal<LeadTimeMetrics | null>(null)
    const [throughputData] = createSignal<ThroughputMetrics | null>(null)
    const [wipData] = createSignal<WipMetrics | null>(null)
    const [cfdData] = createSignal<CfdMetrics | null>(null)
    const [cycleTimeData] = createSignal<CycleTimeMetrics | null>(null)

    render(() => (
      <MetricsSection
        loading={loading}
        leadTimeData={leadTimeData}
        throughputData={throughputData}
        wipData={wipData}
        cfdData={cfdData}
        cycleTimeData={cycleTimeData}
      />
    ))

    // Check for all chart headings
    expect(screen.getByText('Lead Time Analysis')).toBeInTheDocument()
    expect(screen.getByText('Throughput Analysis')).toBeInTheDocument()
    expect(screen.getByText('Work in Progress')).toBeInTheDocument()
    expect(screen.getByText('Cumulative Flow Diagram')).toBeInTheDocument()
    expect(screen.getByText('Cycle Time Analysis')).toBeInTheDocument()

    // Verify "No data available" messages are present
    const noDataMessages = screen.queryAllByText(/No data available/)
    expect(noDataMessages.length).toBe(5)

    // Verify Chart.js is not called since all charts should handle null data properly
    expect(Chart).not.toHaveBeenCalled()
  })

  it('renders loading spinners when data is loading', () => {
    // Create accessor signals with loading state
    const [loading] = createSignal(true)
    const [leadTimeData] = createSignal<LeadTimeMetrics | null>(null)
    const [throughputData] = createSignal<ThroughputMetrics | null>(null)
    const [wipData] = createSignal<WipMetrics | null>(null)
    const [cfdData] = createSignal<CfdMetrics | null>(null)
    const [cycleTimeData] = createSignal<CycleTimeMetrics | null>(null)

    render(() => (
      <MetricsSection
        loading={loading}
        leadTimeData={leadTimeData}
        throughputData={throughputData}
        wipData={wipData}
        cfdData={cfdData}
        cycleTimeData={cycleTimeData}
      />
    ))

    // Check for loading spinners
    const loadingSpinners = screen.queryAllByRole('status')
    expect(loadingSpinners.length).toBe(5)

    // Verify Chart.js was not called since all charts should handle errors properly now
    expect(Chart).not.toHaveBeenCalled()
  })

  it('renders charts with error state', () => {
    // Create accessor signals with error state
    const [loading] = createSignal(false)

    // For error state, we'll use data with error properties
    const [leadTimeData] = createSignal<LeadTimeMetrics>({
      data: [],
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      error: 'Failed to fetch lead time metrics',
    })
    const [throughputData] = createSignal<ThroughputMetrics>({
      dates: [],
      counts: [],
      average: 0,
      error: 'Failed to fetch throughput metrics',
    })
    const [wipData] = createSignal<WipMetrics>({
      status: [],
      counts: [],
      total: 0,
      error: 'Failed to fetch WIP metrics',
    })
    const [cfdData] = createSignal<CfdMetrics>({
      data: [],
      statuses: [],
      error: 'Failed to fetch CFD metrics',
    })
    const [cycleTimeData] = createSignal<CycleTimeMetrics>({
      data: [],
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      start_state: '',
      end_state: '',
      error: 'Failed to fetch cycle time metrics',
    })

    render(() => (
      <MetricsSection
        loading={loading}
        leadTimeData={leadTimeData}
        throughputData={throughputData}
        wipData={wipData}
        cfdData={cfdData}
        cycleTimeData={cycleTimeData}
      />
    ))

    // Check for "No data available" messages since errors are displayed as no data
    const noDataMessages = screen.queryAllByTestId('no-data-message')
    expect(noDataMessages.length).toBeGreaterThan(0)

    // Verify Chart.js was not called
    expect(Chart).not.toHaveBeenCalled()
  })

  it('renders charts with empty data arrays', () => {
    // Create accessor signals with empty arrays
    const [loading] = createSignal(false)
    const [leadTimeData] = createSignal<LeadTimeMetrics>({
      data: [],
      average: 0,
      median: 0,
      min: 0,
      max: 0,
    })
    const [throughputData] = createSignal<ThroughputMetrics>({
      dates: [],
      counts: [],
      average: 0,
    })
    const [wipData] = createSignal<WipMetrics>({
      status: [],
      counts: [],
      total: 0,
    })
    const [cfdData] = createSignal<CfdMetrics>({
      data: [],
      statuses: [],
    })
    const [cycleTimeData] = createSignal<CycleTimeMetrics>({
      data: [],
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      start_state: '',
      end_state: '',
    })

    // Spy on console.error to catch any errors
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(() => (
      <MetricsSection
        loading={loading}
        leadTimeData={leadTimeData}
        throughputData={throughputData}
        wipData={wipData}
        cfdData={cfdData}
        cycleTimeData={cycleTimeData}
      />
    ))

    // Check for all chart headings
    expect(screen.getByText('Lead Time Analysis')).toBeInTheDocument()
    expect(screen.getByText('Throughput Analysis')).toBeInTheDocument()
    expect(screen.getByText('Work in Progress')).toBeInTheDocument()
    expect(screen.getByText('Cumulative Flow Diagram')).toBeInTheDocument()
    expect(screen.getByText('Cycle Time Analysis')).toBeInTheDocument()

    // Check if any errors were logged
    const errorCalled = consoleErrorSpy.mock.calls.length > 0
    if (errorCalled) {
      console.log('Console errors detected during chart rendering with empty arrays:')
      consoleErrorSpy.mock.calls.forEach((call, i) => {
        console.log(`Error ${i + 1}:`, call)
      })
    }

    // Clean up
    consoleErrorSpy.mockRestore()
  })
})
