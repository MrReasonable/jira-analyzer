import { describe, it, expect } from 'vitest'
import type { WorkflowState } from './workflow'

describe('workflow types', () => {
  it('should correctly type a WorkflowState', () => {
    // Create a workflow state conforming to the interface
    const workflowState: WorkflowState = {
      id: 'state-1',
      name: 'To Do',
      isStartPoint: true,
      isEndPoint: false,
    }

    // Assert that the object has the expected properties
    expect(workflowState).toHaveProperty('id')
    expect(workflowState).toHaveProperty('name')
    expect(workflowState).toHaveProperty('isStartPoint')
    expect(workflowState).toHaveProperty('isEndPoint')

    // Assert the property types
    expect(typeof workflowState.id).toBe('string')
    expect(typeof workflowState.name).toBe('string')
    expect(typeof workflowState.isStartPoint).toBe('boolean')
    expect(typeof workflowState.isEndPoint).toBe('boolean')
  })

  it('should allow optional start/end point properties', () => {
    // Create a workflow state with only required properties
    const minimalState: WorkflowState = {
      id: 'state-2',
      name: 'In Progress',
    }

    // Assert that the object has the expected properties
    expect(minimalState).toHaveProperty('id')
    expect(minimalState).toHaveProperty('name')

    // Optional properties should be undefined
    expect(minimalState.isStartPoint).toBeUndefined()
    expect(minimalState.isEndPoint).toBeUndefined()
  })
})
