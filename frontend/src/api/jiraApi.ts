import axios from 'axios';
import { logger } from '../utils/logger';

// Export for testing
export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api`,
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
    try {
      logger.debug('Fetching lead time metrics', { jql });
      const response = await api.get('/metrics/lead-time', { params: { jql } });
      logger.info('Lead time metrics fetched successfully');
      return response.data;
    } catch (err) {
      logger.error('Failed to fetch lead time metrics', err);
      throw err;
    }
  },

  getThroughput: async (jql: string): Promise<ThroughputMetrics> => {
    try {
      logger.debug('Fetching throughput metrics', { jql });
      const response = await api.get('/metrics/throughput', { params: { jql } });
      logger.info('Throughput metrics fetched successfully');
      return response.data;
    } catch (err) {
      logger.error('Failed to fetch throughput metrics', err);
      throw err;
    }
  },

  getWip: async (jql: string): Promise<WipMetrics> => {
    try {
      logger.debug('Fetching WIP metrics', { jql });
      const response = await api.get('/metrics/wip', { params: { jql } });
      logger.info('WIP metrics fetched successfully');
      return response.data;
    } catch (err) {
      logger.error('Failed to fetch WIP metrics', err);
      throw err;
    }
  },

  getCycleTime: async (jql: string): Promise<CycleTimeMetrics> => {
    try {
      logger.debug('Fetching cycle time metrics', { jql });
      const response = await api.get('/metrics/cycle-time', { params: { jql } });
      logger.info('Cycle time metrics fetched successfully');
      return response.data;
    } catch (err) {
      logger.error('Failed to fetch cycle time metrics', err);
      throw err;
    }
  },

  getCfd: async (jql: string): Promise<CfdMetrics> => {
    try {
      logger.debug('Fetching CFD metrics', { jql });
      const response = await api.get('/metrics/cfd', { params: { jql } });
      logger.info('CFD metrics fetched successfully');
      return response.data;
    } catch (err) {
      logger.error('Failed to fetch CFD metrics', err);
      throw err;
    }
  },

  // Configuration endpoints
  createConfiguration: async (config: JiraConfiguration): Promise<JiraConfiguration> => {
    try {
      logger.debug('Creating Jira configuration', { name: config.name });
      const response = await api.post('/configurations', config);
      logger.info('Jira configuration created successfully', { name: config.name });
      return response.data;
    } catch (err) {
      logger.error('Failed to create Jira configuration', err);
      throw err;
    }
  },

  listConfigurations: async (): Promise<JiraConfigurationList[]> => {
    try {
      logger.debug('Fetching Jira configurations list');
      const response = await api.get('/configurations');
      logger.info('Jira configurations list fetched successfully');
      return response.data;
    } catch (err) {
      logger.error('Failed to fetch Jira configurations list', err);
      throw err;
    }
  },

  getConfiguration: async (name: string): Promise<JiraConfiguration> => {
    try {
      logger.debug('Fetching Jira configuration', { name });
      const response = await api.get(`/configurations/${name}`);
      logger.info('Jira configuration fetched successfully', { name });
      return response.data;
    } catch (err) {
      logger.error('Failed to fetch Jira configuration', err);
      throw err;
    }
  },

  updateConfiguration: async (
    name: string,
    config: JiraConfiguration
  ): Promise<JiraConfiguration> => {
    try {
      logger.debug('Updating Jira configuration', { name });
      const response = await api.put(`/configurations/${name}`, config);
      logger.info('Jira configuration updated successfully', { name });
      return response.data;
    } catch (err) {
      logger.error('Failed to update Jira configuration', err);
      throw err;
    }
  },

  deleteConfiguration: async (name: string): Promise<void> => {
    try {
      logger.debug('Deleting Jira configuration', { name });
      await api.delete(`/configurations/${name}`);
      logger.info('Jira configuration deleted successfully', { name });
    } catch (err) {
      logger.error('Failed to delete Jira configuration', err);
      throw err;
    }
  },
};

// Add for testing
export const resetJiraApi = () => {
  // Reset any internal state if needed
};
