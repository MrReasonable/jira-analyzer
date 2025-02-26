import { Component, Accessor } from 'solid-js';
import { Button } from '@kobalte/core';
import { ConfigurationList } from './ConfigurationList';
import { JiraConfigurationList } from '../api/jiraApi';

interface ConfigurationsHeaderProps {
  configurations: Accessor<JiraConfigurationList[]>;
  loading: Accessor<boolean>;
  selectedConfig: Accessor<string | undefined>;
  onSelect: (name: string) => void;
  onDelete: (name: string) => void;
  onAddClick: () => void;
}

export const ConfigurationsHeader: Component<ConfigurationsHeaderProps> = props => {
  return (
    <div class="flex items-start justify-between">
      <ConfigurationList
        configurations={props.configurations}
        loading={props.loading}
        onSelect={props.onSelect}
        onDelete={props.onDelete}
        selectedName={props.selectedConfig}
      />
      <Button.Root
        class="btn btn-primary"
        onClick={props.onAddClick}
        data-testid="add-config-button"
      >
        Add Configuration
      </Button.Root>
    </div>
  );
};
