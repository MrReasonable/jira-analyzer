import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const LeadTimeChart = ({ data }) => {
  if (!data || !data.cycle_time_stats) return null;

  const { median = 0, p85 = 0, p95 = 0 } = data.cycle_time_stats;
  const maxDays = Math.ceil((p95 || 0) * 1.1); // Add 10% padding
  
  // Create distribution data
  const distributionData = [];
  const dayRanges = Array.from({ length: maxDays + 1 }, (_, i) => i);
  
  // Sort cycle times to match numpy.percentile() calculation
  const sortedCycleTimes = [...data.issues]
    .map(issue => Math.floor(issue.cycleTime))
    .sort((a, b) => a - b);
  const totalCount = sortedCycleTimes.length;
  
  dayRanges.forEach(day => {
    // Count items that took this many days
    const count = data.issues.filter(issue => 
      Math.floor(issue.cycleTime) === day
    ).length;
    
    // Calculate percentile by counting items that took this long or less
    const itemsWithinTime = sortedCycleTimes.filter(time => time <= day).length;
    const percentile = (itemsWithinTime / totalCount) * 100;
    
    distributionData.push({
      days: day,
      count,
      cumulativePercentage: percentile.toFixed(1),
      percentileRegion: day <= median ? 'within_50th' :
                       day <= p85 ? '50th_to_85th' :
                       day <= p95 ? '85th_to_95th' : 'above_95th'
    });
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Lead Time Distribution</h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={distributionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="days"
              label={{ value: 'Days', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              label={{ value: 'Number of Items', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-2 border rounded shadow">
                      <p className="text-sm font-medium">{`${data.days} days`}</p>
                      <p className="text-sm">{`${data.count} items`}</p>
                      <p className="text-sm">{`${data.cumulativePercentage}% of items completed within ${data.days} days`}</p>
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
            <Area
              type="monotone"
              dataKey="count"
              fill="#4ade80"
              stroke="#4ade80"
              fillOpacity={0.8}
            />
            <ReferenceLine
              x={median}
              stroke="#4ade80"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ 
                value: '50th percentile', 
                position: 'top',
                fill: '#4ade80',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />
            <ReferenceLine
              x={p85}
              stroke="#facc15"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ 
                value: '85th percentile', 
                position: 'top',
                fill: '#facc15',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />
            <ReferenceLine
              x={p95}
              stroke="#f87171"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ 
                value: '95th percentile', 
                position: 'top',
                fill: '#f87171',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
              <span>Lead Time (50th percentile)</span>
            </div>
            <span>50% of items complete within {(median || 0).toFixed(1)} days</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
              <span>85th percentile</span>
            </div>
            <span>85% of items complete within {(p85 || 0).toFixed(1)} days</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
              <span>95th percentile</span>
            </div>
            <span>95% of items complete within {(p95 || 0).toFixed(1)} days</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadTimeChart;
