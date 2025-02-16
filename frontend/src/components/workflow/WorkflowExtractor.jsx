import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import ProjectSelector from './ProjectSelector';
import WorkflowPreview from './WorkflowPreview';
import { useWorkflowExtraction } from '@/hooks/useWorkflowExtraction';

const WorkflowExtractor = ({ 
  connectionDetails, 
  onWorkflowExtracted,
  onProjectSelect
}) => {
  const {
    loading,
    error,
    projects,
    selectedProject,
    extractedWorkflow,
    selectedStartStates,
    selectedEndStates,
    handleFetchProjects,
    handleProjectSelect,
    handleExtractWorkflow,
    handleStateSelection,
    getWorkflowData
  } = useWorkflowExtraction(connectionDetails, onProjectSelect);

  const handleApplyWorkflow = () => {
    if (!extractedWorkflow) return;
    onWorkflowExtracted(getWorkflowData());
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
        <ProjectSelector
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={handleProjectSelect}
          onRefresh={handleFetchProjects}
          loading={loading}
        />

        <button
          onClick={handleExtractWorkflow}
          disabled={!selectedProject || loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                     disabled:bg-blue-300 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <ArrowRight className="h-4 w-4 animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <ArrowRight className="h-4 w-4" />
              Extract Workflow
            </>
          )}
        </button>

        {extractedWorkflow && (
          <>
            <WorkflowPreview
              workflow={extractedWorkflow}
              selectedStartStates={selectedStartStates}
              selectedEndStates={selectedEndStates}
              onStateSelection={handleStateSelection}
            />

            <button
              onClick={handleApplyWorkflow}
              disabled={!selectedStartStates.length || !selectedEndStates.length}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 
                         disabled:bg-green-300 flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              Apply Workflow
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkflowExtractor;
