import React, { useState, useRef } from 'react';
import { GripVertical, X } from 'lucide-react';

const WorkflowOrdering = ({
  statuses, 
  expectedPath,
  startStates = [],
  endStates = [], 
  onOrderChange,
  onStatusesChange,
  onStateChange
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragNode = useRef(null);

  const handleDragStart = (e, index) => {
    dragNode.current = e.target;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.target.classList.add('opacity-50');
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = (e) => {
    e.preventDefault();
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragNode.current?.classList.remove('opacity-50');
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const items = Array.from(expectedPath);
    const [reorderedItem] = items.splice(draggedIndex, 1);
    items.splice(index, 0, reorderedItem);
    onOrderChange(items);
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragNode.current?.classList.remove('opacity-50');
  };

  const removeStatus = (status) => {
    const newStatuses = statuses.filter(s => s !== status);
    const newPath = expectedPath.filter(s => s !== status);
    onStatusesChange(newStatuses, newPath);
  };

  const addStatus = (status) => {
    const newStatuses = [...statuses, status];
    const newPath = [...expectedPath, status];
    onStatusesChange(newStatuses, newPath);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Workflow Configuration</h3>
        <input
          type="text"
          placeholder="Add new status..."
          className="p-2 border rounded"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && e.target.value) {
              addStatus(e.target.value);
              e.target.value = '';
            }
          }}
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop statuses to define their order in the workflow.
          The cycle time will be calculated based on this order.
        </p>

        <div className="space-y-2">
          {expectedPath.map((status, index) => (
            <div
              key={status}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
              className={`flex items-center gap-2 p-3 bg-white rounded border group hover:border-blue-500 ${
                dragOverIndex === index ? 'border-blue-500 border-2' : ''
              }`}
            >
              <div className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={status}
                  onChange={(e) => {
                    const newStatuses = statuses.map(s => s === status ? e.target.value : s);
                    const newPath = expectedPath.map(s => s === status ? e.target.value : s);
                    const newStartStates = startStates.map(s => s === status ? e.target.value : s);
                    const newEndStates = endStates.map(s => s === status ? e.target.value : s);
                    onStatusesChange(newStatuses, newPath);
                    onStateChange(newStartStates, newEndStates);
                  }}
                  className="flex-1 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newStartStates = startStates.includes(status)
                        ? startStates.filter(s => s !== status)
                        : [...startStates, status];
                      onStateChange(newStartStates, endStates.filter(s => s !== status));
                    }}
                    className={`px-2 py-1 text-xs rounded ${
                      startStates.includes(status)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                    title="Mark as To-Do state"
                  >
                    To-Do
                  </button>
                  <button
                    onClick={() => {
                      const newEndStates = endStates.includes(status)
                        ? endStates.filter(s => s !== status)
                        : [...endStates, status];
                      onStateChange(startStates.filter(s => s !== status), newEndStates);
                    }}
                    className={`px-2 py-1 text-xs rounded ${
                      endStates.includes(status)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                    title="Mark as Done state"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => removeStatus(status)}
                    className="p-1 text-red-500 hover:text-red-700"
                    title="Remove status"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
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
