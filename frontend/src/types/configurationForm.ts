import { JiraConfiguration } from '@api/jiraApi'

export type FormStep = 'credentials' | 'project'

export interface JiraProject {
  key: string
  name: string
}

export interface FormData {
  name: string
  jira_server: string
  jira_email: string
  jira_api_token: string
  jql_query: string
  project_key: string
  lead_time_start_state: string
  lead_time_end_state: string
  cycle_time_start_state: string
  cycle_time_end_state: string
}

export interface StepError {
  credentials: string | null
  project: string | null
}

export interface UseConfigurationFormProps {
  initialConfig?: JiraConfiguration
  onConfigurationSaved: (configName: string) => void
}

export interface UseConfigurationFormReturn {
  // Form state
  currentStep: () => FormStep
  formData: () => FormData
  projects: () => JiraProject[]
  error: () => string | null
  stepErrors: () => StepError
  isNameAvailable: () => boolean | null
  isCheckingName: () => boolean
  isLoading: () => boolean
  checkingCredentials: () => boolean
  credentialsValid: () => boolean
  setCredentialsValid: (valid: boolean) => void // Added for testing purposes
  setProjects: (projects: JiraProject[]) => void // Added for testing purposes

  // Step navigation
  isFirstStep: () => boolean
  isLastStep: () => boolean
  goToNextStep: () => Promise<void>
  goToPreviousStep: () => void

  // Field updates
  updateField: (field: keyof FormData, value: string) => void

  // Actions
  checkNameAvailability: (name: string) => Promise<void>
  checkCredentials: () => Promise<void>
  fetchProjects: () => Promise<void>
  handleSubmit: (e: Event) => Promise<void>

  // Helpers
  isEditMode: () => boolean
}
