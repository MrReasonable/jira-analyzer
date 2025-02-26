import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock import.meta.env
vi.mock('import.meta', () => ({
  env: {
    VITE_API_URL: 'http://localhost:8000',
  },
}));

// Mock Chart.js
const mockDestroy = vi.fn();
const mockUpdate = vi.fn();
const mockInstance = {
  destroy: mockDestroy,
  update: mockUpdate,
  data: { labels: [], datasets: [] },
  options: {},
};
const MockChart = vi.fn(() => mockInstance);

vi.mock('chart.js/auto', () => ({
  default: MockChart,
  Chart: MockChart,
}));

// Export for tests to use
export const chartMock = {
  instance: mockInstance,
  destroy: mockDestroy,
  update: mockUpdate,
  Chart: MockChart,
};

// Reset all mocks before each test
beforeEach(() => {
  mockDestroy.mockClear();
  mockUpdate.mockClear();
  MockChart.mockClear();

  // Reset all mocks before each test
  vi.resetAllMocks();
});

// Mock ResizeObserver
const mockResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as unknown as typeof window.ResizeObserver;

window.ResizeObserver = mockResizeObserver;
