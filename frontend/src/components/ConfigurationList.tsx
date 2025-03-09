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
  return (
    <div class="space-y-4">
      <h2 class="text-xl font-bold">Saved Configurations</h2>

      <Show when={props.error && props.error()}>
        <p class="text-red-500">{props.error?.()?.message}</p>
      </Show>

      <Show
        when={!props.loading()}
        fallback={
          <div class="flex justify-center" role="status" aria-label="Loading configurations">
            <div class="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        }
      >
        <Show
          when={props.configurations().length > 0}
          fallback={<p class="text-gray-500">No configurations saved yet</p>}
        >
          <div class="space-y-2">
            <For each={props.configurations()}>
              {config => (
                <div
                  data-testid={`config-${config.name}`}
                  class={`rounded-lg border p-4 ${props.selectedName && props.selectedName() === config.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} cursor-pointer transition-all duration-200 hover:shadow-md`}
                  onClick={() => {
                    logger.info('User clicked on configuration card', { name: config.name })
                    props.onSelect(config.name)
                  }}
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="font-semibold">{config.name}</h3>
                      <p class="text-sm text-gray-500">
                        {config.jira_email} @ {config.jira_server}
                      </p>
                    </div>
                    <div class="flex gap-2">
                      <button
                        class="btn btn-secondary flex items-center gap-1"
                        onClick={e => {
                          e.stopPropagation() // Prevent click from propagating to parent div
                          logger.info('User selected configuration', { name: config.name })
                          props.onSelect(config.name)
                        }}
                        data-testid={`select-${config.name}`}
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
                        class="btn btn-primary flex items-center gap-1"
                        onClick={e => {
                          e.stopPropagation() // Prevent click from propagating to parent div
                          logger.info('User clicked edit configuration', { name: config.name })
                          props.onEdit(config.name)
                        }}
                        data-testid={`edit-${config.name}`}
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
                        class="btn btn-danger flex items-center gap-1"
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
                            // Handle the result of the delete operation
                            props.onDelete(config.name).then(success => {
                              if (success) {
                                logger.info('Configuration deleted successfully', {
                                  name: config.name,
                                })
                              } else {
                                logger.error('Failed to delete configuration', {
                                  name: config.name,
                                })
                              }
                            })
                          } else {
                            logger.debug('User cancelled configuration deletion', {
                              name: config.name,
                            })
                          }
                        }}
                        data-testid={`delete-${config.name}`}
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
                </div>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  )
}
