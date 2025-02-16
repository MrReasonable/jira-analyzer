import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2, ArrowUpDown } from 'lucide-react';
import WorkflowOrdering from './WorkflowOrdering';
import WorkflowExtractor from './WorkflowExtractor';

const InputField = ({ name, value, onChange, placeholder, type = "text" }) => (
  <div className="relative">
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-md border border-zinc-200 bg-white text-zinc-900 shadow-sm 
                 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                 transition duration-200 ease-in-out"
    />
  </div>
);

const ConfigurationForm = ({ 
  config, 
  onConfigChange, 
  onAnalyze, 
  loading, 
  error,
  onErrorClear
}) => {
  const [useExtractor, setUseExtractor] = useState(false);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onConfigChange({
      ...config,
      [name]: value
    });
  };

  const handleWorkflowChange = (newStatuses, newPath) => {
    onConfigChange({
      ...config,
      statuses: newStatuses,
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

  return (
    <div className="bg-white rounded-xl shadow-lg border border-zinc-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50">
        <h2 className="text-xl font-semibold text-zinc-900">Configuration</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Input Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            name="jiraUrl"
            value={config.jiraUrl}
            onChange={handleInputChange}
            placeholder="Jira URL (e.g., https://your-domain.atlassian.net)"
          />
          <InputField
            name="username"
            value={config.username}
            onChange={handleInputChange}
            placeholder="Email"
          />
          <InputField
            name="apiToken"
            value={config.apiToken}
            onChange={handleInputChange}
            placeholder="API Token"
            type="password"
          />
          <InputField
            name="jqlQuery"
            value={config.jqlQuery}
            onChange={handleInputChange}
            placeholder="JQL Query (e.g., project = 'KEY' AND status = Done)"
          />
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

          <div className="bg-zinc-50 rounded-lg p-4">
            {useExtractor ? (
              <WorkflowExtractor
                connectionDetails={{
                  jiraUrl: config.jiraUrl,
                  username: config.username,
                  apiToken: config.apiToken
                }}
                onWorkflowExtracted={(workflow) => {
                  // Ensure we maintain the same order between statuses and expectedPath
                  const uniqueStatuses = [...new Set(workflow.suggestedFlow)];
                  onConfigChange({
                    ...config,
                    statuses: uniqueStatuses,
                    expectedPath: workflow.suggestedFlow,
                    startStates: workflow.startStates,
                    endStates: workflow.endStates
                  });
                }}
              />
            ) : (
              <WorkflowOrdering
                statuses={config.statuses || []}
                expectedPath={config.expectedPath || []}
                startStates={config.startStates || []}
                endStates={config.endStates || []}
                onOrderChange={(newPath) => handleWorkflowChange(config.statuses, newPath)}
                onStatusesChange={handleWorkflowChange}
                onStateChange={handleStateChange}
              />
            )}
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
