import { createSignal, createEffect } from 'solid-js';
import { jiraApi, JiraConfigurationList } from '../api/jiraApi';

export function useJiraConfigurations(onJqlChange: (jql: string) => void) {
  const [configurations, setConfigurations] = createSignal<JiraConfigurationList[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<Error | null>(null);
  const [selectedConfig, setSelectedConfig] = createSignal<string | undefined>();
  const [showConfigForm, setShowConfigForm] = createSignal(false);

  const loadConfigurations = async () => {
    setLoading(true);
    setError(null);

    try {
      const configs = await jiraApi.listConfigurations();
      setConfigurations(configs);
    } catch (err) {
      console.error('Failed to load configurations:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSelect = async (name: string) => {
    try {
      const config = await jiraApi.getConfiguration(name);
      setSelectedConfig(name);
      onJqlChange(config.jql_query);
    } catch (err) {
      console.error('Failed to load configuration:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleConfigDelete = async (name: string) => {
    try {
      await jiraApi.deleteConfiguration(name);
      if (selectedConfig() === name) {
        setSelectedConfig(undefined);
      }
      // Refresh the configurations list
      await loadConfigurations();
    } catch (err) {
      console.error('Failed to delete configuration:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleConfigSaved = () => {
    setShowConfigForm(false);
    // Refresh the configurations list
    loadConfigurations();
  };

  // Load configurations on initialization
  createEffect(() => {
    loadConfigurations();
  });

  return {
    configurations,
    loading,
    error,
    selectedConfig,
    setSelectedConfig,
    loadConfigurations,
    handleConfigSelect,
    handleConfigDelete,
    showConfigForm,
    setShowConfigForm,
    handleConfigSaved,
  };
}
