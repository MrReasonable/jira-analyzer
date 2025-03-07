import { Component, Accessor } from 'solid-js'
import Chart from 'chart.js/auto'
import { WipMetrics } from '@api/jiraApi'
import { withChart } from './withChart'

interface Props {
  data: Accessor<WipMetrics | null> | WipMetrics | null
  loading: Accessor<boolean> | boolean
}

// Create a base chart component using the withChart HOC
const WipChartBase = withChart<WipMetrics>({
  createChartInstance: (ctx, data) => {
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.status,
        datasets: [
          {
            label: 'Issues',
            data: data.counts,
            backgroundColor: data.status.map(
              (_, i) =>
                [
                  'rgba(255, 99, 132, 0.5)',
                  'rgba(54, 162, 235, 0.5)',
                  'rgba(255, 206, 86, 0.5)',
                  'rgba(75, 192, 192, 0.5)',
                ][i % 4]
            ),
            borderColor: data.status.map(
              (_, i) =>
                [
                  'rgba(255, 99, 132, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)',
                ][i % 4]
            ),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Work in Progress by Status',
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
        },
      },
    })
  },
  renderMetrics: data => (
    <div>
      <p>Total WIP: {data.total} issues</p>
    </div>
  ),
  handleError: data => !!data.error,
})

// Export the component with the expected interface
export const WipChart: Component<Props> = props => {
  return <WipChartBase {...props} title="Work in Progress" />
}
