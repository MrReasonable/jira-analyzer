import { Component, Accessor } from 'solid-js';
import {
  LeadTimeMetrics,
  ThroughputMetrics,
  WipMetrics,
  CfdMetrics,
  CycleTimeMetrics,
} from '../api/jiraApi';
import { LeadTimeChart } from './LeadTimeChart';
import { ThroughputChart } from './ThroughputChart';
import { WipChart } from './WipChart';
import { CfdChart } from './CfdChart';
import { CycleTimeChart } from './CycleTimeChart';

interface MetricsSectionProps {
  loading: Accessor<boolean>;
  leadTimeData: Accessor<LeadTimeMetrics | null>;
  throughputData: Accessor<ThroughputMetrics | null>;
  wipData: Accessor<WipMetrics | null>;
  cfdData: Accessor<CfdMetrics | null>;
  cycleTimeData: Accessor<CycleTimeMetrics | null>;
}

export const MetricsSection: Component<MetricsSectionProps> = props => {
  return (
    <>
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <LeadTimeChart data={props.leadTimeData} loading={props.loading} />
        <ThroughputChart data={props.throughputData} loading={props.loading} />
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <WipChart data={props.wipData} loading={props.loading} />
        <CfdChart data={props.cfdData} loading={props.loading} />
      </div>

      <div class="grid grid-cols-1 gap-6">
        <CycleTimeChart data={props.cycleTimeData} loading={props.loading} />
      </div>
    </>
  );
};
