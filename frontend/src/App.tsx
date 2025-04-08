import { Component, onMount, createSignal, Show, createEffect } from 'solid-js'
import { useJiraMetrics } from '@hooks/useJiraMetrics'
import { useJiraConfigurations } from '@hooks/useJiraConfigurations'
import { logger } from '@utils/logger'
import { jiraApi, JiraConfiguration } from '@api/jiraApi'
import { useWorkflowManager } from '@hooks/useWorkflowManager'
import { useConfigSaver } from '@hooks/useConfigSaver'
import { ConfigurationSection } from '@components/ConfigurationSection'
import { AnalyticsSection } from '@components/AnalyticsSection'
import { ConfigurationDialog } from '@components/ConfigurationDialog'
import { NotificationManager } from '@components/NotificationManager'

/**
 * Main application component
 */
const App: Component = () => {
  logger.info('Initializing Jira Metrics application')

  // Use our custom hooks for state management
  const metricsState = useJiraMetrics()
  const configState = useJiraConfigurations(jql => {
    logger.debug('JQL updated from configuration', { jql })
    metricsState.setJql(jql)
  })

  // Track if metrics have been fetched
  const [metricsAvailable, setMetricsAvailable] = createSignal(false)

  // Track the current active configuration
  const [activeConfig, setActiveConfig] = createSignal<JiraConfiguration | null>(null)

  // Use our custom hooks for workflow and configuration management
  const workflowManager = useWorkflowManager(activeConfig)
  const configSaver = useConfigSaver(
    activeConfig,
    workflowManager.updateConfigWithWorkflowStates,
    configState,
    workflowManager.setEditingWorkflow
  )

  // Update metrics config name when configuration is selected
  createEffect(() => {
    const selectedConfig = configState.selectedConfig()
    logger.debug('Selected configuration changed', { name: selectedConfig })
    metricsState.setConfigName(selectedConfig)

    // Load the selected configuration details
    if (selectedConfig) {
      jiraApi
        .getConfiguration(selectedConfig)
        .then(config => {
          setActiveConfig(config)
          workflowManager.setWorkflowStates(workflowManager.configToWorkflowStates(config))
        })
        .catch(err => {
          logger.error('Failed to load configuration details', err)
        })
    } else {
      setActiveConfig(null)
      workflowManager.setWorkflowStates([])
    }
  })

  onMount(() => {
    logger.info('Application mounted')
  })

  // Function to handle analyze button click
  const handleAnalyze = async () => {
    try {
      await metricsState.fetchMetrics()
      setMetricsAvailable(true)
    } catch (err) {
      logger.error('Failed to fetch metrics', err)
    }
  }

  return (
    <div class="min-h-screen p-6">
      <NotificationManager />
      <div class="mx-auto max-w-7xl space-y-6">
        <h1 class="mb-6 text-3xl font-bold text-gray-800">Jira Analyzer</h1>

        <ConfigurationSection
          configurations={configState.configurations}
          loading={configState.loading}
          selectedConfig={configState.selectedConfig}
          onSelect={name => {
            configState.handleConfigSelect(name)
            return Promise.resolve()
          }}
          onEdit={configState.handleConfigEdit}
          onDelete={name => configState.handleConfigDelete(name)}
          onAddClick={() => configState.setShowConfigForm(true)}
          activeConfig={activeConfig}
          workflowStates={workflowManager.workflowStates}
          setWorkflowStates={workflowManager.setWorkflowStates}
          editingWorkflow={workflowManager.editingWorkflow}
          setEditingWorkflow={workflowManager.setEditingWorkflow}
          saveCurrentConfig={configSaver.saveCurrentConfig}
          savingConfig={configSaver.savingConfig}
          fetchWorkflowStatesFromJira={workflowManager.fetchWorkflowStatesFromJira}
          loadingWorkflow={workflowManager.loadingWorkflow}
          workflowError={workflowManager.workflowError}
          jql={metricsState.jql}
          onJqlChange={metricsState.setJql}
          onAnalyze={handleAnalyze}
          isLoading={metricsState.loading}
          configName={configSaver.configName}
          onConfigNameChange={configSaver.setConfigName}
          saveNewConfig={configSaver.saveNewConfig}
        />

        <Show when={metricsAvailable()}>
          <AnalyticsSection
            leadTimeData={metricsState.leadTimeData}
            throughputData={metricsState.throughputData}
            wipData={metricsState.wipData}
            cfdData={metricsState.cfdData}
            cycleTimeData={metricsState.cycleTimeData}
            loading={metricsState.loading}
          />
        </Show>
      </div>

      <ConfigurationDialog
        isOpen={configState.showConfigForm}
        onOpenChange={configState.setShowConfigForm}
        configToEdit={configState.configToEdit}
        onConfigurationSaved={configName => configState.handleConfigSaved(configName)}
      />
    </div>
  )
}

export default App
