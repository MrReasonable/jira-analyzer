import { Component, For, Show } from 'solid-js'
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  closestCenter,
  SortableProvider,
  DragEvent,
} from '@thisbeyond/solid-dnd'
import type { WorkflowState } from '../../types/workflow'
import { useWorkflowStates } from '../../hooks/useWorkflowStates'
import WorkflowStateItem from './WorkflowStateItem'
import WorkflowStateDragOverlay from './WorkflowStateDragOverlay'

interface WorkflowStatesListProps {
  states: WorkflowState[]
  onChange: (states: WorkflowState[]) => void
}

/**
 * A sortable list of workflow states that can be reordered via drag and drop.
 * Provides UI for adding, removing, and configuring workflow states.
 */
export const WorkflowStatesList: Component<WorkflowStatesListProps> = props => {
  // eslint-disable-next-line solid/reactivity
  const stateManager = useWorkflowStates(props.states, props.onChange)

  // Event handlers for drag and drop
  const onDragStart = (event: DragEvent) => {
    if (event.draggable) {
      stateManager.setActiveItem(String(event.draggable.id))
    }
  }

  const onDragEnd = (event: DragEvent) => {
    if (event.draggable && event.droppable) {
      const fromIndex = stateManager.ids().indexOf(String(event.draggable.id))
      const toIndex = stateManager.ids().indexOf(String(event.droppable.id))
      stateManager.moveItem(fromIndex, toIndex)
    }
    stateManager.setActiveItem(null)
  }

  return (
    <div class="space-y-4">
      {/* Hidden elements to track reactive dependencies for SolidJS */}
      <div style={{ display: 'none' }}>
        {/* Access states length to track changes */}
        {props.states.length}
        {/* Create a function reference to track onChange */}
        {(() => {
          // This creates a dependency on props.onChange without unused variable warnings
          props.onChange.toString()
          return null
        })()}
      </div>
      {/* Input for adding new states */}
      <div class="flex space-x-2">
        <input
          type="text"
          value={stateManager.newStateName()}
          onInput={e => stateManager.setNewStateName(e.currentTarget.value)}
          placeholder="New state name"
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        <button
          type="button"
          onClick={stateManager.addState}
          class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm leading-4 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
        >
          Add
        </button>
      </div>

      {/* Sortable list of states */}
      <Show when={stateManager.items().length > 0}>
        <DragDropProvider
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          collisionDetector={closestCenter}
        >
          <DragDropSensors />
          <div class="overflow-hidden rounded-md border border-gray-200 bg-white">
            <SortableProvider ids={stateManager.ids()}>
              <For each={stateManager.items()}>
                {item => (
                  <WorkflowStateItem
                    item={item}
                    onRemove={stateManager.removeState}
                    onToggleStartPoint={stateManager.toggleStartPoint}
                    onToggleEndPoint={stateManager.toggleEndPoint}
                  />
                )}
              </For>
            </SortableProvider>
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            <Show when={stateManager.activeItem()}>
              {activeId => {
                const item = stateManager.findItemById(activeId())
                return item && <WorkflowStateDragOverlay item={item} />
              }}
            </Show>
          </DragOverlay>
        </DragDropProvider>
      </Show>
    </div>
  )
}

export default WorkflowStatesList
