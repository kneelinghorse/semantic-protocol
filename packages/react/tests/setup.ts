import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Mock window.__SEMANTIC_DEVTOOLS__
global.__SEMANTIC_DEVTOOLS__ = undefined;

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((message) => {
    if (
      typeof message === 'string' &&
      (message.includes('Warning: ReactDOM.render') ||
       message.includes('Warning: useLayoutEffect'))
    ) {
      return;
    }
    originalError(message);
  });

  console.warn = jest.fn((message) => {
    if (
      typeof message === 'string' &&
      message.includes('SemanticPortal: Target element')
    ) {
      return;
    }
    originalWarn(message);
  });
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clean up after each test
afterEach(() => {
  document.body.innerHTML = '';
  if (global.__SEMANTIC_DEVTOOLS__) {
    delete global.__SEMANTIC_DEVTOOLS__;
  }
});