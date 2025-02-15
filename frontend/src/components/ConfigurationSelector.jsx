import React, { useState, useEffect } from 'react';
import { ChevronDown, Settings } from 'lucide-react';

const ConfigurationSelector = ({ onConfigSelect, currentConfigName }) => {
  const [configs, setConfigs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-5 w-5 text-gray-500" />
        <div className="text-sm text-gray-600">Active Configuration:</div>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 min-w-[200px]"
          >
            <span className="flex-1 text-left">
              {currentConfigName || 'Select Configuration'}
            </span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {isOpen && configs.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white border rounded-lg shadow-lg z-10">
              {configs.map((config) => (
                <button
                  key={config.id}
                  onClick={() => {
                    onConfigSelect(config);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                >
                  {config.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 mt-1">
          {error}
        </div>
      )}

      {configs.length === 0 && !error && (
        <div className="text-sm text-gray-500 mt-1">
          No saved configurations found
        </div>
      )}
    </div>
  );
};

export default ConfigurationSelector;