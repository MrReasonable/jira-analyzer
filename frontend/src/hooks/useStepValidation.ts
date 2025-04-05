import { FormData, FormStep } from '~types/configurationForm'

export interface UseStepValidationProps {
  formData: () => FormData
  isNameAvailable: () => boolean | null
  isEditMode: boolean
}

/**
 * Hook for validating form steps
 */
export function useStepValidation({
  formData,
  isNameAvailable,
  isEditMode,
}: UseStepValidationProps) {
  /**
   * Validate credentials step
   */
  const validateCredentialsStep = (): { isValid: boolean; errorMessage: string | null } => {
    const data = formData()

    // Check required fields
    if (!data.name || !data.jira_server || !data.jira_email || !data.jira_api_token) {
      return {
        isValid: false,
        errorMessage: 'Please fill in all required fields',
      }
    }

    // In create mode, check if name is available
    if (!isEditMode && isNameAvailable() === false) {
      return {
        isValid: false,
        errorMessage: 'A configuration with this name already exists',
      }
    }

    return { isValid: true, errorMessage: null }
  }

  /**
   * Validate project step
   */
  const validateProjectStep = (): { isValid: boolean; errorMessage: string | null } => {
    const data = formData()

    // Check required fields
    if (!data.project_key || !data.jql_query) {
      return {
        isValid: false,
        errorMessage: 'Please select a project and provide a JQL query',
      }
    }

    return { isValid: true, errorMessage: null }
  }

  /**
   * Validate the current step and return true if valid
   */
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

    return validation.isValid
  }

  return {
    validateStep,
    validateCredentialsStep,
    validateProjectStep,
  }
}
