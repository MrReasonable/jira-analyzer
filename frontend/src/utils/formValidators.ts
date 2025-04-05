import { FormData } from '~types/configurationForm'
import { JiraConfiguration } from '@api/jiraApi'

/**
 * Creates validators for each form step
 */
export const createStepValidators = (
  formData: () => FormData,
  isNameAvailable: () => boolean | null,
  isEditMode: boolean
) => {
  const validateCredentialsStep = (): { isValid: boolean; errorMessage: string | null } => {
    if (!formData().name) {
      return { isValid: false, errorMessage: 'Configuration name is required' }
    } else if (!isEditMode && isNameAvailable() === false) {
      return {
        isValid: false,
        errorMessage:
          'A configuration with this name already exists. Please choose a different name.',
      }
    } else if (!formData().jira_server) {
      return { isValid: false, errorMessage: 'Jira server URL is required' }
    } else if (!formData().jira_email) {
      return { isValid: false, errorMessage: 'Jira email is required' }
    } else if (!formData().jira_api_token) {
      return { isValid: false, errorMessage: 'Jira API token is required' }
    }
    return { isValid: true, errorMessage: null }
  }

  const validateProjectStep = (): { isValid: boolean; errorMessage: string | null } => {
    if (!formData().project_key) {
      return { isValid: false, errorMessage: 'Project selection is required' }
    } else if (!formData().jql_query) {
      return { isValid: false, errorMessage: 'JQL query is required' }
    }
    return { isValid: true, errorMessage: null }
  }

  return {
    validateCredentialsStep,
    validateProjectStep,
  }
}

/**
 * Creates a configuration object from form data
 */
export const createConfigFromFormData = (formData: FormData): JiraConfiguration => {
  return {
    name: formData.name,
    jira_server: formData.jira_server,
    jira_email: formData.jira_email,
    jira_api_token: formData.jira_api_token,
    jql_query: formData.jql_query,
    project_key: formData.project_key,
    workflow_states: [],
    lead_time_start_state: '',
    lead_time_end_state: '',
    cycle_time_start_state: '',
    cycle_time_end_state: '',
  }
}
