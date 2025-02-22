import { Component, createSignal, Show } from 'solid-js';
import { TextField, Button, Dialog } from '@kobalte/core';
import { jiraApi, LeadTimeMetrics, ThroughputMetrics, WipMetrics, CfdMetrics, CycleTimeMetrics, JiraConfiguration } from './api/jiraApi';
import './index.css';
import { LeadTimeChart } from './components/LeadTimeChart';
import { ThroughputChart } from './components/ThroughputChart';
import { WipChart } from './components/WipChart';
import { CfdChart } from './components/CfdChart';
import { CycleTimeChart } from './components/CycleTimeChart';
import { ConfigurationForm } from './components/ConfigurationForm';
import { ConfigurationList } from './components/ConfigurationList';

const App: Component = () => {
  const [jql, setJql] = createSignal('project = "DEMO" AND type = Story');
  const [loading, setLoading] = createSignal(false);
  const [leadTimeData, setLeadTimeData] = createSignal<LeadTimeMetrics | null>(null);
  const [throughputData, setThroughputData] = createSignal<ThroughputMetrics | null>(null);
  const [wipData, setWipData] = createSignal<WipMetrics | null>(null);
  const [cfdData, setCfdData] = createSignal<CfdMetrics | null>(null);
  const [cycleTimeData, setCycleTimeData] = createSignal<CycleTimeMetrics | null>(null);
  const [showConfigForm, setShowConfigForm] = createSignal(false);
  const [selectedConfig, setSelectedConfig] = createSignal<string>();
  const [currentConfig, setCurrentConfig] = createSignal<JiraConfiguration>();

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const [leadTime, throughput, wip, cfd, cycleTime] = await Promise.all([
        jiraApi.getLeadTime(jql()),
        jiraApi.getThroughput(jql()),
        jiraApi.getWip(jql()),
        jiraApi.getCfd(jql()),
        jiraApi.getCycleTime(jql())
      ]);

      setLeadTimeData(leadTime);
      setThroughputData(throughput);
      setWipData(wip);
      setCfdData(cfd);
      setCycleTimeData(cycleTime);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSelect = async (name: string) => {
    try {
      const config = await jiraApi.getConfiguration(name);
      setCurrentConfig(config);
      setSelectedConfig(name);
      setJql(config.jql_query);
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  };

  const handleConfigDelete = (name: string) => {
    if (selectedConfig() === name) {
      setSelectedConfig(undefined);
      setCurrentConfig(undefined);
    }
  };

  const handleConfigSaved = () => {
    setShowConfigForm(false);
  };

  return (
    <div class="min-h-screen p-6">
      <div class="max-w-7xl mx-auto space-y-6">
        <div class="flex justify-between items-start">
          <ConfigurationList
            onSelect={handleConfigSelect}
            onDelete={handleConfigDelete}
            selectedName={selectedConfig()}
          />
          <Button.Root
            class="btn btn-primary"
            onClick={() => setShowConfigForm(true)}
          >
            Add Configuration
          </Button.Root>
        </div>

        <div class="flex gap-4 items-center">
          <TextField.Root class="flex-1">
            <TextField.Input
              class="input"
              placeholder="Enter JQL Query"
              value={jql()}
              onChange={setJql}
            />
          </TextField.Root>
          <Button.Root
            class="btn btn-primary"
            onClick={fetchMetrics}
            disabled={loading()}
          >
            {loading() ? (
              <div class="flex items-center gap-2">
                <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Loading...</span>
              </div>
            ) : (
              'Analyze'
            )}
          </Button.Root>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LeadTimeChart data={leadTimeData()} loading={loading()} />
          <ThroughputChart data={throughputData()} loading={loading()} />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WipChart data={wipData()} loading={loading()} />
          <CfdChart data={cfdData()} loading={loading()} />
        </div>

        <div class="grid grid-cols-1 gap-6">
          <CycleTimeChart data={cycleTimeData()} loading={loading()} />
        </div>
      </div>

      <Dialog.Root open={showConfigForm()} onOpenChange={setShowConfigForm}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 bg-black/50" />
          <Dialog.Content class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title class="text-2xl font-bold mb-4">
              Add Configuration
            </Dialog.Title>
            <ConfigurationForm
              onConfigurationSaved={handleConfigSaved}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default App;
