import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { GripVertical, X } from 'lucide-react';

const WorkflowOrdering = ({ 
  statuses, 
  expectedPath, 
  onOrderChange,
  onStatusesChange 
}) => {
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(expectedPath);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onOrderChange(items);
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

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="workflow">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {expectedPath.map((status, index) => (
                  <Draggable key={status} draggableId={status} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-2 p-3 bg-white rounded border group hover:border-blue-500"
                      >
                        <div {...provided.dragHandleProps} className="text-gray-400 hover:text-gray-600">
                          <GripVertical className="h-5 w-5" />
                        </div>
                        <span className="flex-1">{status}</span>
                        <button
                          onClick={() => removeStatus(status)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Start/End State Selection */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Start States</h4>
            <div className="space-y-2">
              {statuses.map(status => (
                <label key={status} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={expectedPath.indexOf(status) === 0}
                    onChange={() => {
                      if (expectedPath.indexOf(status) !== 0) {
                        const newPath = [status, ...expectedPath.filter(s => s !== status)];
                        onOrderChange(newPath);
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{status}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">End States</h4>
            <div className="space-y-2">
              {statuses.map(status => (
                <label key={status} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={expectedPath.indexOf(status) === expectedPath.length - 1}
                    onChange={() => {
                      if (expectedPath.indexOf(status) !== expectedPath.length - 1) {
                        const newPath = [...expectedPath.filter(s => s !== status), status];
                        onOrderChange(newPath);
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{status}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowOrdering;