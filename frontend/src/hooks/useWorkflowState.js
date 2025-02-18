import { useState, useCallback, useEffect } from 'react';

export const useWorkflowState = (
  initialStatuses,
  initialPath,
  initialStartStates,
  initialEndStates,
  initialActiveStatuses,
  onStatusesChange,
  onStateChange,
  onActiveStatusesChange
) => {
  // Maintain internal state
  const [statuses, setStatuses] = useState(initialStatuses);
  const [path, setPath] = useState(initialPath);
  const [startStates, setStartStates] = useState(initialStartStates);
  const [endStates, setEndStates] = useState(initialEndStates);
  const [activeStatuses, setActiveStatuses] = useState(initialActiveStatuses);

  // Sync with external state when props change
  useEffect(() => {
    setStatuses(initialStatuses);
    setPath(initialPath);
    setStartStates(initialStartStates);
    setEndStates(initialEndStates);
  }, [initialStatuses, initialPath, initialStartStates, initialEndStates, initialActiveStatuses]);

  const addStatus = useCallback((status) => {
    const newStatuses = [...statuses, status];
    const newPath = [...path, status];
    
    onStatusesChange(newStatuses, newPath);
    setStatuses(newStatuses);
    setPath(newPath);
  }, [statuses, path, onStatusesChange]);

  const removeStatus = useCallback((status) => {
    const newStatuses = statuses.filter(s => s !== status);
    const newPath = path.filter(s => s !== status);
    
    onStatusesChange(newStatuses, newPath);
    setStatuses(newStatuses);
    setPath(newPath);
  }, [statuses, path, onStatusesChange]);

  const updateStatus = useCallback((oldStatus, newStatus) => {
    if (oldStatus === newStatus) return;

    const newStatuses = [...statuses];
    const statusIndex = newStatuses.indexOf(oldStatus);
    if (statusIndex !== -1) {
      newStatuses[statusIndex] = newStatus;
    }

    const newPath = [...path];
    const pathIndex = newPath.indexOf(oldStatus);
    if (pathIndex !== -1) {
      newPath[pathIndex] = newStatus;
    }

    const newStartStates = [...startStates];
    const startIndex = newStartStates.indexOf(oldStatus);
    if (startIndex !== -1) {
      newStartStates[startIndex] = newStatus;
    }

    const newEndStates = [...endStates];
    const endIndex = newEndStates.indexOf(oldStatus);
    if (endIndex !== -1) {
      newEndStates[endIndex] = newStatus;
    }

    const newActiveStatuses = [...activeStatuses];
    const activeIndex = newActiveStatuses.indexOf(oldStatus);
    if (activeIndex !== -1) {
      newActiveStatuses[activeIndex] = newStatus;
    }

    onStatusesChange(newStatuses, newPath);
    onStateChange(newStartStates, newEndStates);
    onActiveStatusesChange(newActiveStatuses);
    
    setStatuses(newStatuses);
    setPath(newPath);
    setStartStates(newStartStates);
    setEndStates(newEndStates);
    setActiveStatuses(newActiveStatuses);
  }, [statuses, path, startStates, endStates, onStatusesChange, onStateChange]);

  const toggleStartState = useCallback((status) => {
    const newStartStates = startStates.includes(status)
      ? startStates.filter(s => s !== status)
      : [...startStates, status];
    const newEndStates = endStates.filter(s => s !== status);
    
    onStateChange(newStartStates, newEndStates);
    setStartStates(newStartStates);
    setEndStates(newEndStates);
  }, [startStates, endStates, onStateChange]);

  const toggleEndState = useCallback((status) => {
    const newEndStates = endStates.includes(status)
      ? endStates.filter(s => s !== status)
      : [...endStates, status];
    const newStartStates = startStates.filter(s => s !== status);
    
    onStateChange(newStartStates, newEndStates);
    setEndStates(newEndStates);
    setStartStates(newStartStates);
  }, [startStates, endStates, onStateChange]);

  const toggleActiveState = useCallback((status) => {
    const newActiveStatuses = activeStatuses.includes(status)
      ? activeStatuses.filter(s => s !== status)
      : [...activeStatuses, status];
    
    onActiveStatusesChange(newActiveStatuses);
    setActiveStatuses(newActiveStatuses);
  }, [activeStatuses, onActiveStatusesChange]);

  return {
    addStatus,
    removeStatus,
    updateStatus,
    toggleStartState,
    toggleEndState,
    toggleActiveState
  };
};
