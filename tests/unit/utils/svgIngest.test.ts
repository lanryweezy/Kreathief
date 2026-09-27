import { describe, it, expect } from 'vitest';
import { svgToDesignNodes } from '../../../utils/svgIngest';
import { countAnchors } from '../../../geometry/simplify';

// A deliberately "dirty" traced rectangle: duplicate + collinear anchors, huge precision.
const TRACED_RECT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path fill="#ff0000" d="M 10.123456 10.987654 L 50.0000001 10.999999 L 90 11 L 90 11.0000001 L 90 50 L 90 90 L 50 90 L 10 90 L 10 50 L 10.0000001 11.0000001 L 10.123456 10.987654 Z"/>
</svg>`;

const PRIMITIVES = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120">
  <rect x="10" y="10" width="40" height="30" rx="5" fill="#123456" stroke="#000" stroke-width="2"/>
  <circle cx="100" cy="60" r="20" fill="#abcdef"/>
  <ellipse cx="160" cy="60" rx="25" ry="15" fill="none" stroke="#333"/>
</svg>`;

describe('svgToDesignNodes — editability', () => {
  it('parses a path into an editable DesignNode with pathData (not a raster image)', () => {
    const { nodes } = svgToDesignNodes(TRACED_RECT);
    expect(nodes).toHaveLength(1);
    const n = nodes[0];
    expect(n.type).toBe('path');
    expect(typeof n.pathData).toBe('string');
    expect(n.pathData && n.pathData.length).toBeGreaterThan(0);
    expect(n.fill).toBe('#ff0000');
  });

  it('runs the clean-vector pass by default, reducing anchor count vs the raw trace', () => {
    const raw = TRACED_RECT.match(/d="([^"]+)"/)![1];
    const rawAnchors = countAnchors(raw);
    const { nodes } = svgToDesignNodes(TRACED_RECT);
    const cleanAnchors = countAnchors(nodes[0].pathData!);
    expect(cleanAnchors).toBeLessThan(rawAnchors);
  });

  it('honors clean:false to preserve the original path verbatim', () => {
    const raw = TRACED_RECT.match(/d="([^"]+)"/)![1];
    const { nodes } = svgToDesignNodes(TRACED_RECT, { clean: false });
    expect(nodes[0].pathData).toBe(raw);
  });
});

describe('svgToDesignNodes — geometry primitives', () => {
  it('maps rect/circle/ellipse to rect/ellipse nodes with correct bbox + style', () => {
    const { nodes, width, height } = svgToDesignNodes(PRIMITIVES);
    expect(width).toBe(200);
    expect(height).toBe(120);
    expect(nodes).toHaveLength(3);

    const [rect, circle, ellipse] = nodes;
    expect(rect.type).toBe('rect');
    expect(rect.x).toBe(10);
    expect(rect.y).toBe(10);
    expect(rect.width).toBe(40);
    expect(rect.height).toBe(30);
    expect(rect.cornerRadius).toBe(5);
    expect(rect.fill).toBe('#123456');
    expect(rect.stroke).toBe('#000');
    expect(rect.strokeWidth).toBe(2);

    // circle -> ellipse centered bbox
    expect(circle.type).toBe('ellipse');
    expect(circle.x).toBe(80);
    expect(circle.y).toBe(40);
    expect(circle.width).toBe(40);
    expect(circle.height).toBe(40);

    // fill="none" keeps a stroke-only node (stroke present, fill not a solid color)
    expect(ellipse.type).toBe('ellipse');
    expect(ellipse.stroke).toBe('#333');
  });
});

describe('svgToDesignNodes — robustness', () => {
  it('applies group translate offsets to nested shapes', () => {
    const svg = `<svg viewBox="0 0 100 100"><g transform="translate(10 20)"><rect x="5" y="5" width="10" height="10" fill="#000"/></g></svg>`;
    const { nodes } = svgToDesignNodes(svg);
    expect(nodes[0].x).toBe(15);
    expect(nodes[0].y).toBe(25);
  });

  it('resolves a referenced linearGradient into a structured fill', () => {
    const svg = `<svg viewBox="0 0 100 100">
      <defs><linearGradient id="g1"><stop offset="0%" stop-color="#ff0000"/><stop offset="100%" stop-color="#0000ff"/></linearGradient></defs>
      <rect x="0" y="0" width="50" height="50" fill="url(#g1)"/>
    </svg>`;
    const { nodes } = svgToDesignNodes(svg);
    const fill = nodes[0].fill as { type: string; stops: unknown[] };
    expect(fill.type).toBe('linear');
    expect(fill.stops).toHaveLength(2);
  });

  it('skips degenerate shapes and never throws on empty/garbage input', () => {
    expect(svgToDesignNodes('').nodes).toEqual([]);
    expect(svgToDesignNodes('<svg><rect x="0" y="0" width="0" height="10"/></svg>').nodes).toHaveLength(0);
    expect(() => svgToDesignNodes('<svg viewBox="nope"><path d="M"/></svg>')).not.toThrow();
  });

  it('produces deterministic ids given an idPrefix', () => {
    const { nodes } = svgToDesignNodes(PRIMITIVES, { idPrefix: 'ingest' });
    expect(nodes.map((n) => n.id)).toEqual(['ingest-0', 'ingest-1', 'ingest-2']);
  });
});
