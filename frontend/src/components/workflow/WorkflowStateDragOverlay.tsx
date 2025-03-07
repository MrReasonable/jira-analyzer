import { Component } from 'solid-js'
import type { WorkflowState } from '~types/workflow'

interface WorkflowStateDragOverlayProps {
  item: WorkflowState
}

/**
 * Visual overlay shown when dragging a workflow state
 */
const WorkflowStateDragOverlay: Component<WorkflowStateDragOverlayProps> = props => {
  return (
    <div class="flex items-center justify-between rounded-md border border-gray-300 bg-white p-3 opacity-80 shadow-md">
      <div class="flex items-center space-x-3">
        <div class="p-1">
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
    </div>
  )
}

export default WorkflowStateDragOverlay
