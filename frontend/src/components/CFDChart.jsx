import React, { useState } from 'react';
import withFullscreen from './hoc/withFullscreen';
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

const CFDChart = ({ data, isFullscreen, fullscreenButton }) => {
  const [showWIP, setShowWIP] = useState(false);
  const [hideNonWorkDays, setHideNonWorkDays] = useState(false);
  
  if (!data || !data.dates || !data.dates.length || !data.status_counts || !Object.keys(data.status_counts).length) {
    return <div>No data available for the selected time range</div>;
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  // Filter out weekends if hideNonWorkDays is true
  const chartData = data.dates.map((date, index) => {
    const dateObj = new Date(date);
    // Skip weekends if hideNonWorkDays is true
    if (hideNonWorkDays && (dateObj.getDay() === 0 || dateObj.getDay() === 6)) {
      return null;
    }
    const dataPoint = {
      date: formatDate(date),
      wip: data.wip_counts[index]
    };
    
    // Add status counts
    Object.entries(data.status_counts).forEach(([status, counts]) => {
      dataPoint[status] = counts[index];
    });
    
    return dataPoint;
  }).filter(Boolean); // Remove null entries

  // Generate colors for each status
  const statusColors = Object.keys(data.status_counts).reduce((acc, status, index) => {
    const hue = (index * 360) / Object.keys(data.status_counts).length;
    acc[status] = `hsl(${hue}, 70%, 50%)`;
    return acc;
  }, {});

  return (
    <div className={`p-4 bg-white rounded-lg shadow ${isFullscreen ? 'h-full' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {showWIP ? 'Work in Progress' : 'Cumulative Flow'}
        </h2>
        <div className="flex items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setShowWIP(!showWIP)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Show {showWIP ? 'CFD' : 'WIP'}
            </button>
            <button
              onClick={() => setHideNonWorkDays(!hideNonWorkDays)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              {hideNonWorkDays ? 'Show' : 'Hide'} Non-Work Days
            </button>
            {fullscreenButton}
          </div>
        </div>
      </div>
      <div className={isFullscreen ? 'h-full' : 'h-96'}>
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
              <Legend 
                payload={
                  Object.entries(data.status_counts)
                    .map(([status]) => ({
                      value: status,
                      type: 'rect',
                      color: statusColors[status]
                    }))
                }
              />
              {Object.entries(data.status_counts)
                .reverse() // Reverse the order so final states are at the bottom
                .map(([status], index) => (
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

export default withFullscreen(CFDChart);
