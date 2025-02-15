import React, { useState } from "react";
import ConfigurationForm from "./ConfigurationForm";
import AnalysisResults from "./AnalysisResults";
import TeamConfigManager from "./TeamConfigManager";
import TimeRangeSelector from "./TimeRangeSelector";
import ConfigurationSelector from "./ConfigurationSelector";
import { Alert, AlertDescription } from "@/components/ui/Alert";

const JiraCycleTimeAnalyzer = () => {
  const [config, setConfig] = useState({
    jiraUrl: "",
    username: "",
    apiToken: "",
    jqlQuery: "",
    statuses: ["To Do", "In Progress", "Code Review", "QA", "Done"],
    expectedPath: ["To Do", "In Progress", "Code Review", "QA", "Done"],
    endStates: ["Done"], // Default end state
    projectKey: "",
    projectName: "",
    filterId: "",
    filterName: "",
    filterJql: "",
  });

  const [currentConfigName, setCurrentConfigName] = useState("");
  const [currentConfigId, setCurrentConfigId] = useState(null);

  const [timeRange, setTimeRange] = useState({
    timePreset: "two_weeks",
    startDate: null,
    endDate: null,
  });

  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTimeRangeChange = (newTimeRange) => {
    setTimeRange(newTimeRange);
  };

  const handleConfigSelect = (selectedConfig) => {
    setConfig({
      jiraUrl: selectedConfig.jiraUrl,
      username: selectedConfig.username,
      apiToken: selectedConfig.apiToken,
      statuses: selectedConfig.statuses,
      expectedPath: selectedConfig.expectedPath,
      endStates: selectedConfig.endStates || ['Done'],
      // Use filterJql if it exists, otherwise use defaultJql or empty string
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
    setAnalysisData(null);
  };

  const handleSaveConfig = async (configToSave) => {
    try {
      const url = configToSave.id
        ? `/api/team-configs/${configToSave.id}`
        : "/api/team-configs";

      const method = configToSave.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(configToSave),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save configuration");
      }

      const data = await response.json();

      if (data.status === "success") {
        setError(null);
        // Update current config details if this was an update
        if (configToSave.id) {
          setCurrentConfigName(configToSave.name);
        }
        alert(
          configToSave.id
            ? "Configuration updated successfully!"
            : "Configuration saved successfully!"
        );
      } else {
        setError(data.message || "Failed to save configuration");
      }
    } catch (err) {
      setError(err.message || "Failed to save configuration");
    }
  };

  const validateInputs = () => {
    if (!config.jiraUrl) return "Jira URL is required";
    if (!config.username) return "Username is required";
    if (!config.apiToken) return "API Token is required";
    if (!config.jqlQuery && !config.filterJql) return "JQL Query is required";
    if (!config.statuses.length) return "At least one status is required";
    if (!config.expectedPath.length) return "Expected path cannot be empty";
    
    // Validate URL format
    try {
      new URL(config.jiraUrl);
    } catch {
      return "Invalid Jira URL format";
    }
    
    return null;
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...config,
          ...timeRange,
          expectedPath: config.expectedPath,
          doneStates: config.endStates || [], // Use end states selected by user
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to analyze data");
      }

      if (data.status === "warning") {
        setError(data.message);
        setAnalysisData(data.data);
      } else if (data.status === "success") {
        setAnalysisData(data.data);
      } else {
        throw new Error(data.message || "Unknown error occurred");
      }
    } catch (err) {
      setError(err.message);
      setAnalysisData(null);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Jira Cycle Time Analyzer</h1>

        {/* Configuration Selector */}
        <ConfigurationSelector
          onConfigSelect={handleConfigSelect}
          currentConfigName={currentConfigName}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Configuration Management */}
          <div className="lg:col-span-1 space-y-6">
            <TimeRangeSelector onTimeRangeChange={handleTimeRangeChange} />

            <TeamConfigManager
              onConfigSelect={handleConfigSelect}
              currentConfig={config}
              currentConfigName={currentConfigName}
            />
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <ConfigurationForm
              config={config}
              onConfigChange={setConfig}
              onAnalyze={handleAnalyze}
              onSaveConfig={handleSaveConfig}
              loading={loading}
              error={error}
              onErrorClear={clearError}
              currentConfigName={currentConfigName}
              currentConfigId={currentConfigId}
            />

            {analysisData && (
              <AnalysisResults
                data={analysisData}
                jiraUrl={config.jiraUrl}
                timeRange={timeRange}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JiraCycleTimeAnalyzer;
