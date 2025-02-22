import { Component, createEffect, onCleanup } from 'solid-js';
import Chart from 'chart.js/auto';
import { LeadTimeMetrics } from '../api/jiraApi';

interface Props {
  data: LeadTimeMetrics | null;
  loading: boolean;
}

export const LeadTimeChart: Component<Props> = (props) => {
  let chartRef: HTMLCanvasElement | undefined;
  let chartInstance: Chart | undefined;

  const createChart = () => {
    if (!props.data || !chartRef) return;

    // Cleanup previous instance
    if (chartInstance) {
      chartInstance.destroy();
    }

    const binSize = 5; // 5-day bins
    const bins: { [key: string]: number } = {};
    props.data.data.forEach(days => {
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
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Lead Time Distribution'
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
              text: 'Days'
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
        <h2 class="text-xl font-bold">Lead Time Analysis</h2>
        {props.loading ? (
          <p>Loading...</p>
        ) : props.data ? (
          <>
            <canvas ref={chartRef} />
            <div class="space-y-1">
              <p>Average: {props.data.average.toFixed(1)} days</p>
              <p>Median: {props.data.median} days</p>
              <p>Range: {props.data.min}-{props.data.max} days</p>
            </div>
          </>
        ) : (
          <p>No data available</p>
        )}
      </div>
    </div>
  );
};
