// Test setup file
import { vi, beforeAll, afterAll } from 'vitest';

// Mock console methods to reduce noise in tests
const originalConsole = global.console;

beforeAll(() => {
  global.console = {
    ...originalConsole,
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
});

afterAll(() => {
  global.console = originalConsole;
});

// Mock fetch globally to prevent external API calls
global.fetch = vi.fn();

// Mock process.exit to prevent tests from actually exiting
const originalExit = process.exit;
beforeAll(() => {
  process.exit = vi.fn() as unknown as typeof process.exit;
});

afterAll(() => {
  process.exit = originalExit;
});
