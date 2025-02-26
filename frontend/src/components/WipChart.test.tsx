import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import { WipChart } from './WipChart';
import { Chart, ChartConfiguration } from 'chart.js/auto';

describe('WipChart', () => {
  const mockData = {
    status: ['To Do', 'In Progress', 'Review', 'Done'],
    counts: [3, 2, 1, 5],
    total: 11,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    render(() => <WipChart data={null} loading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders no data message when data is null', () => {
    render(() => <WipChart data={null} loading={false} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders chart and total WIP when data is provided', () => {
    render(() => <WipChart data={mockData} loading={false} />);

    // Check if total WIP is displayed
    expect(screen.getByText('Total WIP: 11 issues')).toBeInTheDocument();

    // Check if canvas is rendered
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('creates chart with correct configuration', () => {
    render(() => <WipChart data={mockData} loading={false} />);

    const chartCalls = vi.mocked(Chart).mock.calls;
    expect(chartCalls.length).toBe(1);

    const [, config] = chartCalls[0];
    const chartConfig = config as Required<ChartConfiguration<'bar', number[], string>>;

    // Verify chart configuration
    expect(chartConfig.type).toBe('bar');
    expect(chartConfig.data.labels).toEqual(mockData.status);
    expect(chartConfig.data.datasets[0].data).toEqual(mockData.counts);
    expect(chartConfig.options?.responsive).toBe(true);
    expect(chartConfig.options?.plugins?.title?.text).toBe('Work in Progress by Status');
  });

  it('creates chart with correct colors', () => {
    render(() => <WipChart data={mockData} loading={false} />);

    const chartCalls = vi.mocked(Chart).mock.calls;
    const [, config] = chartCalls[0];
    const chartConfig = config as Required<ChartConfiguration<'bar', number[], string>>;

    // Verify color arrays are present and have correct length
    expect(chartConfig.data.datasets[0].backgroundColor).toHaveLength(mockData.status.length);
    expect(chartConfig.data.datasets[0].borderColor).toHaveLength(mockData.status.length);
  });

  it('cleans up chart on unmount', () => {
    const { unmount } = render(() => <WipChart data={mockData} loading={false} />);

    const chartInstance = vi.mocked(Chart).mock.results[0].value;
    unmount();

    expect(chartInstance.destroy).toHaveBeenCalled();
  });

  it('handles empty status and counts arrays', () => {
    const emptyData = {
      status: [],
      counts: [],
      total: 0,
    };

    render(() => <WipChart data={emptyData} loading={false} />);

    // Should still render chart container but with zero total
    expect(screen.getByText('Total WIP: 0 issues')).toBeInTheDocument();
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('updates chart when data changes', () => {
    const { unmount } = render(() => <WipChart data={mockData} loading={false} />);

    const newData = {
      status: ['To Do', 'In Progress', 'Done'],
      counts: [2, 3, 4],
      total: 9,
    };

    unmount();
    render(() => <WipChart data={newData} loading={false} />);

    // Should create new chart with updated data
    const chartCalls = vi.mocked(Chart).mock.calls;
    const lastCallConfig = chartCalls[chartCalls.length - 1][1] as Required<
      ChartConfiguration<'bar', number[], string>
    >;

    expect(lastCallConfig.data.labels).toEqual(newData.status);
    expect(lastCallConfig.data.datasets[0].data).toEqual(newData.counts);
    expect(screen.getByText('Total WIP: 9 issues')).toBeInTheDocument();
  });

  it('recreates chart when loading state changes', () => {
    const { unmount } = render(() => <WipChart data={mockData} loading={true} />);
    unmount();
    render(() => <WipChart data={mockData} loading={false} />);

    // Chart should be created after loading is complete
    expect(Chart).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Total WIP: 11 issues')).toBeInTheDocument();
  });
});
