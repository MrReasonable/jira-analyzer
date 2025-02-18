import React from 'react';
import { GripVertical, X } from 'lucide-react';

export const WorkflowStatusItem = ({
  status,
  isStartState,
  isEndState,
  isActiveState,
  dragHandlers,
  onStatusChange,
  onToggleStart,
  onToggleEnd,
  onToggleActive,
  onRemove,
  index,
  showActiveToggle = true,
  editValue,
  onEditValueChange,
  onStartEdit,
  onCancelEdit
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedValue = editValue.trim();
      if (trimmedValue && trimmedValue !== status) {
        onStatusChange(trimmedValue);
      } else {
        onCancelEdit();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelEdit();
    }
  };

  const handleBlur = (e) => {
    // Prevent blur from firing if we're handling Enter/Escape
    if (['Enter', 'Escape'].includes(e.nativeEvent?.key)) {
      return;
    }
    
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== status) {
      onStatusChange(trimmedValue);
    } else {
      onCancelEdit();
    }
  };
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
      <div className="text-gray-400 hover:text-gray-600 draggable">
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="flex items-center gap-2 flex-1">
        <input
          type="text"
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onFocus={onStartEdit}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
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
          {showActiveToggle && (
            <button
              onClick={onToggleActive}
              className={`px-2 py-1 text-xs rounded ${
                isActiveState
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
              title="Mark as Active state"
            >
              Active
            </button>
          )}
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
