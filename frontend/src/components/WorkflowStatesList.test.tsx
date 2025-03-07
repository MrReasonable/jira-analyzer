import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@solidjs/testing-library'
import { WorkflowStatesList } from '@components/workflow'
import type { WorkflowState } from '@types/workflow'

describe('WorkflowStatesList', () => {
  const mockOnChange = vi.fn()

  const sampleStates: WorkflowState[] = [
    { id: '1', name: 'Todo' },
    { id: '2', name: 'In Progress' },
    { id: '3', name: 'Done' },
  ]

  // Reset the mock before each test
  beforeEach(() => {
    mockOnChange.mockReset()
  })

  it('renders all workflow states', () => {
    render(() => <WorkflowStatesList states={sampleStates} onChange={mockOnChange} />)

    // Check that all states are rendered
    expect(screen.getByText('Todo')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('allows adding a new state', () => {
    render(() => <WorkflowStatesList states={sampleStates} onChange={mockOnChange} />)

    // Add a new state
    const input = screen.getByPlaceholderText('New state name')
    const addButton = screen.getByRole('button', { name: 'Add' })

    fireEvent.input(input, { target: { value: 'Review' } })
    fireEvent.click(addButton)

    // Verify that onChange was called with the new state added
    expect(mockOnChange).toHaveBeenCalled()
    const lastCall = mockOnChange.mock.calls.length - 1
    const newStates = mockOnChange.mock.calls[lastCall][0]
    expect(newStates.length).toBe(4)
    expect(newStates[3].name).toBe('Review')
  })

  it('allows removing a state', () => {
    render(() => <WorkflowStatesList states={sampleStates} onChange={mockOnChange} />)

    // Find and click the first delete button
    const removeButtons = screen.getAllByTitle('Remove state')
    fireEvent.click(removeButtons[0])

    // Verify that onChange was called with the state removed
    expect(mockOnChange).toHaveBeenCalled()
    const lastCall = mockOnChange.mock.calls.length - 1
    const newStates = mockOnChange.mock.calls[lastCall][0]
    expect(newStates.length).toBe(2)
    expect(newStates[0].name).toBe('In Progress')
    expect(newStates[1].name).toBe('Done')
  })

  it('allows marking a state as a start point', () => {
    render(() => <WorkflowStatesList states={sampleStates} onChange={mockOnChange} />)

    // Click the first Start button
    const startButtons = screen.getAllByTitle('Mark as start point')
    fireEvent.click(startButtons[0])

    // Verify that onChange was called with the state marked as a start point
    expect(mockOnChange).toHaveBeenCalled()
    const lastCall = mockOnChange.mock.calls.length - 1
    const newStates = mockOnChange.mock.calls[lastCall][0]
    expect(newStates.some((state: WorkflowState) => state.isStartPoint)).toBe(true)
  })

  it('allows marking a state as an end point', () => {
    render(() => <WorkflowStatesList states={sampleStates} onChange={mockOnChange} />)

    // Click the End button for the Done state
    const endButtons = screen.getAllByTitle('Mark as end point')
    fireEvent.click(endButtons[2]) // The Done state

    // Verify that onChange was called with the state marked as an end point
    expect(mockOnChange).toHaveBeenCalled()
    const lastCall = mockOnChange.mock.calls.length - 1
    const newStates = mockOnChange.mock.calls[lastCall][0]
    expect(newStates.some((state: WorkflowState) => state.isEndPoint)).toBe(true)
  })
})
