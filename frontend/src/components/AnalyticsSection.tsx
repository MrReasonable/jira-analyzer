import { Component } from 'solid-js'
import { Tabs } from '@kobalte/core'
import { LeadTimeChart } from './LeadTimeChart'
import { ThroughputChart } from './ThroughputChart'
import { WipChart } from './WipChart'
import { CfdChart } from './CfdChart'
import { CycleTimeChart } from './CycleTimeChart'
import {
  LeadTimeMetrics,
  ThroughputMetrics,
  WipMetrics,
  CfdMetrics,
  CycleTimeMetrics,
} from '@api/jiraApi'

interface AnalyticsSectionProps {
  leadTimeData: () => LeadTimeMetrics | null
  throughputData: () => ThroughputMetrics | null
  wipData: () => WipMetrics | null
  cfdData: () => CfdMetrics | null
  cycleTimeData: () => CycleTimeMetrics | null
  loading: () => boolean
}

/**
 * Component for displaying analytics charts
 */
export const AnalyticsSection: Component<AnalyticsSectionProps> = props => {
  return (
    <div class="rounded-lg bg-white p-6 shadow-md">
      <h2 class="mb-4 text-xl font-bold">Analytics</h2>

      <Tabs.Root defaultValue="lead-time" class="w-full">
        <Tabs.List class="mb-4 flex border-b border-gray-200" aria-label="Analytics tabs">
          <Tabs.Trigger
            class="cursor-pointer border-b-2 border-transparent px-4 py-2 font-medium text-gray-600 hover:text-blue-600 data-[selected]:border-blue-600 data-[selected]:text-blue-600"
            value="lead-time"
          >
            Lead Time
          </Tabs.Trigger>
          <Tabs.Trigger
            class="cursor-pointer border-b-2 border-transparent px-4 py-2 font-medium text-gray-600 hover:text-blue-600 data-[selected]:border-blue-600 data-[selected]:text-blue-600"
            value="throughput"
          >
            Throughput
          </Tabs.Trigger>
          <Tabs.Trigger
            class="cursor-pointer border-b-2 border-transparent px-4 py-2 font-medium text-gray-600 hover:text-blue-600 data-[selected]:border-blue-600 data-[selected]:text-blue-600"
            value="wip"
          >
            WIP
          </Tabs.Trigger>
          <Tabs.Trigger
            class="cursor-pointer border-b-2 border-transparent px-4 py-2 font-medium text-gray-600 hover:text-blue-600 data-[selected]:border-blue-600 data-[selected]:text-blue-600"
            value="cfd"
          >
            CFD
          </Tabs.Trigger>
          <Tabs.Trigger
            class="cursor-pointer border-b-2 border-transparent px-4 py-2 font-medium text-gray-600 hover:text-blue-600 data-[selected]:border-blue-600 data-[selected]:text-blue-600"
            value="cycle-time"
          >
            Cycle Time
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="lead-time" class="py-2">
          <div class="w-full">
            <LeadTimeChart data={props.leadTimeData} loading={props.loading} />
          </div>
        </Tabs.Content>

        <Tabs.Content value="throughput" class="py-2">
          <div class="w-full">
            <ThroughputChart data={props.throughputData} loading={props.loading} />
          </div>
        </Tabs.Content>

        <Tabs.Content value="wip" class="py-2">
          <div class="w-full">
            <WipChart data={props.wipData} loading={props.loading} />
          </div>
        </Tabs.Content>

        <Tabs.Content value="cfd" class="py-2">
          <div class="w-full">
            <CfdChart data={props.cfdData} loading={props.loading} />
          </div>
        </Tabs.Content>

        <Tabs.Content value="cycle-time" class="py-2">
          <div class="w-full">
            <CycleTimeChart data={props.cycleTimeData} loading={props.loading} />
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
