import { Component, createSignal, createEffect, For, Show } from 'solid-js';
import { Button } from '@kobalte/core';
import { JiraConfigurationList, jiraApi } from '../api/jiraApi';

interface Props {
  onSelect: (name: string) => void;
  onDelete: (name: string) => void;
  selectedName?: string;
}

export const ConfigurationList: Component<Props> = (props) => {
  const [configurations, setConfigurations] = createSignal<JiraConfigurationList[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string>();

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      setError(undefined);
      const configs = await jiraApi.listConfigurations();
      setConfigurations(configs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => {
    loadConfigurations();
  });

  const handleDelete = async (name: string) => {
    if (!confirm(`Are you sure you want to delete configuration "${name}"?`)) {
      return;
    }

    try {
      await jiraApi.deleteConfiguration(name);
      props.onDelete(name);
      await loadConfigurations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete configuration');
    }
  };

  return (
    <div class="space-y-4">
      <h2 class="text-xl font-bold">Saved Configurations</h2>

      <Show when={error()}>
        <p class="text-red-500">{error()}</p>
      </Show>

      <Show
        when={!loading()}
        fallback={
          <div class="flex justify-center">
            <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        }
      >
        <Show
          when={configurations().length > 0}
          fallback={<p class="text-gray-500">No configurations saved yet</p>}
        >
          <div class="space-y-2">
            <For each={configurations()}>
              {(config) => (
                <div class={`p-4 rounded-lg border ${props.selectedName === config.name ? 'border-primary' : 'border-gray-200'}`}>
                  <div class="flex justify-between items-center">
                    <div>
                      <h3 class="font-semibold">{config.name}</h3>
                      <p class="text-sm text-gray-500">{config.jira_email} @ {config.jira_server}</p>
                    </div>
                    <div class="flex gap-2">
                      <Button.Root
                        class="btn btn-secondary"
                        onClick={() => props.onSelect(config.name)}
                      >
                        Select
                      </Button.Root>
                      <Button.Root
                        class="btn btn-danger"
                        onClick={() => handleDelete(config.name)}
                      >
                        Delete
                      </Button.Root>
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
