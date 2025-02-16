import React, { useState } from 'react';
import { RefreshCw, Check, ArrowRight, ArrowRightCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/Alert';

const WorkflowExtractor = ({ 
  connectionDetails, 
  onWorkflowExtracted,
  onProjectSelect
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [extractedWorkflow, setExtractedWorkflow] = useState(null);
  const [selectedStartStates, setSelectedStartStates] = useState([]);
  const [selectedEndStates, setSelectedEndStates] = useState([]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/workflow/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectionDetails),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setProjects(data.data);
      } else {
        setError(data.message || 'Failed to fetch projects');
      }
    } catch (err) {
      setError('Failed to fetch projects: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const extractWorkflow = async () => {
    if (!selectedProject) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/workflow/extract-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...connectionDetails,
          projectKey: selectedProject.key
        }),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setExtractedWorkflow(data.data);
        // Pre-select initial and final statuses from Jira
        setSelectedStartStates(data.data.initialStatuses);
        setSelectedEndStates(data.data.finalStatuses);
        // Notify parent about project selection
        if (onProjectSelect) {
          onProjectSelect(selectedProject);
        }
      } else {
        setError(data.message || 'Failed to extract workflow');
      }
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
    } else {
      setSelectedEndStates(prev => 
        prev.includes(state) 
          ? prev.filter(s => s !== state)
          : [...prev, state]
      );
    }
  };

  const handleApplyWorkflow = () => {
    if (!extractedWorkflow) return;

    onWorkflowExtracted({
      ...extractedWorkflow,
      startStates: selectedStartStates,
      endStates: selectedEndStates
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Extract Workflow</h3>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* Project Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Project
          </label>
          <div className="flex gap-2">
            <select
              value={selectedProject?.key || ''}
              onChange={(e) => {
                const project = projects.find(p => p.key === e.target.value);
                setSelectedProject(project);
              }}
              className="flex-1 p-2 border rounded"
              disabled={loading || !projects.length}
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project.key} value={project.key}>
                  {project.name} ({project.key})
                </option>
              ))}
            </select>
            <button
              onClick={fetchProjects}
              disabled={loading}
              className="p-2 text-blue-600 hover:text-blue-800"
              title="Refresh projects"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Extract Button */}
        <button
          onClick={extractWorkflow}
          disabled={!selectedProject || loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <ArrowRight className="h-4 w-4" />
              Extract Workflow
            </>
          )}
        </button>

        {/* Extracted Workflow Preview */}
        {extractedWorkflow && (
          <div className="mt-6 space-y-6">
            {/* Suggested Flow */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-700">
                  Project Workflow
                </h4>
                {Object.keys(extractedWorkflow.transitions).length > 1 && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Multiple workflow paths available
                  </span>
                )}
              </div>
              <div className="p-4 bg-gray-50 rounded flex items-center flex-wrap gap-2">
                <div className="w-full text-sm text-gray-600 mb-2">
                  This is a suggested workflow path based on your project's issue history:
                </div>
                {extractedWorkflow.suggestedFlow.map((status, index) => (
                  <span key={status} className="inline-flex items-center">
                    <span className="px-3 py-1 bg-white rounded border text-sm">
                      {status}
                    </span>
                    {index < extractedWorkflow.suggestedFlow.length - 1 && (
                      <ArrowRightCircle className="h-4 w-4 mx-1 text-gray-400" />
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Start/End State Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-sm text-gray-600 mb-2 md:col-span-2">
                Select the states that represent the start and end of your workflow. Multiple states can be selected to handle different workflow paths:
              </div>
              {/* Start States */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Select Start States
                </h4>
                <div className="p-4 bg-gray-50 rounded space-y-2">
                  {extractedWorkflow.allStatuses.map((status) => (
                    <label key={status} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedStartStates.includes(status)}
                        onChange={() => handleStateSelection(status, 'start')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* End States */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Select End States
                </h4>
                <div className="p-4 bg-gray-50 rounded space-y-2">
                  {extractedWorkflow.allStatuses.map((status) => (
                    <label key={status} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedEndStates.includes(status)}
                        onChange={() => handleStateSelection(status, 'end')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApplyWorkflow}
              disabled={!selectedStartStates.length || !selectedEndStates.length}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300 flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              Apply Workflow
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowExtractor;
