import { FormData, FormStep, StepError } from '../types/configurationForm'
import { jiraApi, JiraConfiguration } from '../api/jiraApi'

export interface UseFormSubmissionHandlerProps {
  formData: () => FormData
  setError: (error: string | null) => void
  validateStep: (step: FormStep) => boolean
  currentStep: () => FormStep
  setCurrentStep: (step: FormStep) => void
  isLastStep: () => boolean
  goToNextStep: () => Promise<void>
  isNameAvailable: () => boolean | null
  checkNameAvailability: (name: string) => Promise<void>
  onConfigurationSaved: (name: string) => void
  initialConfig?: JiraConfiguration
  setStepErrors: (updater: (prev: StepError) => StepError) => void
}

/**
 * Hook for handling form submission
 */
export function useFormSubmissionHandler({
  formData,
  setError,
  validateStep,
  currentStep,
  setCurrentStep,
  isLastStep,
  goToNextStep,
  isNameAvailable,
  checkNameAvailability,
  onConfigurationSaved,
  initialConfig,
  setStepErrors,
}: UseFormSubmissionHandlerProps) {
  /**
   * Handle form submission
   */
  const handleSubmit = async (event: Event): Promise<void> => {
    event.preventDefault()

    // Validate the current step
    if (!validateStep(currentStep())) {
      return
    }

    // If we're not on the last step, go to the next step
    if (!isLastStep()) {
      await goToNextStep()
      return
    }

    // If we're in edit mode, update the configuration
    if (initialConfig) {
      try {
        const updatedConfig = await jiraApi.updateConfiguration(formData().name, {
          name: formData().name,
          jira_server: formData().jira_server,
          jira_email: formData().jira_email,
          jira_api_token: formData().jira_api_token,
          jql_query: formData().jql_query,
          project_key: formData().project_key,
          workflow_states: initialConfig?.workflow_states || [],
          lead_time_start_state: initialConfig?.lead_time_start_state || '',
          lead_time_end_state: initialConfig?.lead_time_end_state || '',
          cycle_time_start_state: initialConfig?.cycle_time_start_state || '',
          cycle_time_end_state: initialConfig?.cycle_time_end_state || '',
        })

        onConfigurationSaved(updatedConfig.name)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update configuration'
        setError(errorMessage)
      }
      return
    }

    // Otherwise, create a new configuration
    try {
      // Check if the name is available
      await checkNameAvailability(formData().name)

      if (!isNameAvailable()) {
        setStepErrors(prev => ({
          ...prev,
          credentials: 'A configuration with this name already exists',
        }))
        setCurrentStep('credentials')
        return
      }

      // Create the configuration
      const newConfig = await jiraApi.createConfiguration({
        name: formData().name,
        jira_server: formData().jira_server,
        jira_email: formData().jira_email,
        jira_api_token: formData().jira_api_token,
        jql_query: formData().jql_query,
        project_key: formData().project_key,
        workflow_states: [],
        lead_time_start_state: '',
        lead_time_end_state: '',
        cycle_time_start_state: '',
        cycle_time_end_state: '',
      })

      onConfigurationSaved(newConfig.name)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create configuration'
      setError(errorMessage)
    }
  }

  return {
    handleSubmit,
  }
}
