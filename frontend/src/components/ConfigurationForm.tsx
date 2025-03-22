import { Component, createSignal, createEffect, For } from 'solid-js'
import { generateId } from '@utils/idGenerator'
import { jiraApi, JiraConfiguration } from '@api/jiraApi'
import { logger } from '@utils/logger'
import { WorkflowState } from '~/types/workflow'
import { WorkflowStatesList } from './workflow/WorkflowStatesList'

interface Props {
  initialConfig?: JiraConfiguration
  onConfigurationSaved: (configName: string) => void
}

export const ConfigurationForm: Component<Props> = props => {
  const [error, setError] = createSignal<string | null>(null)
  const [formData, setFormData] = createSignal({
    name: props.initialConfig?.name || '',
    jira_server: props.initialConfig?.jira_server || '',
    jira_email: props.initialConfig?.jira_email || '',
    jira_api_token: props.initialConfig?.jira_api_token || '',
    jql_query: props.initialConfig?.jql_query || '',
    lead_time_start_state: props.initialConfig?.lead_time_start_state || '',
    lead_time_end_state: props.initialConfig?.lead_time_end_state || '',
    cycle_time_start_state: props.initialConfig?.cycle_time_start_state || '',
    cycle_time_end_state: props.initialConfig?.cycle_time_end_state || '',
  })

  // Initialize workflow states from props or empty array
  const initialWorkflowStates = () => {
    if (props.initialConfig?.workflow_states?.length) {
      return props.initialConfig.workflow_states.map(name => ({
        id: generateId(),
        name,
        isStartPoint:
          name === props.initialConfig?.lead_time_start_state ||
          name === props.initialConfig?.cycle_time_start_state,
        isEndPoint:
          name === props.initialConfig?.lead_time_end_state ||
          name === props.initialConfig?.cycle_time_end_state,
      }))
    }
    return []
  }

  const [workflowStates, setWorkflowStates] = createSignal<WorkflowState[]>(initialWorkflowStates())

  // Update lead/cycle time states when workflow states are modified
  createEffect(() => {
    const states = workflowStates()
    const startStates = states.filter(s => s.isStartPoint).map(s => s.name)
    const endStates = states.filter(s => s.isEndPoint).map(s => s.name)

    // Only update if we have marked states and current values are empty or not in the list anymore
    if (startStates.length > 0) {
      if (
        !formData().lead_time_start_state ||
        !states.some(s => s.name === formData().lead_time_start_state)
      ) {
        updateField('lead_time_start_state', startStates[0])
      }

      if (
        !formData().cycle_time_start_state ||
        !states.some(s => s.name === formData().cycle_time_start_state)
      ) {
        updateField('cycle_time_start_state', startStates[0])
      }
    }

    if (endStates.length > 0) {
      if (
        !formData().lead_time_end_state ||
        !states.some(s => s.name === formData().lead_time_end_state)
      ) {
        updateField('lead_time_end_state', endStates[0])
      }

      if (
        !formData().cycle_time_end_state ||
        !states.some(s => s.name === formData().cycle_time_end_state)
      ) {
        updateField('cycle_time_end_state', endStates[0])
      }
    }
  })

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setError(null)

    // Validate all fields are filled
    if (Object.values(formData()).some(value => !value)) {
      setError('All fields are required')
      return
    }

    const config: JiraConfiguration = {
      name: formData().name,
      jira_server: formData().jira_server,
      jira_email: formData().jira_email,
      jira_api_token: formData().jira_api_token,
      jql_query: formData().jql_query,
      workflow_states: workflowStates().map(state => state.name),
      lead_time_start_state: formData().lead_time_start_state,
      lead_time_end_state: formData().lead_time_end_state,
      cycle_time_start_state: formData().cycle_time_start_state,
      cycle_time_end_state: formData().cycle_time_end_state,
    }

    try {
      if (props.initialConfig) {
        await jiraApi.updateConfiguration(config.name, config)
        props.onConfigurationSaved(config.name)
      } else {
        await jiraApi.createConfiguration(config)
        props.onConfigurationSaved(config.name)
      }
    } catch (err) {
      // Extract detailed error message from Axios error response if available
      let errorMessage = 'Failed to save configuration'

      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'detail' in err.response.data
      ) {
        errorMessage = String(err.response.data.detail)
      } else if (err instanceof Error) {
        errorMessage = err.message
      }

      // Log the error using our logger utility
      logger.error('Failed to save configuration:', err)

      setError(errorMessage)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form class="space-y-4" onSubmit={handleSubmit}>
      {/* Name field */}
      <div role="group" class="space-y-1">
        <label for="name" class="block text-sm font-medium text-gray-700">
          Configuration Name
        </label>
        <input
          id="name"
          type="text"
          class="mt-1 block w-full cursor-pointer rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={formData().name}
          disabled={!!props.initialConfig}
          onInput={e => updateField('name', e.currentTarget.value)}
          required
        />
      </div>

      {/* Jira Server URL field */}
      <div role="group" class="space-y-1">
        <label for="jira_server" class="block text-sm font-medium text-gray-700">
          Jira Server URL
        </label>
        <input
          id="jira_server"
          type="text"
          class="mt-1 block w-full cursor-pointer rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={formData().jira_server}
          onInput={e => updateField('jira_server', e.currentTarget.value)}
          required
          placeholder="https://your-domain.atlassian.net"
        />
      </div>

      {/* Jira Email field */}
      <div role="group" class="space-y-1">
        <label for="jira_email" class="block text-sm font-medium text-gray-700">
          Jira Email
        </label>
        <input
          id="jira_email"
          type="email"
          class="mt-1 block w-full cursor-pointer rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={formData().jira_email}
          onInput={e => updateField('jira_email', e.currentTarget.value)}
          autocomplete="email"
          required
        />
      </div>

      {/* Jira API Token field */}
      <div role="group" class="space-y-1">
        <label for="jira_api_token" class="block text-sm font-medium text-gray-700">
          Jira API Token
        </label>
        <input
          id="jira_api_token"
          type="password"
          class="mt-1 block w-full cursor-pointer rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={formData().jira_api_token}
          onInput={e => updateField('jira_api_token', e.currentTarget.value)}
          autocomplete="current-password"
          required
        />
      </div>

      {/* JQL Query field */}
      <div role="group" class="space-y-1">
        <label for="jql_query" class="block text-sm font-medium text-gray-700">
          Default JQL Query
        </label>
        <textarea
          id="jql_query"
          class="mt-1 block w-full cursor-pointer rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={formData().jql_query}
          onInput={e => updateField('jql_query', e.currentTarget.value)}
          required
          placeholder="project = PROJ AND type = Story"
        />
      </div>

      {/* Workflow States field */}
      <div role="group" class="space-y-1">
        <label class="block text-sm font-medium text-gray-700">Workflow States</label>
        <p class="mb-2 text-xs text-gray-500">
          Add workflow states and drag to reorder them. Mark states as start/end points for lead and
          cycle time calculations.
        </p>
        <WorkflowStatesList states={workflowStates()} onChange={setWorkflowStates} />
      </div>

      {/* Lead Time Start State field */}
      <div role="group" class="space-y-1">
        <label for="lead_time_start_state" class="block text-sm font-medium text-gray-700">
          Lead Time Start State
        </label>
        <select
          id="lead_time_start_state"
          class="mt-1 block w-full cursor-pointer rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={formData().lead_time_start_state}
          onChange={e => updateField('lead_time_start_state', e.currentTarget.value)}
          required
        >
          <option value="" disabled>
            Select a state
          </option>
          <For each={workflowStates()}>
            {state => <option value={state.name}>{state.name}</option>}
          </For>
        </select>
      </div>

      {/* Lead Time End State field */}
      <div role="group" class="space-y-1">
        <label for="lead_time_end_state" class="block text-sm font-medium text-gray-700">
          Lead Time End State
        </label>
        <select
          id="lead_time_end_state"
          class="mt-1 block w-full cursor-pointer rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={formData().lead_time_end_state}
          onChange={e => updateField('lead_time_end_state', e.currentTarget.value)}
          required
        >
          <option value="" disabled>
            Select a state
          </option>
          <For each={workflowStates()}>
            {state => <option value={state.name}>{state.name}</option>}
          </For>
        </select>
      </div>

      {/* Cycle Time Start State field */}
      <div role="group" class="space-y-1">
        <label for="cycle_time_start_state" class="block text-sm font-medium text-gray-700">
          Cycle Time Start State
        </label>
        <select
          id="cycle_time_start_state"
          class="mt-1 block w-full cursor-pointer rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={formData().cycle_time_start_state}
          onChange={e => updateField('cycle_time_start_state', e.currentTarget.value)}
          required
        >
          <option value="" disabled>
            Select a state
          </option>
          <For each={workflowStates()}>
            {state => <option value={state.name}>{state.name}</option>}
          </For>
        </select>
      </div>

      {/* Cycle Time End State field */}
      <div role="group" class="space-y-1">
        <label for="cycle_time_end_state" class="block text-sm font-medium text-gray-700">
          Cycle Time End State
        </label>
        <select
          id="cycle_time_end_state"
          class="mt-1 block w-full cursor-pointer rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={formData().cycle_time_end_state}
          onChange={e => updateField('cycle_time_end_state', e.currentTarget.value)}
          required
        >
          <option value="" disabled>
            Select a state
          </option>
          <For each={workflowStates()}>
            {state => <option value={state.name}>{state.name}</option>}
          </For>
        </select>
      </div>

      {error() && (
        <p class="text-red-500" data-testid="error-message">
          {error()}
        </p>
      )}

      <button
        type="submit"
        class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
          />
        </svg>
        {props.initialConfig ? 'Update Configuration' : 'Create Configuration'}
      </button>
    </form>
  )
}
