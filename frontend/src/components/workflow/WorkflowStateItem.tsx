import { Component } from 'solid-js'
import { createSortable, transformStyle } from '@thisbeyond/solid-dnd'
import type { WorkflowState } from '../../types/workflow'

interface WorkflowStateItemProps {
  item: WorkflowState
  onRemove: (id: string) => void
  onToggleStartPoint: (id: string) => void
  onToggleEndPoint: (id: string) => void
}

/**
 * Individual workflow state item component for display in the sortable list
 */
const WorkflowStateItem: Component<WorkflowStateItemProps> = props => {
  // Use createSortable to create a sortable element
  // eslint-disable-next-line solid/reactivity
  const sortable = createSortable(props.item.id)

  return (
    <div
      ref={sortable.ref}
      class={`border-b border-gray-200 last:border-b-0 ${
        sortable.isActiveDraggable ? 'opacity-50' : 'bg-white hover:bg-gray-50'
      }`}
      style={transformStyle(sortable.transform)}
    >
      {/* Hidden span for reactivity tracking */}
      <span style={{ display: 'none' }}>{props.item.id}</span>

      <div class="flex items-center justify-between p-3">
        <div class="flex items-center space-x-3">
          {/* Drag handle icon - this makes the handle activate dragging */}
          <div class="cursor-grab p-1 active:cursor-grabbing" data-dnd-handle data-no-dnd-click>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-gray-400"
            >
              <line x1="3" y1="12" x2="9" y2="12" />
              <line x1="3" y1="6" x2="9" y2="6" />
              <line x1="3" y1="18" x2="9" y2="18" />
              <line x1="15" y1="12" x2="21" y2="12" />
              <line x1="15" y1="6" x2="21" y2="6" />
              <line x1="15" y1="18" x2="21" y2="18" />
            </svg>
          </div>
          <span class="text-sm font-medium text-gray-900">{props.item.name}</span>
        </div>
        <div class="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => props.onToggleStartPoint(props.item.id)}
            class={`rounded px-2 py-1 text-xs font-medium ${
              props.item.isStartPoint ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}
            title={props.item.isStartPoint ? 'Remove as start point' : 'Mark as start point'}
          >
            Start
          </button>
          <button
            type="button"
            onClick={() => props.onToggleEndPoint(props.item.id)}
            class={`rounded px-2 py-1 text-xs font-medium ${
              props.item.isEndPoint ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
            }`}
            title={props.item.isEndPoint ? 'Remove as end point' : 'Mark as end point'}
          >
            End
          </button>
          <button
            type="button"
            onClick={() => props.onRemove(props.item.id)}
            class="p-1 text-red-500 hover:text-red-700"
            title="Remove state"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default WorkflowStateItem
