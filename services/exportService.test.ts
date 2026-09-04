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

  it('should support text layers with linear gradient and gradient defs in SVG', async () => {
    const layers = [
      {
        id: 'grad-text',
        type: 'text',
        x: 10,
        y: 10,
        width: 200,
        height: 50,
        text: 'Gradient Heading',
        color: 'linear-gradient(90deg, #ff007a 0%, #7928ca 100%)',
      },
    ] as any[];
    const svg = await exportToSVG(300, 100, '#ffffff', layers);
    expect(svg).toContain('linearGradient id="grad-grad-text"');
    expect(svg).toContain('fill="url(#grad-grad-text)"');
    expect(svg).toContain('#ff007a');
    expect(svg).toContain('#7928ca');
  });

  it('should support directional CSS gradients and radial gradients on shapes', async () => {
    const layers = [
      {
        id: 'dir-shape',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        color: 'linear-gradient(to right, #00f2fe, #4facfe)',
      },
      {
        id: 'radial-shape',
        type: 'circle',
        x: 20,
        y: 20,
        width: 60,
        height: 60,
        color: 'radial-gradient(circle, #f857a6 0%, #ff5858 100%)',
      },
    ] as any[];
    const svg = await exportToSVG(200, 200, '#ffffff', layers);
    expect(svg).toContain('linearGradient id="grad-dir-shape"');
    expect(svg).toContain('radialGradient id="grad-radial-shape"');
    expect(svg).toContain('#00f2fe');
    expect(svg).toContain('#ff5858');
  });

  it('should export background gradient when artboard has a gradient background', async () => {
    const layers = [
      {
        id: 'simple-box',
        type: 'rectangle',
        x: 10,
        y: 10,
        width: 50,
        height: 50,
        color: '#ffffff',
      },
    ] as any[];
    const svg = await exportToSVG(500, 500, 'linear-gradient(135deg, #111827 0%, #1f2937 100%)', layers);
    expect(svg).toContain('linearGradient id="grad-artboard-bg"');
    expect(svg).toContain('fill="url(#grad-artboard-bg)"');
    expect(svg).toContain('#111827');
    expect(svg).toContain('#1f2937');
  });

  it('should export sticker effect with dilated outline and drop shadow filters in SVG', async () => {
    const layers = [
      {
        id: 'sticker-layer',
        type: 'rectangle',
        x: 20,
        y: 20,
        width: 100,
        height: 100,
        color: '#ff0055',
        stickerEffect: {
          enabled: true,
          width: 6,
          color: '#ffffff',
          shadowBlur: 8,
          shadowColor: 'rgba(0,0,0,0.5)',
        },
      },
    ] as any[];
    const svg = await exportToSVG(200, 200, '#ffffff', layers);
    expect(svg).toContain('filter id="filter-sticker-layer"');
    expect(svg).toContain('feMorphology in="SourceAlpha" operator="dilate" radius="6"');
    expect(svg).toContain('flood-color="#ffffff"');
    expect(svg).toContain('filter="url(#filter-sticker-layer)"');
  });

  it('should export image layer maskPath as SVG clipPath cutout', async () => {
    const layers = [
      {
        id: 'masked-img',
        type: 'image',
        x: 10,
        y: 10,
        width: 150,
        height: 150,
        src: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400',
        maskPath: 'M 10 10 L 140 10 L 75 140 Z',
      },
    ] as any[];
    const svg = await exportToSVG(200, 200, '#ffffff', layers);
    expect(svg).toContain('<clipPath id="clip-mask-masked-img">');
    expect(svg).toContain('d="M 10 10 L 140 10 L 75 140 Z"');
    expect(svg).toContain('clip-path="url(#clip-mask-masked-img)"');
  });

  it('should export warped text along textPath in SVG', async () => {
    const layers = [
      {
        id: 'arc-text',
        type: 'text',
        x: 20,
        y: 20,
        width: 200,
        height: 80,
        text: 'Curved Banner Text',
        fontSize: 32,
        warpStyle: 'arc',
        curve: 50,
      },
    ] as any[];
    const svg = await exportToSVG(300, 200, '#ffffff', layers);
    expect(svg).toContain('<textPath href="#path-arc-text" startOffset="50%">Curved Banner Text</textPath>');
  });

  it('should export shape with imageFill as clipped image in SVG', async () => {
    const layers = [
      {
        id: 'img-rect',
        type: 'rectangle',
        x: 10,
        y: 10,
        width: 120,
        height: 120,
        cornerRadius: 16,
        imageFill: {
          src: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400',
          fit: 'cover',
        },
      },
    ] as any[];
    const svg = await exportToSVG(200, 200, '#ffffff', layers);
    expect(svg).toContain('clipPath id="clip-rect-img-rect"');
    expect(svg).toContain('href="https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&amp;fit=crop&amp;w=400"');
  });

  it('should export dashed stroke and skew transforms in SVG', async () => {
    const layers = [
      {
        id: 'dashed-box',
        type: 'rectangle',
        x: 15,
        y: 15,
        width: 80,
        height: 80,
        stroke: '#3b82f6',
        strokeWidth: 3,
        strokeDasharray: '6 4',
        skewX: 10,
      },
    ] as any[];
    const svg = await exportToSVG(200, 200, '#ffffff', layers);
    expect(svg).toContain('stroke-dasharray="6 4"');
    expect(svg).toContain('skewX(10)');
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
