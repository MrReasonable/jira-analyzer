// Mock implementation for @thisbeyond/solid-dnd to use in tests
// This prevents the drag-and-drop errors when running tests

// Store registered draggables and droppables to prevent cleanup errors
const registeredDraggables = new Set<string | number>()
const registeredDroppables = new Set<string | number>()

// Mock for closestCenter collision detector
export const closestCenter = () => null

// Define mock types that match the real library
export type DragEvent = {
  draggable?: { id: string | number }
  droppable?: { id: string | number }
}

// Define proper types for props
interface DragDropProviderProps {
  children: unknown
  onDragStart?: (event: DragEvent) => void
  onDragEnd?: (event: DragEvent) => void
  collisionDetector?: unknown
}

interface DragOverlayProps {
  children: unknown
}

// Mock for createSortable
export const createSortable = (id: string | number) => {
  return {
    ref: (el: HTMLElement) => el,
    id,
    isActiveDraggable: false,
    transform: { x: 0, y: 0 },
    // Add dragActivators for drag handle functionality
    dragActivators: (el: HTMLElement) => el,
    // Method to trigger drag event manually in tests
    setDragging: (dragging: boolean) => {
      // This is just a stub for testing - real implementation would set internal state
      return dragging
    },
  }
}

// Mock for transformStyle
export const transformStyle = (transform: { x: number; y: number }) => {
  return {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  }
}

// Mock implementations
export const DragDropProvider = (props: DragDropProviderProps) => {
  // In test environment we just return children directly
  if (props.onDragEnd) {
    // Register cleanup function - no reactivity needed in tests
    setTimeout(() => {
      registeredDraggables.clear()
      registeredDroppables.clear()
    }, 0)
  }

  return props.children
}

export const DragDropSensors = () => null

export const DragOverlay = (props: DragOverlayProps) => {
  // In test environment we just return children directly
  return props.children
}

// Mock for SortableProvider
export const SortableProvider = (props: { ids: (string | number)[]; children: unknown }) => {
  // In test environment we just return children directly
  return props.children
}

// Create draggable function that properly registers/unregisters
export const createDraggable = (id: string | number) => {
  // Register this draggable
  registeredDraggables.add(id)

  // Return a function that does nothing but maintain the same interface
  const fn = (el: HTMLElement) => {
    // Attached to the element but doesn't do anything
    return el
  }

  // Add a method to manually unregister
  fn.destroy = () => {
    registeredDraggables.delete(id)
  }

  return fn
}

// Create droppable function that properly registers/unregisters
export const createDroppable = (id: string | number) => {
  // Register this droppable
  registeredDroppables.add(id)

  // Return a function that does nothing but maintain the same interface
  const fn = (el: HTMLElement) => {
    // Attached to the element but doesn't do anything
    return el
  }

  // Add a method to manually unregister
  fn.destroy = () => {
    registeredDroppables.delete(id)
  }

  return fn
}

// Export a mock context that includes our registered items
export const useDragDropContext = () => ({
  draggables: new Map([...registeredDraggables].map(id => [id, { id }])),
  droppables: new Map([...registeredDroppables].map(id => [id, { id }])),
})
