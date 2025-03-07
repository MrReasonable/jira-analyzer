import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@solidjs/testing-library'
import { ConfigurationsHeader } from './ConfigurationsHeader'
import { createSignal } from 'solid-js'
import { logger } from '@utils/logger'
import { JiraConfigurationList } from '@api/jiraApi'

// Mock the logger
vi.mock('@utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('ConfigurationsHeader', () => {
  it('renders the configuration list and add button', () => {
    const [configurations] = createSignal<JiraConfigurationList[]>([
      { name: 'Config 1', jira_server: 'https://jira.example.com', jira_email: 'user@example.com' },
    ])
    const [loading] = createSignal(false)
    const [selectedConfig] = createSignal('Config 1')

    render(() => (
      <ConfigurationsHeader
        configurations={configurations}
        loading={loading}
        selectedConfig={selectedConfig}
        onSelect={vi.fn()}
        onDelete={vi.fn().mockResolvedValue(true)}
        onAddClick={vi.fn()}
      />
    ))

    // Check that the ConfigurationList component is rendered
    // (We can't directly test the component, but we can check for elements that should be present)
    expect(screen.getByTestId('add-config-button')).toBeInTheDocument()
  })

  it('calls onAddClick when add button is clicked', () => {
    const [configurations] = createSignal([])
    const [loading] = createSignal(false)
    const [selectedConfig] = createSignal(undefined)
    const onAddClick = vi.fn()

    render(() => (
      <ConfigurationsHeader
        configurations={configurations}
        loading={loading}
        selectedConfig={selectedConfig}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onAddClick={onAddClick}
      />
    ))

    const addButton = screen.getByTestId('add-config-button')
    fireEvent.click(addButton)

    expect(onAddClick).toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith('User clicked Add Configuration button')
  })

  it('renders correctly when loading', () => {
    const [configurations] = createSignal<JiraConfigurationList[]>([
      { name: 'Config 1', jira_server: 'https://jira.example.com', jira_email: 'user@example.com' },
    ])
    const [loading] = createSignal(true)
    const [selectedConfig] = createSignal('Config 1')

    render(() => (
      <ConfigurationsHeader
        configurations={configurations}
        loading={loading}
        selectedConfig={selectedConfig}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onAddClick={vi.fn()}
      />
    ))

    // Verify the add button is still present when loading
    expect(screen.getByTestId('add-config-button')).toBeInTheDocument()
  })
})
