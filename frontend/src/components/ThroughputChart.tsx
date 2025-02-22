import { Component, createEffect, onCleanup } from 'solid-js';
import Chart from 'chart.js/auto';
import { ThroughputMetrics } from '../api/jiraApi';

interface Props {
  data: ThroughputMetrics | null;
  loading: boolean;
}

export const ThroughputChart: Component<Props> = (props) => {
  let chartRef: HTMLCanvasElement | undefined;
  let chartInstance: Chart | undefined;

  const createChart = () => {
    if (!props.data || !chartRef) return;

    // Cleanup previous instance
    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = chartRef.getContext('2d');
    if (!ctx) return;

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: props.data.dates,
        datasets: [{
          label: 'Completed Issues',
          data: props.data.counts,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Throughput Over Time'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Issues'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        }
      }
    });
  };

  createEffect(() => {
    if (!props.loading) {
      createChart();
    }
  });

  onCleanup(() => {
    if (chartInstance) {
      chartInstance.destroy();
    }
  });

  return (
    <div class="card">
      <div class="space-y-4">
        <h2 class="text-xl font-bold">Throughput Analysis</h2>
        {props.loading ? (
          <p>Loading...</p>
        ) : props.data ? (
          <>
            <canvas ref={chartRef} />
            <div>
              <p>Average Throughput: {props.data.average.toFixed(1)} issues per day</p>
            </div>
          </>
        ) : (
          <p>No data available</p>
        )}
      </div>
    </div>
  );
};
