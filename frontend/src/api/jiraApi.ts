import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api`
});

export interface MetricResponse {
  error?: string;
}

export interface LeadTimeMetrics extends MetricResponse {
  average: number;
  median: number;
  min: number;
  max: number;
  data: number[];
}

export interface ThroughputMetrics extends MetricResponse {
  dates: string[];
  counts: number[];
  average: number;
}

export interface WipMetrics extends MetricResponse {
  status: string[];
  counts: number[];
  total: number;
}

export interface CycleTimeMetrics extends MetricResponse {
  average: number;
  median: number;
  min: number;
  max: number;
  data: number[];
  start_state: string;
  end_state: string;
}

export interface CfdMetrics extends MetricResponse {
  statuses: string[];
  data: Array<{
    date: string;
    [key: string]: string | number;
  }>;
}

export interface JiraConfiguration {
  id?: number;
  name: string;
  jira_server: string;
  jira_email: string;
  jira_api_token: string;
  jql_query: string;
  workflow_states: string[];
  lead_time_start_state: string;
  lead_time_end_state: string;
  cycle_time_start_state: string;
  cycle_time_end_state: string;
}

export interface JiraConfigurationList {
  name: string;
  jira_server: string;
  jira_email: string;
}

export const jiraApi = {
  getLeadTime: async (jql: string): Promise<LeadTimeMetrics> => {
    const response = await api.get('/metrics/lead-time', { params: { jql } });
    return response.data;
  },

  getThroughput: async (jql: string): Promise<ThroughputMetrics> => {
    const response = await api.get('/metrics/throughput', { params: { jql } });
    return response.data;
  },

  getWip: async (jql: string): Promise<WipMetrics> => {
    const response = await api.get('/metrics/wip', { params: { jql } });
    return response.data;
  },

  getCycleTime: async (jql: string): Promise<CycleTimeMetrics> => {
    const response = await api.get('/metrics/cycle-time', { params: { jql } });
    return response.data;
  },

  getCfd: async (jql: string): Promise<CfdMetrics> => {
    const response = await api.get('/metrics/cfd', { params: { jql } });
    return response.data;
  },

  // Configuration endpoints
  createConfiguration: async (config: JiraConfiguration): Promise<JiraConfiguration> => {
    const response = await api.post('/configurations', config);
    return response.data;
  },

  listConfigurations: async (): Promise<JiraConfigurationList[]> => {
    const response = await api.get('/configurations');
    return response.data;
  },

  getConfiguration: async (name: string): Promise<JiraConfiguration> => {
    const response = await api.get(`/configurations/${name}`);
    return response.data;
  },

  updateConfiguration: async (name: string, config: JiraConfiguration): Promise<JiraConfiguration> => {
    const response = await api.put(`/configurations/${name}`, config);
    return response.data;
  },

  deleteConfiguration: async (name: string): Promise<void> => {
    await api.delete(`/configurations/${name}`);
  }
};
