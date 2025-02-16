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
  projectKey: "",
  projectName: "",
  filterId: "",
  filterName: "",
  filterJql: "",
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
      jqlQuery: selectedConfig.filterJql || selectedConfig.defaultJql || '',
      defaultJql: selectedConfig.defaultJql || '',
      projectKey: selectedConfig.projectKey || '',
      projectName: selectedConfig.projectName || '',
      filterId: selectedConfig.filterId || '',
      filterName: selectedConfig.filterName || '',
      filterJql: selectedConfig.filterJql || ''
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
    setLoading(true);
    setError(null);

    const configToSave = {
      ...config,
      name,
      ...(currentConfigName === name ? { id: currentConfigId } : {})
    };

    try {
      const result = await saveTeamConfig(configToSave, currentConfigId);
      if (result.status === 'success') {
        setCurrentConfigName(name);
        if (result.data.id) {
          setCurrentConfigId(result.data.id);
        }
        return true;
      } else {
        setError(result.message || 'Failed to save configuration');
        return false;
      }
    } catch (err) {
      setError('Failed to save configuration');
      return false;
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
