import React from 'react';
import EpicLeadTimeChart from '../EpicLeadTimeChart';

export const EpicAnalysis = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Epic Lead Times</h3>
      <EpicLeadTimeChart data={data.epic_data} />
    </div>
  );
};

export default EpicAnalysis;
