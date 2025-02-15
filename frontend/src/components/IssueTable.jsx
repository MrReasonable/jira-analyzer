import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const IssueTable = ({ issues, jiraUrl }) => {
  const [sortField, setSortField] = useState('cycleTime');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedIssues = [...issues].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'key':
        comparison = a.key.localeCompare(b.key);
        break;
      case 'summary':
        comparison = a.summary.localeCompare(b.summary);
        break;
      case 'cycleTime':
        comparison = a.cycleTime - b.cycleTime;
        break;
      case 'currentStatus':
        comparison = a.currentStatus.localeCompare(b.currentStatus);
        break;
      default:
        comparison = 0;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  const getIssueUrl = (key) => {
    const baseUrl = jiraUrl.endsWith('/') ? jiraUrl : `${jiraUrl}/`;
    return `${baseUrl}browse/${key}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <h3 className="text-lg font-medium p-6 pb-4">Issues</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('key')}
              >
                <div className="flex items-center gap-1">
                  Key
                  {getSortIcon('key')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('summary')}
              >
                <div className="flex items-center gap-1">
                  Summary
                  {getSortIcon('summary')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('cycleTime')}
              >
                <div className="flex items-center gap-1">
                  Cycle Time (Days)
                  {getSortIcon('cycleTime')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('currentStatus')}
              >
                <div className="flex items-center gap-1">
                  Current Status
                  {getSortIcon('currentStatus')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedIssues.map((issue) => (
              <tr key={issue.key} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <a 
                    href={getIssueUrl(issue.key)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {issue.key}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 line-clamp-2">{issue.summary}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{issue.cycleTime.toFixed(1)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {issue.currentStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IssueTable;