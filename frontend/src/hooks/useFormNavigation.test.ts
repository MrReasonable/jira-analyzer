/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFormNavigation } from './useFormNavigation'
import { FormStep, StepError } from '../types/configurationForm'
import { logger } from '../utils/logger'

// Mock the logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('useFormNavigation', () => {
  // Common test variables
  let currentStepValue: FormStep
  let stepErrorsValue: StepError
  let credentialsValidValue: boolean

  // Mock functions
  let currentStep: () => FormStep
  let setCurrentStep: (step: FormStep) => void
  let isFirstStep: () => boolean
  let baseGoToNextStep: () => void
  let validateStep: (step: FormStep) => boolean
  let credentialsValid: () => boolean
  let setCredentialsValid: (valid: boolean) => void
  let validateCredentials: (onSuccess?: () => void) => Promise<void>
  let stepErrors: () => StepError
  let setStepErrors: (updater: (prev: StepError) => StepError) => void

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Initialize test state
    currentStepValue = 'credentials'
    stepErrorsValue = { credentials: null, project: null }
    credentialsValidValue = false

    // Setup mock functions
    currentStep = vi.fn(() => currentStepValue)
    setCurrentStep = vi.fn((step: FormStep) => {
      currentStepValue = step
    })
    isFirstStep = vi.fn(() => currentStepValue === 'credentials')
    baseGoToNextStep = vi.fn()
    validateStep = vi.fn((_step: FormStep) => true) // Default to valid
    credentialsValid = vi.fn(() => credentialsValidValue)
    setCredentialsValid = vi.fn((valid: boolean) => {
      credentialsValidValue = valid
    })
    validateCredentials = vi.fn(async (onSuccess?: () => void) => {
      if (onSuccess) onSuccess()
      return Promise.resolve()
    })
    stepErrors = vi.fn(() => stepErrorsValue)
    setStepErrors = vi.fn((updater: (prev: StepError) => StepError) => {
      stepErrorsValue = updater(stepErrorsValue)
    })
  })

  it('initializes with the expected functions', () => {
    // Arrange & Act
    const { goToNextStep, goToPreviousStep } = useFormNavigation({
      currentStep,
      setCurrentStep,
      isFirstStep,
      baseGoToNextStep,
      validateStep,
      credentialsValid,
      setCredentialsValid,
      validateCredentials,
      stepErrors,
      setStepErrors,
    })

    // Assert
    expect(goToNextStep).toBeInstanceOf(Function)
    expect(goToPreviousStep).toBeInstanceOf(Function)
  })

  describe('goToPreviousStep', () => {
    it('does nothing when on the first step', () => {
      // Arrange
      currentStepValue = 'credentials'
      const { goToPreviousStep } = useFormNavigation({
        currentStep,
        setCurrentStep,
        isFirstStep,
        baseGoToNextStep,
        validateStep,
        credentialsValid,
        setCredentialsValid,
        validateCredentials,
        stepErrors,
        setStepErrors,
      })

      // Act
      goToPreviousStep()

      // Assert
      expect(setCurrentStep).not.toHaveBeenCalled()
      expect(currentStepValue).toBe('credentials')
    })

    it('navigates from project step to credentials step', () => {
      // Arrange
      currentStepValue = 'project'
      const { goToPreviousStep } = useFormNavigation({
        currentStep,
        setCurrentStep,
        isFirstStep,
        baseGoToNextStep,
        validateStep,
        credentialsValid,
        setCredentialsValid,
        validateCredentials,
        stepErrors,
        setStepErrors,
      })

      // Act
      goToPreviousStep()

      // Assert
      expect(setCurrentStep).toHaveBeenCalledWith('credentials')
      expect(currentStepValue).toBe('credentials')
    })
  })

  describe('goToNextStep', () => {
    it('does not proceed when step validation fails', async () => {
      // Arrange
      validateStep = vi.fn((_step: FormStep) => false) // Force validation failure

      const { goToNextStep } = useFormNavigation({
        currentStep,
        setCurrentStep,
        isFirstStep,
        baseGoToNextStep,
        validateStep,
        credentialsValid,
        setCredentialsValid,
        validateCredentials,
        stepErrors,
        setStepErrors,
      })

      // Act
      await goToNextStep()

      // Assert
      expect(validateStep).toHaveBeenCalledWith('credentials')
      expect(setStepErrors).toHaveBeenCalled()
      expect(setCurrentStep).not.toHaveBeenCalled()
      expect(currentStepValue).toBe('credentials')
    })

    it('sets error message when validation fails on credentials step', async () => {
      // Arrange
      validateStep = vi.fn((_step: FormStep) => false) // Force validation failure
      stepErrorsValue = { credentials: null, project: null } // No existing error

      const { goToNextStep } = useFormNavigation({
        currentStep,
        setCurrentStep,
        isFirstStep,
        baseGoToNextStep,
        validateStep,
        credentialsValid,
        setCredentialsValid,
        validateCredentials,
        stepErrors,
        setStepErrors,
      })

      // Act
      await goToNextStep()

      // Assert
      expect(setStepErrors).toHaveBeenCalled()
      // Verify the updater function sets the credentials error
      const updaterFn = vi.mocked(setStepErrors).mock.calls[0][0]
      const result = updaterFn({ credentials: null, project: null })
      expect(result).toEqual({ credentials: 'Please fill in all required fields', project: null })
    })

    it('validates credentials when on credentials step with invalid credentials', async () => {
      // Arrange
      currentStepValue = 'credentials'
      credentialsValidValue = false
      validateStep = vi.fn((_step: FormStep) => true) // Step validation passes

      const { goToNextStep } = useFormNavigation({
        currentStep,
        setCurrentStep,
        isFirstStep,
        baseGoToNextStep,
        validateStep,
        credentialsValid,
        setCredentialsValid,
        validateCredentials,
        stepErrors,
        setStepErrors,
      })

      // Act
      await goToNextStep()

      // Assert
      expect(validateCredentials).toHaveBeenCalled()
      expect(setCredentialsValid).toHaveBeenCalledWith(true)
      expect(setCurrentStep).toHaveBeenCalledWith('project')
    })

    it('handles credential validation failure', async () => {
      // Arrange
      currentStepValue = 'credentials'
      credentialsValidValue = false
      validateStep = vi.fn((_step: FormStep) => true) // Step validation passes

      // Mock validateCredentials to throw an error
      const validationError = new Error('Validation failed')
      validateCredentials = vi.fn(async () => {
        throw validationError
      })

      const { goToNextStep } = useFormNavigation({
        currentStep,
        setCurrentStep,
        isFirstStep,
        baseGoToNextStep,
        validateStep,
        credentialsValid,
        setCredentialsValid,
        validateCredentials,
        stepErrors,
        setStepErrors,
      })

      // Act
      await goToNextStep()

      // Assert
      expect(validateCredentials).toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledWith(
        'Validation failed, staying on credentials step',
        validationError
      )
      expect(setCurrentStep).toHaveBeenCalledWith('credentials')
      expect(currentStepValue).toBe('credentials')
    })

    it('proceeds to project step when on credentials step with valid credentials', async () => {
      // Arrange
      currentStepValue = 'credentials'
      credentialsValidValue = true
      validateStep = vi.fn((_step: FormStep) => true) // Step validation passes

      const { goToNextStep } = useFormNavigation({
        currentStep,
        setCurrentStep,
        isFirstStep,
        baseGoToNextStep,
        validateStep,
        credentialsValid,
        setCredentialsValid,
        validateCredentials,
        stepErrors,
        setStepErrors,
      })

      // Act
      await goToNextStep()

      // Assert
      expect(validateCredentials).not.toHaveBeenCalled() // Should skip validation
      expect(setCurrentStep).toHaveBeenCalledWith('project')
      expect(currentStepValue).toBe('project')
    })

    it('calls baseGoToNextStep when on a step other than credentials', async () => {
      // Arrange
      currentStepValue = 'project' // Any step other than credentials
      validateStep = vi.fn((_step: FormStep) => true) // Step validation passes

      const { goToNextStep } = useFormNavigation({
        currentStep,
        setCurrentStep,
        isFirstStep,
        baseGoToNextStep,
        validateStep,
        credentialsValid,
        setCredentialsValid,
        validateCredentials,
        stepErrors,
        setStepErrors,
      })

      // Act
      await goToNextStep()

      // Assert
      expect(baseGoToNextStep).toHaveBeenCalled()
      expect(validateCredentials).not.toHaveBeenCalled()
    })
  })
})
