import { createEffect, createSignal, createMemo } from 'solid-js'
import { generateId } from '@utils/idGenerator'
import type { WorkflowState } from '@types/workflow'

/**
 * Hook to manage workflow states, providing operations for adding, removing,
 * and modifying workflow states
 */
export function useWorkflowStates(
  /** Initial workflow states from props */
  initialStates: WorkflowState[],
  /** Callback for when states change */
  onChange: (states: WorkflowState[]) => void
) {
  // Create a memoized version of initialStates with guaranteed IDs
  const preparedStates = createMemo(() =>
    initialStates.map(state => ({
      ...state,
      id: state.id || generateId(),
    }))
  )

  const [items, setItems] = createSignal<WorkflowState[]>([])
  const [activeItem, setActiveItem] = createSignal<string | null>(null)
  const [newStateName, setNewStateName] = createSignal('')

  // Initialize items when initialStates changes
  createEffect(() => {
    if (preparedStates().length > 0) {
      setItems(preparedStates())
    }
  })

  // Get all state IDs (useful for SortableProvider)
  const ids = () => items().map(item => item.id)

  // Notify parent component of state changes
  const handleItemsChange = (newItems: WorkflowState[]) => {
    setItems(newItems)
    onChange(newItems)
  }

  // Add a new state
  const addState = () => {
    if (newStateName().trim()) {
      const newState: WorkflowState = {
        id: generateId(),
        name: newStateName().trim(),
      }
      const newItems = [...items(), newState]
      handleItemsChange(newItems)
      setNewStateName('')
    }
  }

  // Remove a state by ID
  const removeState = (id: string) => {
    const newItems = items().filter(item => item.id !== id)
    handleItemsChange(newItems)
  }

  // Toggle whether a state is a starting point
  const toggleStartPoint = (id: string) => {
    const newItems = items().map(item => {
      if (item.id === id) {
        return { ...item, isStartPoint: !item.isStartPoint }
      }
      return item
    })
    handleItemsChange(newItems)
  }

  // Toggle whether a state is an ending point
  const toggleEndPoint = (id: string) => {
    const newItems = items().map(item => {
      if (item.id === id) {
        return { ...item, isEndPoint: !item.isEndPoint }
      }
      return item
    })
    handleItemsChange(newItems)
  }

  // Handle drag-and-drop reordering
  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex !== toIndex) {
      const currentItems = [...items()]
      const [removed] = currentItems.splice(fromIndex, 1)
      currentItems.splice(toIndex, 0, removed)
      handleItemsChange(currentItems)
    }
  }

  // Find an item by ID
  const findItemById = (id: string | null) => {
    if (!id) return null
    const item = items().find(item => item.id === id)
    return item || null // Convert undefined to null when item not found
  }

  return {
    // State
    items,
    activeItem,
    setActiveItem,
    newStateName,
    setNewStateName,
    ids,

    // Actions
    addState,
    removeState,
    toggleStartPoint,
    toggleEndPoint,
    moveItem,
    findItemById,
  }
}
