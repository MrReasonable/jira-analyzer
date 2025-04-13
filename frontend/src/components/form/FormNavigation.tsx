import { Component } from 'solid-js'

interface FormNavigationProps {
  currentStep: () => string
  isFirstStep: () => boolean
  isLastStep: () => boolean
  onPrevious: () => void
  isEditMode: boolean
  disabled?: boolean
}

/**
 * Component for form navigation buttons
 */
export const FormNavigation: Component<FormNavigationProps> = props => {
  // Helper function to determine the button test ID based on step and mode
  const getButtonTestId = () => {
    if (props.isLastStep()) {
      return props.isEditMode ? 'update-button' : 'create-button'
    }
    return 'next-button'
  }

  // Helper function to render the submit button content
  const renderSubmitButtonContent = () => {
    if (props.isLastStep()) {
      return (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
          {props.isEditMode ? 'Update Configuration' : 'Create Configuration'}
        </>
      )
    }

    return (
      <>
        Next
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </>
    )
  }

  return (
    <div class="flex justify-between" data-testid="form-navigation">
      {!props.isFirstStep() && (
        <button
          type="button"
          class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          onClick={() => props.onPrevious()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="mr-2 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </button>
      )}

      <button
        type="submit"
        class="ml-auto flex cursor-pointer items-center justify-center gap-2 rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        disabled={props.disabled}
        data-testid={getButtonTestId()}
      >
        {renderSubmitButtonContent()}
      </button>
    </div>
  )
}
