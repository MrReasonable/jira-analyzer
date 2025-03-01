import { Component, Accessor } from 'solid-js'
import Chart from 'chart.js/auto'
import { CfdMetrics } from '../api/jiraApi'
import { withChart } from './withChart'

interface Props {
  data: Accessor<CfdMetrics | null> | CfdMetrics | null
  loading: Accessor<boolean> | boolean
}

// Create a base chart component using the withChart HOC
const CfdChartBase = withChart<CfdMetrics>({
  createChartInstance: (ctx, data) => {
    const colors = [
      'rgba(255, 99, 132, 0.5)',
      'rgba(54, 162, 235, 0.5)',
      'rgba(255, 206, 86, 0.5)',
      'rgba(75, 192, 192, 0.5)',
      'rgba(153, 102, 255, 0.5)',
    ]

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.data.map(d => d.date),
        datasets: data.statuses.map((status, index) => ({
          label: status,
          data: data.data.map(d => d[status] as number) || [],
          fill: true,
          backgroundColor: colors[index % colors.length],
          borderColor: colors[index % colors.length].replace('0.5', '1'),
          tension: 0.4,
        })),
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Cumulative Flow Diagram',
          },
        },
        scales: {
          y: {
            stacked: true,
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
  // CFD doesn't need additional metrics display
  renderMetrics: () => <></>,
  handleError: data => !!data.error,
})

// Export the component with the expected interface
export const CfdChart: Component<Props> = props => {
  return <CfdChartBase {...props} title="Cumulative Flow Diagram" />
}
