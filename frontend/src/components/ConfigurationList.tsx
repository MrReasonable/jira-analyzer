import { Component, For, Show, Accessor } from 'solid-js'
import { JiraConfigurationList } from '@api/jiraApi'
import { logger } from '@utils/logger'

interface Props {
  configurations: Accessor<JiraConfigurationList[]>
  loading: Accessor<boolean>
  error?: Accessor<Error | null>
  onSelect: (name: string) => void
  onEdit: (name: string) => void
  onDelete: (name: string) => Promise<boolean> // Return success status
  selectedName?: Accessor<string | undefined>
}

export const ConfigurationList: Component<Props> = props => {
  const isConfigSelected = (configName: string) => {
    return props.selectedName ? props.selectedName() === configName : false
  }

  const getConfigClass = (configName: string) => {
    const baseClass =
      'rounded-lg border p-4 cursor-pointer transition-all duration-200 hover:shadow-md'
    const selectedClass = 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
    const unselectedClass = 'border-gray-200'

    return `${baseClass} ${isConfigSelected(configName) ? selectedClass : unselectedClass}`
  }

  // Separate handlers for success and failure cases
  const handleDeleteSuccess = (configName: string) => {
    logger.info('Configuration deleted successfully', {
      name: configName,
    })
  }

  const handleDeleteFailure = (configName: string) => {
    logger.error('Failed to delete configuration', {
      name: configName,
    })
  }

  return (
    <div class="space-y-4">
      <h2 class="text-xl font-bold">Saved Configurations</h2>

      <Show when={props.error?.()}>
        <p class="text-red-500">{props.error?.()?.message}</p>
      </Show>

      <Show
        when={!props.loading()}
        fallback={
          <output class="flex justify-center" aria-label="Loading configurations">
            <div class="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          </output>
        }
      >
        <Show
          when={props.configurations() && props.configurations().length > 0}
          fallback={<p class="text-gray-500">No configurations saved yet</p>}
        >
          <div class="space-y-2">
            <For each={props.configurations()}>
              {config => (
                <button
                  data-testid={`config-${config.name}`}
                  aria-pressed={isConfigSelected(config.name) ? 'true' : 'false'}
                  role="button"
                  tabIndex={0}
                  class={getConfigClass(config.name)}
                  onClick={() => {
                    logger.info('User clicked on configuration card', { name: config.name })
                    props.onSelect(config.name)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      logger.info('User pressed key on configuration card', {
                        name: config.name,
                        key: e.key,
                      })
                      props.onSelect(config.name)
                    }
                  }}
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="font-semibold">
                        {config.name}
                        {isConfigSelected(config.name) && (
                          <span class="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            Active
                          </span>
                        )}
                      </h3>
                      <p class="text-sm text-gray-500">
                        {config.jira_email} @ {config.jira_server}
                      </p>
                    </div>
                    <div class="flex gap-2">
                      <button
                        class="btn btn-secondary flex cursor-pointer items-center gap-1"
                        onClick={e => {
                          e.stopPropagation() // Prevent click from propagating to parent div
                          logger.info('User selected configuration', { name: config.name })
                          props.onSelect(config.name)
                        }}
                        data-testid={`select-${config.name}`}
                        type="button"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-4 w-4"
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
                        Select
                      </button>
                      <button
                        class="btn btn-primary flex cursor-pointer items-center gap-1"
                        onClick={e => {
                          e.stopPropagation() // Prevent click from propagating to parent div
                          logger.info('User clicked edit configuration', { name: config.name })
                          props.onEdit(config.name)
                        }}
                        data-testid={`edit-${config.name}`}
                        type="button"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                        Edit
                      </button>
                      <button
                        class="btn btn-danger flex cursor-pointer items-center gap-1"
                        onClick={e => {
                          e.stopPropagation() // Prevent click from propagating to parent div
                          logger.debug('User clicked delete configuration', { name: config.name })
                          if (
                            window.confirm(
                              `Are you sure you want to delete configuration "${config.name}"?`
                            )
                          ) {
                            logger.info('User confirmed configuration deletion', {
                              name: config.name,
                            })
                            // Handle the result of the delete operation using Promise chaining
                            props
                              .onDelete(config.name)
                              .then(result => {
                                if (!result) {
                                  // If the result is false, reject the promise to trigger the catch handler
                                  return Promise.reject(new Error('Delete operation failed'))
                                }
                                // Only handle success case here
                                handleDeleteSuccess(config.name)
                              })
                              .catch(() => {
                                // Handle failure case in the catch handler
                                handleDeleteFailure(config.name)
                              })
                          } else {
                            logger.debug('User cancelled configuration deletion', {
                              name: config.name,
                            })
                          }
                        }}
                        data-testid={`delete-${config.name}`}
                        type="button"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </button>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  )
}
