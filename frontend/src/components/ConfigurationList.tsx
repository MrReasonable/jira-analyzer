import { Component, For, Show, Accessor } from 'solid-js';
import { JiraConfigurationList } from '../api/jiraApi';
import { logger } from '../utils/logger';

interface Props {
  configurations: Accessor<JiraConfigurationList[]>;
  loading: Accessor<boolean>;
  error?: Accessor<Error | null>;
  onSelect: (name: string) => void;
  onDelete: (name: string) => void;
  selectedName?: Accessor<string | undefined>;
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
                  class={`rounded-lg border p-4 ${props.selectedName && props.selectedName() === config.name ? 'border-primary' : 'border-gray-200'}`}
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
                        class="btn btn-secondary"
                        onClick={() => {
                          logger.info('User selected configuration', { name: config.name });
                          props.onSelect(config.name);
                        }}
                        data-testid={`select-${config.name}`}
                      >
                        Select
                      </button>
                      <button
                        class="btn btn-danger"
                        onClick={() => {
                          logger.debug('User clicked delete configuration', { name: config.name });
                          if (
                            window.confirm(
                              `Are you sure you want to delete configuration "${config.name}"?`
                            )
                          ) {
                            logger.info('User confirmed configuration deletion', {
                              name: config.name,
                            });
                            props.onDelete(config.name);
                          } else {
                            logger.debug('User cancelled configuration deletion', {
                              name: config.name,
                            });
                          }
                        }}
                        data-testid={`delete-${config.name}`}
                      >
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
  );
};
