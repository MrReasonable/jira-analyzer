import { Component, For, Show } from 'solid-js'
import { JiraProject } from '@api/jiraApi'

interface ProjectStepProps {
  projectKey: () => string
  jqlQuery: () => string
  projects: () => JiraProject[]
  onProjectKeyChange: (value: string) => void
  onJqlQueryChange: (value: string) => void
  error: () => string | null
  isLoading?: () => boolean
  onFetchProjects?: () => void
}

/**
 * Component for the project selection step of the configuration form
 */
export const ProjectStep: Component<ProjectStepProps> = props => {
  return (
    <div class="space-y-4">
      {/* Project dropdown */}
      <div role="group" class="space-y-1">
        <div class="flex items-center justify-between">
          <label for="project_key" class="block text-sm font-medium text-gray-700">
            Jira Project
          </label>
          <button
            type="button"
            class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            onClick={() => props.onFetchProjects?.()}
            disabled={props.isLoading?.()}
          >
            {props.isLoading?.() ? (
              <>
                <div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                Refreshing...
              </>
            ) : (
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh Projects
              </>
            )}
          </button>
        </div>
        <Show
          when={!props.isLoading?.()}
          fallback={
            <div class="mt-1 flex items-center">
              <div class="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              <span>Loading projects...</span>
            </div>
          }
        >
          <Show
            when={props.projects().length > 0}
            fallback={
              <div class="mt-1 text-amber-600">
                No projects found. Please check your Jira credentials and permissions.
              </div>
            }
          >
            <select
              id="project_key"
              class="mt-1 block w-full cursor-pointer rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={props.projectKey()}
              onChange={e => props.onProjectKeyChange(e.currentTarget.value)}
              required
            >
              <option value="" disabled>
                Select a project
              </option>
              <For each={props.projects()}>
                {project => (
                  <option value={project.key}>
                    {project.key} - {project.name}
                  </option>
                )}
              </For>
            </select>
          </Show>
        </Show>
      </div>

      {/* JQL Query field */}
      <div role="group" class="space-y-1">
        <label for="jql_query" class="block text-sm font-medium text-gray-700">
          Default JQL Query
        </label>
        <textarea
          id="jql_query"
          class="mt-1 block w-full cursor-text rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={props.jqlQuery()}
          onInput={e => props.onJqlQueryChange(e.currentTarget.value)}
          required
          placeholder="project = PROJ AND type = Story"
          data-testid="jql_query"
        />
      </div>

      {props.error() && (
        <p class="text-red-500" data-testid="step-error">
          {props.error()}
        </p>
      )}
    </div>
  )
}
