import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { jiraApi } from './jiraApi';

vi.mock('axios');

describe('jiraApi', () => {
  const mockJql = 'project = TEST';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLeadTime', () => {
    const mockResponse = {
      average: 5,
      median: 4,
      min: 2,
      max: 10,
      data: [2, 4, 5, 5, 7, 10]
    };

    it('makes correct API call', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: mockResponse });
      
      await jiraApi.getLeadTime(mockJql);
      
      expect(axios.get).toHaveBeenCalledWith('/api/metrics/lead-time', {
        params: { jql: mockJql }
      });
    });

    it('returns lead time metrics', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: mockResponse });
      
      const result = await jiraApi.getLeadTime(mockJql);
      
      expect(result).toEqual(mockResponse);
    });

    it('handles API errors', async () => {
      const error = new Error('API Error');
      vi.mocked(axios.get).mockRejectedValue(error);
      
      await expect(jiraApi.getLeadTime(mockJql)).rejects.toThrow('API Error');
    });
  });

  describe('getThroughput', () => {
    const mockResponse = {
      dates: ['2024-01-01', '2024-01-02'],
      counts: [3, 4],
      average: 3.5
    };

    it('makes correct API call', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: mockResponse });
      
      await jiraApi.getThroughput(mockJql);
      
      expect(axios.get).toHaveBeenCalledWith('/api/metrics/throughput', {
        params: { jql: mockJql }
      });
    });

    it('returns throughput metrics', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: mockResponse });
      
      const result = await jiraApi.getThroughput(mockJql);
      
      expect(result).toEqual(mockResponse);
    });

    it('handles API errors', async () => {
      const error = new Error('API Error');
      vi.mocked(axios.get).mockRejectedValue(error);
      
      await expect(jiraApi.getThroughput(mockJql)).rejects.toThrow('API Error');
    });
  });

  describe('getWip', () => {
    const mockResponse = {
      status: ['To Do', 'In Progress', 'Done'],
      counts: [2, 3, 5],
      total: 10
    };

    it('makes correct API call', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: mockResponse });
      
      await jiraApi.getWip(mockJql);
      
      expect(axios.get).toHaveBeenCalledWith('/api/metrics/wip', {
        params: { jql: mockJql }
      });
    });

    it('returns WIP metrics', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: mockResponse });
      
      const result = await jiraApi.getWip(mockJql);
      
      expect(result).toEqual(mockResponse);
    });

    it('handles API errors', async () => {
      const error = new Error('API Error');
      vi.mocked(axios.get).mockRejectedValue(error);
      
      await expect(jiraApi.getWip(mockJql)).rejects.toThrow('API Error');
    });
  });

  describe('getCfd', () => {
    const mockResponse = {
      statuses: ['To Do', 'In Progress', 'Done'],
      data: [
        {
          date: '2024-01-01',
          'To Do': 2,
          'In Progress': 3,
          'Done': 5
        }
      ]
    };

    it('makes correct API call', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: mockResponse });
      
      await jiraApi.getCfd(mockJql);
      
      expect(axios.get).toHaveBeenCalledWith('/api/metrics/cfd', {
        params: { jql: mockJql }
      });
    });

    it('returns CFD metrics', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: mockResponse });
      
      const result = await jiraApi.getCfd(mockJql);
      
      expect(result).toEqual(mockResponse);
    });

    it('handles API errors', async () => {
      const error = new Error('API Error');
      vi.mocked(axios.get).mockRejectedValue(error);
      
      await expect(jiraApi.getCfd(mockJql)).rejects.toThrow('API Error');
    });
  });

  describe('error handling', () => {
    it('handles network errors', async () => {
      const networkError = new Error('Network Error');
      vi.mocked(axios.get).mockRejectedValue(networkError);
      
      await expect(jiraApi.getLeadTime(mockJql)).rejects.toThrow('Network Error');
    });

    it('handles invalid responses', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: null });
      
      const result = await jiraApi.getLeadTime(mockJql);
      expect(result).toBeNull();
    });

    it('handles unexpected response formats', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: { invalid: 'format' } });
      
      const result = await jiraApi.getLeadTime(mockJql);
      expect(result).toEqual({ invalid: 'format' });
    });
  });
});
