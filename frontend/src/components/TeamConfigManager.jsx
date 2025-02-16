import React, { useState, useEffect } from 'react';
import { Plus, Save, Edit2, Trash2, Check, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/Alert';

const TeamConfigManager = ({ 
  onConfigSelect, 
  currentConfig,
  currentConfigName,
  onSaveConfig 
}) => {
  const [configs, setConfigs] = useState([]);
  const [editingConfig, setEditingConfig] = useState(null);
  const [error, setError] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/team-configs');
      const data = await response.json();
      
      if (data.status === 'success') {
        setConfigs(data.data);
      } else {
        setError('Failed to load configurations');
      }
    } catch (err) {
      setError('Failed to load configurations');
    }
  };

  const handleSaveCurrentConfig = async () => {
    if (!newConfigName.trim()) {
      setError('Please enter a configuration name');
      return;
    }

    const success = await onSaveConfig(newConfigName);
    if (success) {
      setShowSaveDialog(false);
      setNewConfigName('');
      fetchConfigs(); // Refresh the config list
    }
  };

  const handleSaveClick = () => {
    setNewConfigName(currentConfigName || '');
    setShowSaveDialog(true);
  };

  const deleteConfig = async (configId) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;
    
    try {
      const response = await fetch(`/api/team-configs/${configId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        fetchConfigs();
      } else {
        setError(data.message || 'Failed to delete configuration');
      }
    } catch (err) {
      setError('Failed to delete configuration');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Team Configurations</h2>
        {currentConfig && !showSaveDialog && (
          <button
            onClick={handleSaveClick}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <Save className="h-4 w-4" />
            Save Current
          </button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showSaveDialog && (
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">Configuration Name</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={newConfigName}
                onChange={(e) => setNewConfigName(e.target.value)}
                placeholder="Enter name"
                className="flex-1 p-2 border rounded"
              />
              <button
                onClick={handleSaveCurrentConfig}
                className="p-2 text-green-600 hover:text-green-800"
                title="Save"
              >
                <Check className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setNewConfigName('');
                }}
                className="p-2 text-red-600 hover:text-red-800"
                title="Cancel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {currentConfigName ? 
                'Using the same name will update the existing configuration.' :
                'Enter a name to save your current configuration.'}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {configs.map((config) => (
          <div
            key={config.id}
            className={`flex items-center justify-between p-4 border rounded hover:bg-gray-50 
              ${config.name === currentConfigName ? 'border-blue-500 bg-blue-50' : ''}`}
          >
            <span className="flex-1">{config.name}</span>
            <div className="flex gap-2">
              <button
                onClick={() => onConfigSelect(config)}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Load
              </button>
              <button
                onClick={() => deleteConfig(config.id)}
                className="p-2 text-red-600 hover:text-red-800"
                title="Delete"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {configs.length === 0 && (
        <p className="text-gray-500 text-center py-4">
          No saved configurations yet
        </p>
      )}
    </div>
  );
};

export default TeamConfigManager;