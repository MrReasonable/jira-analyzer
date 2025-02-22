import { Component, createSignal, Show } from 'solid-js';
import { TextField, Button } from '@kobalte/core';
import { JiraConfiguration, jiraApi } from '../api/jiraApi';

interface Props {
  onConfigurationSaved: () => void;
  initialConfig?: JiraConfiguration;
}

export const ConfigurationForm: Component<Props> = (props) => {
  const [name, setName] = createSignal(props.initialConfig?.name || '');
  const [jiraServer, setJiraServer] = createSignal(props.initialConfig?.jira_server || '');
  const [jiraEmail, setJiraEmail] = createSignal(props.initialConfig?.jira_email || '');
  const [jiraApiToken, setJiraApiToken] = createSignal(props.initialConfig?.jira_api_token || '');
  const [jqlQuery, setJqlQuery] = createSignal(props.initialConfig?.jql_query || '');
  const [workflowStates, setWorkflowStates] = createSignal(props.initialConfig?.workflow_states.join('\n') || '');
  const [leadTimeStartState, setLeadTimeStartState] = createSignal(props.initialConfig?.lead_time_start_state || '');
  const [leadTimeEndState, setLeadTimeEndState] = createSignal(props.initialConfig?.lead_time_end_state || '');
  const [cycleTimeStartState, setCycleTimeStartState] = createSignal(props.initialConfig?.cycle_time_start_state || '');
  const [cycleTimeEndState, setCycleTimeEndState] = createSignal(props.initialConfig?.cycle_time_end_state || '');
  const [error, setError] = createSignal<string>();
  const [saving, setSaving] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setSaving(true);
    setError(undefined);

    try {
      const config: JiraConfiguration = {
        name: name(),
        jira_server: jiraServer(),
        jira_email: jiraEmail(),
        jira_api_token: jiraApiToken(),
        jql_query: jqlQuery(),
        workflow_states: workflowStates().split('\n').filter(s => s.trim()),
        lead_time_start_state: leadTimeStartState(),
        lead_time_end_state: leadTimeEndState(),
        cycle_time_start_state: cycleTimeStartState(),
        cycle_time_end_state: cycleTimeEndState()
      };

      if (props.initialConfig) {
        await jiraApi.updateConfiguration(props.initialConfig.name, config);
      } else {
        await jiraApi.createConfiguration(config);
      }

      props.onConfigurationSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <TextField.Root>
        <TextField.Label>Configuration Name</TextField.Label>
        <TextField.Input
          class="input"
          value={name()}
          onChange={setName}
          required
          disabled={!!props.initialConfig}
        />
      </TextField.Root>

      <TextField.Root>
        <TextField.Label>Jira Server URL</TextField.Label>
        <TextField.Input
          class="input"
          value={jiraServer()}
          onChange={setJiraServer}
          required
          placeholder="https://your-domain.atlassian.net"
        />
      </TextField.Root>

      <TextField.Root>
        <TextField.Label>Jira Email</TextField.Label>
        <TextField.Input
          class="input"
          value={jiraEmail()}
          onChange={setJiraEmail}
          required
          type="email"
        />
      </TextField.Root>

      <TextField.Root>
        <TextField.Label>Jira API Token</TextField.Label>
        <TextField.Input
          class="input"
          value={jiraApiToken()}
          onChange={setJiraApiToken}
          required
          type="password"
        />
      </TextField.Root>

      <TextField.Root>
        <TextField.Label>JQL Query</TextField.Label>
        <TextField.TextArea
          class="input"
          value={jqlQuery()}
          onChange={setJqlQuery}
          required
          placeholder="project = PROJ AND type = Story"
        />
      </TextField.Root>

      <TextField.Root>
        <TextField.Label>Workflow States (one per line)</TextField.Label>
        <TextField.TextArea
          class="input"
          value={workflowStates()}
          onChange={setWorkflowStates}
          required
          placeholder="Backlog&#10;In Progress&#10;Done"
        />
      </TextField.Root>

      <div class="grid grid-cols-2 gap-4">
        <TextField.Root>
          <TextField.Label>Lead Time Start State</TextField.Label>
          <TextField.Input
            class="input"
            value={leadTimeStartState()}
            onChange={setLeadTimeStartState}
            required
          />
        </TextField.Root>

        <TextField.Root>
          <TextField.Label>Lead Time End State</TextField.Label>
          <TextField.Input
            class="input"
            value={leadTimeEndState()}
            onChange={setLeadTimeEndState}
            required
          />
        </TextField.Root>

        <TextField.Root>
          <TextField.Label>Cycle Time Start State</TextField.Label>
          <TextField.Input
            class="input"
            value={cycleTimeStartState()}
            onChange={setCycleTimeStartState}
            required
          />
        </TextField.Root>

        <TextField.Root>
          <TextField.Label>Cycle Time End State</TextField.Label>
          <TextField.Input
            class="input"
            value={cycleTimeEndState()}
            onChange={setCycleTimeEndState}
            required
          />
        </TextField.Root>
      </div>

      <Show when={error()}>
        <p class="text-red-500">{error()}</p>
      </Show>

      <Button.Root
        class="btn btn-primary w-full"
        type="submit"
        disabled={saving()}
      >
        {saving() ? (
          <div class="flex items-center gap-2">
            <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            <span>Saving...</span>
          </div>
        ) : (
          props.initialConfig ? 'Update Configuration' : 'Create Configuration'
        )}
      </Button.Root>
    </form>
  );
};
