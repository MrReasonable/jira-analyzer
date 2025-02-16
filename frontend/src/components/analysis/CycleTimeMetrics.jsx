import React from 'react';
import CycleTimeChart from '../CycleTimeChart';
import LeadTimeChart from '../LeadTimeChart';

export const CycleTimeMetrics = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Process Metrics</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CycleTimeChart data={{ 
          ...data, 
          expected_path: data.expected_path || data.config?.expectedPath || [],
          end_states: data.end_states || [] 
        }} />
        <LeadTimeChart data={data} />
      </div>
    </div>
  );
};

export default CycleTimeMetrics;
