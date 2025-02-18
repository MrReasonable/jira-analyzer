import React, { useState, useCallback, useEffect } from "react";
import ConfigurationForm from "./form/ConfigurationForm";
import AnalysisResults from "./analysis/AnalysisResults";
import TeamConfigManager from "./TeamConfigManager";
import TimeRangeSelector from "./TimeRangeSelector";
import ConfigurationSelector from "./ConfigurationSelector";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { useConfiguration } from "@/hooks/useConfiguration";
import { useAnalysis } from "@/hooks/useAnalysis";
import { fetchTeamConfigs } from "@/services/api";

const JiraCycleTimeAnalyzer = () => {
  const {
    config,
    setConfig,
    currentConfigName,
    currentConfigId,
    handleConfigSelect,
    validateConfig,
    saveConfig,
    setError: setConfigError
  } = useConfiguration();

  const {
    analysisData,
    error,
    loading,
    activeTab,
    setActiveTab,
    runAnalysis,
    clearError
  } = useAnalysis();

  const [configs, setConfigs] = useState([]);
  const [configLoadError, setConfigLoadError] = useState(null);

  const [timeRange, setTimeRange] = useState(() => {
    const now = new Date();
    const quarterAgo = new Date();
    quarterAgo.setDate(quarterAgo.getDate() - 90); // 90 days = ~1 quarter
    return {
      timePreset: "quarter",
      startDate: quarterAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    };
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const result = await fetchTeamConfigs();
      if (result.status === 'success') {
        setConfigs(result.data);
      } else {
        setConfigLoadError('Failed to load configurations');
      }
    } catch (err) {
      setConfigLoadError('Failed to load configurations');
    }
  };

  const handleTimeRangeChange = useCallback((newTimeRange) => {
    setTimeRange(newTimeRange);
  }, []); // No dependencies needed since setTimeRange is stable

  const handleAnalyze = async () => {
    const validationError = validateConfig(config);
    if (validationError) {
      setConfigError(validationError);
      return;
    }
    await runAnalysis(config, timeRange);
  };

  const renderTabContent = () => {
    if (activeTab === "config") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Configuration Management */}
          <div className="lg:col-span-1 space-y-6">
            <TimeRangeSelector 
              defaultValue={timeRange}
              onTimeRangeChange={handleTimeRangeChange} 
            />
            <TeamConfigManager
              onConfigSelect={handleConfigSelect}
              currentConfig={config}
              currentConfigName={currentConfigName}
              onSaveConfig={async (name) => {
                if (name) {
                  await saveConfig(name);
                }
                fetchConfigs();
              }}
              configs={configs}
              error={configLoadError}
            />
          </div>

          {/* Right Column - Configuration Form */}
          <div className="lg:col-span-2">
            <ConfigurationForm
              config={config}
              onConfigChange={setConfig}
              onAnalyze={handleAnalyze}
              onSaveConfig={async (name) => {
                await saveConfig(name);
                fetchConfigs();
              }}
              loading={loading}
              error={error}
              onErrorClear={clearError}
              currentConfigName={currentConfigName}
              currentConfigId={currentConfigId}
            />
          </div>
        </div>
      );
    }

    if (activeTab === "analysis" && analysisData) {
      return (
        <AnalysisResults
          data={analysisData}
          jiraUrl={config.jiraUrl}
          timeRange={timeRange}
        />
      );
    }

    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Jira Cycle Time Analyzer</h1>

        {/* Configuration Selector */}
        <ConfigurationSelector
          onConfigSelect={handleConfigSelect}
          currentConfigName={currentConfigName}
          configs={configs}
          error={configLoadError}
        />

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("config")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "config"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Configuration
            </button>
            <button
              onClick={() => setActiveTab("analysis")}
              disabled={!analysisData}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                !analysisData
                  ? "border-transparent text-gray-300 cursor-not-allowed"
                  : activeTab === "analysis"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Analysis
            </button>
          </nav>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8" onClose={clearError}>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {renderTabContent()}
      </div>
    </div>
  );
};

export default JiraCycleTimeAnalyzer;
