import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const CFDChart = ({ data }) => {
  const [showWIP, setShowWIP] = useState(false);
  
  if (!data || !data.dates || !data.status_counts) {
    return <div>No data available</div>;
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  // Transform data for recharts
  const chartData = data.dates.map((date, index) => {
    const dataPoint = {
      date: formatDate(date),
      wip: data.wip_counts[index]
    };
    
    // Add status counts
    Object.entries(data.status_counts).forEach(([status, counts]) => {
      dataPoint[status] = counts[index];
    });
    
    return dataPoint;
  });

  // Generate colors for each status
  const statusColors = Object.keys(data.status_counts).reduce((acc, status, index) => {
    const hue = (index * 360) / Object.keys(data.status_counts).length;
    acc[status] = `hsl(${hue}, 70%, 50%)`;
    return acc;
  }, {});

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {showWIP ? 'Work in Progress' : 'Cumulative Flow'}
        </h2>
        <button
          onClick={() => setShowWIP(!showWIP)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Show {showWIP ? 'CFD' : 'WIP'}
        </button>
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {showWIP ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                label={{ value: 'Number of Items', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-2 border rounded shadow">
                        <p className="text-sm font-medium">{payload[0].payload.date}</p>
                        <p className="text-sm">WIP: {payload[0].value}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="wip"
                fill="#4ade80"
              />
            </BarChart>
          ) : (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                label={{ value: 'Number of Items', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-2 border rounded shadow">
                        <p className="text-sm font-medium">{payload[0].payload.date}</p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              {Object.entries(data.status_counts).map(([status], index) => (
                <Area
                  key={status}
                  type="monotone"
                  dataKey={status}
                  stackId="1"
                  stroke={statusColors[status]}
                  fill={statusColors[status]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>
          {showWIP 
            ? 'Shows the number of items actively being worked on over time.'
            : 'Shows how work items flow through different states over time.'}
        </p>
      </div>
    </div>
  );
};

export default CFDChart;
