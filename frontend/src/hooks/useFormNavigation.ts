import { FormStep, StepError } from '../types/configurationForm'
import { logger } from '../utils/logger'

export interface UseFormNavigationProps {
  currentStep: () => FormStep
  setCurrentStep: (step: FormStep) => void
  isFirstStep: () => boolean
  baseGoToNextStep: () => void
  validateStep: (step: FormStep) => boolean
  credentialsValid: () => boolean
  setCredentialsValid: (valid: boolean) => void
  validateCredentials: (onSuccess?: () => void) => Promise<void>
  stepErrors: () => StepError
  setStepErrors: (updater: (prev: StepError) => StepError) => void
}

/**
 * Hook for managing form navigation
 */
export function useFormNavigation({
  currentStep,
  setCurrentStep,
  isFirstStep,
  baseGoToNextStep,
  validateStep,
  credentialsValid,
  setCredentialsValid,
  validateCredentials,
  stepErrors,
  setStepErrors,
}: UseFormNavigationProps) {
  /**
   * Go to previous step
   */
  const goToPreviousStep = () => {
    if (isFirstStep()) return

    if (currentStep() === 'project') {
      setCurrentStep('credentials')
    }
  }

  /**
   * Go to next step
   */
  const goToNextStep = async (): Promise<void> => {
    const current = currentStep()

    // Always validate the current step first
    if (!validateStep(current)) {
      // If validation fails, make sure we set an error message
      if (current === 'credentials' && !stepErrors().credentials) {
        setStepErrors(prev => ({ ...prev, credentials: 'Please fill in all required fields' }))
      }
      return
    }

    // If moving from credentials to project step, validate credentials first
    if (current === 'credentials') {
      if (!credentialsValid()) {
        try {
          // We need to validate credentials before moving to the next step
          // But we should NOT move to the next step in the callback
          // Instead, we'll move to the next step only if validation succeeds
          await validateCredentials(() => {
            setCredentialsValid(true)
            // Do NOT set current step here - we'll do it after validation succeeds
          })

          // If we get here, validation succeeded, so we can move to the next step
          setCurrentStep('project')
        } catch (err) {
          // If validation fails, stay on the credentials step
          logger.error('Validation failed, staying on credentials step', err)
          // Make sure we don't proceed to the next step
          setCurrentStep('credentials') // Explicitly set the step back to credentials
          return
        }
        return
      } else {
        // Credentials are already valid, move to the next step
        setCurrentStep('project')
      }
    } else {
      // For other steps, just move to the next step
      baseGoToNextStep()
    }
  }

  return {
    goToNextStep,
    goToPreviousStep,
  }
}
