/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@solidjs/testing-library'
import { WorkflowViewer } from './WorkflowViewer'
import { WorkflowState } from '~/types/workflow'

// Mock the JqlInput component
vi.mock('./JqlInput', () => ({
  JqlInput: (props: any) => (
    <div data-testid="jql-input">
      <textarea
        data-testid="jql-textarea"
        value={props.jql()}
        onInput={(e: any) => props.onJqlChange(e.target.value)}
      />
      <button
        data-testid="analyze-button"
        onClick={props.onAnalyze}
        disabled={!props.configSelected()}
      >
        {props.loading() ? 'Analyzing...' : 'Analyze'}
      </button>
    </div>
  ),
}))

describe('WorkflowViewer', () => {
  const mockWorkflowStates: WorkflowState[] = [
    { id: '1', name: 'Todo', isStartPoint: true, isEndPoint: false },
    { id: '2', name: 'In Progress', isStartPoint: false, isEndPoint: false },
    { id: '3', name: 'Done', isStartPoint: false, isEndPoint: true },
  ]

  const defaultProps = {
    workflowStates: () => mockWorkflowStates,
    onEditClick: vi.fn(),
    jql: () => 'project = TEST',
    onJqlChange: vi.fn(),
    onAnalyze: vi.fn(),
    isLoading: () => false,
    configSelected: () => true,
    configName: () => '',
    onConfigNameChange: vi.fn(),
    onSaveAs: vi.fn(),
    isSaving: () => false,
  }

  it('renders the workflow viewer', () => {
    render(() => <WorkflowViewer {...defaultProps} />)

    expect(screen.getByText('Workflow States')).toBeInTheDocument()
    expect(screen.getByText('JQL Query')).toBeInTheDocument()
    expect(screen.getByTestId('jql-input')).toBeInTheDocument()
  })

  it('displays workflow states', () => {
    render(() => <WorkflowViewer {...defaultProps} />)

    expect(screen.getByText('Todo (Start)')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Done (End)')).toBeInTheDocument()
  })

  it('displays a message when no workflow states are defined', () => {
    const props = {
      ...defaultProps,
      workflowStates: () => [],
    }

    render(() => <WorkflowViewer {...props} />)

    expect(screen.getByText('No workflow states defined')).toBeInTheDocument()
  })

  it('handles edit workflow button click', () => {
    render(() => <WorkflowViewer {...defaultProps} />)

    const editButton = screen.getByText('Edit Workflow')
    fireEvent.click(editButton)

    expect(defaultProps.onEditClick).toHaveBeenCalled()
  })

  it('handles JQL change', () => {
    render(() => <WorkflowViewer {...defaultProps} />)

    const jqlTextarea = screen.getByTestId('jql-textarea')
    fireEvent.input(jqlTextarea, { target: { value: 'project = CUSTOM' } })

    expect(defaultProps.onJqlChange).toHaveBeenCalledWith('project = CUSTOM')
  })

  it('handles analyze button click', () => {
    render(() => <WorkflowViewer {...defaultProps} />)

    const analyzeButton = screen.getByTestId('analyze-button')
    fireEvent.click(analyzeButton)

    expect(defaultProps.onAnalyze).toHaveBeenCalled()
  })

  it('handles config name change', () => {
    render(() => <WorkflowViewer {...defaultProps} />)

    const input = screen.getByPlaceholderText('Save as new configuration...')
    fireEvent.input(input, { target: { value: 'New Config' } })

    expect(defaultProps.onConfigNameChange).toHaveBeenCalledWith('New Config')
  })

  it('handles save as button click', () => {
    const props = {
      ...defaultProps,
      configName: () => 'New Config',
    }

    render(() => <WorkflowViewer {...props} />)

    const saveAsButton = screen.getByText('Save As')
    fireEvent.click(saveAsButton)

    expect(defaultProps.onSaveAs).toHaveBeenCalled()
  })

  it('disables save as button when config name is empty', () => {
    render(() => <WorkflowViewer {...defaultProps} />)

    const saveAsButton = screen.getByText('Save As')
    expect(saveAsButton).toBeDisabled()
  })

  it('disables save as button when saving', () => {
    const props = {
      ...defaultProps,
      configName: () => 'New Config',
      isSaving: () => true,
    }

    render(() => <WorkflowViewer {...props} />)

    const saveAsButton = screen.getByText('Saving...')
    expect(saveAsButton).toBeDisabled()
  })
})
