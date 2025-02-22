import { Component, createEffect, onCleanup } from 'solid-js';
import Chart from 'chart.js/auto';
import { WipMetrics } from '../api/jiraApi';

interface Props {
  data: WipMetrics | null;
  loading: boolean;
}

export const WipChart: Component<Props> = (props) => {
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
      type: 'bar',
      data: {
        labels: props.data.status,
        datasets: [{
          label: 'Issues',
          data: props.data.counts,
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Work in Progress by Status'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Issues'
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
        <h2 class="text-xl font-bold">Work in Progress</h2>
        {props.loading ? (
          <p>Loading...</p>
        ) : props.data ? (
          <>
            <canvas ref={chartRef} />
            <div>
              <p>Total WIP: {props.data.total} issues</p>
            </div>
          </>
        ) : (
          <p>No data available</p>
        )}
      </div>
    </div>
  );
};
