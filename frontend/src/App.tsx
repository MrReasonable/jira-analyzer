import { Component, onMount, createSignal, Show, createEffect } from 'solid-js'
import { Dialog, Tabs } from '@kobalte/core'
import { ConfigurationForm } from '@components/ConfigurationForm'
import { useJiraMetrics } from '@hooks/useJiraMetrics'
import { useJiraConfigurations } from '@hooks/useJiraConfigurations'
import { JqlInput } from '@components/JqlInput'
import { LeadTimeChart } from '@components/LeadTimeChart'
import { ThroughputChart } from '@components/ThroughputChart'
import { WipChart } from '@components/WipChart'
import { CfdChart } from '@components/CfdChart'
import { CycleTimeChart } from '@components/CycleTimeChart'
import { ConfigurationsHeader } from '@components/ConfigurationsHeader'
import { logger } from '@utils/logger'

const App: Component = () => {
  logger.info('Initializing Jira Metrics application')

  // Use our custom hooks for state management
  const metricsState = useJiraMetrics()
  const configState = useJiraConfigurations(jql => {
    logger.debug('JQL updated from configuration', { jql })
    metricsState.setJql(jql)
  })

  // Update metrics config name when configuration is selected
  createEffect(() => {
    const selectedConfig = configState.selectedConfig()
    logger.debug('Selected configuration changed', { name: selectedConfig })
    metricsState.setConfigName(selectedConfig)
  })

  // Track if metrics have been fetched
  const [metricsAvailable, setMetricsAvailable] = createSignal(false)

  onMount(() => {
    logger.info('Application mounted')
  })

  // Function to handle analyze button click
  const handleAnalyze = async () => {
    await metricsState.fetchMetrics()
    setMetricsAvailable(true)
  }

  return (
    <div class="min-h-screen p-6">
      <div class="mx-auto max-w-7xl space-y-6">
        <h1 class="mb-6 text-3xl font-bold text-gray-800">Jira Analyzer</h1>

        <div class="mb-6 rounded-lg bg-white p-6 shadow-md">
          <h2 class="mb-4 text-xl font-bold">Configuration</h2>

          <ConfigurationsHeader
            configurations={configState.configurations}
            loading={configState.loading}
            selectedConfig={configState.selectedConfig}
            onSelect={configState.handleConfigSelect}
            onDelete={configState.handleConfigDelete}
            onAddClick={() => configState.setShowConfigForm(true)}
          />

          <div class="mt-6">
            <h3 id="jql-query-heading" class="mb-2 text-lg font-medium">
              JQL Query
            </h3>
            <JqlInput
              jql={metricsState.jql}
              onJqlChange={metricsState.setJql}
              onAnalyze={handleAnalyze}
              loading={metricsState.loading}
              configSelected={() => !!configState.selectedConfig()}
            />
          </div>
        </div>

        <Show when={metricsAvailable()}>
          <div class="rounded-lg bg-white p-6 shadow-md">
            <h2 class="mb-4 text-xl font-bold">Analytics</h2>

            <Tabs.Root defaultValue="lead-time" class="w-full">
              <Tabs.List class="mb-4 flex border-b border-gray-200" aria-label="Analytics tabs">
                <Tabs.Trigger
                  class="border-b-2 border-transparent px-4 py-2 font-medium text-gray-600 hover:text-blue-600 data-[selected]:border-blue-600 data-[selected]:text-blue-600"
                  value="lead-time"
                >
                  Lead Time
                </Tabs.Trigger>
                <Tabs.Trigger
                  class="border-b-2 border-transparent px-4 py-2 font-medium text-gray-600 hover:text-blue-600 data-[selected]:border-blue-600 data-[selected]:text-blue-600"
                  value="throughput"
                >
                  Throughput
                </Tabs.Trigger>
                <Tabs.Trigger
                  class="border-b-2 border-transparent px-4 py-2 font-medium text-gray-600 hover:text-blue-600 data-[selected]:border-blue-600 data-[selected]:text-blue-600"
                  value="wip"
                >
                  WIP
                </Tabs.Trigger>
                <Tabs.Trigger
                  class="border-b-2 border-transparent px-4 py-2 font-medium text-gray-600 hover:text-blue-600 data-[selected]:border-blue-600 data-[selected]:text-blue-600"
                  value="cfd"
                >
                  CFD
                </Tabs.Trigger>
                <Tabs.Trigger
                  class="border-b-2 border-transparent px-4 py-2 font-medium text-gray-600 hover:text-blue-600 data-[selected]:border-blue-600 data-[selected]:text-blue-600"
                  value="cycle-time"
                >
                  Cycle Time
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="lead-time" class="py-2">
                <div class="w-full">
                  <LeadTimeChart data={metricsState.leadTimeData} loading={metricsState.loading} />
                </div>
              </Tabs.Content>

              <Tabs.Content value="throughput" class="py-2">
                <div class="w-full">
                  <ThroughputChart
                    data={metricsState.throughputData}
                    loading={metricsState.loading}
                  />
                </div>
              </Tabs.Content>

              <Tabs.Content value="wip" class="py-2">
                <div class="w-full">
                  <WipChart data={metricsState.wipData} loading={metricsState.loading} />
                </div>
              </Tabs.Content>

              <Tabs.Content value="cfd" class="py-2">
                <div class="w-full">
                  <CfdChart data={metricsState.cfdData} loading={metricsState.loading} />
                </div>
              </Tabs.Content>

              <Tabs.Content value="cycle-time" class="py-2">
                <div class="w-full">
                  <CycleTimeChart
                    data={metricsState.cycleTimeData}
                    loading={metricsState.loading}
                  />
                </div>
              </Tabs.Content>
            </Tabs.Root>
          </div>
        </Show>
      </div>

      <Dialog.Root open={configState.showConfigForm()} onOpenChange={configState.setShowConfigForm}>
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
              Add Configuration
            </Dialog.Title>
            <ConfigurationForm
              onConfigurationSaved={configName => configState.handleConfigSaved(configName)}
            />
            <Dialog.CloseButton class="absolute top-4 right-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
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
    </div>
  )
}

export default App
