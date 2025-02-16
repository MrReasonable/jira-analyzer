import React from 'react';
import { RefreshCw } from 'lucide-react';

export const ProjectSelector = ({
  projects,
  selectedProject,
  onProjectSelect,
  onRefresh,
  loading,
  disabled
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Select Project
    </label>
    <div className="flex gap-2">
      <select
        value={selectedProject?.key || ''}
        onChange={(e) => {
          const project = projects.find(p => p.key === e.target.value);
          onProjectSelect(project);
        }}
        className="flex-1 p-2 border rounded"
        disabled={disabled || loading || !projects.length}
      >
        <option value="">Select a project...</option>
        {projects.map((project) => (
          <option key={project.key} value={project.key}>
            {project.name} ({project.key})
          </option>
        ))}
      </select>
      <button
        onClick={onRefresh}
        disabled={disabled || loading}
        className="p-2 text-blue-600 hover:text-blue-800"
        title="Refresh projects"
      >
        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  </div>
);

export default ProjectSelector;
