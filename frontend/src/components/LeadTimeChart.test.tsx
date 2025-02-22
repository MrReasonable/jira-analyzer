import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import { LeadTimeChart } from './LeadTimeChart';
import Chart from 'chart.js/auto';

describe('LeadTimeChart', () => {
  const mockData = {
    average: 5.5,
    median: 5,
    min: 2,
    max: 10,
    data: [2, 4, 5, 5, 7, 10]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    render(() => <LeadTimeChart data={null} loading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders no data message when data is null', () => {
    render(() => <LeadTimeChart data={null} loading={false} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders chart and metrics when data is provided', () => {
    render(() => <LeadTimeChart data={mockData} loading={false} />);
    
    // Check if metrics are displayed
    expect(screen.getByText('Average: 5.5 days')).toBeInTheDocument();
    expect(screen.getByText('Median: 5 days')).toBeInTheDocument();
    expect(screen.getByText('Range: 2-10 days')).toBeInTheDocument();
    
    // Check if canvas is rendered
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('creates chart with correct configuration', () => {
    render(() => <LeadTimeChart data={mockData} loading={false} />);
    
    const chartCalls = vi.mocked(Chart).mock.calls;
    expect(chartCalls.length).toBe(1);
    
    const [, config] = chartCalls[0];
    expect(config.type).toBe('bar');
    expect(config.options.responsive).toBe(true);
    expect(config.options.plugins.title.text).toBe('Lead Time Distribution');
  });

  it('cleans up chart on unmount', () => {
    const { unmount } = render(() => <LeadTimeChart data={mockData} loading={false} />);
    
    const chartInstance = vi.mocked(Chart).mock.results[0].value;
    unmount();
    
    expect(chartInstance.destroy).toHaveBeenCalled();
  });

  it('updates chart when data changes', () => {
    const { rerender } = render(() => <LeadTimeChart data={mockData} loading={false} />);
    
    const newData = {
      ...mockData,
      average: 6.5,
      data: [3, 5, 6, 7, 8, 10]
    };
    
    rerender(() => <LeadTimeChart data={newData} loading={false} />);
    
    // Should destroy old chart and create new one
    const chartInstance = vi.mocked(Chart).mock.results[0].value;
    expect(chartInstance.destroy).toHaveBeenCalled();
    expect(Chart).toHaveBeenCalledTimes(2);
  });

  it('handles empty data array', () => {
    const emptyData = {
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      data: []
    };
    
    render(() => <LeadTimeChart data={emptyData} loading={false} />);
    
    // Should still render chart container but with zero values
    expect(screen.getByText('Average: 0.0 days')).toBeInTheDocument();
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });
});
