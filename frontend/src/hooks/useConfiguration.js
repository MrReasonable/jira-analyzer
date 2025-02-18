import { useState } from 'react';
import { saveTeamConfig } from '@/services/api';

const defaultConfig = {
  jiraUrl: "",
  username: "",
  apiToken: "",
  jqlQuery: "",
  statuses: ["To Do", "In Progress", "Code Review", "QA", "Done"],
  expectedPath: ["To Do", "In Progress", "Code Review", "QA", "Done"],
  startStates: ["To Do"],
  endStates: ["Done"],
  filterJql: "",
  flowEfficiencyMethod: "active_statuses"
};

export const useConfiguration = () => {
  const [config, setConfig] = useState(defaultConfig);
  const [currentConfigName, setCurrentConfigName] = useState("");
  const [currentConfigId, setCurrentConfigId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConfigSelect = (selectedConfig) => {
    setConfig({
      jiraUrl: selectedConfig.jiraUrl,
      username: selectedConfig.username,
      apiToken: selectedConfig.apiToken,
      statuses: selectedConfig.statuses,
      expectedPath: selectedConfig.expectedPath,
      startStates: selectedConfig.startStates || [selectedConfig.statuses[0]],
      endStates: selectedConfig.endStates || [selectedConfig.statuses[selectedConfig.statuses.length - 1]],
      jqlQuery: selectedConfig.filterJql || '',
      filterJql: selectedConfig.filterJql || '',
      flowEfficiencyMethod: selectedConfig.flowEfficiencyMethod || 'active_statuses'
    });
    setCurrentConfigName(selectedConfig.name);
    setCurrentConfigId(selectedConfig.id);
  };

  const validateConfig = (config) => {
    if (!config.jiraUrl) return "Jira URL is required";
    if (!config.username) return "Username is required";
    if (!config.apiToken) return "API Token is required";
    if (!config.jqlQuery && !config.filterJql) return "JQL Query is required";
    if (!config.statuses.length) return "At least one status is required";
    if (!config.expectedPath.length) return "Expected path cannot be empty";
    
    try {
      new URL(config.jiraUrl);
    } catch {
      return "Invalid Jira URL format";
    }
    
    return null;
  };

  const saveConfig = async (name) => {
    if (!name) return; // Early return if no name provided (used for refresh only)
    
    setLoading(true);
    setError(null);

    const configToSave = {
      ...config,
      name,
      filterJql: config.jqlQuery, // Map jqlQuery to filterJql for saving
      ...(currentConfigName === name ? { id: currentConfigId } : {})
    };

    try {
      const result = await saveTeamConfig(configToSave, currentConfigId);
      if (result.status === 'success') {
        setCurrentConfigName(name);
        if (result.data.id) {
          setCurrentConfigId(result.data.id);
        }
        setError(null);
        return true;
      } else {
        const errorMessage = result.message || 'Failed to save configuration';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to save configuration';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    config,
    setConfig,
    currentConfigName,
    currentConfigId,
    error,
    loading,
    handleConfigSelect,
    validateConfig,
    saveConfig,
    setError
  };
};
