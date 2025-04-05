/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@solidjs/testing-library'
import { ConfigurationDialog } from './ConfigurationDialog'

// Mock the Dialog component from @kobalte/core
vi.mock('@kobalte/core', () => {
  return {
    Dialog: {
      Root: (props: any) => (
        <div data-testid="dialog-root" data-open={props.open}>
          {props.open && props.children}
        </div>
      ),
      Portal: (props: any) => <div data-testid="dialog-portal">{props.children}</div>,
      Overlay: (props: any) => <div data-testid="dialog-overlay">{props.children}</div>,
      Content: (props: any) => <div data-testid="dialog-content">{props.children}</div>,
      Title: (props: any) => <h2 data-testid="dialog-title">{props.children}</h2>,
      CloseButton: (props: any) => (
        <button data-testid="dialog-close-button" onClick={() => props.onClick?.()}>
          {props.children}
        </button>
      ),
    },
  }
})

// Mock the ConfigurationForm component
vi.mock('./ConfigurationForm', () => ({
  ConfigurationForm: (props: any) => (
    <div data-testid="configuration-form">
      <button
        data-testid="mock-save-config"
        onClick={() => props.onConfigurationSaved('Test Config')}
      >
        Save Configuration
      </button>
      <div>Initial Config: {props.initialConfig?.name || 'None'}</div>
    </div>
  ),
}))

describe('ConfigurationDialog', () => {
  const mockConfig = {
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
  }

  const defaultProps = {
    isOpen: () => true,
    onOpenChange: vi.fn(),
    configToEdit: () => undefined,
    onConfigurationSaved: vi.fn(),
  }

  it('renders the dialog when open', () => {
    render(() => <ConfigurationDialog {...defaultProps} />)

    expect(screen.getByTestId('dialog-root')).toHaveAttribute('data-open', 'true')
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument()
    expect(screen.getByText('Add Configuration')).toBeInTheDocument()
  })

  it('does not render the dialog when closed', () => {
    const props = {
      ...defaultProps,
      isOpen: () => false,
    }

    render(() => <ConfigurationDialog {...props} />)

    expect(screen.getByTestId('dialog-root')).toHaveAttribute('data-open', 'false')
    expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument()
  })

  it('shows edit title when editing a configuration', () => {
    const props = {
      ...defaultProps,
      configToEdit: () => mockConfig,
    }

    render(() => <ConfigurationDialog {...props} />)

    expect(screen.getByText('Edit Configuration')).toBeInTheDocument()
    expect(screen.getByText('Initial Config: Test Config')).toBeInTheDocument()
  })

  it('handles configuration saved event', () => {
    render(() => <ConfigurationDialog {...defaultProps} />)

    const saveButton = screen.getByText('Save Configuration')
    fireEvent.click(saveButton)

    expect(defaultProps.onConfigurationSaved).toHaveBeenCalledWith('Test Config')
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('handles close button click', () => {
    render(() => <ConfigurationDialog {...defaultProps} />)

    const closeButton = screen.getByTestId('dialog-close-button')
    fireEvent.click(closeButton)

    expect(defaultProps.onOpenChange).toHaveBeenCalled()
  })
})
