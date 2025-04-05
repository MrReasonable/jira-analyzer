/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@solidjs/testing-library'
import { ConfigurationSection } from './ConfigurationSection'
import { WorkflowState } from '~/types/workflow'

// Mock the child components
vi.mock('./ConfigurationsHeader', () => ({
  ConfigurationsHeader: (props: any) => (
    <div data-testid="configurations-header">
      <button onClick={() => props.onSelect('Test Config')}>Select</button>
      <button onClick={() => props.onEdit('Test Config')}>Edit</button>
      <button onClick={() => props.onDelete('Test Config')}>Delete</button>
      <button onClick={props.onAddClick}>Add</button>
    </div>
  ),
}))

vi.mock('./WorkflowEditor', () => ({
  WorkflowEditor: (props: any) => (
    <div data-testid="workflow-editor">
      <button onClick={() => props.onCancel()}>Cancel</button>
      <button onClick={() => props.onSave()}>Save</button>
    </div>
  ),
}))

vi.mock('./WorkflowViewer', () => ({
  WorkflowViewer: (props: any) => (
    <div data-testid="workflow-viewer">
      <button onClick={() => props.onEditClick()}>Edit Workflow</button>
      <button onClick={() => props.onAnalyze()}>Analyze</button>
      <input
        data-testid="config-name-input"
        value={props.configName()}
        onInput={(e: any) => props.onConfigNameChange(e.target.value)}
      />
      <button onClick={() => props.onSaveAs()}>Save As</button>
    </div>
  ),
}))

describe('ConfigurationSection', () => {
  const mockWorkflowStates: WorkflowState[] = [
    { id: '1', name: 'Todo', isStartPoint: true, isEndPoint: false },
    { id: '2', name: 'In Progress', isStartPoint: false, isEndPoint: false },
    { id: '3', name: 'Done', isStartPoint: false, isEndPoint: true },
  ]

  const defaultProps = {
    configurations: () => [
      {
        name: 'Test Config',
        jira_server: 'https://test.atlassian.net',
        jira_email: 'test@example.com',
      },
    ],
    loading: () => false,
    selectedConfig: () => 'Test Config',
    onSelect: vi.fn(async () => true),
    onEdit: vi.fn(async () => {}),
    onDelete: vi.fn(async () => true),
    onAddClick: vi.fn(),
    activeConfig: () => ({
      name: 'Test Config',
      jira_server: 'https://test.atlassian.net',
      jira_email: 'test@example.com',
      jira_api_token: 'test-token',
      jql_query: 'project = TEST',
      project_key: 'TEST',
      workflow_states: ['Todo', 'In Progress', 'Done'],
      lead_time_start_state: 'Todo',
      lead_time_end_state: 'Done',
      cycle_time_start_state: 'In Progress',
      cycle_time_end_state: 'Done',
    }),
    workflowStates: () => mockWorkflowStates,
    setWorkflowStates: vi.fn(),
    editingWorkflow: () => false,
    setEditingWorkflow: vi.fn(),
    saveCurrentConfig: vi.fn(),
    savingConfig: () => false,
    jql: () => 'project = TEST',
    onJqlChange: vi.fn(),
    onAnalyze: vi.fn(),
    isLoading: () => false,
    configName: () => '',
    onConfigNameChange: vi.fn(),
    saveNewConfig: vi.fn(),
  }

  it('renders the configuration section', () => {
    render(() => <ConfigurationSection {...defaultProps} />)

    expect(screen.getByText('Configuration')).toBeInTheDocument()
    expect(screen.getByTestId('configurations-header')).toBeInTheDocument()
  })

  it('shows workflow viewer when not editing workflow', () => {
    render(() => <ConfigurationSection {...defaultProps} />)

    expect(screen.getByTestId('workflow-viewer')).toBeInTheDocument()
  })

  it('shows workflow editor when editing workflow', () => {
    const props = {
      ...defaultProps,
      editingWorkflow: () => true,
    }

    render(() => <ConfigurationSection {...props} />)

    expect(screen.getByTestId('workflow-editor')).toBeInTheDocument()
  })

  it('handles edit workflow button click', () => {
    render(() => <ConfigurationSection {...defaultProps} />)

    const editButton = screen.getByText('Edit Workflow')
    fireEvent.click(editButton)

    expect(defaultProps.setEditingWorkflow).toHaveBeenCalledWith(true)
  })

  it('handles save workflow button click', () => {
    const props = {
      ...defaultProps,
      editingWorkflow: () => true,
    }

    render(() => <ConfigurationSection {...props} />)

    const saveButton = screen.getByText('Save')
    fireEvent.click(saveButton)

    expect(defaultProps.saveCurrentConfig).toHaveBeenCalled()
  })

  it('handles cancel workflow edit button click', () => {
    const props = {
      ...defaultProps,
      editingWorkflow: () => true,
    }

    render(() => <ConfigurationSection {...props} />)

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(defaultProps.setEditingWorkflow).toHaveBeenCalledWith(false)
  })

  it('handles analyze button click', () => {
    render(() => <ConfigurationSection {...defaultProps} />)

    const analyzeButton = screen.getByText('Analyze')
    fireEvent.click(analyzeButton)

    expect(defaultProps.onAnalyze).toHaveBeenCalled()
  })

  it('handles save as button click', () => {
    render(() => <ConfigurationSection {...defaultProps} />)

    const saveAsButton = screen.getByText('Save As')
    fireEvent.click(saveAsButton)

    expect(defaultProps.saveNewConfig).toHaveBeenCalled()
  })

  it('handles config name change', () => {
    render(() => <ConfigurationSection {...defaultProps} />)

    const input = screen.getByTestId('config-name-input')
    fireEvent.input(input, { target: { value: 'New Config' } })

    expect(defaultProps.onConfigNameChange).toHaveBeenCalledWith('New Config')
  })
})
