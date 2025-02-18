import { useState } from 'react';
import { fetchProjects, extractWorkflow } from '@/services/workflow';

export const useWorkflowExtraction = (connectionDetails, onProjectSelect) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [extractedWorkflow, setExtractedWorkflow] = useState(null);
  const [selectedStartStates, setSelectedStartStates] = useState([]);
  const [selectedEndStates, setSelectedEndStates] = useState([]);
  const [selectedActiveStatuses, setSelectedActiveStatuses] = useState([]);

  const handleFetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProjects(connectionDetails);
      setProjects(result.data);
    } catch (err) {
      setError('Failed to fetch projects: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    if (onProjectSelect) {
      onProjectSelect(project);
    }
  };

  const handleExtractWorkflow = async () => {
    if (!selectedProject) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await extractWorkflow(connectionDetails, selectedProject.key);
      setExtractedWorkflow(result.data);
      setSelectedStartStates(result.data.initialStatuses);
      setSelectedEndStates(result.data.finalStatuses);
    } catch (err) {
      setError('Failed to extract workflow: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStateSelection = (state, type) => {
    if (type === 'start') {
      setSelectedStartStates(prev => 
        prev.includes(state) 
          ? prev.filter(s => s !== state)
          : [...prev, state]
      );
    } else if (type === 'end') {
      setSelectedEndStates(prev => 
        prev.includes(state) 
          ? prev.filter(s => s !== state)
          : [...prev, state]
      );
    } else if (type === 'active') {
      setSelectedActiveStatuses(prev => 
        prev.includes(state) 
          ? prev.filter(s => s !== state)
          : [...prev, state]
      );
    }
  };

  const getWorkflowData = () => ({
    ...extractedWorkflow,
    startStates: selectedStartStates,
    endStates: selectedEndStates,
    activeStatuses: selectedActiveStatuses
  });

  return {
    loading,
    error,
    projects,
    selectedProject,
    extractedWorkflow,
    selectedStartStates,
    selectedEndStates,
    selectedActiveStatuses,
    handleFetchProjects,
    handleProjectSelect,
    handleExtractWorkflow,
    handleStateSelection,
    getWorkflowData,
    setError
  };
};
