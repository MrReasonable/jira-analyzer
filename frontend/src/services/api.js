import { handleResponse } from '../lib/utils';

export const fetchTeamConfigs = async () => {
  const response = await fetch('/api/team-configs');
  return handleResponse(response);
};

export const analyzeData = async (config, timeRange) => {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...config,
      ...timeRange,
    }),
  });
  return handleResponse(response);
};

export const deleteTeamConfig = async (configId) => {
  const response = await fetch(`/api/team-configs/${configId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

export const saveTeamConfig = async (config, currentConfigId) => {
  const isUpdate = Boolean(currentConfigId);
  const endpoint = isUpdate ? `/api/team-configs/${currentConfigId}` : '/api/team-configs';
  
  const response = await fetch(endpoint, {
    method: isUpdate ? 'PUT' : 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });
  return handleResponse(response);
}
