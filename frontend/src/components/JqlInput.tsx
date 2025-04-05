import { Component, Accessor } from 'solid-js'
import { Button } from '@kobalte/core'
import { logger } from '@utils/logger'

interface JqlInputProps {
  jql: Accessor<string>
  onJqlChange: (value: string) => void
  onAnalyze: () => void
  loading: Accessor<boolean>
  configSelected: Accessor<boolean>
}

export const JqlInput: Component<JqlInputProps> = props => {
  const handleJqlChange = (value: string) => {
    logger.debug('JQL input changed by user', { jql: value })
    props.onJqlChange(value)
  }

  const handleAnalyzeClick = () => {
    logger.info('User clicked Analyze button', { jql: props.jql() })
    props.onAnalyze()
  }

  const isDisabled = () => props.loading() || !props.configSelected()

  return (
    <div class="flex items-center gap-4">
      <div class="flex-1">
        <label class="sr-only" for="jql_input">
          JQL Query
        </label>
        <input
          id="jql_input"
          class="block w-full cursor-text rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Enter JQL Query"
          value={props.jql()}
          onInput={e => handleJqlChange(e.currentTarget.value)}
          data-testid="jql_input"
          aria-labelledby="jql_query_heading"
          disabled={!props.configSelected()}
        />
      </div>
      <Button.Root
        class="flex cursor-pointer items-center gap-2 rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        onClick={handleAnalyzeClick}
        disabled={isDisabled()}
        data-testid="analyze-button"
        aria-label="Analyze"
      >
        {props.loading() ? (
          <div class="flex items-center gap-2">
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Loading...</span>
          </div>
        ) : (
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span>Analyze</span>
          </>
        )}
      </Button.Root>
    </div>
  )
}
