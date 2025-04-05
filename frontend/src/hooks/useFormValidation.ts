import { createSignal } from 'solid-js'
import { FormData, FormStep, StepError } from '../types/configurationForm'
import { createStepValidators } from '../utils/formValidators'

/**
 * Hook for form validation
 */
export function useFormValidation(
  formData: () => FormData,
  isNameAvailable: () => boolean | null,
  isEditMode: boolean
) {
  const [error, setError] = createSignal<string | null>(null)
  const [stepErrors, setStepErrors] = createSignal<StepError>({
    credentials: null,
    project: null,
  })

  // Create step validators
  const { validateCredentialsStep, validateProjectStep } = createStepValidators(
    formData,
    isNameAvailable,
    isEditMode
  )

  // Validate the current step and return true if valid
  const validateStep = (step: FormStep): boolean => {
    let validation: { isValid: boolean; errorMessage: string | null } = {
      isValid: true,
      errorMessage: null,
    }

    switch (step) {
      case 'credentials':
        validation = validateCredentialsStep()
        break
      case 'project':
        validation = validateProjectStep()
        break
    }

    if (!validation.isValid) {
      // Set a default error message if none is provided
      const errorMessage = validation.errorMessage || 'Validation failed'
      setStepErrors(prev => ({ ...prev, [step]: errorMessage }))
      return false
    } else {
      setStepErrors(prev => ({ ...prev, [step]: null }))
      return true
    }
  }

  return {
    error,
    setError,
    stepErrors,
    setStepErrors,
    validateStep,
  }
}
