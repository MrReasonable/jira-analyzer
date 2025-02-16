import { useState, useRef } from 'react';

export const useDragAndDrop = (items, onReorder) => {
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
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, reorderedItem);
    onReorder(newItems);
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragNode.current?.classList.remove('opacity-50');
  };

  return {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragEnter,
    handleDragOver,
    handleDragEnd,
    handleDrop
  };
};
