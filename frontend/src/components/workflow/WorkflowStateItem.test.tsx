import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@solidjs/testing-library'
import WorkflowStateItem from './WorkflowStateItem'
import type { WorkflowState } from '~types/workflow'

// Mock the solid-dnd module
vi.mock('@thisbeyond/solid-dnd', () => {
  return {
    createSortable: () => ({
      ref: (el: any) => el,
      isActiveDraggable: false,
      transform: null,
    }),
    transformStyle: () => ({}),
  }
})

describe('WorkflowStateItem', () => {
  const mockWorkflowState: WorkflowState = {
    id: 'test-id',
    name: 'Test State',
    isStartPoint: false,
    isEndPoint: false,
  }

  const mockOnRemove = vi.fn()
  const mockOnToggleStartPoint = vi.fn()
  const mockOnToggleEndPoint = vi.fn()

  it('should render the workflow state name', () => {
    render(() => (
      <WorkflowStateItem
        item={mockWorkflowState}
        onRemove={mockOnRemove}
        onToggleStartPoint={mockOnToggleStartPoint}
        onToggleEndPoint={mockOnToggleEndPoint}
      />
    ))

    expect(screen.getByText('Test State')).toBeInTheDocument()
  })

  it('should call onRemove when remove button is clicked', () => {
    render(() => (
      <WorkflowStateItem
        item={mockWorkflowState}
        onRemove={mockOnRemove}
        onToggleStartPoint={mockOnToggleStartPoint}
        onToggleEndPoint={mockOnToggleEndPoint}
      />
    ))

    // Find the remove button (has title "Remove state")
    const removeButton = screen.getByTitle('Remove state')
    fireEvent.click(removeButton)

    // Check that the onRemove function was called with the correct ID
    expect(mockOnRemove).toHaveBeenCalledWith('test-id')
  })

  it('should call onToggleStartPoint when start button is clicked', () => {
    render(() => (
      <WorkflowStateItem
        item={mockWorkflowState}
        onRemove={mockOnRemove}
        onToggleStartPoint={mockOnToggleStartPoint}
        onToggleEndPoint={mockOnToggleEndPoint}
      />
    ))

    // Find the start button
    const startButton = screen.getByText('Start')
    fireEvent.click(startButton)

    // Check that the onToggleStartPoint function was called with the correct ID
    expect(mockOnToggleStartPoint).toHaveBeenCalledWith('test-id')
  })

  it('should call onToggleEndPoint when end button is clicked', () => {
    render(() => (
      <WorkflowStateItem
        item={mockWorkflowState}
        onRemove={mockOnRemove}
        onToggleStartPoint={mockOnToggleStartPoint}
        onToggleEndPoint={mockOnToggleEndPoint}
      />
    ))

    // Find the end button
    const endButton = screen.getByText('End')
    fireEvent.click(endButton)

    // Check that the onToggleEndPoint function was called with the correct ID
    expect(mockOnToggleEndPoint).toHaveBeenCalledWith('test-id')
  })

  it('should highlight the start button when isStartPoint is true', () => {
    const activeStartState = {
      ...mockWorkflowState,
      isStartPoint: true,
    }

    render(() => (
      <WorkflowStateItem
        item={activeStartState}
        onRemove={mockOnRemove}
        onToggleStartPoint={mockOnToggleStartPoint}
        onToggleEndPoint={mockOnToggleEndPoint}
      />
    ))

    // Find the start button and check it has the active class
    const startButton = screen.getByText('Start')
    expect(startButton).toHaveClass('bg-green-100')
    expect(startButton).toHaveClass('text-green-800')
  })

  it('should highlight the end button when isEndPoint is true', () => {
    const activeEndState = {
      ...mockWorkflowState,
      isEndPoint: true,
    }

    render(() => (
      <WorkflowStateItem
        item={activeEndState}
        onRemove={mockOnRemove}
        onToggleStartPoint={mockOnToggleStartPoint}
        onToggleEndPoint={mockOnToggleEndPoint}
      />
    ))

    // Find the end button and check it has the active class
    const endButton = screen.getByText('End')
    expect(endButton).toHaveClass('bg-purple-100')
    expect(endButton).toHaveClass('text-purple-800')
  })
})
