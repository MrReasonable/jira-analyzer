import { Component, createEffect, onCleanup } from 'solid-js';
import Chart from 'chart.js/auto';
import { CfdMetrics } from '../api/jiraApi';

interface Props {
  data: CfdMetrics | null;
  loading: boolean;
}

export const CfdChart: Component<Props> = (props) => {
  let chartRef: HTMLCanvasElement | undefined;
  let chartInstance: Chart | undefined;

  const createChart = () => {
    // Cleanup previous instance
    if (chartInstance) {
      chartInstance.destroy();
    }
    if (!props.data || !chartRef) return;

    const ctx = chartRef.getContext('2d');
    if (!ctx) return;

    const colors = [
      'rgba(255, 99, 132, 0.5)',
      'rgba(54, 162, 235, 0.5)',
      'rgba(255, 206, 86, 0.5)',
      'rgba(75, 192, 192, 0.5)',
      'rgba(153, 102, 255, 0.5)',
    ];

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: props.data?.data.map(d => d.date),
        datasets: props.data?.statuses.map((status, index) => ({
          label: status,
          data: props.data?.data.map(d => d[status] as number) || [],
          fill: true,
          backgroundColor: colors[index % colors.length],
          borderColor: colors[index % colors.length].replace('0.5', '1'),
          tension: 0.4
        }))
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Cumulative Flow Diagram'
          }
        },
        scales: {
          y: {
            stacked: true,
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
        <h2 class="text-xl font-bold">Cumulative Flow Diagram</h2>
        {props.loading ? (
          <p>Loading...</p>
        ) : props.data ? (
          <canvas ref={chartRef} />
        ) : (
          <p>No data available</p>
        )}
      </div>
    </div>
  );
};
