import React, { useState } from 'react';
import withFullscreen from './hoc/withFullscreen';
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

const CycleTimeChart = ({ data, isFullscreen, fullscreenButton }) => {
  const [isLogScale, setIsLogScale] = useState(true);
  // Sort statuses according to the workflow order from the backend
  const chartData = data.expected_path
    .filter(status => !data.end_states?.includes(status))
    .map(status => {
      const metrics = data.status_distribution[status] || {
        median: 0,
        p85: 0,
        p95: 0,
        p50_85_avg: 0,
        p85_95_avg: 0,
        p95_100_avg: 0
      };
      const { median, p85, p95, p50_85_avg, p85_95_avg, p95_100_avg } = metrics;
      
      // For log scale, we need absolute values rather than differences
      // Also ensure minimum value of 0.1 for log scale
      return {
        status,
        p50: Math.max(0.1, median),
        p85: Math.max(0.1, p85),
        p95: Math.max(0.1, p95),
        p100: Math.max(0.1, p95 + (p95_100_avg || 0)),
        // Store original values for tooltip
        originalP50: median,
        originalP85: p85 - median,
        originalP95: p95 - p85,
        originalP100: p95_100_avg || 0,
        totalDays: p95 + (p95_100_avg || 0),
        itemCount: data.issues.filter(issue => issue.statusTimes[status] > 0).length
      };
    });

  const formatNumber = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '0.0';
    return value.toFixed(1);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (!data) return null;

      const itemCount = data.itemCount || 0;
      const p50 = data.originalP50 ?? 0;
      const p85 = data.originalP85 ?? 0;
      const p95 = data.originalP95 ?? 0;
      const p100 = data.originalP100 ?? 0;
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
    <div className={`bg-white p-6 rounded-lg shadow-sm ${isFullscreen ? 'h-full' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Cycle Time by Status</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Scale:</label>
            <select 
              className="text-sm border rounded p-1"
              value={isLogScale ? 'log' : 'linear'}
              onChange={(e) => setIsLogScale(e.target.value === 'log')}
            >
              <option value="log">Logarithmic</option>
              <option value="linear">Linear</option>
            </select>
          </div>
          {fullscreenButton}
        </div>
      </div>
      <div className={isFullscreen ? 'h-full' : 'h-96'}>
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
              scale={isLogScale ? 'log' : 'linear'}
              domain={isLogScale ? [0.1, 'auto'] : [0, 'auto']}
              allowDataOverflow={true}
              label={{ value: `Days in Status${isLogScale ? ' (log scale)' : ''}`, angle: -90, position: 'insideLeft' }}
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

export default withFullscreen(CycleTimeChart);
