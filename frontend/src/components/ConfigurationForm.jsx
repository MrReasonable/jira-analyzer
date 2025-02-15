import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import TeamFilterSelector from './TeamFilterSelector';
import { DragDropContext } from 'react-beautiful-dnd';
import WorkflowOrdering from './WorkflowOrdering';

const ConfigurationForm = ({ 
  config, 
  onConfigChange, 
  onAnalyze, 
  onSaveConfig,
  loading, 
  error,
  onErrorClear,
  currentConfigName,
  currentConfigId
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [configName, setConfigName] = useState('');
  const [saveMode, setSaveMode] = useState('new'); // 'new' or 'update'
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(null);

  useEffect(() => {
    // When config changes (e.g., from loading), update selected team and filter
    if (config.projectKey) {
      setSelectedTeam({
        key: config.projectKey,
        name: config.projectName
      });
    } else {
      setSelectedTeam(null);
    }

    if (config.filterId) {
      setSelectedFilter({
        id: config.filterId,
        name: config.filterName,
        jql: config.filterJql
      });
    } else {
      setSelectedFilter(null);
    }
  }, [config]);

  useEffect(() => {
    // When a configuration is loaded, pre-fill its name
    if (currentConfigName) {
      setConfigName(currentConfigName);
    }
  }, [currentConfigName]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onConfigChange({
      ...config,
      [name]: value
    });
  };

  const handleStatusChange = (index, value) => {
    const newStatuses = [...config.statuses];
    newStatuses[index] = value;
    onConfigChange({
      ...config,
      statuses: newStatuses,
      expectedPath: newStatuses // Update expected path to match statuses
    });
  };

  const addStatus = () => {
    onConfigChange({
      ...config,
      statuses: [...config.statuses, ''],
      expectedPath: [...config.expectedPath, '']
    });
  };

  const removeStatus = (index) => {
    onConfigChange({
      ...config,
      statuses: config.statuses.filter((_, i) => i !== index),
      expectedPath: config.expectedPath.filter((_, i) => i !== index)
    });
  };

  const handleTeamSelect = (team) => {
    setSelectedTeam(team);
    onConfigChange({
      ...config,
      projectKey: team?.key,
      projectName: team?.name
    });
  };

  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
    if (filter) {
      onConfigChange({
        ...config,
        filterId: filter.id,
        filterName: filter.name,
        filterJql: filter.jql,
        jqlQuery: filter.jql  // Make sure to set jqlQuery when selecting a filter
      });
    }
  };

  const handleSaveClick = () => {
    if (currentConfigName) {
      // If we have a current config, show options to update or save as new
      setSaveMode('update');
    } else {
      setSaveMode('new');
    }
    setShowSaveDialog(true);
  };

  const handleSave = (mode) => {
    if (!configName.trim()) {
      alert('Please enter a name for this configuration');
      return;
    }

    // Ensure we're saving both JQL fields
    const configToSave = {
      ...config,
      name: configName,
      id: mode === 'update' ? currentConfigId : undefined,
      projectKey: selectedTeam?.key || '',
      projectName: selectedTeam?.name || '',
      filterId: selectedFilter?.id || '',
      filterName: selectedFilter?.name || '',
      filterJql: selectedFilter?.jql || '',
      // Ensure jqlQuery is saved correctly
      jqlQuery: config.jqlQuery || selectedFilter?.jql || '',
      defaultJql: config.jqlQuery || selectedFilter?.jql || ''  // Save current query as default
    };

    onSaveConfig(configToSave);
    setShowSaveDialog(false);
  };

  const handleWorkflowChange = (statuses, path) => {
    onConfigChange({
      ...config,
      statuses: statuses,
      expectedPath: path
    });
  };  

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Configuration</h2>
        <button
          onClick={handleSaveClick}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          <Save className="h-4 w-4" />
          Save Configuration
        </button>
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Save Configuration</h3>
            {currentConfigName && (
              <div className="mb-4 flex flex-col gap-2">
                <button
                  onClick={() => handleSave('update')}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Update "{currentConfigName}"
                </button>
                <div className="text-center text-gray-500">or</div>
              </div>
            )}
            <div className="space-y-4">
              <input
                type="text"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder="Enter configuration name"
                className="w-full p-2 border rounded"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave('new')}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Save as New
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

 {/* Connection Details */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          name="jiraUrl"
          value={config.jiraUrl}
          onChange={handleInputChange}
          placeholder="Jira URL (e.g., https://your-domain.atlassian.net)"
          className="p-2 border rounded w-full"
        />
        <input
          type="text"
          name="username"
          value={config.username}
          onChange={handleInputChange}
          placeholder="Email"
          className="p-2 border rounded w-full"
        />
        <input
          type="password"
          name="apiToken"
          value={config.apiToken}
          onChange={handleInputChange}
          placeholder="API Token"
          className="p-2 border rounded w-full"
        />
      </div>

      {/* Team and Filter Selection */}
      {config.jiraUrl && config.username && config.apiToken && (
        <TeamFilterSelector
          connectionDetails={{
            jiraUrl: config.jiraUrl,
            username: config.username,
            apiToken: config.apiToken
          }}
          onTeamSelect={handleTeamSelect}
          onFilterSelect={handleFilterSelect}
          selectedTeam={selectedTeam}
          selectedFilter={selectedFilter}
        />
      )}

      {/* Manual JQL Query (always visible but with note if filter selected) */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        JQL Query
        {selectedFilter && (
          <span className="text-sm text-gray-500 ml-2">
            (from filter: {selectedFilter.name})
          </span>
        )}
      </label>
      <input
        type="text"
        name="jqlQuery"
        value={config.jqlQuery}
        onChange={handleInputChange}
        placeholder="JQL Query (e.g., project = 'KEY' AND status = Done)"
        className="p-2 border rounded w-full"
      />
    </div>

      {/* Workflow Configuration */}
      <WorkflowOrdering
        statuses={config.statuses}
        expectedPath={config.expectedPath}
        onOrderChange={(newPath) => handleWorkflowChange(config.statuses, newPath)}
        onStatusesChange={handleWorkflowChange}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <button
        onClick={onAnalyze}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center gap-2"
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
  );
};

export default ConfigurationForm;