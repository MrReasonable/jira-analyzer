/**
 * Represents a single workflow state in the kanban process
 */
export interface WorkflowState {
  /** Unique identifier for the state */
  id: string

  /** Display name for the workflow state */
  name: string

  /** Whether this state is a starting point in the workflow */
  isStartPoint?: boolean

  /** Whether this state is an ending point in the workflow */
  isEndPoint?: boolean
}
