import { createSignal } from 'solid-js';
import {
  jiraApi,
  LeadTimeMetrics,
  ThroughputMetrics,
  WipMetrics,
  CfdMetrics,
  CycleTimeMetrics,
} from '../api/jiraApi';
import { logger } from '../utils/logger';

export function useJiraMetrics(initialJql = 'project = "DEMO" AND type = Story') {
  const [jql, setJql] = createSignal(initialJql);
  const [loading, setLoading] = createSignal(false);
  const [leadTimeData, setLeadTimeData] = createSignal<LeadTimeMetrics | null>(null);
  const [throughputData, setThroughputData] = createSignal<ThroughputMetrics | null>(null);
  const [wipData, setWipData] = createSignal<WipMetrics | null>(null);
  const [cfdData, setCfdData] = createSignal<CfdMetrics | null>(null);
  const [cycleTimeData, setCycleTimeData] = createSignal<CycleTimeMetrics | null>(null);
  const [error, setError] = createSignal<Error | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);

    logger.info('Fetching all Jira metrics', { jql: jql() });
    try {
      const results = await Promise.all([
        jiraApi.getLeadTime(jql()),
        jiraApi.getThroughput(jql()),
        jiraApi.getWip(jql()),
        jiraApi.getCfd(jql()),
        jiraApi.getCycleTime(jql()),
      ]);

      setLeadTimeData(results[0]);
      setThroughputData(results[1]);
      setWipData(results[2]);
      setCfdData(results[3]);
      setCycleTimeData(results[4]);

      logger.info('All Jira metrics fetched successfully');
      logger.debug('Metrics summary', {
        leadTimeAvg: results[0].average,
        throughputAvg: results[1].average,
        wipTotal: results[2].total,
        cfdStatuses: results[3].statuses.length,
        cycleTimeAvg: results[4].average,
      });
    } catch (err) {
      logger.error('Failed to fetch metrics:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  return {
    jql: jql,
    setJql,
    loading: loading,
    leadTimeData: leadTimeData,
    throughputData: throughputData,
    wipData: wipData,
    cfdData: cfdData,
    cycleTimeData: cycleTimeData,
    fetchMetrics,
    error: error,
  };
}
