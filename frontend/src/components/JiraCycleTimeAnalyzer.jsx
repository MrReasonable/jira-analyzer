import React, { useState } from "react";
import ConfigurationForm from "./ConfigurationForm";
import AnalysisResults from "./analysis/AnalysisResults";
import TeamConfigManager from "./TeamConfigManager";
import TimeRangeSelector from "./TimeRangeSelector";
import ConfigurationSelector from "./ConfigurationSelector";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { useConfiguration } from "@/hooks/useConfiguration";
import { useAnalysis } from "@/hooks/useAnalysis";

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

  const [timeRange, setTimeRange] = useState({
    timePreset: "quarter",
    startDate: null,
    endDate: null,
  });

  const handleTimeRangeChange = (newTimeRange) => {
    setTimeRange(newTimeRange);
  };

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
            <TimeRangeSelector onTimeRangeChange={handleTimeRangeChange} />
            <TeamConfigManager
              onConfigSelect={handleConfigSelect}
              currentConfig={config}
              currentConfigName={currentConfigName}
              onSaveConfig={saveConfig}
            />
          </div>

          {/* Right Column - Configuration Form */}
          <div className="lg:col-span-2">
            <ConfigurationForm
              config={config}
              onConfigChange={setConfig}
              onAnalyze={handleAnalyze}
              onSaveConfig={saveConfig}
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
