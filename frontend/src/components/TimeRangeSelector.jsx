import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';

const TimeRangeSelector = ({ defaultValue, onTimeRangeChange }) => {
  const [selectedPreset, setSelectedPreset] = useState(defaultValue?.timePreset || 'quarter');
  const [customRange, setCustomRange] = useState({
    startDate: defaultValue?.startDate || '',
    endDate: defaultValue?.endDate || ''
  });

  const presets = [
    { value: 'two_weeks', label: 'Last 2 Weeks' },
    { value: 'quarter', label: 'Last Quarter' },
    { value: 'half_year', label: 'Last 6 Months' },
    { value: 'year', label: 'Last Year' }
  ];

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);
    setCustomRange({ startDate: '', endDate: '' });
    
    // Calculate dates based on preset
    const now = new Date();
    let startDate = new Date();
    
    switch (preset) {
      case 'two_weeks':
        startDate.setDate(now.getDate() - 14);
        break;
      case 'quarter':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'half_year':
        startDate.setDate(now.getDate() - 180);
        break;
      case 'year':
        startDate.setDate(now.getDate() - 365);
        break;
      default:
        startDate = null;
    }
    
    onTimeRangeChange({
      timePreset: preset,
      startDate: startDate ? startDate.toISOString().split('T')[0] : null,
      endDate: now.toISOString().split('T')[0]
    });
  };

  const handleCustomRangeChange = (field, value) => {
    const newRange = {
      ...customRange,
      [field]: value
    };
    setCustomRange(newRange);
    setSelectedPreset('');

    if (newRange.startDate && newRange.endDate) {
      onTimeRangeChange({
        timePreset: null,
        startDate: newRange.startDate,
        endDate: newRange.endDate
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Time Range</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {presets.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handlePresetChange(value)}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded border
                ${selectedPreset === value 
                  ? 'bg-blue-50 border-blue-500 text-blue-700' 
                  : 'hover:bg-gray-50'}`}
            >
              <Clock className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="text-sm text-gray-600 mb-2">Custom Range</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <div className="mt-1 relative">
                <input
                  type="date"
                  value={customRange.startDate}
                  onChange={(e) => handleCustomRangeChange('startDate', e.target.value)}
                  className="w-full p-2 border rounded pr-10"
                  max={customRange.endDate || undefined}
                />
                <Calendar className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <div className="mt-1 relative">
                <input
                  type="date"
                  value={customRange.endDate}
                  onChange={(e) => handleCustomRangeChange('endDate', e.target.value)}
                  className="w-full p-2 border rounded pr-10"
                  min={customRange.startDate || undefined}
                  max={new Date().toISOString().split('T')[0]}
                />
                <Calendar className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeRangeSelector;
