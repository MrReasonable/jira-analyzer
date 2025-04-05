import { jiraApi } from '@api/jiraApi'
import { logger } from '@utils/logger'
import { handleApiRequest } from '@utils/apiErrorHandler'
import { createConfigFromFormData } from '@utils/formValidators'
import { FormData, FormStep } from '~types/configurationForm'
import type { JiraConfiguration } from '@api/jiraApi'

/**
 * Hook for form submission
 */
export function useFormSubmission(
  formData: () => FormData,
  setError: (error: string | null) => void,
  validateStep: (step: FormStep) => boolean,
  setCurrentStep: (step: FormStep) => void,
  isLastStep: () => boolean,
  goToNextStep: () => Promise<void>,
  checkNameAvailability: (name: string) => Promise<void>,
  isNameAvailable: () => boolean | null,
  onConfigurationSaved: (configName: string) => void,
  initialConfig?: JiraConfiguration
) {
  // Handle form submission
  const handleSubmit = async (e: Event): Promise<void> => {
    e.preventDefault()
    setError(null)

    // Validate the current step
    if (!validateStep(formData().name as unknown as FormStep)) {
      return
    }

    // If we're not on the last step, move to the next step
    if (!isLastStep()) {
      await goToNextStep()
      return
    }

    // Final validation of all steps
    const steps: FormStep[] = ['credentials', 'project']
    for (const step of steps) {
      if (!validateStep(step)) {
        setCurrentStep(step)
        return
      }
    }

    // Check name availability one more time before submitting if it's a new configuration
    if (!initialConfig && isNameAvailable() !== true) {
      try {
        await checkNameAvailability(formData().name)
        if (isNameAvailable() === false) {
          setError('A configuration with this name already exists. Please choose a different name.')
          setCurrentStep('credentials')
          return
        }
      } catch (err) {
        logger.error('Failed to check name availability before submission:', err)
        // Continue with submission even if the check fails
      }
    }

    const config = createConfigFromFormData(formData())

    // Use the API request handler
    if (initialConfig) {
      await handleApiRequest(
        () => jiraApi.updateConfiguration(config.name, config),
        'Failed to update configuration',
        setError,
        () => {
          onConfigurationSaved(config.name)
        }
      )
    } else {
      await handleApiRequest(
        () => jiraApi.createConfiguration(config),
        'Failed to create configuration',
        setError,
        () => {
          onConfigurationSaved(config.name)
        }
      )
    }
  }

  return {
    handleSubmit,
  }
}
