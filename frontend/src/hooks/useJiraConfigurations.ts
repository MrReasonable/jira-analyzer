import { createSignal, createEffect } from 'solid-js'
import { jiraApi, JiraConfigurationList, JiraConfiguration } from '@api/jiraApi'
import { logger } from '@utils/logger'
import { showNotification } from '@components/NotificationManager'

export function useJiraConfigurations(onJqlChange: (jql: string) => void) {
  const [configurations, setConfigurations] = createSignal<JiraConfigurationList[]>([])
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<Error | null>(null)
  const [selectedConfig, setSelectedConfig] = createSignal<string | undefined>()
  const [showConfigForm, setShowConfigForm] = createSignal(false)
  const [configToEdit, setConfigToEdit] = createSignal<JiraConfiguration | undefined>()

  const loadConfigurations = async () => {
    setLoading(true)
    setError(null)

    logger.debug('Loading Jira configurations')
    try {
      const configs = await jiraApi.listConfigurations()
      setConfigurations(configs)
      logger.debug('Jira configurations loaded', { count: configs.length })
    } catch (err) {
      logger.error('Failed to load configurations:', err)
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }

  const handleConfigSelect = async (name: string) => {
    logger.debug('Selecting Jira configuration', { name })
    try {
      const config = await jiraApi.getConfiguration(name)
      setSelectedConfig(name)
      onJqlChange(config.jql_query)
      logger.info('Jira configuration selected', { name })
      showNotification(`Configuration "${name}" loaded`, 'info')
    } catch (err) {
      logger.error('Failed to load configuration:', err)
      setError(err instanceof Error ? err : new Error(String(err)))
      showNotification(
        `Failed to load configuration: ${err instanceof Error ? err.message : String(err)}`,
        'error'
      )
    }
  }

  const handleConfigDelete = async (name: string): Promise<boolean> => {
    logger.debug('Deleting Jira configuration', { name })
    try {
      await jiraApi.deleteConfiguration(name)

      // Clear selected config if it's the one being deleted
      if (selectedConfig() === name) {
        setSelectedConfig(undefined)
        logger.debug('Cleared selected configuration')
      }

      // Update the configurations list immediately to reflect the deletion
      setConfigurations(prev => prev.filter(config => config.name !== name))

      // Also refresh from the server to ensure consistency
      await loadConfigurations()

      logger.info('Jira configuration deleted', { name })
      showNotification(`Configuration "${name}" deleted`, 'success')
      return true
    } catch (err) {
      logger.error('Failed to delete configuration:', err)
      setError(err instanceof Error ? err : new Error(String(err)))
      showNotification(
        `Failed to delete configuration: ${err instanceof Error ? err.message : String(err)}`,
        'error'
      )

      // We'll display the error through the error signal, no need for alert
      // The error will be shown in the UI through the error accessor

      return false
    }
  }

  const handleConfigEdit = async (name: string) => {
    logger.debug('Editing Jira configuration', { name })
    try {
      const config = await jiraApi.getConfiguration(name)
      setConfigToEdit(config)
      setShowConfigForm(true)
      logger.info('Loaded configuration for editing', { name })
    } catch (err) {
      logger.error('Failed to load configuration for editing:', err)
      setError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  const handleConfigSaved = async (configName: string) => {
    logger.debug('Configuration saved, refreshing list and selecting new config', {
      name: configName,
    })
    setShowConfigForm(false)
    setConfigToEdit(undefined)

    // Refresh the configurations list
    await loadConfigurations()

    // Automatically select the newly created configuration
    await handleConfigSelect(configName)

    logger.info('New configuration selected automatically', { name: configName })
    showNotification(`Configuration "${configName}" saved and selected`, 'success')
  }

  // Load configurations on initialization
  createEffect(() => {
    // Immediately load configurations when the component mounts
    loadConfigurations()

    // Set up a periodic refresh to ensure configurations are up-to-date
    const refreshInterval = setInterval(() => {
      loadConfigurations()
    }, 30000) // Refresh every 30 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(refreshInterval)
  })

  return {
    configurations,
    loading,
    error,
    selectedConfig,
    setSelectedConfig,
    loadConfigurations,
    handleConfigSelect,
    handleConfigDelete,
    handleConfigEdit,
    showConfigForm,
    setShowConfigForm,
    handleConfigSaved,
    configToEdit,
    setConfigToEdit,
  }
}
