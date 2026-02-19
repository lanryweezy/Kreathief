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
