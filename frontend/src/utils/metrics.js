export const formatNumber = (num) => Number(num.toFixed(1));

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

export const getMetricsSummary = (data) => ({
  totalIssues: data.total_issues,
  cycleTime: {
    mean: formatNumber(data.cycle_time_stats.mean),
    median: formatNumber(data.cycle_time_stats.median),
    p85: formatNumber(data.cycle_time_stats.p85),
    p95: formatNumber(data.cycle_time_stats.p95),
    stdDev: formatNumber(data.cycle_time_stats.std_dev)
  },
  compliance: {
    rate: formatNumber(data.workflow_compliance.compliance_rate),
    compliantIssues: data.workflow_compliance.compliant_issues
  }
});

export const getBottleneckSummary = (bottleneck) => ({
  status: bottleneck.status,
  avgTime: formatNumber(bottleneck.avg_time),
  stdDev: formatNumber(bottleneck.std_dev),
  impact: bottleneck.impact
});
