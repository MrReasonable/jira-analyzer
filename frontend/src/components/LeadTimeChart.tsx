import { Component, createEffect, onCleanup, Accessor, createMemo } from 'solid-js';
import Chart from 'chart.js/auto';
import { LeadTimeMetrics } from '../api/jiraApi';

interface Props {
  data: Accessor<LeadTimeMetrics | null> | LeadTimeMetrics | null;
  loading: Accessor<boolean> | boolean;
}

export const LeadTimeChart: Component<Props> = props => {
  let chartRef: HTMLCanvasElement | undefined;
  let chartInstance: Chart | undefined;

  // Helper functions to handle both accessor and non-accessor props
  const getData = createMemo(() => {
    if (typeof props.data === 'function') {
      return props.data();
    }
    return props.data;
  });

  const isLoading = createMemo(() => {
    if (typeof props.loading === 'function') {
      return props.loading();
    }
    return props.loading;
  });

  const createChart = () => {
    const data = getData();
    if (!data || !chartRef) return;

    // Always destroy previous instance
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = undefined;
    }

    const binSize = 5; // 5-day bins
    const bins: { [key: string]: number } = {};
    data.data.forEach((days: number) => {
      const binIndex = Math.floor(days / binSize) * binSize;
      const binLabel = `${binIndex}-${binIndex + binSize}`;
      bins[binLabel] = (bins[binLabel] || 0) + 1;
    });

    const ctx = chartRef.getContext('2d');
    if (!ctx) return;

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(bins),
        datasets: [
          {
            label: 'Number of Issues',
            data: Object.values(bins),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Lead Time Distribution',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Issues',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Days',
            },
          },
        },
      },
    });
  };

  createEffect(() => {
    // Trigger effect on both loading and data changes
    const data = getData();
    const loading = isLoading();

    if (!loading && data) {
      // Create chart directly in the effect
      createChart();
    }
  });

  onCleanup(() => {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = undefined;
    }
  });

  return (
    <div class="card">
      <div class="space-y-4">
        <h2 class="text-xl font-bold">Lead Time Analysis</h2>
        {isLoading() ? (
          <p>Loading...</p>
        ) : getData() ? (
          <>
            <canvas ref={el => (chartRef = el)} />
            <div class="space-y-1">
              <p>Average: {getData()?.average.toFixed(1)} days</p>
              <p>Median: {getData()?.median} days</p>
              <p>
                Range: {getData()?.min}-{getData()?.max} days
              </p>
            </div>
          </>
        ) : (
          <p>No data available</p>
        )}
      </div>
    </div>
  );
};
