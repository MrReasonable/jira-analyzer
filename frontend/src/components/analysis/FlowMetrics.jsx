import React from 'react';
import CFDChart from '../CFDChart';
import FlowEfficiencyChart from '../FlowEfficiencyChart';

export const FlowMetrics = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">Flow Analysis</h3>
        <CFDChart data={data.cfd_data} />
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">Flow Efficiency</h3>
        <FlowEfficiencyChart data={data.flow_efficiency_data} />
      </div>
    </div>
  );
};

export default FlowMetrics;
