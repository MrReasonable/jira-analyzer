import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import { ThroughputChart } from './ThroughputChart';
import { Chart, ChartConfiguration } from 'chart.js/auto';

describe('ThroughputChart', () => {
  const mockData = {
    dates: ['2024-01-01', '2024-01-02', '2024-01-03'],
    counts: [2, 3, 1],
    average: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    render(() => <ThroughputChart data={null} loading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders no data message when data is null', () => {
    render(() => <ThroughputChart data={null} loading={false} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders chart and metrics when data is provided', () => {
    render(() => <ThroughputChart data={mockData} loading={false} />);

    // Check if metrics are displayed
    expect(screen.getByText('Average Throughput: 2.0 issues per day')).toBeInTheDocument();

    // Check if canvas is rendered
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('creates chart with correct configuration', async () => {
    render(() => <ThroughputChart data={mockData} loading={false} />);

    // Wait for microtask queue to process chart creation
    await Promise.resolve();

    const chartCalls = vi.mocked(Chart).mock.calls;
    expect(chartCalls.length).toBe(1);

    const [, config] = chartCalls[0];
    const chartConfig = config as Required<ChartConfiguration<'line', number[], string>>;

    expect(chartConfig.type).toBe('line');
    expect(chartConfig.data.labels).toEqual(mockData.dates);
    expect(chartConfig.data.datasets[0].data).toEqual(mockData.counts);
    expect(chartConfig.options?.responsive).toBe(true);
    expect(chartConfig.options?.plugins?.title?.text).toBe('Throughput Over Time');
  });

  it('cleans up chart on unmount', async () => {
    const { unmount } = render(() => <ThroughputChart data={mockData} loading={false} />);

    // Wait for microtask queue to process chart creation
    await new Promise(resolve => window.setTimeout(resolve, 10));

    expect(Chart).toHaveBeenCalledTimes(1);

    const chartInstance = vi.mocked(Chart).mock.results[0].value;
    unmount();

    // Wait for cleanup to execute
    await new Promise(resolve => window.setTimeout(resolve, 10));

    expect(chartInstance.destroy).toHaveBeenCalled();
  });

  it('handles empty data arrays', async () => {
    const emptyData = {
      dates: [],
      counts: [],
      average: 0,
    };

    render(() => <ThroughputChart data={emptyData} loading={false} />);

    // Wait for chart creation
    await Promise.resolve();

    // Should still render chart container but with zero average
    expect(screen.getByText('Average Throughput: 0.0 issues per day')).toBeInTheDocument();
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('updates chart when data changes', async () => {
    const { unmount } = render(() => <ThroughputChart data={mockData} loading={false} />);

    // Wait for initial chart creation
    await new Promise(resolve => window.setTimeout(resolve, 10));
    expect(Chart).toHaveBeenCalledTimes(1);

    const chartInstance = vi.mocked(Chart).mock.results[0].value;

    const newData = {
      dates: ['2024-01-04', '2024-01-05'],
      counts: [4, 2],
      average: 3,
    };

    unmount();

    // Wait for cleanup
    await new Promise(resolve => window.setTimeout(resolve, 10));

    expect(chartInstance.destroy).toHaveBeenCalled();

    render(() => <ThroughputChart data={newData} loading={false} />);

    // Wait for second chart creation
    await new Promise(resolve => window.setTimeout(resolve, 10));

    // Should create new chart
    expect(Chart).toHaveBeenCalledTimes(2);

    // Verify new chart configuration
    const lastCallConfig = vi.mocked(Chart).mock.calls[1][1] as Required<
      ChartConfiguration<'line', number[], string>
    >;
    expect(lastCallConfig.data.labels).toEqual(newData.dates);
    expect(lastCallConfig.data.datasets[0].data).toEqual(newData.counts);
  });

  it('maintains chart instance between renders unless data changes', async () => {
    const { unmount } = render(() => <ThroughputChart data={mockData} loading={false} />);

    // Wait for initial chart creation
    await new Promise(resolve => window.setTimeout(resolve, 10));
    expect(Chart).toHaveBeenCalledTimes(1);

    const chartInstance = vi.mocked(Chart).mock.results[0].value;

    unmount();

    // Wait for cleanup
    await new Promise(resolve => window.setTimeout(resolve, 10));

    expect(chartInstance.destroy).toHaveBeenCalled();

    render(() => <ThroughputChart data={mockData} loading={false} />);

    // Wait for second chart creation
    await new Promise(resolve => window.setTimeout(resolve, 10));

    // Should create new chart
    expect(Chart).toHaveBeenCalledTimes(2);
  });
});
