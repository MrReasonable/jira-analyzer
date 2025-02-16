import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const formatNumber = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '0.0';
  return value.toFixed(1);
};

const EpicLeadTimeChart = ({ data }) => {
  if (!data || !data.length) {
    return <div>No epic data available</div>;
  }

  // Filter out epics with no lead time and sort by lead time
  const sortedData = [...data]
    .filter(epic => epic.lead_time !== null)
    .sort((a, b) => b.lead_time - a.lead_time);

  // Calculate percentiles
  const leadTimes = sortedData.map(epic => epic.lead_time).sort((a, b) => a - b);
  const getPercentile = (arr, p) => {
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[index];
  };
  
  const medianLeadTime = getPercentile(leadTimes, 50);
  const p85LeadTime = getPercentile(leadTimes, 85);
  const p95LeadTime = getPercentile(leadTimes, 95);
  
  // Calculate cumulative percentages for each epic
  const chartData = sortedData.map(epic => {
    const itemsWithinTime = leadTimes.filter(time => time <= epic.lead_time).length;
    const percentile = (itemsWithinTime / leadTimes.length) * 100;
    
    return {
      key: epic.key,
      leadTime: epic.lead_time,
      summary: epic.summary,
      childCount: epic.children.length,
      startDate: epic.start_time ? new Date(epic.start_time).toLocaleDateString() : 'N/A',
      endDate: epic.end_time ? new Date(epic.end_time).toLocaleDateString() : 'N/A',
      cumulativePercentage: formatNumber(percentile),
      percentileRegion: epic.lead_time <= medianLeadTime ? 'within_50th' :
                       epic.lead_time <= p85LeadTime ? '50th_to_85th' :
                       epic.lead_time <= p95LeadTime ? '85th_to_95th' : 'above_95th'
    };
  });

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Epic Lead Times</h2>
        <div className="text-sm text-gray-600 space-x-4">
          <span>50th percentile: {formatNumber(medianLeadTime)} days</span>
          <span>85th percentile: {formatNumber(p85LeadTime)} days</span>
          <span>95th percentile: {formatNumber(p95LeadTime)} days</span>
        </div>
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="key"
              label={{ value: 'Epic Key', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              label={{ value: 'Lead Time (days)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-2 border rounded shadow">
                      <p className="text-sm font-medium">{data.key}</p>
                      <p className="text-sm text-gray-600">{data.summary}</p>
                      <p className="text-sm">Lead Time: {formatNumber(data.leadTime)} days</p>
                      <p className="text-sm">{data.cumulativePercentage}% of epics completed within this time</p>
                      <p className="text-sm text-gray-600">
                        {data.percentileRegion === 'within_50th' ? 'Below median (50th percentile)' :
                         data.percentileRegion === '50th_to_85th' ? 'Between median and 85th percentile' :
                         data.percentileRegion === '85th_to_95th' ? 'Between 85th and 95th percentile' :
                         'Above 95th percentile'}
                      </p>
                      <p className="text-sm">Child Issues: {data.childCount}</p>
                      <p className="text-sm">Start: {data.startDate}</p>
                      <p className="text-sm">End: {data.endDate}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              y={medianLeadTime}
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
              y={p85LeadTime}
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
              y={p95LeadTime}
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
              dataKey="leadTime"
              fill="#60a5fa"
              fillOpacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Lead time is calculated from the first child issue entering progress to the last child issue being completed.</p>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
            <span>50% of epics complete within {formatNumber(medianLeadTime)} days</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
            <span>85% of epics complete within {formatNumber(p85LeadTime)} days</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
            <span>95% of epics complete within {formatNumber(p95LeadTime)} days</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EpicLeadTimeChart;
