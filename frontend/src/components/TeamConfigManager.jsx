import React, { useState, useEffect } from 'react';
import { Plus, Save, Edit2, Trash2, Check, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/Alert';

const TeamConfigManager = ({ onConfigSelect, currentConfig }) => {
  const [configs, setConfigs] = useState([]);
  const [editingConfig, setEditingConfig] = useState(null);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
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

  const saveCurrentConfig = async () => {
    if (!currentConfig) return;
    
    try {
      const configToSave = {
        ...currentConfig,
        name: newConfigName || 'New Configuration'
      };

      const response = await fetch('/api/team-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configToSave),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setNewConfigName('');
        setIsCreating(false);
        fetchConfigs();
      } else {
        setError(data.message || 'Failed to save configuration');
      }
    } catch (err) {
      setError('Failed to save configuration');
    }
  };

  const updateConfig = async (configId) => {
    if (!editingConfig) return;
    
    try {
      const response = await fetch(`/api/team-configs/${configId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingConfig),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setEditingConfig(null);
        fetchConfigs();
      } else {
        setError(data.message || 'Failed to update configuration');
      }
    } catch (err) {
      setError('Failed to update configuration');
    }
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
        {currentConfig && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <Plus className="h-4 w-4" />
            Save Current
          </button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isCreating && (
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newConfigName}
              onChange={(e) => setNewConfigName(e.target.value)}
              placeholder="Configuration name"
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={saveCurrentConfig}
              className="p-2 text-green-600 hover:text-green-800"
              title="Save"
            >
              <Check className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="p-2 text-red-600 hover:text-red-800"
              title="Cancel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {configs.map((config) => (
          <div
            key={config.id}
            className="flex items-center justify-between p-4 border rounded hover:bg-gray-50"
          >
            {editingConfig?.id === config.id ? (
              <input
                type="text"
                value={editingConfig.name}
                onChange={(e) => setEditingConfig({
                  ...editingConfig,
                  name: e.target.value
                })}
                className="flex-1 p-2 border rounded mr-2"
              />
            ) : (
              <span className="flex-1">{config.name}</span>
            )}
            
            <div className="flex gap-2">
              {editingConfig?.id === config.id ? (
                <>
                  <button
                    onClick={() => updateConfig(config.id)}
                    className="p-2 text-green-600 hover:text-green-800"
                    title="Save"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setEditingConfig(null)}
                    className="p-2 text-red-600 hover:text-red-800"
                    title="Cancel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onConfigSelect(config)}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => setEditingConfig(config)}
                    className="p-2 text-gray-600 hover:text-gray-800"
                    title="Edit"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => deleteConfig(config.id)}
                    className="p-2 text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamConfigManager;