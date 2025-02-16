export const formatNumber = (num) => {
  if (num === undefined || num === null) return 0;
  return Number(num.toFixed(1));
};

export const getComplianceColor = (rate) => {
  if (rate >= 80) return 'bg-green-100 text-green-800';
  if (rate >= 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

export const formatTimeRange = (timeRange) => {
  if (timeRange.timePreset) {
    const presetLabels = {
      'two_weeks': 'Last 2 Weeks',
      'quarter': 'Last Quarter',
      'half_year': 'Last 6 Months',
      'year': 'Last Year'
    };
    return presetLabels[timeRange.timePreset];
  }
  
  if (timeRange.startDate && timeRange.endDate) {
    const start = new Date(timeRange.startDate).toLocaleDateString();
    const end = new Date(timeRange.endDate).toLocaleDateString();
    return `${start} to ${end}`;
  }

  return 'All Time';
};

export const hasSignificantBottleneck = (bottlenecks) => 
  bottlenecks.length > 0 && bottlenecks[0].bottleneck_score > 5;

export const getMetricsSummary = (data) => {
  if (!data) return {
    totalIssues: 0,
    cycleTime: { mean: 0, median: 0, p85: 0, p95: 0, stdDev: 0 },
    compliance: { rate: 0, compliantIssues: 0 }
  };

  const cycleTimeStats = data.cycle_time_stats || {};
  const workflowCompliance = data.workflow_compliance || {};

  return {
    totalIssues: data.total_issues || 0,
    cycleTime: {
      mean: formatNumber(cycleTimeStats.mean),
      median: formatNumber(cycleTimeStats.median),
      p85: formatNumber(cycleTimeStats.p85),
      p95: formatNumber(cycleTimeStats.p95),
      stdDev: formatNumber(cycleTimeStats.std_dev)
    },
    compliance: {
      rate: formatNumber(workflowCompliance.compliance_rate),
      compliantIssues: workflowCompliance.compliant_issues || 0
    }
  };
};

export const getBottleneckSummary = (bottleneck) => {
  if (!bottleneck) return {
    status: '',
    avgTime: 0,
    stdDev: 0,
    impact: 0
  };

  return {
    status: bottleneck.status || '',
    avgTime: formatNumber(bottleneck.avg_time),
    stdDev: formatNumber(bottleneck.std_dev),
    impact: bottleneck.impact || 0
  };
};
