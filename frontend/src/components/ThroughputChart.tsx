import { Component, Accessor } from 'solid-js'
import Chart from 'chart.js/auto'
import { ThroughputMetrics } from '../api/jiraApi'
import { withChart } from './withChart'

interface Props {
  data: Accessor<ThroughputMetrics | null> | ThroughputMetrics | null
  loading: Accessor<boolean> | boolean
}

// Create a base chart component using the withChart HOC
const ThroughputChartBase = withChart<ThroughputMetrics>({
  createChartInstance: (ctx, data) => {
    return new Chart(ctx, {
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
    })
  },
  renderMetrics: data => (
    <div>
      <p>Average Throughput: {data.average.toFixed(1)} issues per day</p>
    </div>
  ),
})

// Export the component with the expected interface
export const ThroughputChart: Component<Props> = props => {
  return <ThroughputChartBase {...props} title="Throughput Analysis" />
}
