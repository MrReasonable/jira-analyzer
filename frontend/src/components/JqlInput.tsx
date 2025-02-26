import { Component, Accessor } from 'solid-js';
import { TextField, Button } from '@kobalte/core';

interface JqlInputProps {
  jql: Accessor<string>;
  onJqlChange: (value: string) => void;
  onAnalyze: () => void;
  loading: Accessor<boolean>;
}

export const JqlInput: Component<JqlInputProps> = props => {
  return (
    <div class="flex items-center gap-4">
      <TextField.Root class="flex-1">
        <TextField.Input
          class="input"
          placeholder="Enter JQL Query"
          value={props.jql()}
          // Remove the onChange prop as it's not compatible with the expected type
          onInput={e => props.onJqlChange(e.currentTarget.value)}
          data-testid="jql-input"
        />
      </TextField.Root>
      <Button.Root
        class="btn btn-primary"
        onClick={props.onAnalyze}
        disabled={props.loading()}
        data-testid="analyze-button"
        aria-label="Analyze"
      >
        {props.loading() ? (
          <div class="flex items-center gap-2">
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Loading...</span>
          </div>
        ) : (
          'Analyze'
        )}
      </Button.Root>
    </div>
  );
};
