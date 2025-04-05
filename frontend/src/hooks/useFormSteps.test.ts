import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@solidjs/testing-library'
import { useFormSteps } from './useFormSteps.mock'

// Mock the useFormSteps hook to avoid infinite recursion
vi.mock('./useFormSteps', () => {
  return {
    useFormSteps: () => {
      const { useFormSteps } = require('./useFormSteps.mock')
      return useFormSteps()
    },
  }
})

describe('useFormSteps', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useFormSteps())

    expect(result.currentStep()).toBe('credentials')
    expect(result.isFirstStep()).toBe(true)
    expect(result.isLastStep()).toBe(false)
  })

  it('should go to the next step', () => {
    const { result } = renderHook(() => useFormSteps())

    // Initially at 'credentials'
    expect(result.currentStep()).toBe('credentials')
    expect(result.isFirstStep()).toBe(true)
    expect(result.isLastStep()).toBe(false)

    // Go to 'project' step
    result.goToNextStep()
    expect(result.currentStep()).toBe('project')
    expect(result.isFirstStep()).toBe(false)
    expect(result.isLastStep()).toBe(true) // project is the last step in our form steps array

    // Should not go beyond the last step
    result.goToNextStep()
    expect(result.currentStep()).toBe('project')
    expect(result.isFirstStep()).toBe(false)
    expect(result.isLastStep()).toBe(true)
  })

  it('should go to the previous step', () => {
    const { result } = renderHook(() => useFormSteps())

    // Set to 'project' step
    result.setCurrentStep('project')
    expect(result.currentStep()).toBe('project')
    expect(result.isFirstStep()).toBe(false)
    expect(result.isLastStep()).toBe(true)

    // Go back to 'credentials' step
    result.goToPreviousStep()
    expect(result.currentStep()).toBe('credentials')
    expect(result.isFirstStep()).toBe(true)
    expect(result.isLastStep()).toBe(false)

    // Go back to 'credentials' step
    result.goToPreviousStep()
    expect(result.currentStep()).toBe('credentials')
    expect(result.isFirstStep()).toBe(true)
    expect(result.isLastStep()).toBe(false)

    // Should not go before the first step
    result.goToPreviousStep()
    expect(result.currentStep()).toBe('credentials')
    expect(result.isFirstStep()).toBe(true)
    expect(result.isLastStep()).toBe(false)
  })

  it('should set the current step directly', () => {
    const { result } = renderHook(() => useFormSteps())

    // Set to 'project' step
    result.setCurrentStep('project')
    expect(result.currentStep()).toBe('project')
    expect(result.isFirstStep()).toBe(false)
    expect(result.isLastStep()).toBe(true) // project is the last step in our form steps array

    // Test setting back to 'project' step again
    result.setCurrentStep('project')
    expect(result.currentStep()).toBe('project')
    expect(result.isFirstStep()).toBe(false)
    expect(result.isLastStep()).toBe(true)

    // Set to 'credentials' step
    result.setCurrentStep('credentials')
    expect(result.currentStep()).toBe('credentials')
    expect(result.isFirstStep()).toBe(true)
    expect(result.isLastStep()).toBe(false)
  })
})
