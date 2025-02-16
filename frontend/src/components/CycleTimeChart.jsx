import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const CycleTimeChart = ({ data }) => {
  // Sort statuses according to the workflow order from the backend
  const chartData = data.expected_path
    .filter(status => !data.end_states?.includes(status))
    .map(status => {
      const metrics = data.status_distribution[status] || {
        median: 0,
        p85: 0,
        p95: 0,
        p85_95_avg: 0,
        p95_100_avg: 0
      };
    const { median, p85, p95, p85_95_avg, p95_100_avg } = metrics;
    
    // Calculate the max based on our highest percentile average
    const max = p95_100_avg > 0 ? p95 + p95_100_avg : p95;
    
    return {
      status,
      p50: median,
      p85: p85 - median,
      p95: p85_95_avg || (p95 - p85), // Use average if available, fallback to difference
      p100: p95_100_avg || 0, // Use the 95-100th percentile average
      totalDays: max,
      itemCount: data.issues.filter(issue => issue.statusTimes[status] > 0).length
    };
  });

  const formatNumber = (value) => {
    return typeof value === 'number' && !isNaN(value) ? value.toFixed(1) : '0.0';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (!data) return null;

      const itemCount = data.itemCount || 0;
      const p50 = data.p50 ?? 0;
      const p85 = data.p85 ?? 0;
      const p95 = data.p95 ?? 0;
      const p100 = data.p100 ?? 0;
      const totalDays = data.totalDays ?? 0;

      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-medium">{label} {`(${itemCount} items)`}</p>
          <p className="text-sm text-green-600">{`0-50th percentile: ${formatNumber(p50)} days`}</p>
          <p className="text-sm text-yellow-600">{`50-85th percentile: +${formatNumber(p85)} days`}</p>
          <p className="text-sm text-red-600">{`85-95th percentile: +${formatNumber(p95)} days`}</p>
          <p className="text-sm text-gray-800">{`95-100th percentile: +${formatNumber(p100)} days`}</p>
          <p className="text-sm text-gray-600 mt-1">{`Total range: 0-${formatNumber(totalDays)} days`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Cycle Time by Status</h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="status"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis 
              label={{ value: 'Days in Status', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ bottom: -10 }}
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
            />
            <Bar 
              dataKey="p50" 
              name="0-50th percentile" 
              stackId="a" 
              fill="#4ade80"
            />
            <Bar 
              dataKey="p85" 
              name="50-85th percentile" 
              stackId="a" 
              fill="#facc15"
            />
            <Bar 
              dataKey="p95" 
              name="85-95th percentile" 
              stackId="a" 
              fill="#f87171"
            />
            <Bar 
              dataKey="p100" 
              name="95-100th percentile" 
              stackId="a" 
              fill="#1f2937"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CycleTimeChart;
