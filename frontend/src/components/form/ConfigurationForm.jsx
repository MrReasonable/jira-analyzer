import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2, ArrowUpDown } from 'lucide-react';
import WorkflowOrdering from '../workflow/WorkflowOrdering';
import WorkflowExtractor from '../workflow/WorkflowExtractor';
import FormField from './FormField';
import { useFormFields } from '@/hooks/useFormFields';

const ConfigurationForm = ({ 
  config, 
  onConfigChange, 
  onAnalyze, 
  loading, 
  error,
  onErrorClear
}) => {
  const [useExtractor, setUseExtractor] = useState(false);
  
  const { handleFieldChange } = useFormFields(config, onConfigChange);

  const handleWorkflowChange = (newStatuses, newPath) => {
    // Ensure statuses array maintains same order as path
    const orderedStatuses = [...new Set(newPath)];
    onConfigChange({
      ...config,
      statuses: orderedStatuses,
      expectedPath: newPath
    });
  };

  const handleStateChange = (newStartStates, newEndStates) => {
    onConfigChange({
      ...config,
      startStates: newStartStates,
      endStates: newEndStates
    });
  };

  const handleActiveStatusesChange = (newActiveStatuses) => {
    onConfigChange({
      ...config,
      activeStatuses: newActiveStatuses
    });
  };

  const formFields = [
    {
      name: "jiraUrl",
      label: "Jira URL",
      placeholder: "https://your-domain.atlassian.net"
    },
    {
      name: "username",
      label: "Email",
      placeholder: "Your Jira email"
    },
    {
      name: "apiToken",
      label: "API Token",
      type: "password",
      placeholder: "Your Jira API token"
    },
    {
      name: "jqlQuery",
      label: "JQL Query",
      placeholder: "project = 'KEY' AND status = Done"
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-zinc-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50">
        <h2 className="text-xl font-semibold text-zinc-900">Configuration</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Input Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formFields.map(field => (
            <FormField
              key={field.name}
              {...field}
              value={config[field.name]}
              onChange={handleFieldChange}
            />
          ))}
        </div>

        {/* Workflow Configuration Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-zinc-900">Workflow Configuration</h3>
            <button
              onClick={() => setUseExtractor(!useExtractor)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 
                         hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-200"
            >
              <ArrowUpDown className="h-4 w-4" />
              {useExtractor ? 'Switch to Manual' : 'Extract from Jira'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Flow Efficiency Calculation:</label>
              <select 
                className="text-sm border rounded p-1"
                value={config.flowEfficiencyMethod || 'active_statuses'}
                onChange={(e) => onConfigChange({
                  ...config,
                  flowEfficiencyMethod: e.target.value
                })}
              >
                <option value="active_statuses">Active Statuses</option>
                <option value="time_logged">Time Logged</option>
              </select>
            </div>

            <div className="bg-zinc-50 rounded-lg p-4">
              {useExtractor ? (
                <WorkflowExtractor
                  connectionDetails={{
                    jiraUrl: config.jiraUrl,
                    username: config.username,
                    apiToken: config.apiToken
                  }}
                  onWorkflowExtracted={(workflow) => {
                    const uniqueStatuses = [...new Set(workflow.suggestedFlow)];
                    onConfigChange({
                      ...config,
                      statuses: uniqueStatuses,
                      expectedPath: workflow.suggestedFlow,
                      startStates: workflow.startStates,
                      endStates: workflow.endStates,
                      activeStatuses: workflow.activeStatuses
                    });
                  }}
                />
              ) : (
                <WorkflowOrdering
                  statuses={config.statuses || []}
                  expectedPath={config.expectedPath || []}
                  startStates={config.startStates || []}
                  endStates={config.endStates || []}
                  activeStatuses={config.activeStatuses || []}
                  flowEfficiencyMethod={config.flowEfficiencyMethod || 'active_statuses'}
                  onOrderChange={(newPath) => handleWorkflowChange(config.statuses, newPath)}
                  onStatusesChange={handleWorkflowChange}
                  onStateChange={handleStateChange}
                  onActiveStatusesChange={handleActiveStatusesChange}
                />
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" onClose={onErrorClear}>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Analyze Button */}
        <button
          onClick={onAnalyze}
          disabled={loading}
          className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-200
                     shadow-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze'
          )}
        </button>
      </div>
    </div>
  );
};

export default ConfigurationForm;
