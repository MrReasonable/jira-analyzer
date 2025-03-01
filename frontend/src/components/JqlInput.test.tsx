import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@solidjs/testing-library'
import { JqlInput } from './JqlInput'
import { createSignal } from 'solid-js'

describe('JqlInput', () => {
  it('renders input field and analyze button', () => {
    const [jql] = createSignal('project = TEST')
    render(() => (
      <JqlInput
        jql={jql}
        onJqlChange={vi.fn()}
        onAnalyze={vi.fn()}
        loading={() => false}
        configSelected={() => true}
      />
    ))

    expect(screen.getByTestId('jql-input')).toBeInTheDocument()
    expect(screen.getByTestId('analyze-button')).toBeInTheDocument()
  })

  it('disables input when no configuration is selected', () => {
    const [jql] = createSignal('')
    render(() => (
      <JqlInput
        jql={jql}
        onJqlChange={vi.fn()}
        onAnalyze={vi.fn()}
        loading={() => false}
        configSelected={() => false}
      />
    ))

    expect(screen.getByTestId('jql-input')).toBeDisabled()
  })

  it('disables analyze button when loading', () => {
    const [jql] = createSignal('project = TEST')
    render(() => (
      <JqlInput
        jql={jql}
        onJqlChange={vi.fn()}
        onAnalyze={vi.fn()}
        loading={() => true}
        configSelected={() => true}
      />
    ))

    expect(screen.getByTestId('analyze-button')).toBeDisabled()
  })

  it('disables analyze button when no configuration is selected', () => {
    const [jql] = createSignal('project = TEST')
    render(() => (
      <JqlInput
        jql={jql}
        onJqlChange={vi.fn()}
        onAnalyze={vi.fn()}
        loading={() => false}
        configSelected={() => false}
      />
    ))

    expect(screen.getByTestId('analyze-button')).toBeDisabled()
  })

  it('calls onJqlChange when input changes', () => {
    const [jql] = createSignal('project = TEST')
    const onJqlChange = vi.fn()
    render(() => (
      <JqlInput
        jql={jql}
        onJqlChange={onJqlChange}
        onAnalyze={vi.fn()}
        loading={() => false}
        configSelected={() => true}
      />
    ))

    const input = screen.getByTestId('jql-input')
    fireEvent.input(input, { target: { value: 'project = NEW' } })

    expect(onJqlChange).toHaveBeenCalledWith('project = NEW')
  })

  it('calls onAnalyze when analyze button is clicked', () => {
    const [jql] = createSignal('project = TEST')
    const onAnalyze = vi.fn()
    render(() => (
      <JqlInput
        jql={jql}
        onJqlChange={vi.fn()}
        onAnalyze={onAnalyze}
        loading={() => false}
        configSelected={() => true}
      />
    ))

    const button = screen.getByTestId('analyze-button')
    fireEvent.click(button)

    expect(onAnalyze).toHaveBeenCalled()
  })

  it('shows loading spinner when loading', () => {
    const [jql] = createSignal('project = TEST')
    render(() => (
      <JqlInput
        jql={jql}
        onJqlChange={vi.fn()}
        onAnalyze={vi.fn()}
        loading={() => true}
        configSelected={() => true}
      />
    ))

    // Check for the loading spinner
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
