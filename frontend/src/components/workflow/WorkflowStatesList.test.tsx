import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@solidjs/testing-library'
import { WorkflowStatesList } from './WorkflowStatesList'
import type { WorkflowState } from '~types/workflow'
import * as solidDnd from '@thisbeyond/solid-dnd'

// Completely mock the solid-dnd module
vi.mock('@thisbeyond/solid-dnd', () => {
  return {
    DragDropProvider: (props: any) => <div data-testid="dnd-provider">{props.children}</div>,
    DragDropSensors: () => <div data-testid="dnd-sensors" />,
    DragOverlay: (props: any) => <div data-testid="drag-overlay">{props.children}</div>,
    SortableProvider: (props: any) => <div data-testid="sortable-provider">{props.children}</div>,
    useDragDropContext: vi.fn().mockReturnValue([{}, {}]),
    createSortable: () => ({
      ref: (el: any) => el,
      isActiveDraggable: false,
      transform: null,
    }),
    transformStyle: () => ({}),
    closestCenter: vi.fn(),
  }
})

// Mock WorkflowStateItem to avoid dependency issues
vi.mock('./WorkflowStateItem', () => {
  return {
    default: (props: any) => (
      <div data-testid="workflow-state-item">
        {props.item.name}
        <button
          data-testid={`remove-${props.item.id}`}
          onClick={() => props.onRemove(props.item.id)}
        >
          Remove
        </button>
      </div>
    ),
  }
})

describe('WorkflowStatesList', () => {
  const mockStates: WorkflowState[] = [
    { id: 'state-1', name: 'To Do', isStartPoint: true, isEndPoint: false },
    { id: 'state-2', name: 'In Progress', isStartPoint: false, isEndPoint: false },
    { id: 'state-3', name: 'Done', isStartPoint: false, isEndPoint: true },
  ]

  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the input for adding new states', () => {
    render(() => <WorkflowStatesList states={mockStates} onChange={mockOnChange} />)

    const input = screen.getByPlaceholderText('New state name')
    expect(input).toBeInTheDocument()

    const addButton = screen.getByText('Add')
    expect(addButton).toBeInTheDocument()
  })

  it('should render all workflow states', () => {
    render(() => <WorkflowStatesList states={mockStates} onChange={mockOnChange} />)

    // The WorkflowStateItem component would render these texts
    expect(screen.getByText('To Do')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('should set up the drag and drop environment', () => {
    render(() => <WorkflowStatesList states={mockStates} onChange={mockOnChange} />)

    expect(screen.getByTestId('dnd-provider')).toBeInTheDocument()
    expect(screen.getByTestId('dnd-sensors')).toBeInTheDocument()
    expect(screen.getByTestId('sortable-provider')).toBeInTheDocument()
    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument()
  })

  it('should add a new state when the Add button is clicked', async () => {
    render(() => <WorkflowStatesList states={mockStates} onChange={mockOnChange} />)

    const input = screen.getByPlaceholderText('New state name')
    const addButton = screen.getByText('Add')

    fireEvent.input(input, { target: { value: 'New State' } })
    fireEvent.click(addButton)

    // The onChange handler should be called with the updated states
    expect(mockOnChange).toHaveBeenCalled()
    const updatedStates = mockOnChange.mock.calls[0][0]

    // Check that the new state was added
    expect(updatedStates.length).toBe(4)
    expect(updatedStates[3].name).toBe('New State')
  })

  it('should show empty state when no workflow states exist', () => {
    render(() => <WorkflowStatesList states={[]} onChange={mockOnChange} />)

    // DragDrop providers should not be rendered when there are no items
    expect(screen.queryByTestId('dnd-provider')).not.toBeInTheDocument()
  })

  it('should handle drag events', () => {
    // Create mocks for drag handlers
    const mockDragStartHandler = vi.fn()
    const mockDragEndHandler = vi.fn()

    // Create a new mock implementation just for this test
    const MockProvider = vi.fn(props => {
      // Capture handlers when component is rendered
      if (props.onDragStart) mockDragStartHandler.mockImplementation(props.onDragStart)
      if (props.onDragEnd) mockDragEndHandler.mockImplementation(props.onDragEnd)
      return <div data-testid="dnd-provider">{props.children}</div>
    })

    // Replace the component just for this test
    vi.spyOn(solidDnd, 'DragDropProvider').mockImplementation(MockProvider as any)

    try {
      render(() => <WorkflowStatesList states={mockStates} onChange={mockOnChange} />)

      // Simulate drag start event
      const dragStartEvent = {
        draggable: { id: 'state-1' },
      }
      mockDragStartHandler(dragStartEvent)

      // Simulate drag end event with valid drop
      const dragEndEvent = {
        draggable: { id: 'state-1' },
        droppable: { id: 'state-3' },
      }
      mockDragEndHandler(dragEndEvent)

      // The onChange handler should be called with the updated states
      expect(mockOnChange).toHaveBeenCalled()
    } finally {
      // Clean up mock to avoid affecting other tests
      vi.restoreAllMocks()
    }
  })
})
