import { Component } from 'solid-js'
import { WorkflowState } from '~/types/workflow'
import { WorkflowStatesList } from './workflow/WorkflowStatesList'

interface WorkflowEditorProps {
  workflowStates: () => WorkflowState[]
  setWorkflowStates: (states: WorkflowState[]) => void
  onCancel: () => void
  onSave: () => void
  isSaving: () => boolean
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
      <p class="text-sm text-gray-500">
        Add workflow states and drag to reorder them. Mark states as start/end points for lead and
        cycle time calculations.
      </p>
      <WorkflowStatesList states={props.workflowStates()} onChange={props.setWorkflowStates} />
    </div>
  )
}
