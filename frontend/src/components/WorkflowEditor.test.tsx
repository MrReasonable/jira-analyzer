/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@solidjs/testing-library'
import { WorkflowEditor } from './WorkflowEditor'
import { WorkflowState } from '~/types/workflow'

// Mock the WorkflowStatesList component
vi.mock('./workflow/WorkflowStatesList', () => ({
  WorkflowStatesList: (props: any) => (
    <div data-testid="workflow-states-list">
      <button
        data-testid="mock-update-states"
        onClick={() =>
          props.onChange([
            { id: '1', name: 'Todo', isStartPoint: true, isEndPoint: false },
            { id: '2', name: 'In Progress', isStartPoint: false, isEndPoint: false },
            { id: '3', name: 'Done', isStartPoint: false, isEndPoint: true },
          ])
        }
      >
        Update States
      </button>
      <div>Current States: {props.states.length}</div>
    </div>
  ),
}))

describe('WorkflowEditor', () => {
  const mockWorkflowStates: WorkflowState[] = [
    { id: '1', name: 'Todo', isStartPoint: false, isEndPoint: false },
    { id: '2', name: 'In Progress', isStartPoint: false, isEndPoint: false },
  ]

  const defaultProps = {
    workflowStates: () => mockWorkflowStates,
    setWorkflowStates: vi.fn(),
    onCancel: vi.fn(),
    onSave: vi.fn(),
    isSaving: () => false,
  }

  const withJiraProps = {
    ...defaultProps,
    projectKey: 'TEST',
    onImportFromJira: vi.fn(),
    isImportingFromJira: () => false,
    importError: () => null,
  }

  it('renders the workflow editor', () => {
    render(() => <WorkflowEditor {...defaultProps} />)

    expect(screen.getByText('Edit Workflow States')).toBeInTheDocument()
    expect(screen.getByTestId('workflow-states-list')).toBeInTheDocument()
    expect(screen.getByText('Current States: 2')).toBeInTheDocument()
  })

  it('handles cancel button click', () => {
    render(() => <WorkflowEditor {...defaultProps} />)

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(defaultProps.onCancel).toHaveBeenCalled()
  })

  it('handles save button click', () => {
    render(() => <WorkflowEditor {...defaultProps} />)

    const saveButton = screen.getByText('Save Workflow')
    fireEvent.click(saveButton)

    expect(defaultProps.onSave).toHaveBeenCalled()
  })

  it('disables save button when saving', () => {
    const props = {
      ...defaultProps,
      isSaving: () => true,
    }

    render(() => <WorkflowEditor {...props} />)

    const saveButton = screen.getByText('Saving...')
    expect(saveButton).toBeDisabled()
  })

  it('updates workflow states when changed', () => {
    render(() => <WorkflowEditor {...defaultProps} />)

    const updateButton = screen.getByTestId('mock-update-states')
    fireEvent.click(updateButton)

    expect(defaultProps.setWorkflowStates).toHaveBeenCalledWith([
      { id: '1', name: 'Todo', isStartPoint: true, isEndPoint: false },
      { id: '2', name: 'In Progress', isStartPoint: false, isEndPoint: false },
      { id: '3', name: 'Done', isStartPoint: false, isEndPoint: true },
    ])
  })

  it('renders import section when project key and import function are provided', () => {
    render(() => <WorkflowEditor {...withJiraProps} />)

    expect(screen.getByText('Import from Jira')).toBeInTheDocument()
    expect(screen.getByText('Import Workflow')).toBeInTheDocument()
  })

  it('does not render import section when project key is missing', () => {
    const propsWithoutProject = {
      ...withJiraProps,
      projectKey: undefined,
    }

    render(() => <WorkflowEditor {...propsWithoutProject} />)

    expect(screen.queryByText('Import from Jira')).not.toBeInTheDocument()
  })

  it('handles import button click', () => {
    render(() => <WorkflowEditor {...withJiraProps} />)

    const importButton = screen.getByText('Import Workflow')
    fireEvent.click(importButton)

    expect(withJiraProps.onImportFromJira).toHaveBeenCalledWith('TEST')
  })

  it('disables import button when importing', () => {
    const props = {
      ...withJiraProps,
      isImportingFromJira: () => true,
    }

    render(() => <WorkflowEditor {...props} />)

    const importButton = screen.getByText('Importing...')
    expect(importButton).toBeDisabled()
  })

  it('displays error message when import fails', () => {
    const props = {
      ...withJiraProps,
      importError: () => 'Failed to fetch workflow states',
    }

    render(() => <WorkflowEditor {...props} />)

    expect(
      screen.getByText('Error importing workflow: Failed to fetch workflow states')
    ).toBeInTheDocument()
  })
})
