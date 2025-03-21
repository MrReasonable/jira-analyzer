import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'
import { server } from '@mocks/server'
import { logger, LogLevel } from '@utils/logger'
import '@testing-library/jest-dom'
import { cleanup } from '@solidjs/testing-library'

// Set logger level to NONE for tests
logger.setLevel(LogLevel.NONE)

// Auto mock the axios module
vi.mock('axios')

// Mock Chart.js
const mockDestroy = vi.fn()
const mockUpdate = vi.fn()
const mockInstance = {
  destroy: mockDestroy,
  update: mockUpdate,
  data: { labels: [], datasets: [] },
  options: {},
}
const MockChart = vi.fn(() => mockInstance)

vi.mock('chart.js/auto', () => ({
  default: MockChart,
  Chart: MockChart,
}))

// Export for tests to use
export const chartMock = {
  instance: mockInstance,
  destroy: mockDestroy,
  update: mockUpdate,
  Chart: MockChart,
}

// Mock ResizeObserver which is used by Chart.js but not available in jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window.scrollTo which is not implemented in jsdom
window.scrollTo = vi.fn()

// Reset all mocks before each test
beforeEach(() => {
  mockDestroy.mockClear()
  mockUpdate.mockClear()
  MockChart.mockClear()
})

// Start server before all tests
beforeAll(async () => {
  await server.listen()
})

// Reset handlers after each test (important for test isolation)
afterEach(async () => {
  await server.resetHandlers()
  cleanup()
})

// Clean up after all tests are done
afterAll(() => {
  server.close()
})

// Mock @thisbeyond/solid-dnd
vi.mock('@thisbeyond/solid-dnd', async () => {
  // Use type assertion to specify the expected type structure
  const actual = (await vi.importActual('@mocks/solid-dnd-mock')) as {
    createSortable: typeof import('@mocks/solid-dnd-mock').createSortable
    transformStyle: typeof import('@mocks/solid-dnd-mock').transformStyle
    DragDropProvider: typeof import('@mocks/solid-dnd-mock').DragDropProvider
    DragDropSensors: typeof import('@mocks/solid-dnd-mock').DragDropSensors
    DragOverlay: typeof import('@mocks/solid-dnd-mock').DragOverlay
    createDraggable: typeof import('@mocks/solid-dnd-mock').createDraggable
    createDroppable: typeof import('@mocks/solid-dnd-mock').createDroppable
    useDragDropContext: typeof import('@mocks/solid-dnd-mock').useDragDropContext
  }
  return actual
})
