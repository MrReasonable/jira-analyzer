import { vi } from 'vitest'
import { FormStep } from '~types/configurationForm'

// Define the steps information
export const FORM_STEPS = [
  {
    id: 'credentials' as FormStep,
    title: 'Jira Credentials',
    description: 'Connect to your Jira instance',
  },
  {
    id: 'project' as FormStep,
    title: 'Project Selection',
    description: 'Select a Jira project',
  },
]

/**
 * Mock implementation of the useFormSteps hook for testing
 */
export function useFormSteps() {
  let currentStepValue: FormStep = 'credentials'

  const currentStep = vi.fn(() => currentStepValue)
  const setCurrentStep = vi.fn((step: FormStep) => {
    currentStepValue = step
  })

  // Check if current step is the first step
  const isFirstStep = vi.fn(() => {
    return currentStepValue === FORM_STEPS[0].id
  })

  // Check if current step is the last step
  const isLastStep = vi.fn(() => {
    // Simply check if the current step is the last one in the steps array
    return currentStepValue === FORM_STEPS[FORM_STEPS.length - 1].id
  })

  // Move to the next step
  const goToNextStep = vi.fn(() => {
    const currentIndex = FORM_STEPS.findIndex(step => step.id === currentStepValue)
    if (currentIndex < FORM_STEPS.length - 1) {
      currentStepValue = FORM_STEPS[currentIndex + 1].id
    }
  })

  // Move to the previous step
  const goToPreviousStep = vi.fn(() => {
    const currentIndex = FORM_STEPS.findIndex(step => step.id === currentStepValue)
    if (currentIndex > 0) {
      currentStepValue = FORM_STEPS[currentIndex - 1].id
    }
  })

  return {
    currentStep,
    setCurrentStep,
    isFirstStep,
    isLastStep,
    goToNextStep,
    goToPreviousStep,
    FORM_STEPS,
  }
}
