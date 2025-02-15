import React from 'react';
import CycleTimeChart from './CycleTimeChart';
import IssueTable from './IssueTable';
import { AlertTriangle, Calendar } from 'lucide-react';

const AnalysisResults = ({ data, jiraUrl, timeRange }) => {
  const formatNumber = (num) => Number(num.toFixed(1));

  const getComplianceColor = (rate) => {
    if (rate >= 80) return 'bg-green-100 text-green-800';
    if (rate >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatTimeRange = () => {
    if (timeRange.timePreset) {
      const presetLabels = {
        'two_weeks': 'Last 2 Weeks',
        'quarter': 'Last Quarter',
        'half_year': 'Last 6 Months',
        'year': 'Last Year'
      };
      return presetLabels[timeRange.timePreset];
    }
    
    if (timeRange.startDate && timeRange.endDate) {
      const start = new Date(timeRange.startDate).toLocaleDateString();
      const end = new Date(timeRange.endDate).toLocaleDateString();
      return `${start} to ${end}`;
    }

    return 'All Time';
  };

  return (
    <div className="space-y-6">
      {/* Time Range Info */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="h-5 w-5" />
          <span>Analysis Period: {formatTimeRange()}</span>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Issues</h3>
          <p className="mt-2 text-3xl font-semibold">{data.total_issues}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Average Cycle Time</h3>
          <p className="mt-2 text-3xl font-semibold">
            {formatNumber(data.cycle_time_stats.mean)} days
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Median: {formatNumber(data.cycle_time_stats.median)} days
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Workflow Compliance</h3>
          <p className="mt-2 text-3xl font-semibold">
            <span className={`px-2 py-1 rounded-full ${getComplianceColor(data.workflow_compliance.compliance_rate)}`}>
              {formatNumber(data.workflow_compliance.compliance_rate)}%
            </span>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {data.workflow_compliance.compliant_issues} compliant issues
          </p>
        </div>
      </div>

      {/* Bottlenecks Warning */}
      {data.bottlenecks.length > 0 && data.bottlenecks[0].bottleneck_score > 5 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Potential bottleneck detected in status{' '}
                <strong>{data.bottlenecks[0].status}</strong> with an average time of{' '}
                {formatNumber(data.bottlenecks[0].avg_time)} days
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cycle Time Distribution Chart */}
      <CycleTimeChart data={data} />

      {/* Process Efficiency */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">Process Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">85th Percentile</h4>
            <p className="mt-1 text-2xl font-semibold">
              {formatNumber(data.cycle_time_stats.p85)} days
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">95th Percentile</h4>
            <p className="mt-1 text-2xl font-semibold">
              {formatNumber(data.cycle_time_stats.p95)} days
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Standard Deviation</h4>
            <p className="mt-1 text-2xl font-semibold">
              {formatNumber(data.cycle_time_stats.std_dev)} days
            </p>
          </div>
        </div>
      </div>

      {/* Bottlenecks Table */}
      {data.bottlenecks.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-4">Status Analysis</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Time (Days)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Standard Deviation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impact
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.bottlenecks.map((bottleneck, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {bottleneck.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(bottleneck.avg_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(bottleneck.std_dev)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${bottleneck.impact === 'High' ? 'bg-red-100 text-red-800' :
                          bottleneck.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'}`}>
                        {bottleneck.impact}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issues Table */}
      <IssueTable issues={data.issues} jiraUrl={jiraUrl} />
    </div>
  );
};

export default AnalysisResults;