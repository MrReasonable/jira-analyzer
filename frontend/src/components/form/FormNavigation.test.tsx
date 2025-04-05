/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@solidjs/testing-library'
import { FormNavigation } from './FormNavigation'

describe('FormNavigation', () => {
  const defaultProps = {
    currentStep: () => 'credentials',
    isFirstStep: () => false,
    isLastStep: () => false,
    onPrevious: vi.fn(),
    isEditMode: false,
    disabled: false,
  }

  it('renders previous and next buttons when not on first or last step', () => {
    render(() => <FormNavigation {...defaultProps} />)

    expect(screen.getByText('Previous')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('does not render previous button on first step', () => {
    const props = {
      ...defaultProps,
      isFirstStep: () => true,
    }

    render(() => <FormNavigation {...props} />)

    expect(screen.queryByText('Previous')).not.toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('renders Create Configuration button on last step in create mode', () => {
    const props = {
      ...defaultProps,
      isLastStep: () => true,
    }

    render(() => <FormNavigation {...props} />)

    expect(screen.getByText('Previous')).toBeInTheDocument()
    expect(screen.getByText('Create Configuration')).toBeInTheDocument()
    expect(screen.queryByText('Next')).not.toBeInTheDocument()
  })

  it('renders Update Configuration button on last step in edit mode', () => {
    const props = {
      ...defaultProps,
      isLastStep: () => true,
      isEditMode: true,
    }

    render(() => <FormNavigation {...props} />)

    expect(screen.getByText('Previous')).toBeInTheDocument()
    expect(screen.getByText('Update Configuration')).toBeInTheDocument()
    expect(screen.queryByText('Next')).not.toBeInTheDocument()
  })

  it('calls onPrevious when previous button is clicked', () => {
    render(() => <FormNavigation {...defaultProps} />)

    fireEvent.click(screen.getByText('Previous'))
    expect(defaultProps.onPrevious).toHaveBeenCalled()
  })

  it('submits the form when next/create/update button is clicked', () => {
    // Create a mock form and submit handler
    const handleSubmit = vi.fn(e => e.preventDefault())
    render(() => (
      <form onSubmit={handleSubmit}>
        <FormNavigation {...defaultProps} />
      </form>
    ))

    // Find the next button and click it
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    // Verify the form was submitted
    expect(handleSubmit).toHaveBeenCalled()
  })

  it('has the correct button styling', () => {
    render(() => <FormNavigation {...defaultProps} />)

    const previousButton = screen.getByText('Previous')
    const nextButton = screen.getByText('Next')

    // Previous button should have secondary styling
    expect(previousButton).toHaveClass('bg-white')
    expect(previousButton).toHaveClass('border-gray-300')
    expect(previousButton).toHaveClass('text-gray-700')

    // Next button should have primary styling
    expect(nextButton).toHaveClass('bg-blue-600')
    expect(nextButton).toHaveClass('text-white')
  })

  it('disables the submit button when disabled prop is true', () => {
    const props = {
      ...defaultProps,
      disabled: true,
    }

    render(() => <FormNavigation {...props} />)

    const nextButton = screen.getByText('Next')
    expect(nextButton).toBeDisabled()
    expect(nextButton).toHaveClass('disabled:opacity-50')
    expect(nextButton).toHaveClass('disabled:cursor-not-allowed')
  })
})
