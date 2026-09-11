import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import 'vitest-canvas-mock';

// Mock Worker and OffscreenCanvas if not available in JSDOM
if (typeof Worker === 'undefined') {
  (globalThis as any).Worker = class {
    onmessage: any = null;
    onerror: any = null;
    postMessage(msg: any) {
      // Simulate success for unit tests
      setTimeout(() => {
        if (this.onmessage) {
          const canvas = document.createElement('canvas');
          canvas.width = msg.width || 100;
          canvas.height = msg.height || 100;
          const dataUrl = canvas.toDataURL(msg.format === 'jpeg' ? 'image/jpeg' : 'image/png');
          this.onmessage({ data: { dataUrl } });
        }
      }, 10);
    }
    terminate() {}
  } as any;
}

if (typeof OffscreenCanvas === 'undefined') {
  (globalThis as any).OffscreenCanvas = class {
    width: number = 0;
    height: number = 0;
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
    }
    getContext() {
      return null;
    }
    convertToBlob() {
      return Promise.resolve(new Blob());
    }
  } as any;
}
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// extends Vitest's expect method with methods from react-testing-library
afterEach(() => {
  cleanup();
});

// Mock URL.createObjectURL and URL.revokeObjectURL
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
}
if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = vi.fn();
}

// Mock fetch for OpenRouter/backend in unit tests to prevent network hangs
const originalFetch = globalThis.fetch;
globalThis.fetch = vi.fn(async (input: any, init?: any) => {
  const url = typeof input === 'string' ? input : input?.url || '';
  if (url.includes('/api/openrouter') || url.includes(':3000')) {
    return {
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: 'OpenRouter API key not configured' }),
      text: async () => JSON.stringify({ error: 'OpenRouter API key not configured' }),
    } as any;
  }
  if (originalFetch) {
    return originalFetch(input, init);
  }
  return { ok: false, status: 404 } as any;
});

