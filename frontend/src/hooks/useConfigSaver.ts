import { createSignal } from 'solid-js'
import { JiraConfiguration } from '@api/jiraApi'
import { jiraApi } from '@api/jiraApi'
import { logger } from '@utils/logger'
import { showNotification } from '@components/NotificationManager'

/**
 * Custom hook for managing configuration saving
 */
export const useConfigSaver = (
  activeConfig: () => JiraConfiguration | null,
  updateConfigWithWorkflowStates: (config: JiraConfiguration) => JiraConfiguration,
  configState: {
    loadConfigurations: () => Promise<void>
    handleConfigSelect: (name: string) => Promise<void>
  },
  setEditingWorkflow: (editing: boolean) => void
) => {
  const [savingConfig, setSavingConfig] = createSignal(false)
  const [configName, setConfigName] = createSignal('')

  // Function to save the current configuration
  const saveCurrentConfig = async () => {
    if (!activeConfig()) return

    setSavingConfig(true)

    try {
      const config = updateConfigWithWorkflowStates(activeConfig()!)

      await jiraApi.updateConfiguration(config.name, config)
      logger.info('Configuration updated successfully', { name: config.name })

      // Show success notification
      showNotification(`Configuration "${config.name}" updated successfully`, 'success')

      // Refresh configurations list
      await configState.loadConfigurations()

      // Exit workflow editing mode
      setEditingWorkflow(false)
    } catch (err) {
      logger.error('Failed to save configuration', err)
    } finally {
      setSavingConfig(false)
    }
  }

  // Function to save a new configuration
  const saveNewConfig = async () => {
    if (!activeConfig() || !configName()) return

    setSavingConfig(true)

    try {
      const config = updateConfigWithWorkflowStates({ ...activeConfig()! })
      config.name = configName()

      await jiraApi.createConfiguration(config)
      logger.info('New configuration created successfully', { name: config.name })

      // Show success notification
      showNotification(`Configuration "${config.name}" created successfully`, 'success')

      // Refresh configurations list and select the new config
      await configState.loadConfigurations()
      await configState.handleConfigSelect(config.name)

      // Reset the config name
      setConfigName('')
    } catch (err) {
      logger.error('Failed to create new configuration', err)
    } finally {
      setSavingConfig(false)
    }
  }

  return {
    savingConfig,
    configName,
    setConfigName,
    saveCurrentConfig,
    saveNewConfig,
  }
}
