import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import { CfdChart } from './CfdChart';
import Chart from 'chart.js/auto';

describe('CfdChart', () => {
  const mockData = {
    statuses: ['To Do', 'In Progress', 'Done'],
    data: [
      {
        date: '2024-01-01',
        'To Do': 5,
        'In Progress': 3,
        'Done': 1
      },
      {
        date: '2024-01-02',
        'To Do': 6,
        'In Progress': 3,
        'Done': 2
      },
      {
        date: '2024-01-03',
        'To Do': 6,
        'In Progress': 4,
        'Done': 3
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    render(() => <CfdChart data={null} loading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders no data message when data is null', () => {
    render(() => <CfdChart data={null} loading={false} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders chart when data is provided', () => {
    render(() => <CfdChart data={mockData} loading={false} />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('creates chart with correct configuration', () => {
    render(() => <CfdChart data={mockData} loading={false} />);
    
    const chartCalls = vi.mocked(Chart).mock.calls;
    expect(chartCalls.length).toBe(1);
    
    const [, config] = chartCalls[0];
    const chartConfig = config as any;
    
    // Verify chart configuration
    expect(chartConfig.type).toBe('line');
    expect(chartConfig.data.labels).toEqual(mockData.data.map(d => d.date));
    expect(chartConfig.options.responsive).toBe(true);
    expect(chartConfig.options.plugins.title.text).toBe('Cumulative Flow Diagram');
    expect(chartConfig.options.scales.y.stacked).toBe(true);
  });

  it('creates correct number of datasets', () => {
    render(() => <CfdChart data={mockData} loading={false} />);
    
    const chartCalls = vi.mocked(Chart).mock.calls;
    const [, config] = chartCalls[0];
    const chartConfig = config as any;
    
    // Should have one dataset per status
    expect(chartConfig.data.datasets).toHaveLength(mockData.statuses.length);
    
    // Each dataset should have correct properties
    chartConfig.data.datasets.forEach((dataset: any, index: number) => {
      expect(dataset.label).toBe(mockData.statuses[index]);
      expect(dataset.fill).toBe(true);
      expect(dataset.tension).toBe(0.4);
    });
  });

  it('cleans up chart on unmount', () => {
    const { unmount } = render(() => <CfdChart data={mockData} loading={false} />);
    
    const chartInstance = vi.mocked(Chart).mock.results[0].value;
    unmount();
    
    expect(chartInstance.destroy).toHaveBeenCalled();
  });

  it('handles empty data arrays', () => {
    const emptyData = {
      statuses: [],
      data: []
    };
    
    render(() => <CfdChart data={emptyData} loading={false} />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('updates chart when data changes', () => {
    const { unmount } = render(() => <CfdChart data={mockData} loading={false} />);
    
    const newData = {
      statuses: ['To Do', 'Done'],
      data: [
        {
          date: '2024-01-04',
          'To Do': 3,
          'Done': 4
        }
      ]
    };
    
    unmount();
    render(() => <CfdChart data={newData} loading={false} />);
    
    // Should create new chart with updated data
    const chartCalls = vi.mocked(Chart).mock.calls;
    const lastCallConfig = chartCalls[chartCalls.length - 1][1] as any;
    
    expect(lastCallConfig.data.labels).toEqual(newData.data.map(d => d.date));
    expect(lastCallConfig.data.datasets).toHaveLength(newData.statuses.length);
  });

  it('recreates chart when loading state changes', () => {
    const { unmount } = render(() => <CfdChart data={mockData} loading={true} />);
    unmount();
    render(() => <CfdChart data={mockData} loading={false} />);
    
    // Chart should be created after loading is complete
    expect(Chart).toHaveBeenCalledTimes(1);
  });

  it('applies correct colors to datasets', () => {
    render(() => <CfdChart data={mockData} loading={false} />);
    
    const chartCalls = vi.mocked(Chart).mock.calls;
    const [, config] = chartCalls[0];
    const chartConfig = config as any;
    
    chartConfig.data.datasets.forEach((dataset: any) => {
      expect(dataset.backgroundColor).toMatch(/rgba\(\d+,\s*\d+,\s*\d+,\s*0\.5\)/);
      expect(dataset.borderColor).toMatch(/rgba\(\d+,\s*\d+,\s*\d+,\s*1\)/);
    });
  });
});
