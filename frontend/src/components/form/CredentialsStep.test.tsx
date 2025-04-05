/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@solidjs/testing-library'
import { CredentialsStep } from './CredentialsStep'

describe('CredentialsStep', () => {
  const defaultProps = {
    name: () => 'Test Config',
    jiraServer: () => 'https://test.atlassian.net',
    jiraEmail: () => 'test@example.com',
    jiraApiToken: () => 'test-token',
    onNameChange: vi.fn(),
    onJiraServerChange: vi.fn(),
    onJiraEmailChange: vi.fn(),
    onJiraApiTokenChange: vi.fn(),
    error: () => '',
    isEditMode: false,
  }

  it('renders the credentials form fields', () => {
    render(() => <CredentialsStep {...defaultProps} />)

    expect(screen.getByLabelText('Configuration Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Jira Server URL')).toBeInTheDocument()
    expect(screen.getByLabelText('Jira Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Jira API Token')).toBeInTheDocument()
    // No longer checking for the Check Credentials button
  })

  it('displays the provided values', () => {
    render(() => <CredentialsStep {...defaultProps} />)

    expect(screen.getByLabelText('Configuration Name')).toHaveValue('Test Config')
    expect(screen.getByLabelText('Jira Server URL')).toHaveValue('https://test.atlassian.net')
    expect(screen.getByLabelText('Jira Email')).toHaveValue('test@example.com')
    expect(screen.getByLabelText('Jira API Token')).toHaveValue('test-token')
  })

  it('disables the name field in edit mode', () => {
    const props = {
      ...defaultProps,
      isEditMode: true,
    }

    render(() => <CredentialsStep {...props} />)

    expect(screen.getByLabelText('Configuration Name')).toBeDisabled()
  })

  it('calls the change handlers when input values change', () => {
    render(() => <CredentialsStep {...defaultProps} />)

    fireEvent.input(screen.getByLabelText('Configuration Name'), {
      target: { value: 'New Config' },
    })
    expect(defaultProps.onNameChange).toHaveBeenCalledWith('New Config')

    fireEvent.input(screen.getByLabelText('Jira Server URL'), {
      target: { value: 'https://new.atlassian.net' },
    })
    expect(defaultProps.onJiraServerChange).toHaveBeenCalledWith('https://new.atlassian.net')

    fireEvent.input(screen.getByLabelText('Jira Email'), { target: { value: 'new@example.com' } })
    expect(defaultProps.onJiraEmailChange).toHaveBeenCalledWith('new@example.com')

    fireEvent.input(screen.getByLabelText('Jira API Token'), { target: { value: 'new-token' } })
    expect(defaultProps.onJiraApiTokenChange).toHaveBeenCalledWith('new-token')
  })

  // Removed tests for the Check Credentials button

  it('displays error message when there is an error', () => {
    const props = {
      ...defaultProps,
      error: () => 'Failed to validate credentials',
    }

    render(() => <CredentialsStep {...props} />)

    expect(screen.getByText('Failed to validate credentials')).toBeInTheDocument()
  })
})
