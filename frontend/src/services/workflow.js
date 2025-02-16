import { handleResponse } from '@/lib/utils';

export const fetchProjects = async (connectionDetails) => {
  const response = await fetch('/api/workflow/teams', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(connectionDetails),
  });
  return handleResponse(response);
};

export const extractWorkflow = async (connectionDetails, projectKey) => {
  const response = await fetch('/api/workflow/extract-workflow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...connectionDetails,
      projectKey
    }),
  });
  return handleResponse(response);
};
