import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import { ThroughputChart } from './ThroughputChart';
import Chart from 'chart.js/auto';

describe('ThroughputChart', () => {
  const mockData = {
    dates: ['2024-01-01', '2024-01-02', '2024-01-03'],
    counts: [2, 3, 1],
    average: 2
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

  it('creates chart with correct configuration', () => {
    render(() => <ThroughputChart data={mockData} loading={false} />);
    
    const chartCalls = vi.mocked(Chart).mock.calls;
    expect(chartCalls.length).toBe(1);
    
    const [, config] = chartCalls[0];
    const chartConfig = config as any; // Type assertion for test purposes
    
    expect(chartConfig.type).toBe('line');
    expect(chartConfig.data.labels).toEqual(mockData.dates);
    expect(chartConfig.data.datasets[0].data).toEqual(mockData.counts);
    expect(chartConfig.options.responsive).toBe(true);
    expect(chartConfig.options.plugins.title.text).toBe('Throughput Over Time');
  });

  it('cleans up chart on unmount', () => {
    const { unmount } = render(() => <ThroughputChart data={mockData} loading={false} />);
    
    const chartInstance = vi.mocked(Chart).mock.results[0].value;
    unmount();
    
    expect(chartInstance.destroy).toHaveBeenCalled();
  });

  it('handles empty data arrays', () => {
    const emptyData = {
      dates: [],
      counts: [],
      average: 0
    };
    
    render(() => <ThroughputChart data={emptyData} loading={false} />);
    
    // Should still render chart container but with zero average
    expect(screen.getByText('Average Throughput: 0.0 issues per day')).toBeInTheDocument();
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('updates chart when data changes', async () => {
    const { unmount } = render(() => <ThroughputChart data={mockData} loading={false} />);
    
    const newData = {
      dates: ['2024-01-04', '2024-01-05'],
      counts: [4, 2],
      average: 3
    };
    
    unmount();
    render(() => <ThroughputChart data={newData} loading={false} />);
    
    // Should create new chart with updated data
    const chartCalls = vi.mocked(Chart).mock.calls;
    const lastCallConfig = chartCalls[chartCalls.length - 1][1] as any;
    
    expect(lastCallConfig.data.labels).toEqual(newData.dates);
    expect(lastCallConfig.data.datasets[0].data).toEqual(newData.counts);
  });

  it('maintains chart instance between renders unless data changes', () => {
    const { rerender } = render(() => <ThroughputChart data={mockData} loading={false} />);
    
    // Rerender with same data
    rerender(() => <ThroughputChart data={mockData} loading={false} />);
    
    // Chart should only be created once
    expect(Chart).toHaveBeenCalledTimes(1);
  });
});
