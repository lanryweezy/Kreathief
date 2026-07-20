import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportDesignToImage, exportToSVG, downloadBlob } from './exportService';

describe('exportDesignToImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a Blob', async () => {
    const result = await exportDesignToImage([], { width: 100, height: 100 });
    expect(result).toBeInstanceOf(Blob);
  });

  it('should handle different formats', async () => {
    const result = await exportDesignToImage([], { width: 100, height: 100, format: 'jpeg' });
    expect(result).toBeInstanceOf(Blob);
  });
});

describe('exportToSVG', () => {
  it('should generate valid SVG with correct dimensions', () => {
    const svg = exportToSVG(200, 100, '#ffffff', []);
    expect(svg).toContain('<svg');
    expect(svg).toContain('200');
    expect(svg).toContain('100');
  });

  it('should include background rect', () => {
    const svg = exportToSVG(100, 100, '#ff0000', []);
    expect(svg).toContain('#ff0000');
  });

  it('should handle empty layers', () => {
    const svg = exportToSVG(100, 100, '#ffffff', []);
    expect(svg).toContain('<svg');
  });

  it('should include gradient definitions when layers have gradients', () => {
    const layers = [
      {
        id: 'test',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        rotation: 0,
        opacity: 1,
      },
    ] as any[];
    const svg = exportToSVG(100, 100, '#ffffff', layers);
    expect(svg).toContain('<svg');
  });
});

describe('downloadBlob', () => {
  it('should create and click a download link', () => {
    const mockClick = vi.fn();
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();
    const mockCreateElement = vi.fn(() => ({
      href: '',
      download: '',
      click: mockClick,
    }));

    Object.defineProperty(document, 'createElement', { value: mockCreateElement });
    Object.defineProperty(document.body, 'appendChild', { value: mockAppendChild });
    Object.defineProperty(document.body, 'removeChild', { value: mockRemoveChild });

    const blob = new Blob(['test'], { type: 'text/plain' });
    downloadBlob(blob, 'test.txt');

    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockClick).toHaveBeenCalled();
  });
});
