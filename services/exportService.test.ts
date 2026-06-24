import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportDesignToImage, exportToSVG, downloadBlob } from './exportService';

describe('exportDesignToImage', () => {
  const mockParams = {
    width: 100,
    height: 100,
    backgroundColor: '#ffffff',
    backgroundImageUrl: null,
    shapes: [],
    texts: [],
    images: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fall back to main thread if Worker is not functional', async () => {
    // In our setup, Worker is mocked but doesn't do much.
    // We can test if the function returns a string (data URL)
    const result = await exportDesignToImage(
      mockParams.width,
      mockParams.height,
      mockParams.backgroundColor,
      mockParams.backgroundImageUrl,
      [] // Combined layers
    );
    expect(result).toContain('data:image/png;base64');
  });

  it('should handle different formats', async () => {
    const resultJpeg = await exportDesignToImage(100, 100, '#ffffff', null, [], undefined, 'jpeg');
    expect(resultJpeg).toContain('data:image/jpeg;base64');
  });
});

describe('exportToSVG', () => {
  it('should generate valid SVG with correct dimensions', () => {
    const svg = exportToSVG(200, 100, '#ffffff', []);
    expect(svg).toContain('<svg width="200" height="100"');
    expect(svg).toContain('</svg>');
  });

  it('should include background rect', () => {
    const svg = exportToSVG(100, 100, '#ff0000', []);
    expect(svg).toContain('fill="#ff0000"');
  });

  it('should handle empty layers', () => {
    const svg = exportToSVG(100, 100, '#ffffff', []);
    expect(svg).toContain('<defs>');
    expect(svg).toContain('</defs>');
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
        locked: false,
        visible: true,
        color: '#000',
        cornerRadius: 0,
        gradient: {
          enabled: true,
          type: 'linear' as const,
          angle: 90,
          colors: [
            { color: '#ff0000', position: 0 },
            { color: '#0000ff', position: 1 },
          ],
        },
      },
    ] as any[];
    const svg = exportToSVG(100, 100, '#ffffff', layers);
    expect(svg).toContain('linearGradient');
    expect(svg).toContain('grad-test');
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
