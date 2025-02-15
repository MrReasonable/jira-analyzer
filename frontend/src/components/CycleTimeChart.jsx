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
  const chartData = Object.entries(data.status_distribution).map(([status, metrics]) => ({
    status,
    mean: Number(metrics.mean.toFixed(1)),
    median: Number(metrics.median.toFixed(1)),
    p85: Number(metrics.p85.toFixed(1))
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Time in Status (Days)</h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="status"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              formatter={(value) => [`${value} days`, undefined]}
              labelStyle={{ color: 'black' }}
            />
            <Legend />
            <Bar dataKey="mean" name="Mean" fill="#8884d8" />
            <Bar dataKey="median" name="Median" fill="#82ca9d" />
            <Bar dataKey="p85" name="85th Percentile" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CycleTimeChart;