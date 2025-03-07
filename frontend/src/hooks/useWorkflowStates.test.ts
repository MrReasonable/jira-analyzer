import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@solidjs/testing-library'
import { useWorkflowStates } from './useWorkflowStates'
import type { WorkflowState } from '~types/workflow'

// Mock ID generator to provide deterministic IDs for testing
vi.mock('../utils/idGenerator', () => ({
  generateId: vi.fn(() => 'test-id-123'),
}))

describe('useWorkflowStates', () => {
  const mockOnChange = vi.fn()

  const initialStates: WorkflowState[] = [
    { id: '1', name: 'Todo' },
    { id: '2', name: 'In Progress' },
    { id: '3', name: 'Done' },
  ]

  beforeEach(() => {
    mockOnChange.mockReset()
  })

  it('should initialize with the provided states', () => {
    const { result } = renderHook(() => useWorkflowStates(initialStates, mockOnChange))

    expect(result.items()).toHaveLength(3)
    expect(result.items()[0].name).toBe('Todo')
    expect(result.items()[1].name).toBe('In Progress')
    expect(result.items()[2].name).toBe('Done')
  })

  it('should add a new state with a generated ID', () => {
    const { result } = renderHook(() => useWorkflowStates(initialStates, mockOnChange))

    // Set new state name and add it
    result.setNewStateName('Review')
    result.addState()

    // Verify onChange called with the new state added
    expect(mockOnChange).toHaveBeenCalled()
    const newStates = mockOnChange.mock.calls[0][0]
    expect(newStates).toHaveLength(4)
    expect(newStates[3].name).toBe('Review')
    expect(newStates[3].id).toBe('test-id-123')

    // Verify newStateName cleared after adding
    expect(result.newStateName()).toBe('')
  })

  it('should not add a state with an empty name', () => {
    const { result } = renderHook(() => useWorkflowStates(initialStates, mockOnChange))

    // Attempt to add a state with empty name
    result.setNewStateName('   ')
    result.addState()

    // Verify onChange not called
    expect(mockOnChange).not.toHaveBeenCalled()
    expect(result.items()).toHaveLength(3)
  })

  it('should remove a state', () => {
    const { result } = renderHook(() => useWorkflowStates(initialStates, mockOnChange))

    // Remove the first state
    result.removeState('1')

    // Verify onChange called with updated states
    expect(mockOnChange).toHaveBeenCalled()
    const newStates = mockOnChange.mock.calls[0][0]
    expect(newStates).toHaveLength(2)
    expect(newStates[0].id).toBe('2')
    expect(newStates[1].id).toBe('3')
  })

  it('should toggle start point status', () => {
    const { result } = renderHook(() => useWorkflowStates(initialStates, mockOnChange))

    // Toggle start point for the first state
    result.toggleStartPoint('1')

    // Verify onChange called with updated states
    expect(mockOnChange).toHaveBeenCalled()
    const newStates = mockOnChange.mock.calls[0][0]
    expect(newStates[0].isStartPoint).toBe(true)

    // Toggle it back off
    result.toggleStartPoint('1')

    // Verify toggle back
    const finalStates = mockOnChange.mock.calls[1][0]
    expect(finalStates[0].isStartPoint).toBe(false)
  })

  it('should toggle end point status', () => {
    const { result } = renderHook(() => useWorkflowStates(initialStates, mockOnChange))

    // Toggle end point for the last state
    result.toggleEndPoint('3')

    // Verify onChange called with updated states
    expect(mockOnChange).toHaveBeenCalled()
    const newStates = mockOnChange.mock.calls[0][0]
    expect(newStates[2].isEndPoint).toBe(true)

    // Toggle it back off
    result.toggleEndPoint('3')

    // Verify toggle back
    const finalStates = mockOnChange.mock.calls[1][0]
    expect(finalStates[2].isEndPoint).toBe(false)
  })

  it('should move items when reordering', () => {
    const { result } = renderHook(() => useWorkflowStates(initialStates, mockOnChange))

    // Move the first item to the second position
    result.moveItem(0, 1)

    // Verify onChange called with reordered states
    expect(mockOnChange).toHaveBeenCalled()
    const newStates = mockOnChange.mock.calls[0][0]
    expect(newStates[0].id).toBe('2')
    expect(newStates[1].id).toBe('1')
    expect(newStates[2].id).toBe('3')
  })

  it('should not reorder when source equals destination', () => {
    const { result } = renderHook(() => useWorkflowStates(initialStates, mockOnChange))

    // Try to move item to its own position
    result.moveItem(1, 1)

    // Verify onChange not called
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('should find an item by ID', () => {
    const { result } = renderHook(() => useWorkflowStates(initialStates, mockOnChange))

    // Find item by ID
    const item = result.findItemById('2')

    // Verify item found
    expect(item).toBeDefined()
    expect(item?.id).toBe('2')
    expect(item?.name).toBe('In Progress')

    // Should return null for non-existent ID
    expect(result.findItemById('nonexistent')).toBeNull()
    expect(result.findItemById(null)).toBeNull()
  })
})
