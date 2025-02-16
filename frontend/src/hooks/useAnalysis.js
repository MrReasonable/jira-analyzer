import { useState } from 'react';
import { analyzeData } from '@/services/api';

export const useAnalysis = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('config');

  const runAnalysis = async (config, timeRange) => {
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeData(config, timeRange);
      
      if (result.status === "warning") {
        setError(result.message);
        setAnalysisData(result.data);
        setActiveTab("analysis");
      } else if (result.status === "success") {
        setAnalysisData(result.data);
        setActiveTab("analysis");
      } else {
        throw new Error(result.message || "Unknown error occurred");
      }
    } catch (err) {
      setError(err.message);
      setAnalysisData(null);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    analysisData,
    error,
    loading,
    activeTab,
    setActiveTab,
    runAnalysis,
    clearError
  };
};
