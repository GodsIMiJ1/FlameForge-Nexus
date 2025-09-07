// Test setup for FlameForge Nexus
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
});

// Mock AbortController
global.AbortController = class AbortController {
  signal = {
    aborted: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  abort = vi.fn(() => {
    this.signal.aborted = true;
  });
};

// Mock AbortSignal.timeout
global.AbortSignal = {
  timeout: (ms: number) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  },
} as any;

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
});
