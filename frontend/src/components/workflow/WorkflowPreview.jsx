import React from 'react';
import { ArrowRightCircle } from 'lucide-react';

export const WorkflowPreview = ({
  workflow,
  selectedStartStates,
  selectedEndStates,
  selectedActiveStatuses,
  onStateSelection
}) => {
  if (!workflow) return null;

  return (
    <div className="mt-6 space-y-6">
      {/* Suggested Flow */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-700">
            Project Workflow
          </h4>
          {Object.keys(workflow.transitions).length > 1 && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Multiple workflow paths available
            </span>
          )}
        </div>
        <div className="p-4 bg-gray-50 rounded flex items-center flex-wrap gap-2">
          <div className="w-full text-sm text-gray-600 mb-2">
            This is a suggested workflow path based on your project's issue history:
          </div>
          {workflow.suggestedFlow.map((status, index) => (
            <span key={status} className="inline-flex items-center">
              <span className="px-3 py-1 bg-white rounded border text-sm">
                {status}
              </span>
              {index < workflow.suggestedFlow.length - 1 && (
                <ArrowRightCircle className="h-4 w-4 mx-1 text-gray-400" />
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Start/End State Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-sm text-gray-600 mb-2 md:col-span-3">
          Select the states that represent the start, active work, and end of your workflow. Multiple states can be selected to handle different workflow paths:
        </div>
        {/* Start States */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Select Start States
          </h4>
          <div className="p-4 bg-gray-50 rounded space-y-2">
            {workflow.allStatuses.map((status) => (
              <label key={status} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedStartStates.includes(status)}
                  onChange={() => onStateSelection(status, 'start')}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{status}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Active States */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Select Active States
          </h4>
          <div className="p-4 bg-gray-50 rounded space-y-2">
            {workflow.allStatuses.map((status) => (
              <label key={status} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedActiveStatuses.includes(status)}
                  onChange={() => onStateSelection(status, 'active')}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{status}</span>
              </label>
            ))}
          </div>
        </div>

        {/* End States */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Select End States
          </h4>
          <div className="p-4 bg-gray-50 rounded space-y-2">
            {workflow.allStatuses.map((status) => (
              <label key={status} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedEndStates.includes(status)}
                  onChange={() => onStateSelection(status, 'end')}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{status}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowPreview;
