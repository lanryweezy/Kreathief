import { describe, it, expect } from 'vitest';
import { getSupportedVideoMimeType } from '../../../services/videoExportService';

describe('Video Export Service', () => {
  it('detects or falls back to a supported video mime type', () => {
    const mimeType = getSupportedVideoMimeType();
    expect(typeof mimeType).toBe('string');
    expect(mimeType).toContain('video/');
  });
});
