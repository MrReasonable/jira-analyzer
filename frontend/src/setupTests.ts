import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { server } from './mocks/server';

// Auto mock the axios module
vi.mock('axios');

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

// Mock ResizeObserver which is used by Chart.js but not available in jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.scrollTo which is not implemented in jsdom
window.scrollTo = vi.fn();

// Reset all mocks before each test
beforeEach(() => {
  mockDestroy.mockClear();
  mockUpdate.mockClear();
  MockChart.mockClear();
});

// Start server before all tests
beforeAll(async () => {
  await server.listen();
});

// Reset handlers after each test (important for test isolation)
afterEach(async () => {
  await server.resetHandlers();
});

// Clean up after all tests are done
afterAll(() => {
  server.close();
});
