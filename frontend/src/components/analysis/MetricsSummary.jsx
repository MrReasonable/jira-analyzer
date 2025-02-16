import React from 'react';
import { Calendar } from 'lucide-react';
import { formatTimeRange, getComplianceColor, getMetricsSummary } from '@/utils/metrics';

export const MetricsSummary = ({ data, timeRange }) => {
  const metrics = getMetricsSummary(data);

  return (
    <div className="space-y-6">
      {/* Time Range Info */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="h-5 w-5" />
          <span>Analysis Period: {formatTimeRange(timeRange)}</span>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Issues</h3>
          <p className="mt-2 text-3xl font-semibold">{metrics.totalIssues}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Average Cycle Time</h3>
          <p className="mt-2 text-3xl font-semibold">
            {metrics.cycleTime.mean} days
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Median: {metrics.cycleTime.median} days
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Workflow Compliance</h3>
          <p className="mt-2 text-3xl font-semibold">
            <span className={`px-2 py-1 rounded-full ${getComplianceColor(metrics.compliance.rate)}`}>
              {metrics.compliance.rate}%
            </span>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {metrics.compliance.compliantIssues} compliant issues
          </p>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">Process Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">85th Percentile</h4>
            <p className="mt-1 text-2xl font-semibold">
              {metrics.cycleTime.p85} days
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">95th Percentile</h4>
            <p className="mt-1 text-2xl font-semibold">
              {metrics.cycleTime.p95} days
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Standard Deviation</h4>
            <p className="mt-1 text-2xl font-semibold">
              {metrics.cycleTime.stdDev} days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsSummary;
