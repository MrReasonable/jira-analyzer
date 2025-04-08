import { Component, Show } from 'solid-js'
import { WorkflowState } from '~/types/workflow'
import { WorkflowStatesList } from './workflow/WorkflowStatesList'

interface WorkflowEditorProps {
  workflowStates: () => WorkflowState[]
  setWorkflowStates: (states: WorkflowState[]) => void
  onCancel: () => void
  onSave: () => void
  isSaving: () => boolean
  projectKey?: string
  onImportFromJira?: (projectKey: string) => Promise<void>
  isImportingFromJira?: () => boolean
  importError?: () => string | null
}

/**
 * Component for editing workflow states
 */
export const WorkflowEditor: Component<WorkflowEditorProps> = props => {
  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium">Edit Workflow States</h3>
        <div class="flex gap-2">
          <button
            class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            onClick={() => props.onCancel()}
          >
            Cancel
          </button>
          <button
            class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            onClick={() => props.onSave()}
            disabled={props.isSaving()}
          >
            {props.isSaving() ? 'Saving...' : 'Save Workflow'}
          </button>
        </div>
      </div>

      {/* Import from Jira section */}
      <Show when={props.projectKey && props.onImportFromJira}>
        <div class="flex items-center justify-between rounded-md bg-blue-50 p-3">
          <div>
            <h4 class="font-medium text-blue-800">Import from Jira</h4>
            <p class="text-sm text-blue-600">
              Import workflow states directly from Jira for the selected project
            </p>
          </div>
          <button
            class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-300"
            onClick={() => props.projectKey && props.onImportFromJira?.(props.projectKey)}
            disabled={props.isImportingFromJira?.() || !props.projectKey}
          >
            {props.isImportingFromJira?.() ? 'Importing...' : 'Import Workflow'}
          </button>
        </div>

        <Show when={props.importError?.()}>
          <div class="rounded-md bg-red-50 p-3 text-sm text-red-600">
            <p>Error importing workflow: {props.importError?.()}</p>
          </div>
        </Show>
      </Show>
      <p class="text-sm text-gray-500">
        Add workflow states and drag to reorder them. Mark states as start/end points for lead and
        cycle time calculations.
      </p>
      <WorkflowStatesList states={props.workflowStates()} onChange={props.setWorkflowStates} />
    </div>
  )
}
