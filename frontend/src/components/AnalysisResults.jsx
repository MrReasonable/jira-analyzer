import React, { useState } from 'react';
import CycleTimeChart from './CycleTimeChart';
import LeadTimeChart from './LeadTimeChart';
import CFDChart from './CFDChart';
import FlowEfficiencyChart from './FlowEfficiencyChart';
import EpicLeadTimeChart from './EpicLeadTimeChart';
import IssueTable from './IssueTable';
import { AlertTriangle, Calendar, BarChart2, TrendingUp, Table, Activity, GitBranch } from 'lucide-react';

const AnalysisResults = ({ data, jiraUrl, timeRange }) => {
  const [activeSection, setActiveSection] = useState('metrics');
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

      {/* Analysis Navigation */}
      <div className="bg-white p-4 rounded-lg shadow-sm mt-6 mb-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveSection('metrics')}
            className={`flex items-center px-4 py-2 rounded ${
              activeSection === 'metrics' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BarChart2 className="h-5 w-5 mr-2" />
            Process Metrics
          </button>
          <button
            onClick={() => setActiveSection('flow')}
            className={`flex items-center px-4 py-2 rounded ${
              activeSection === 'flow' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Activity className="h-5 w-5 mr-2" />
            Flow Metrics
          </button>
          <button
            onClick={() => setActiveSection('epics')}
            className={`flex items-center px-4 py-2 rounded ${
              activeSection === 'epics' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <GitBranch className="h-5 w-5 mr-2" />
            Epic Analysis
          </button>
          <button
            onClick={() => setActiveSection('bottlenecks')}
            className={`flex items-center px-4 py-2 rounded ${
              activeSection === 'bottlenecks' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="h-5 w-5 mr-2" />
            Status Analysis
          </button>
          <button
            onClick={() => setActiveSection('issues')}
            className={`flex items-center px-4 py-2 rounded ${
              activeSection === 'issues' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Table className="h-5 w-5 mr-2" />
            Issue Details
          </button>
        </div>
      </div>

      {/* Process Metrics Section */}
      {activeSection === 'metrics' && (
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CycleTimeChart data={{ 
            ...data, 
            expected_path: data.expected_path || data.config?.expectedPath || [],
            end_states: data.end_states || [] 
          }} />
          <LeadTimeChart data={data} />
        </div>
      </div>
      )}

      {/* Flow Metrics Section */}
      {activeSection === 'flow' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-4">Flow Analysis</h3>
            <CFDChart data={data.cfd_data} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-4">Flow Efficiency</h3>
            <FlowEfficiencyChart data={data.flow_efficiency_data} />
          </div>
        </div>
      )}

      {/* Epic Analysis Section */}
      {activeSection === 'epics' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-4">Epic Lead Times</h3>
          <EpicLeadTimeChart data={data.epic_data} />
        </div>
      )}

      {/* Bottlenecks Section */}
      {activeSection === 'bottlenecks' && data.bottlenecks.length > 0 && (
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

      {/* Issues Table Section */}
      {activeSection === 'issues' && (
        <IssueTable issues={data.issues} jiraUrl={jiraUrl} />
      )}
    </div>
  );
};

export default AnalysisResults;
