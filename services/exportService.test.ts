import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportDesignToImage, exportToSVG, downloadBlob, cleanSvgMarkup } from './exportService';

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
  it('should generate valid SVG with correct dimensions', async () => {
    const svg = await exportToSVG(200, 100, '#ffffff', []);
    expect(svg).toContain('<svg');
    expect(svg).toContain('200');
    expect(svg).toContain('100');
  });

  it('should include background rect', async () => {
    const svg = await exportToSVG(100, 100, '#ff0000', []);
    expect(svg).toContain('#ff0000');
  });

  it('should handle empty layers', async () => {
    const svg = await exportToSVG(100, 100, '#ffffff', []);
    expect(svg).toContain('<svg');
  });

  it('should include gradient definitions when layers have gradients', async () => {
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
        gradient: {
          enabled: true,
          type: 'linear',
          colors: [
            { color: '#ff0000', position: 0 },
            { color: '#00ff00', position: 1 },
          ],
        },
      },
    ] as any[];
    const svg = await exportToSVG(100, 100, '#ffffff', layers);
    expect(svg).toContain('linearGradient');
    expect(svg).toContain('#ff0000');
  });

  it('should preserve solid color fills on rectangles and ellipses', async () => {
    const layers = [
      {
        id: 'rect-1',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        color: '#ff0055',
      },
      {
        id: 'circle-1',
        type: 'circle',
        x: 10,
        y: 10,
        width: 30,
        height: 30,
        color: '#00ff77',
      },
    ] as any[];
    const svg = await exportToSVG(100, 100, '#ffffff', layers);
    expect(svg).toContain('fill="#ff0055"');
    expect(svg).toContain('fill="#00ff77"');
    expect(svg).toContain('ellipse');
  });

  it('should preserve text layers properties correctly', async () => {
    const layers = [
      {
        id: 'text-1',
        type: 'text',
        x: 5,
        y: 5,
        width: 80,
        height: 20,
        text: 'hello world',
        color: '#aabbcc',
        fontSize: 24,
      },
    ] as any[];
    const svg = await exportToSVG(100, 100, '#ffffff', layers);
    expect(svg).toContain('hello world');
    expect(svg).toContain('fill="#aabbcc"');
    expect(svg).toContain('font-size="24"');
  });

  it('should clean SVG markup by removing empty groups and editor data attributes', () => {
    const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" data-editor-id="test-123" data-kreathief="true">
  <defs></defs>
  <g id="empty-group">
  </g>
  <rect x="0" y="0" width="100" height="100" fill="white" data-layer-id="layer-1" />
</svg>`;
    const cleaned = cleanSvgMarkup(rawSvg);
    expect(cleaned).not.toContain('data-editor-id');
    expect(cleaned).not.toContain('data-kreathief');
    expect(cleaned).not.toContain('data-layer-id');
    expect(cleaned).not.toContain('<defs></defs>');
    expect(cleaned).not.toContain('<g id="empty-group">');
    expect(cleaned).toContain('<rect x="0" y="0" width="100" height="100" fill="white" />');
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
