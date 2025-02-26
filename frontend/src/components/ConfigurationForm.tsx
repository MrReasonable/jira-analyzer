import { Component, createSignal } from 'solid-js';
import { jiraApi, JiraConfiguration } from '../api/jiraApi';
import { logger } from '../utils/logger';

interface Props {
  initialConfig?: JiraConfiguration;
  onConfigurationSaved: () => void;
}

export const ConfigurationForm: Component<Props> = props => {
  const [error, setError] = createSignal<string | null>(null);
  const [formData, setFormData] = createSignal({
    name: props.initialConfig?.name || '',
    jira_server: props.initialConfig?.jira_server || '',
    jira_email: props.initialConfig?.jira_email || '',
    jira_api_token: props.initialConfig?.jira_api_token || '',
    jql_query: props.initialConfig?.jql_query || '',
    workflow_states: props.initialConfig?.workflow_states.join('\n') || '',
    lead_time_start_state: props.initialConfig?.lead_time_start_state || '',
    lead_time_end_state: props.initialConfig?.lead_time_end_state || '',
    cycle_time_start_state: props.initialConfig?.cycle_time_start_state || '',
    cycle_time_end_state: props.initialConfig?.cycle_time_end_state || '',
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(null);

    // Validate all fields are filled
    if (Object.values(formData()).some(value => !value)) {
      setError('All fields are required');
      return;
    }

    const config: JiraConfiguration = {
      name: formData().name,
      jira_server: formData().jira_server,
      jira_email: formData().jira_email,
      jira_api_token: formData().jira_api_token,
      jql_query: formData().jql_query,
      workflow_states: formData().workflow_states.split('\n').filter(Boolean),
      lead_time_start_state: formData().lead_time_start_state,
      lead_time_end_state: formData().lead_time_end_state,
      cycle_time_start_state: formData().cycle_time_start_state,
      cycle_time_end_state: formData().cycle_time_end_state,
    };

    try {
      if (props.initialConfig) {
        await jiraApi.updateConfiguration(config.name, config);
      } else {
        await jiraApi.createConfiguration(config);
      }
      props.onConfigurationSaved();
    } catch (err) {
      // Ensure we're handling the error properly
      const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration';

      // Log the error using our logger utility
      logger.error('Failed to save configuration:', err);

      setError(errorMessage);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form class="space-y-4" onSubmit={handleSubmit}>
      {/* Name field */}
      <div role="group">
        <label for="name">Configuration Name</label>
        <input
          id="name"
          type="text"
          class="input"
          value={formData().name}
          disabled={!!props.initialConfig}
          onInput={e => updateField('name', e.currentTarget.value)}
          required
        />
      </div>

      {/* Jira Server URL field */}
      <div role="group">
        <label for="jira_server">Jira Server URL</label>
        <input
          id="jira_server"
          type="text"
          class="input"
          value={formData().jira_server}
          onInput={e => updateField('jira_server', e.currentTarget.value)}
          required
          placeholder="https://your-domain.atlassian.net"
        />
      </div>

      {/* Jira Email field */}
      <div role="group">
        <label for="jira_email">Jira Email</label>
        <input
          id="jira_email"
          type="email"
          class="input"
          value={formData().jira_email}
          onInput={e => updateField('jira_email', e.currentTarget.value)}
          required
        />
      </div>

      {/* Jira API Token field */}
      <div role="group">
        <label for="jira_api_token">Jira API Token</label>
        <input
          id="jira_api_token"
          type="password"
          class="input"
          value={formData().jira_api_token}
          onInput={e => updateField('jira_api_token', e.currentTarget.value)}
          required
        />
      </div>

      {/* JQL Query field */}
      <div role="group">
        <label for="jql_query">JQL Query</label>
        <textarea
          id="jql_query"
          class="input"
          value={formData().jql_query}
          onInput={e => updateField('jql_query', e.currentTarget.value)}
          required
          placeholder="project = PROJ AND type = Story"
        />
      </div>

      {/* Workflow States field */}
      <div role="group">
        <label for="workflow_states">Workflow States (one per line)</label>
        <textarea
          id="workflow_states"
          class="input"
          value={formData().workflow_states}
          onInput={e => updateField('workflow_states', e.currentTarget.value)}
          required
          placeholder="Backlog&#10;In Progress&#10;Done"
        />
      </div>

      {/* Lead Time Start State field */}
      <div role="group">
        <label for="lead_time_start_state">Lead Time Start State</label>
        <input
          id="lead_time_start_state"
          type="text"
          class="input"
          value={formData().lead_time_start_state}
          onInput={e => updateField('lead_time_start_state', e.currentTarget.value)}
          required
        />
      </div>

      {/* Lead Time End State field */}
      <div role="group">
        <label for="lead_time_end_state">Lead Time End State</label>
        <input
          id="lead_time_end_state"
          type="text"
          class="input"
          value={formData().lead_time_end_state}
          onInput={e => updateField('lead_time_end_state', e.currentTarget.value)}
          required
        />
      </div>

      {/* Cycle Time Start State field */}
      <div role="group">
        <label for="cycle_time_start_state">Cycle Time Start State</label>
        <input
          id="cycle_time_start_state"
          type="text"
          class="input"
          value={formData().cycle_time_start_state}
          onInput={e => updateField('cycle_time_start_state', e.currentTarget.value)}
          required
        />
      </div>

      {/* Cycle Time End State field */}
      <div role="group">
        <label for="cycle_time_end_state">Cycle Time End State</label>
        <input
          id="cycle_time_end_state"
          type="text"
          class="input"
          value={formData().cycle_time_end_state}
          onInput={e => updateField('cycle_time_end_state', e.currentTarget.value)}
          required
        />
      </div>

      {error() && (
        <p class="text-red-500" data-testid="error-message">
          {error()}
        </p>
      )}

      <button type="submit" class="btn btn-primary w-full">
        {props.initialConfig ? 'Update Configuration' : 'Create Configuration'}
      </button>
    </form>
  );
};
