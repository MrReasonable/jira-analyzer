import { createSignal } from 'solid-js'
import { FormStep } from '../types/configurationForm'

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
 * Hook for managing form steps
 */
export function useFormSteps() {
  const [currentStep, setCurrentStep] = createSignal<FormStep>('credentials')

  // Check if current step is the first step
  const isFirstStep = () => {
    return currentStep() === FORM_STEPS[0].id
  }

  // Check if current step is the last step
  const isLastStep = () => {
    // Simply check if the current step is the last one in the steps array
    return currentStep() === FORM_STEPS[FORM_STEPS.length - 1].id
  }

  // Move to the next step
  const goToNextStep = () => {
    const currentIndex = FORM_STEPS.findIndex(step => step.id === currentStep())
    if (currentIndex < FORM_STEPS.length - 1) {
      setCurrentStep(FORM_STEPS[currentIndex + 1].id)
    }
  }

  // Move to the previous step
  const goToPreviousStep = () => {
    const currentIndex = FORM_STEPS.findIndex(step => step.id === currentStep())
    if (currentIndex > 0) {
      setCurrentStep(FORM_STEPS[currentIndex - 1].id)
    }
  }

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
