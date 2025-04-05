/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@solidjs/testing-library'
import { FormStepper, StepInfo } from './FormStepper'

describe('FormStepper', () => {
  const steps: StepInfo[] = [
    { id: 'credentials', title: 'Credentials', description: 'Enter Jira credentials' },
    { id: 'project', title: 'Project', description: 'Select a project' },
  ]

  it('renders the stepper with steps', () => {
    render(() => (
      <FormStepper
        steps={steps}
        currentStep={() => 'credentials'}
        description={() => 'Step 1: Enter your Jira credentials'}
      />
    ))

    expect(screen.getByText('Credentials')).toBeInTheDocument()
    expect(screen.getByText('Project')).toBeInTheDocument()
    expect(screen.getByText('Step 1: Enter your Jira credentials')).toBeInTheDocument()
  })

  it('highlights the current step', () => {
    render(() => (
      <FormStepper
        steps={steps}
        currentStep={() => 'credentials'}
        description={() => 'Step description'}
      />
    ))

    // Check that the first step has the current step styling
    const firstStepTitle = screen.getByText('Credentials')
    const firstStepContainer = firstStepTitle.closest('div')?.parentElement
    expect(firstStepContainer).toHaveClass('text-blue-600')
  })

  it('highlights completed steps', () => {
    render(() => (
      <FormStepper
        steps={steps}
        currentStep={() => 'project'}
        description={() => 'Step description'}
      />
    ))

    // First step should be marked as completed
    const firstStepTitle = screen.getByText('Credentials')
    const firstStepContainer = firstStepTitle.closest('div')?.parentElement
    expect(firstStepContainer).toHaveClass('text-green-600')

    // Second step should be current
    const secondStepTitle = screen.getByText('Project')
    const secondStepContainer = secondStepTitle.closest('div')?.parentElement
    expect(secondStepContainer).toHaveClass('text-blue-600')
  })

  it('renders the correct number of steps', () => {
    const manySteps: StepInfo[] = [
      { id: 'step1', title: 'Step 1', description: 'First step' },
      { id: 'step2', title: 'Step 2', description: 'Second step' },
      { id: 'step3', title: 'Step 3', description: 'Third step' },
      { id: 'step4', title: 'Step 4', description: 'Fourth step' },
      { id: 'step5', title: 'Step 5', description: 'Fifth step' },
    ]

    render(() => (
      <FormStepper
        steps={manySteps}
        currentStep={() => 'step3'}
        description={() => 'Step description'}
      />
    ))

    // Check that all 5 steps are rendered
    expect(screen.getByText('Step 1')).toBeInTheDocument()
    expect(screen.getByText('Step 2')).toBeInTheDocument()
    expect(screen.getByText('Step 3')).toBeInTheDocument()
    expect(screen.getByText('Step 4')).toBeInTheDocument()
    expect(screen.getByText('Step 5')).toBeInTheDocument()

    // First two steps should be completed
    const step1Title = screen.getByText('Step 1')
    const step1Container = step1Title.closest('div')?.parentElement
    expect(step1Container).toHaveClass('text-green-600')

    const step2Title = screen.getByText('Step 2')
    const step2Container = step2Title.closest('div')?.parentElement
    expect(step2Container).toHaveClass('text-green-600')

    // Third step should be current
    const step3Title = screen.getByText('Step 3')
    const step3Container = step3Title.closest('div')?.parentElement
    expect(step3Container).toHaveClass('text-blue-600')

    // Last two steps should be inactive
    const step4Title = screen.getByText('Step 4')
    const step4Container = step4Title.closest('div')?.parentElement
    expect(step4Container).toHaveClass('text-gray-400')

    const step5Title = screen.getByText('Step 5')
    const step5Container = step5Title.closest('div')?.parentElement
    expect(step5Container).toHaveClass('text-gray-400')
  })
})
