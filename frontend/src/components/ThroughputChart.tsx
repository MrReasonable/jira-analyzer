import { Component, createEffect, onCleanup, createMemo } from 'solid-js';
import Chart from 'chart.js/auto';
import { ThroughputMetrics } from '../api/jiraApi';

interface Props {
  data: ThroughputMetrics | null;
  loading: boolean;
}

export const ThroughputChart: Component<Props> = props => {
  let chartRef: HTMLCanvasElement | undefined;
  let chartInstance: Chart | undefined;

  // Helper functions to handle props consistently
  const getData = createMemo(() => props.data);
  const isLoading = createMemo(() => props.loading);

  const createChart = () => {
    const data = getData();
    if (!data || !chartRef) return;

    // Always destroy previous instance
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = undefined;
    }

    const ctx = chartRef.getContext('2d');
    if (!ctx) return;

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.dates,
        datasets: [
          {
            label: 'Completed Issues',
            data: data.counts,
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Throughput Over Time',
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
              text: 'Date',
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
        <h2 class="text-xl font-bold">Throughput Analysis</h2>
        {isLoading() ? (
          <p>Loading...</p>
        ) : getData() ? (
          <>
            <canvas ref={el => (chartRef = el)} />
            <div>
              <p>Average Throughput: {getData()?.average.toFixed(1)} issues per day</p>
            </div>
          </>
        ) : (
          <p>No data available</p>
        )}
      </div>
    </div>
  );
};
