import { Component, Accessor } from 'solid-js'
import Chart from 'chart.js/auto'
import { CycleTimeMetrics } from '@api/jiraApi'
import { withChart } from './withChart'

interface Props {
  data:
    | Accessor<(CycleTimeMetrics & { error?: string }) | null>
    | (CycleTimeMetrics & { error?: string })
    | null
  loading: Accessor<boolean> | boolean
}

// Create a base chart component using the withChart HOC
const CycleTimeChartBase = withChart<CycleTimeMetrics>({
  createChartInstance: (ctx, data) => {
    const binSize = 5 // 5-day bins
    const bins: { [key: string]: number } = {}
    data.data.forEach(days => {
      const binIndex = Math.floor(days / binSize) * binSize
      const binLabel = `${binIndex}-${binIndex + binSize}`
      bins[binLabel] = (bins[binLabel] || 0) + 1
    })

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(bins),
        datasets: [
          {
            label: 'Number of Issues',
            data: Object.values(bins),
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Cycle Time Distribution',
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
    })
  },
  renderMetrics: data => (
    <div class="space-y-1">
      <p>Average: {data.average.toFixed(1)} days</p>
      <p>Median: {data.median} days</p>
      <p>
        Range: {data.min}-{data.max} days
      </p>
      <p class="text-sm text-gray-600">
        From {data.start_state} to {data.end_state}
      </p>
    </div>
  ),
  handleError: data => !!data.error,
})

// Export the component with the expected interface
export const CycleTimeChart: Component<Props> = props => {
  return <CycleTimeChartBase {...props} title="Cycle Time Analysis" />
}
