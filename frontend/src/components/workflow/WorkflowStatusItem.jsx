import React from 'react';
import { GripVertical, X } from 'lucide-react';

export const WorkflowStatusItem = ({
  status,
  isStartState,
  isEndState,
  dragHandlers,
  onStatusChange,
  onToggleStart,
  onToggleEnd,
  onRemove,
  index
}) => {
  return (
    <div
      draggable
      onDragStart={(e) => dragHandlers.handleDragStart(e, index)}
      onDragEnter={(e) => dragHandlers.handleDragEnter(e, index)}
      onDragOver={dragHandlers.handleDragOver}
      onDragEnd={dragHandlers.handleDragEnd}
      onDrop={(e) => dragHandlers.handleDrop(e, index)}
      className={`flex items-center gap-2 p-3 bg-white rounded border group hover:border-blue-500 ${
        dragHandlers.dragOverIndex === index ? 'border-blue-500 border-2' : ''
      }`}
    >
      <div className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="flex items-center gap-2 flex-1">
        <input
          type="text"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="flex-1 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
        />
        <div className="flex gap-2">
          <button
            onClick={onToggleStart}
            className={`px-2 py-1 text-xs rounded ${
              isStartState
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
            title="Mark as To-Do state"
          >
            To-Do
          </button>
          <button
            onClick={onToggleEnd}
            className={`px-2 py-1 text-xs rounded ${
              isEndState
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
            title="Mark as Done state"
          >
            Done
          </button>
          <button
            onClick={onRemove}
            className="p-1 text-red-500 hover:text-red-700"
            title="Remove status"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowStatusItem;
