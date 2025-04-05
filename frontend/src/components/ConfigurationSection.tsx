import { Component, Show, Switch, Match, Accessor } from 'solid-js'
import { ConfigurationsHeader } from './ConfigurationsHeader'
import { WorkflowEditor } from './WorkflowEditor'
import { WorkflowViewer } from './WorkflowViewer'
import { JiraConfiguration, JiraConfigurationList } from '@api/jiraApi'
import { WorkflowState } from '~/types/workflow'

interface ConfigurationSectionProps {
  configurations: Accessor<JiraConfigurationList[]>
  loading: Accessor<boolean>
  selectedConfig: Accessor<string | undefined>
  onSelect: (name: string) => void
  onEdit: (name: string) => void
  onDelete: (name: string) => Promise<boolean>
  onAddClick: () => void
  activeConfig: () => JiraConfiguration | null
  workflowStates: () => WorkflowState[]
  setWorkflowStates: (states: WorkflowState[]) => void
  editingWorkflow: () => boolean
  setEditingWorkflow: (editing: boolean) => void
  saveCurrentConfig: () => void
  savingConfig: () => boolean
  jql: () => string
  onJqlChange: (jql: string) => void
  onAnalyze: () => void
  isLoading: () => boolean
  configName: () => string
  onConfigNameChange: (name: string) => void
  saveNewConfig: () => void
}

/**
 * Component for the configuration section
 */
export const ConfigurationSection: Component<ConfigurationSectionProps> = props => {
  return (
    <div class="mb-6 rounded-lg bg-white p-6 shadow-md">
      <h2 class="mb-4 text-xl font-bold">Configuration</h2>

      <ConfigurationsHeader
        configurations={props.configurations}
        loading={props.loading}
        selectedConfig={props.selectedConfig}
        onSelect={props.onSelect}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
        onAddClick={props.onAddClick}
      />

      <Show when={props.activeConfig()}>
        <div class="mt-6 border-t pt-4">
          <Switch>
            <Match when={props.editingWorkflow()}>
              <WorkflowEditor
                workflowStates={props.workflowStates}
                setWorkflowStates={props.setWorkflowStates}
                onCancel={() => props.setEditingWorkflow(false)}
                onSave={props.saveCurrentConfig}
                isSaving={props.savingConfig}
              />
            </Match>
            <Match when={!props.editingWorkflow()}>
              <WorkflowViewer
                workflowStates={props.workflowStates}
                onEditClick={() => props.setEditingWorkflow(true)}
                jql={props.jql}
                onJqlChange={props.onJqlChange}
                onAnalyze={props.onAnalyze}
                isLoading={props.isLoading}
                configSelected={() => !!props.selectedConfig()}
                configName={props.configName}
                onConfigNameChange={props.onConfigNameChange}
                onSaveAs={props.saveNewConfig}
                isSaving={props.savingConfig}
              />
            </Match>
          </Switch>
        </div>
      </Show>
    </div>
  )
}
