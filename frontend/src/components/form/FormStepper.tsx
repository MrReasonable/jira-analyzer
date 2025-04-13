import { Component, For } from 'solid-js'

export interface StepInfo {
  id: string
  title: string
  description: string
}

interface FormStepperProps {
  steps: StepInfo[]
  currentStep: () => string
  description: () => string
}

/**
 * Component for displaying form steps
 */
export const FormStepper: Component<FormStepperProps> = props => {
  const getTextColorClass = (step: StepInfo, index: () => number): string => {
    if (step.id === props.currentStep()) {
      return 'text-blue-600'
    } else if (props.steps.findIndex(s => s.id === props.currentStep()) > index()) {
      return 'text-green-600'
    } else {
      return 'text-gray-400'
    }
  }

  const getStepStyleClass = (step: StepInfo, index: () => number): string => {
    if (step.id === props.currentStep()) {
      return 'border-blue-600 bg-blue-100'
    } else if (props.steps.findIndex(s => s.id === props.currentStep()) > index()) {
      return 'border-green-600 bg-green-100'
    } else {
      return 'border-gray-300'
    }
  }

  return (
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <For each={props.steps}>
          {(step, index) => (
            <>
              <div class={`flex flex-col items-center ${getTextColorClass(step, index)}`}>
                <div
                  class={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${getStepStyleClass(step, index)}`}
                >
                  {props.steps.findIndex(s => s.id === props.currentStep()) > index() ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 text-green-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span>{index() + 1}</span>
                  )}
                </div>
                <div class="mt-1 text-xs font-medium">{step.title}</div>
              </div>
              {index() < props.steps.length - 1 && (
                <div
                  class={`h-0.5 w-full ${
                    props.steps.findIndex(s => s.id === props.currentStep()) > index()
                      ? 'bg-green-600'
                      : 'bg-gray-300'
                  }`}
                />
              )}
            </>
          )}
        </For>
      </div>
      <div class="mt-2 text-center text-sm text-gray-500">{props.description()}</div>
    </div>
  )
}
