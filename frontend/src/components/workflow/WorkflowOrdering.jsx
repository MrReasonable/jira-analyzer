import React, { useState } from 'react';
import WorkflowStatusItem from './WorkflowStatusItem';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useWorkflowState } from '@/hooks/useWorkflowState';

const WorkflowOrdering = ({
  statuses, 
  expectedPath,
  startStates = [],
  endStates = [], 
  onOrderChange,
  onStatusesChange,
  onStateChange
}) => {
  const dragHandlers = useDragAndDrop(expectedPath, onOrderChange);
  const workflowState = useWorkflowState(
    statuses,
    expectedPath,
    startStates,
    endStates,
    onStatusesChange,
    onStateChange
  );

  const [newStatus, setNewStatus] = useState('');

  const handleAddStatus = (e) => {
    if (e.key === 'Enter' && newStatus) {
      workflowState.addStatus(newStatus);
      setNewStatus('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Workflow Configuration</h3>
        <input
          type="text"
          placeholder="Add new status..."
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          onKeyPress={handleAddStatus}
          className="p-2 border rounded"
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop statuses to define their order in the workflow.
          The cycle time will be calculated based on this order.
        </p>

        <div className="space-y-2">
          {expectedPath.map((status, index) => (
            <WorkflowStatusItem
              key={status}
              status={status}
              isStartState={startStates.includes(status)}
              isEndState={endStates.includes(status)}
              dragHandlers={dragHandlers}
              onStatusChange={(newValue) => workflowState.updateStatus(status, newValue)}
              onToggleStart={() => workflowState.toggleStartState(status)}
              onToggleEnd={() => workflowState.toggleEndState(status)}
              onRemove={() => workflowState.removeStatus(status)}
              index={index}
            />
          ))}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>
            <span className="font-medium">To-Do States:</span> States that indicate work hasn't started
          </p>
          <p>
            <span className="font-medium">Done States:</span> States that indicate work is complete
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkflowOrdering;
