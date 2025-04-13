import { Component } from 'solid-js'

interface CredentialsStepProps {
  name: () => string
  jiraServer: () => string
  jiraEmail: () => string
  jiraApiToken: () => string
  onNameChange: (value: string) => void
  onJiraServerChange: (value: string) => void
  onJiraEmailChange: (value: string) => void
  onJiraApiTokenChange: (value: string) => void
  isEditMode: boolean
  error: () => string | null
  onCheckCredentials?: () => void
  isCheckingCredentials?: () => boolean
  isNameAvailable?: () => boolean | null
  onCheckNameAvailability?: (name: string) => void
  isCheckingName?: () => boolean
}

/**
 * Component for the credentials step of the configuration form
 */
export const CredentialsStep: Component<CredentialsStepProps> = props => {
  // Helper function to render the name availability status indicator
  const renderNameAvailabilityIndicator = () => {
    if (props.isCheckingName?.()) {
      return (
        <div class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      )
    }

    if (props.isNameAvailable?.() === true) {
      return (
        <svg class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )
    }

    if (props.isNameAvailable?.() === false) {
      return (
        <svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )
    }

    return null
  }

  // Helper function to render the check credentials button content
  const renderCheckCredentialsContent = () => {
    if (props.isCheckingCredentials?.()) {
      return (
        <>
          <div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          Checking...
        </>
      )
    }

    return (
      <>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        Check Credentials
      </>
    )
  }

  return (
    <div class="space-y-4">
      {/* Name field */}
      <fieldset class="space-y-1">
        <label for="name" class="block text-sm font-medium text-gray-700">
          Configuration Name
        </label>
        <div class="relative">
          <input
            id="name"
            type="text"
            class="mt-1 block w-full cursor-text rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={props.name()}
            disabled={props.isEditMode}
            onInput={e => {
              props.onNameChange(e.currentTarget.value)
              if (e.currentTarget.value) {
                props.onCheckNameAvailability?.(e.currentTarget.value)
              }
            }}
            required
          />
          {!props.isEditMode && props.name() && props.isNameAvailable && (
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              {renderNameAvailabilityIndicator()}
            </div>
          )}
        </div>
        {!props.isEditMode && props.name() && props.isNameAvailable?.() === false && (
          <p class="mt-1 text-sm text-red-500">
            A configuration with this name already exists. Please choose a different name.
          </p>
        )}
      </fieldset>

      {/* Jira Server URL field */}
      <fieldset class="space-y-1">
        <label for="jira_server" class="block text-sm font-medium text-gray-700">
          Jira Server URL
        </label>
        <input
          id="jira_server"
          type="text"
          class="mt-1 block w-full cursor-text rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={props.jiraServer()}
          onInput={e => props.onJiraServerChange(e.currentTarget.value)}
          required
          placeholder="https://your-domain.atlassian.net"
        />
      </fieldset>

      {/* Jira Email field */}
      <fieldset class="space-y-1">
        <label for="jira_email" class="block text-sm font-medium text-gray-700">
          Jira Email
        </label>
        <input
          id="jira_email"
          type="email"
          class="mt-1 block w-full cursor-text rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={props.jiraEmail()}
          onInput={e => props.onJiraEmailChange(e.currentTarget.value)}
          autocomplete="email"
          required
        />
      </fieldset>

      {/* Jira API Token field */}
      <fieldset class="space-y-1">
        <label for="jira_api_token" class="block text-sm font-medium text-gray-700">
          Jira API Token
        </label>
        <input
          id="jira_api_token"
          type="password"
          class="mt-1 block w-full cursor-text rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={props.jiraApiToken()}
          onInput={e => props.onJiraApiTokenChange(e.currentTarget.value)}
          autocomplete="current-password"
          required
        />
      </fieldset>

      {/* Check Credentials button */}
      <div class="mt-4">
        <button
          type="button"
          class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          onClick={() => props.onCheckCredentials?.()}
          disabled={
            props.isCheckingCredentials?.() ||
            !props.name() ||
            !props.jiraServer() ||
            !props.jiraEmail() ||
            !props.jiraApiToken()
          }
        >
          {renderCheckCredentialsContent()}
        </button>
      </div>

      {props.error() && (
        <p class="text-red-500" data-testid="step-error">
          {props.error()}
        </p>
      )}
    </div>
  )
}
