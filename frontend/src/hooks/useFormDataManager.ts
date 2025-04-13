import { createSignal } from 'solid-js'
import { FormData } from '~types/configurationForm'
import type { JiraConfiguration } from '@api/jiraApi'

/**
 * Hook for managing form data
 */
export function useFormDataManager(initialConfig?: JiraConfiguration) {
  const [formData, setFormData] = createSignal<FormData>({
    name: initialConfig?.name ?? '',
    jira_server: initialConfig?.jira_server ?? '',
    jira_email: initialConfig?.jira_email ?? '',
    jira_api_token: initialConfig?.jira_api_token ?? '',
    jql_query: initialConfig?.jql_query ?? '',
    project_key: initialConfig?.project_key ?? '',
    lead_time_start_state: initialConfig?.lead_time_start_state ?? '',
    lead_time_end_state: initialConfig?.lead_time_end_state ?? '',
    cycle_time_start_state: initialConfig?.cycle_time_start_state ?? '',
    cycle_time_end_state: initialConfig?.cycle_time_end_state ?? '',
  })

  // Helper function to update form data
  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev: FormData) => ({ ...prev, [field]: value }))
  }

  return {
    formData,
    updateField,
  }
}
