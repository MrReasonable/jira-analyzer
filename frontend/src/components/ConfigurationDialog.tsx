import { Component } from 'solid-js'
import { Dialog } from '@kobalte/core'
import { ConfigurationForm } from './ConfigurationForm'
import { JiraConfiguration } from '@api/jiraApi'

interface ConfigurationDialogProps {
  isOpen: () => boolean
  onOpenChange: (open: boolean) => void
  configToEdit: () => JiraConfiguration | undefined
  onConfigurationSaved: (configName: string) => void
}

/**
 * Dialog component for adding or editing a configuration
 */
export const ConfigurationDialog: Component<ConfigurationDialogProps> = props => {
  return (
    <Dialog.Root open={props.isOpen()} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
        <Dialog.Content class="fixed top-1/2 left-1/2 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white p-6 shadow-xl transition-all">
          <Dialog.Title class="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {props.configToEdit() ? 'Edit Configuration' : 'Add Configuration'}
          </Dialog.Title>
          <ConfigurationForm
            initialConfig={props.configToEdit()}
            onConfigurationSaved={configName => {
              props.onConfigurationSaved(configName)
              props.onOpenChange(false)
            }}
          />
          <Dialog.CloseButton class="absolute top-4 right-4 cursor-pointer rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Dialog.CloseButton>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
