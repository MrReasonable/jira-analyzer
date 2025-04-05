import { Component, For } from 'solid-js'
import { WorkflowState } from '~/types/workflow'
import { JqlInput } from './JqlInput'

interface WorkflowViewerProps {
  workflowStates: () => WorkflowState[]
  onEditClick: () => void
  jql: () => string
  onJqlChange: (jql: string) => void
  onAnalyze: () => void
  isLoading: () => boolean
  configSelected: () => boolean
  configName: () => string
  onConfigNameChange: (name: string) => void
  onSaveAs: () => void
  isSaving: () => boolean
}

/**
 * Component for viewing workflow states and JQL query
 */
export const WorkflowViewer: Component<WorkflowViewerProps> = props => {
  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-medium">Workflow States</h3>
          {props.configSelected() && (
            <p class="text-sm text-gray-600">
              Current configuration:{' '}
              <span class="font-medium text-blue-600">{props.configName()}</span>
            </p>
          )}
        </div>
        <button
          class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          onClick={() => props.onEditClick()}
        >
          Edit Workflow
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        {props.workflowStates().length > 0 ? (
          <For each={props.workflowStates()}>
            {(state: WorkflowState) => (
              <div
                class={`rounded-md px-3 py-1 text-sm ${
                  state.isStartPoint && state.isEndPoint
                    ? 'bg-purple-100 text-purple-800'
                    : state.isStartPoint
                      ? 'bg-green-100 text-green-800'
                      : state.isEndPoint
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                }`}
              >
                {state.name}
                {state.isStartPoint && ' (Start)'}
                {state.isEndPoint && ' (End)'}
              </div>
            )}
          </For>
        ) : (
          <p class="text-sm text-gray-500">No workflow states defined</p>
        )}
      </div>

      <div class="mt-4">
        <h3 id="jql-query-heading" class="mb-2 text-lg font-medium">
          JQL Query
        </h3>
        <JqlInput
          jql={props.jql}
          onJqlChange={props.onJqlChange}
          onAnalyze={props.onAnalyze}
          loading={props.isLoading}
          configSelected={props.configSelected}
        />
      </div>

      <div class="mt-4 flex items-center gap-2">
        <input
          type="text"
          class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Save as new configuration..."
          value={props.configName()}
          onInput={e => props.onConfigNameChange(e.currentTarget.value)}
        />
        <button
          class="rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
          onClick={() => props.onSaveAs()}
          disabled={!props.configName() || props.isSaving()}
        >
          {props.isSaving() ? 'Saving...' : 'Save As'}
        </button>
      </div>
    </div>
  )
}
