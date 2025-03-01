import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@solidjs/testing-library'
import { MetricsSection } from './MetricsSection'
import { Accessor } from 'solid-js'
import {
  LeadTimeMetrics,
  ThroughputMetrics,
  WipMetrics,
  CfdMetrics,
  CycleTimeMetrics,
} from '../api/jiraApi'

// Mock the chart components
vi.mock('./LeadTimeChart', () => ({
  LeadTimeChart: (props: {
    loading: Accessor<boolean>
    data: Accessor<LeadTimeMetrics | null>
  }) => (
    <div
      data-testid="lead-time-chart"
      data-loading={props.loading()}
      data-has-data={!!props.data()}
    ></div>
  ),
}))

vi.mock('./ThroughputChart', () => ({
  ThroughputChart: (props: {
    loading: Accessor<boolean>
    data: Accessor<ThroughputMetrics | null>
  }) => (
    <div
      data-testid="throughput-chart"
      data-loading={props.loading()}
      data-has-data={!!props.data()}
    ></div>
  ),
}))

vi.mock('./WipChart', () => ({
  WipChart: (props: { loading: Accessor<boolean>; data: Accessor<WipMetrics | null> }) => (
    <div
      data-testid="wip-chart"
      data-loading={props.loading()}
      data-has-data={!!props.data()}
    ></div>
  ),
}))

vi.mock('./CfdChart', () => ({
  CfdChart: (props: { loading: Accessor<boolean>; data: Accessor<CfdMetrics | null> }) => (
    <div
      data-testid="cfd-chart"
      data-loading={props.loading()}
      data-has-data={!!props.data()}
    ></div>
  ),
}))

vi.mock('./CycleTimeChart', () => ({
  CycleTimeChart: (props: {
    loading: Accessor<boolean>
    data: Accessor<CycleTimeMetrics | null>
  }) => (
    <div
      data-testid="cycle-time-chart"
      data-loading={props.loading()}
      data-has-data={!!props.data()}
    ></div>
  ),
}))

describe('MetricsSection', () => {
  const mockLeadTimeData: LeadTimeMetrics = {
    average: 5.5,
    median: 5,
    min: 1,
    max: 10,
    data: [3, 5, 7, 8, 4],
  }

  const mockThroughputData: ThroughputMetrics = {
    dates: ['2023-01-01', '2023-01-02', '2023-01-03'],
    counts: [5, 3, 7],
    average: 5,
  }

  const mockWipData: WipMetrics = {
    status: ['To Do', 'In Progress', 'Done'],
    counts: [3, 5, 10],
    total: 18,
  }

  const mockCfdData: CfdMetrics = {
    statuses: ['To Do', 'In Progress', 'Done'],
    data: [
      { date: '2023-01-01', 'To Do': 5, 'In Progress': 3, Done: 0 },
      { date: '2023-01-02', 'To Do': 3, 'In Progress': 4, Done: 1 },
    ],
  }

  const mockCycleTimeData: CycleTimeMetrics = {
    average: 4.5,
    median: 4,
    min: 1,
    max: 8,
    data: [3, 4, 5, 6],
    start_state: 'In Progress',
    end_state: 'Done',
  }

  it('renders all chart components', () => {
    render(() => (
      <MetricsSection
        loading={() => false}
        leadTimeData={() => mockLeadTimeData}
        throughputData={() => mockThroughputData}
        wipData={() => mockWipData}
        cfdData={() => mockCfdData}
        cycleTimeData={() => mockCycleTimeData}
      />
    ))

    expect(screen.getByTestId('lead-time-chart')).toBeInTheDocument()
    expect(screen.getByTestId('throughput-chart')).toBeInTheDocument()
    expect(screen.getByTestId('wip-chart')).toBeInTheDocument()
    expect(screen.getByTestId('cfd-chart')).toBeInTheDocument()
    expect(screen.getByTestId('cycle-time-chart')).toBeInTheDocument()
  })

  it('passes loading state to all charts', () => {
    render(() => (
      <MetricsSection
        loading={() => true}
        leadTimeData={() => null}
        throughputData={() => null}
        wipData={() => null}
        cfdData={() => null}
        cycleTimeData={() => null}
      />
    ))

    expect(screen.getByTestId('lead-time-chart').getAttribute('data-loading')).toBe('true')
    expect(screen.getByTestId('throughput-chart').getAttribute('data-loading')).toBe('true')
    expect(screen.getByTestId('wip-chart').getAttribute('data-loading')).toBe('true')
    expect(screen.getByTestId('cfd-chart').getAttribute('data-loading')).toBe('true')
    expect(screen.getByTestId('cycle-time-chart').getAttribute('data-loading')).toBe('true')
  })

  it('passes data correctly to all charts', () => {
    render(() => (
      <MetricsSection
        loading={() => false}
        leadTimeData={() => mockLeadTimeData}
        throughputData={() => mockThroughputData}
        wipData={() => mockWipData}
        cfdData={() => mockCfdData}
        cycleTimeData={() => mockCycleTimeData}
      />
    ))

    expect(screen.getByTestId('lead-time-chart').getAttribute('data-has-data')).toBe('true')
    expect(screen.getByTestId('throughput-chart').getAttribute('data-has-data')).toBe('true')
    expect(screen.getByTestId('wip-chart').getAttribute('data-has-data')).toBe('true')
    expect(screen.getByTestId('cfd-chart').getAttribute('data-has-data')).toBe('true')
    expect(screen.getByTestId('cycle-time-chart').getAttribute('data-has-data')).toBe('true')
  })

  it('handles null data gracefully', () => {
    render(() => (
      <MetricsSection
        loading={() => false}
        leadTimeData={() => null}
        throughputData={() => null}
        wipData={() => null}
        cfdData={() => null}
        cycleTimeData={() => null}
      />
    ))

    expect(screen.getByTestId('lead-time-chart').getAttribute('data-has-data')).toBe('false')
    expect(screen.getByTestId('throughput-chart').getAttribute('data-has-data')).toBe('false')
    expect(screen.getByTestId('wip-chart').getAttribute('data-has-data')).toBe('false')
    expect(screen.getByTestId('cfd-chart').getAttribute('data-has-data')).toBe('false')
    expect(screen.getByTestId('cycle-time-chart').getAttribute('data-has-data')).toBe('false')
  })
})
