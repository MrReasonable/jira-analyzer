import { createEffect, createMemo, createSignal } from 'solid-js'
import {
  UseConfigurationFormProps,
  UseConfigurationFormReturn,
  StepError,
} from '~types/configurationForm'
import { useFormSteps } from './useFormSteps'
import { useFormDataManager } from './useFormDataManager'
import { logger } from '@utils/logger'
import { useNameAvailability } from './useNameAvailability'
import { useCredentialsValidation } from './useCredentialsValidation'
import { useProjectsManagement } from './useProjectsManagement'
import { useStepValidation } from './useStepValidation'
import { useFormNavigation } from './useFormNavigation'
import { useFormSubmissionHandler } from './useFormSubmissionHandler'

/**
 * Custom hook for managing configuration form state and logic
 *
 * This hook composes several smaller hooks to handle different aspects of the form:
 * - useFormSteps: Manages the multi-step form navigation
 * - useFormDataManager: Manages the form data
 * - useNameAvailability: Checks if a configuration name is available
 * - useCredentialsValidation: Validates Jira credentials
 * - useProjectsManagement: Manages Jira projects
 * - useStepValidation: Validates form steps
 * - useFormNavigation: Handles form navigation
 * - useFormSubmissionHandler: Handles form submission
 */
export function useConfigurationForm({
  initialConfig,
  onConfigurationSaved,
}: UseConfigurationFormProps): UseConfigurationFormReturn {
  // Initialize form steps
  const {
    currentStep,
    setCurrentStep,
    isFirstStep,
    isLastStep,
    goToNextStep: baseGoToNextStep,
    // We don't use this directly, but we'll rename it to avoid linting errors
    goToPreviousStep: _baseGoToPreviousStep,
  } = useFormSteps()

  // Initialize form data
  const { formData, updateField } = useFormDataManager(initialConfig)

  // Initialize state signals
  const [error, setError] = createSignal<string | null>(null)
  const [stepErrors, setStepErrors] = createSignal<StepError>({
    credentials: null,
    project: null,
  })

  // Set edit mode
  const isEditMode = !!initialConfig
  const isEditModeMemo = createMemo(() => isEditMode)

  // Initialize name availability
  const { isNameAvailable, setIsNameAvailable, isCheckingName, checkNameAvailability } =
    useNameAvailability(initialConfig)

  // Initialize step validation
  const { validateStep } = useStepValidation({
    formData,
    isNameAvailable,
    isEditMode,
  })

  // Initialize credentials validation
  const {
    checkingCredentials,
    credentialsValid,
    setCredentialsValid,
    projects,
    setProjects,
    validateCredentials,
    checkCredentials,
  } = useCredentialsValidation({
    formData,
    setError,
    setStepErrors,
  })

  // Initialize projects management
  const { isLoading, fetchProjects } = useProjectsManagement({
    formData,
    setError,
    setStepErrors,
    updateField: updateField as (field: string, value: string) => void,
    initialConfig,
  })

  // Initialize form navigation
  const { goToNextStep, goToPreviousStep } = useFormNavigation({
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
  })

  // Initialize form submission
  const { handleSubmit } = useFormSubmissionHandler({
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
  })

  // Set up effects

  // Effect to update JQL query when project is selected
  createEffect(() => {
    const projectKey = formData().project_key
    if (projectKey) {
      // Update JQL query when project key changes
      updateField('jql_query', `project = ${projectKey} AND type = Story`)
    }
  })

  // Fetch projects when moving to the project step
  createEffect(() => {
    // Store the current step in a local variable to prevent circular references
    const step = currentStep()

    if (step === 'project') {
      // Clear any previous errors
      setStepErrors(prev => ({ ...prev, project: null }))
      setError(null)

      // Log the current state for debugging
      logger.debug(
        'Attempting to fetch projects with credentials valid:',
        credentialsValid(),
        'and config name:',
        formData().name
      )

      // Use setTimeout to break potential circular references
      // This ensures the fetchProjects call happens in a separate execution context
      setTimeout(() => {
        // Only fetch if we're still on the project step
        if (currentStep() === 'project') {
          fetchProjects()
        }
      }, 0)
    } else {
      logger.debug('Not fetching projects. Current step:', step)
    }
  })

  // Reset credentials validation when any credential field changes
  createEffect(() => {
    // Watch credential fields to detect changes
    const currentData = formData()

    // We need to access these properties to make the effect depend on them
    // This ensures the effect runs when any of these values change
    const serverChanged = currentData.jira_server
    const emailChanged = currentData.jira_email
    const tokenChanged = currentData.jira_api_token

    // If credentials were previously valid and any field has changed,
    // reset the validation state
    if (credentialsValid() && (serverChanged || emailChanged || tokenChanged)) {
      setCredentialsValid(false)
    }
  })

  // Reset name availability check when name changes
  createEffect(() => {
    const name = formData().name
    if (name && !initialConfig && isNameAvailable() !== null) {
      setIsNameAvailable(null)
    }
  })

  // Initialize with default values if in edit mode
  if (isEditMode && initialConfig) {
    // Set credentials as valid in edit mode
    setCredentialsValid(true)

    // Set projects if available
    if (initialConfig.project_key) {
      setProjects([{ key: initialConfig.project_key, name: initialConfig.project_key }])
    }
  }

  // Return the public API
  return {
    currentStep,
    formData,
    projects,
    error,
    stepErrors,
    isNameAvailable,
    isCheckingName,
    isLoading,
    checkingCredentials,
    credentialsValid,
    setCredentialsValid, // Expose this for testing purposes
    isFirstStep,
    isLastStep,
    goToNextStep,
    goToPreviousStep,
    updateField,
    checkNameAvailability,
    checkCredentials,
    fetchProjects,
    handleSubmit,
    isEditMode: isEditModeMemo,
  }
}
