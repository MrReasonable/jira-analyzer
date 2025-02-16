import React, { useState } from 'react';
import { BarChart2, Activity, GitBranch, TrendingUp, Table } from 'lucide-react';
import MetricsSummary from './MetricsSummary';
import BottleneckAnalysis from './BottleneckAnalysis';
import FlowMetrics from './FlowMetrics';
import CycleTimeMetrics from './CycleTimeMetrics';
import EpicAnalysis from './EpicAnalysis';
import IssueTable from '../IssueTable';

const AnalysisResults = ({ data, jiraUrl, timeRange }) => {
  const [activeSection, setActiveSection] = useState('metrics');

  const navigationButtons = [
    {
      id: 'metrics',
      label: 'Process Metrics',
      icon: BarChart2
    },
    {
      id: 'flow',
      label: 'Flow Metrics',
      icon: Activity
    },
    {
      id: 'epics',
      label: 'Epic Analysis',
      icon: GitBranch
    },
    {
      id: 'bottlenecks',
      label: 'Status Analysis',
      icon: TrendingUp
    },
    {
      id: 'issues',
      label: 'Issue Details',
      icon: Table
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'metrics':
        return (
          <>
            <MetricsSummary data={data} timeRange={timeRange} />
            <CycleTimeMetrics data={data} />
          </>
        );
      case 'flow':
        return <FlowMetrics data={data} />;
      case 'epics':
        return <EpicAnalysis data={data} />;
      case 'bottlenecks':
        return <BottleneckAnalysis bottlenecks={data.bottlenecks} />;
      case 'issues':
        return <IssueTable issues={data.issues} jiraUrl={jiraUrl} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Navigation */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex space-x-4">
          {navigationButtons.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex items-center px-4 py-2 rounded ${
                activeSection === id 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-5 w-5 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Section */}
      {renderContent()}
    </div>
  );
};

export default AnalysisResults;
