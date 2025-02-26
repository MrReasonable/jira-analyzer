import { Component, onMount } from 'solid-js';
import { Dialog } from '@kobalte/core';
import './index.css';
import { ConfigurationForm } from './components/ConfigurationForm';
import { useJiraMetrics } from './hooks/useJiraMetrics';
import { useJiraConfigurations } from './hooks/useJiraConfigurations';
import { JqlInput } from './components/JqlInput';
import { MetricsSection } from './components/MetricsSection';
import { ConfigurationsHeader } from './components/ConfigurationsHeader';
import { logger } from './utils/logger';

const App: Component = () => {
  logger.info('Initializing Jira Metrics application');

  // Use our custom hooks for state management
  const metricsState = useJiraMetrics();
  const configState = useJiraConfigurations(jql => {
    logger.debug('JQL updated from configuration', { jql });
    metricsState.setJql(jql);
  });

  onMount(() => {
    logger.info('Application mounted');
  });

  return (
    <div class="min-h-screen p-6">
      <div class="mx-auto max-w-7xl space-y-6">
        <ConfigurationsHeader
          configurations={configState.configurations}
          loading={configState.loading}
          selectedConfig={configState.selectedConfig}
          onSelect={configState.handleConfigSelect}
          onDelete={configState.handleConfigDelete}
          onAddClick={() => configState.setShowConfigForm(true)}
        />

        <JqlInput
          jql={metricsState.jql}
          onJqlChange={metricsState.setJql}
          onAnalyze={metricsState.fetchMetrics}
          loading={metricsState.loading}
        />

        <MetricsSection
          loading={metricsState.loading}
          leadTimeData={metricsState.leadTimeData}
          throughputData={metricsState.throughputData}
          wipData={metricsState.wipData}
          cfdData={metricsState.cfdData}
          cycleTimeData={metricsState.cycleTimeData}
        />
      </div>

      <Dialog.Root open={configState.showConfigForm()} onOpenChange={configState.setShowConfigForm}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 bg-black/50" />
          <Dialog.Content class="fixed left-1/2 top-1/2 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white p-6">
            <Dialog.Title class="mb-4 text-2xl font-bold">Add Configuration</Dialog.Title>
            <ConfigurationForm onConfigurationSaved={configState.handleConfigSaved} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default App;
