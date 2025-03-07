import { Component, Accessor } from 'solid-js'
import { Button } from '@kobalte/core'
import { ConfigurationList } from './ConfigurationList'
import { JiraConfigurationList } from '@api/jiraApi'
import { logger } from '@utils/logger'

interface ConfigurationsHeaderProps {
  configurations: Accessor<JiraConfigurationList[]>
  loading: Accessor<boolean>
  selectedConfig: Accessor<string | undefined>
  onSelect: (name: string) => void
  onDelete: (name: string) => Promise<boolean>
  onAddClick: () => void
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
        class="btn btn-primary flex items-center gap-2"
        onClick={() => {
          logger.info('User clicked Add Configuration button')
          props.onAddClick()
        }}
        data-testid="add-config-button"
      >
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
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Add Configuration
      </Button.Root>
    </div>
  )
}
