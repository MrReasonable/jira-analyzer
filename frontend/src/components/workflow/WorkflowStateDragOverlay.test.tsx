import { describe, it, expect } from 'vitest'
import { render, screen } from '@solidjs/testing-library'
import WorkflowStateDragOverlay from './WorkflowStateDragOverlay'
import type { WorkflowState } from '~types/workflow'

describe('WorkflowStateDragOverlay', () => {
  const mockWorkflowState: WorkflowState = {
    id: 'test-id',
    name: 'Test State',
    isStartPoint: false,
    isEndPoint: false,
  }

  it('should render the workflow state name', () => {
    render(() => <WorkflowStateDragOverlay item={mockWorkflowState} />)
    expect(screen.getByText('Test State')).toBeInTheDocument()
  })

  it('should have the correct styling for drag overlay', () => {
    const { container } = render(() => <WorkflowStateDragOverlay item={mockWorkflowState} />)

    // Get the main container div
    const overlayElement = container.firstChild as HTMLElement

    // Check for expected classes that define the drag overlay appearance
    expect(overlayElement).toHaveClass('rounded-md')
    expect(overlayElement).toHaveClass('border')
    expect(overlayElement).toHaveClass('bg-white')
    expect(overlayElement).toHaveClass('opacity-80')
    expect(overlayElement).toHaveClass('shadow-md')
  })

  it('should include the drag handle icon', () => {
    const { container } = render(() => <WorkflowStateDragOverlay item={mockWorkflowState} />)

    // Check that the SVG icon exists
    const svgElement = container.querySelector('svg')
    expect(svgElement).toBeInTheDocument()
    expect(svgElement).toHaveClass('text-gray-400')
  })
})
