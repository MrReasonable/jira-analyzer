export const useWorkflowState = (
  initialStatuses,
  initialPath,
  initialStartStates,
  initialEndStates,
  onStatusesChange,
  onStateChange
) => {
  const addStatus = (status) => {
    const newStatuses = [...initialStatuses, status];
    const newPath = [...initialPath, status];
    onStatusesChange(newStatuses, newPath);
  };

  const removeStatus = (status) => {
    const newStatuses = initialStatuses.filter(s => s !== status);
    const newPath = initialPath.filter(s => s !== status);
    onStatusesChange(newStatuses, newPath);
  };

  const updateStatus = (oldStatus, newStatus) => {
    const newStatuses = initialStatuses.map(s => s === oldStatus ? newStatus : s);
    const newPath = initialPath.map(s => s === oldStatus ? newStatus : s);
    const newStartStates = initialStartStates.map(s => s === oldStatus ? newStatus : s);
    const newEndStates = initialEndStates.map(s => s === oldStatus ? newStatus : s);
    onStatusesChange(newStatuses, newPath);
    onStateChange(newStartStates, newEndStates);
  };

  const toggleStartState = (status) => {
    const newStartStates = initialStartStates.includes(status)
      ? initialStartStates.filter(s => s !== status)
      : [...initialStartStates, status];
    onStateChange(newStartStates, initialEndStates.filter(s => s !== status));
  };

  const toggleEndState = (status) => {
    const newEndStates = initialEndStates.includes(status)
      ? initialEndStates.filter(s => s !== status)
      : [...initialEndStates, status];
    onStateChange(initialStartStates.filter(s => s !== status), newEndStates);
  };

  return {
    addStatus,
    removeStatus,
    updateStatus,
    toggleStartState,
    toggleEndState
  };
};
