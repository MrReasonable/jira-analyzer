import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';

const formatNumber = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '0.0';
  return value.toFixed(1);
};

const FlowEfficiencyChart = ({ data }) => {
  if (!data || !data.length) {
    return <div>No flow efficiency data available</div>;
  }

  // Sort by efficiency for better visualization
  const sortedData = [...data].sort((a, b) => b.efficiency - a.efficiency);
  const efficiencies = sortedData.map(item => item.efficiency);

  // Calculate percentiles
  const getPercentile = (arr, p) => {
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[index];
  };

  const median = getPercentile(efficiencies, 50);
  const p85 = getPercentile(efficiencies, 85);
  const p95 = getPercentile(efficiencies, 95);

  // Transform data for recharts
  const chartData = sortedData.map(item => {
    const itemsWithinEfficiency = efficiencies.filter(e => e <= item.efficiency).length;
    const percentile = (itemsWithinEfficiency / efficiencies.length) * 100;

    return {
      issueKey: item.issue_key,
      activeTime: item.active_time,
      waitTime: item.total_time - item.active_time,
      efficiency: item.efficiency,
      cumulativePercentage: formatNumber(percentile),
      percentileRegion: item.efficiency <= median ? 'within_50th' :
                       item.efficiency <= p85 ? '50th_to_85th' :
                       item.efficiency <= p95 ? '85th_to_95th' : 'above_95th'
    };
  });

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Flow Efficiency</h2>
        <div className="text-sm text-gray-600 space-x-4">
          <span>50th percentile: {formatNumber(median)}%</span>
          <span>85th percentile: {formatNumber(p85)}%</span>
          <span>95th percentile: {formatNumber(p95)}%</span>
        </div>
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="issueKey"
              label={{ value: 'Issue Key', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              label={{ value: 'Time (days)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-2 border rounded shadow">
                      <p className="text-sm font-medium">{data.issueKey}</p>
                      <p className="text-sm text-emerald-600">Active Time: {formatNumber(data.activeTime)} days</p>
                      <p className="text-sm text-red-600">Wait Time: {formatNumber(data.waitTime)} days</p>
                      <p className="text-sm font-medium">Efficiency: {formatNumber(data.efficiency)}%</p>
                      <p className="text-sm">{data.cumulativePercentage}% of items have lower efficiency</p>
                      <p className="text-sm text-gray-600">
                        {data.percentileRegion === 'within_50th' ? 'Below median (50th percentile)' :
                         data.percentileRegion === '50th_to_85th' ? 'Between median and 85th percentile' :
                         data.percentileRegion === '85th_to_95th' ? 'Between 85th and 95th percentile' :
                         'Above 95th percentile'}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <ReferenceLine
              y={median}
              stroke="#4ade80"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ 
                value: '50th percentile', 
                position: 'right',
                fill: '#4ade80',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />
            <ReferenceLine
              y={p85}
              stroke="#facc15"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ 
                value: '85th percentile', 
                position: 'right',
                fill: '#facc15',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />
            <ReferenceLine
              y={p95}
              stroke="#f87171"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ 
                value: '95th percentile', 
                position: 'right',
                fill: '#f87171',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />
            <Bar
              dataKey="activeTime"
              stackId="time"
              name="Active Time"
              fill="#4ade80"
              fillOpacity={0.8}
            />
            <Bar
              dataKey="waitTime"
              stackId="time"
              name="Wait Time"
              fill="#f87171"
              fillOpacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
            <span>50% of items have efficiency above {formatNumber(median)}%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
            <span>85% of items have efficiency above {formatNumber(p85)}%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
            <span>95% of items have efficiency above {formatNumber(p95)}%</span>
          </div>
        </div>
        <p className="mt-2">Flow efficiency measures the ratio of active work time to total lead time.</p>
        <p>Higher percentages indicate more efficient flow through the system.</p>
      </div>
    </div>
  );
};

export default FlowEfficiencyChart;
