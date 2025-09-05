/// <reference types="vitest" />
import { vi } from 'vitest';

// Global fetch mock setup
global.fetch = vi.fn();

// Mock setTimeout and setInterval for deterministic testing
vi.mock('timers', () => ({
  setTimeout: vi.fn((fn, ms) => {
    return vi.advanceTimersByTime ? vi.advanceTimersByTime(ms) : setTimeout(fn, ms);
  }),
  clearTimeout: vi.fn()
}));

// Mock console methods to avoid spam during tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// Setup for each test
beforeEach(() => {
  vi.clearAllMocks();
  // Reset fetch mock to default behavior
  vi.mocked(fetch).mockReset();
});
