import React, { useState } from 'react';
import WorkflowStatusItem from './WorkflowStatusItem';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useWorkflowState } from '@/hooks/useWorkflowState';

const WorkflowOrdering = ({
  statuses, 
  expectedPath,
  startStates = [],
  endStates = [],
  activeStatuses = [],
  flowEfficiencyMethod = 'active_statuses',
  onOrderChange,
  onStatusesChange,
  onStateChange,
  onActiveStatusesChange
}) => {
  const dragHandlers = useDragAndDrop(expectedPath, (newPath) => {
    // When order changes, ensure both path and statuses are updated
    onStatusesChange([...new Set(newPath)], newPath);
  });
  const workflowState = useWorkflowState(
    statuses,
    expectedPath,
    startStates,
    endStates,
    activeStatuses,
    onStatusesChange,
    onStateChange,
    onActiveStatusesChange
  );

  const [newStatus, setNewStatus] = useState('');
  const [editingStatus, setEditingStatus] = useState(null);
  const [editValue, setEditValue] = useState('');

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
              key={index}
              status={status}
              isStartState={startStates.includes(status)}
              isEndState={endStates.includes(status)}
              dragHandlers={dragHandlers}
              onStatusChange={(newValue) => {
                if (newValue.trim() && newValue.trim() !== status) {
                  workflowState.updateStatus(status, newValue.trim());
                }
                setEditingStatus(null);
                setEditValue('');
              }}
              editValue={editingStatus === status ? editValue : status}
              onEditValueChange={(value) => setEditValue(value)}
              onStartEdit={() => {
                setEditingStatus(status);
                setEditValue(status);
              }}
              onCancelEdit={() => {
                setEditingStatus(null);
                setEditValue('');
              }}
              onToggleStart={() => workflowState.toggleStartState(status)}
              onToggleEnd={() => workflowState.toggleEndState(status)}
              isActiveState={flowEfficiencyMethod === 'active_statuses' && activeStatuses.includes(status)}
              onToggleActive={flowEfficiencyMethod === 'active_statuses' ? () => workflowState.toggleActiveState(status) : undefined}
              showActiveToggle={flowEfficiencyMethod === 'active_statuses'}
              onRemove={() => workflowState.removeStatus(status)}
              index={index}
            />
          ))}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>
            <span className="font-medium">To-Do States:</span> States that indicate work hasn't started
          </p>
          {flowEfficiencyMethod === 'active_statuses' && (
            <p>
              <span className="font-medium">Active States:</span> States where active work is being done (used for flow efficiency calculation)
            </p>
          )}
          <p>
            <span className="font-medium">Done States:</span> States that indicate work is complete
          </p>
          <p className="mt-2 text-xs">
            Flow efficiency is calculated using {flowEfficiencyMethod === 'active_statuses' 
              ? 'time spent in active states' 
              : 'time logged on issues'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkflowOrdering;
