import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const calculatePercentile = (values, percentile) => {
  if (!values.length) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
};

export const calculateStandardDeviation = (values) => {
  const n = values.length;
  if (n < 2) return 0;

  const mean = values.reduce((acc, val) => acc + val, 0) / n;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
  return Math.sqrt(variance);
};