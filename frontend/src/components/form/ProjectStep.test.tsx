/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@solidjs/testing-library'
import { ProjectStep } from './ProjectStep'

describe('ProjectStep', () => {
  const mockProjects = [
    { key: 'TEST', name: 'Test Project' },
    { key: 'DEV', name: 'Development Project' },
  ]

  const defaultProps = {
    projectKey: () => '',
    onProjectKeyChange: vi.fn(),
    jqlQuery: () => '',
    onJqlQueryChange: vi.fn(),
    projects: () => mockProjects,
    error: () => '',
  }

  it('renders the project selection and JQL query fields', () => {
    render(() => <ProjectStep {...defaultProps} />)

    expect(screen.getByLabelText('Jira Project')).toBeInTheDocument()
    expect(screen.getByLabelText('Default JQL Query')).toBeInTheDocument()
  })

  it('shows loading indicator when isLoading is true', () => {
    const props = {
      ...defaultProps,
      isLoading: () => true,
    }

    render(() => <ProjectStep {...props} />)

    expect(screen.getByText('Loading projects...')).toBeInTheDocument()
    expect(screen.queryByLabelText('Jira Project')).not.toBeInTheDocument()
  })

  it('shows no projects message when projects array is empty', () => {
    const props = {
      ...defaultProps,
      projects: () => [],
    }

    render(() => <ProjectStep {...props} />)

    expect(
      screen.getByText('No projects found. Please check your Jira credentials and permissions.')
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Jira Project')).not.toBeInTheDocument()
  })

  it('displays the provided values', () => {
    const props = {
      ...defaultProps,
      projectKey: () => 'TEST',
      jqlQuery: () => 'project = TEST',
    }

    render(() => <ProjectStep {...props} />)

    expect(screen.getByLabelText('Jira Project')).toHaveValue('TEST')
    expect(screen.getByLabelText('Default JQL Query')).toHaveValue('project = TEST')
  })

  it('renders project options from the provided projects', () => {
    render(() => <ProjectStep {...defaultProps} />)

    // Open the select dropdown
    const select = screen.getByLabelText('Jira Project')
    fireEvent.click(select)

    // Check that the options are rendered
    expect(screen.getByText('TEST - Test Project')).toBeInTheDocument()
    expect(screen.getByText('DEV - Development Project')).toBeInTheDocument()
  })

  it('calls onProjectKeyChange when a project is selected', () => {
    render(() => <ProjectStep {...defaultProps} />)

    const select = screen.getByLabelText('Jira Project')
    fireEvent.change(select, { target: { value: 'TEST' } })

    expect(defaultProps.onProjectKeyChange).toHaveBeenCalledWith('TEST')
  })

  it('calls onJqlQueryChange when JQL query is changed', () => {
    render(() => <ProjectStep {...defaultProps} />)

    const jqlInput = screen.getByLabelText('Default JQL Query')
    fireEvent.input(jqlInput, { target: { value: 'project = TEST AND type = Story' } })

    expect(defaultProps.onJqlQueryChange).toHaveBeenCalledWith('project = TEST AND type = Story')
  })

  it('displays error message when there is an error', () => {
    const props = {
      ...defaultProps,
      error: () => 'Please select a project',
    }

    render(() => <ProjectStep {...props} />)

    expect(screen.getByText('Please select a project')).toBeInTheDocument()
  })

  it('shows a placeholder when no project is selected', () => {
    render(() => <ProjectStep {...defaultProps} />)

    const select = screen.getByLabelText('Jira Project')
    expect(select).toHaveValue('')
    expect(screen.getByText('Select a project')).toBeInTheDocument()
  })

  it('automatically generates a JQL query when a project is selected', () => {
    const props = {
      ...defaultProps,
      projectKey: () => 'TEST',
      jqlQuery: () => 'project = TEST',
    }

    render(() => <ProjectStep {...props} />)

    expect(screen.getByLabelText('Default JQL Query')).toHaveValue('project = TEST')
  })
})
