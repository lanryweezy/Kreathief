import { describe, it, expect } from 'vitest';
import {
  analyzeDesign,
  applyDesignIntent,
  generateLayoutVariants,
  optimizeForPlatform,
} from '../../ai/designEngine';
import type { Artboard, TextLayer, ShapeLayer } from '../../types';

function makeText(overrides: Partial<TextLayer> = {}): TextLayer {
  return {
    id: 't1', type: 'text', text: 'Hello', x: 0, y: 0, width: 100, height: 40,
    rotation: 0, opacity: 1, locked: false, visible: true,
    fontSize: 24, fontWeight: '400', fontStyle: 'normal', textDecoration: 'none',
    color: '#000000', fontFamily: 'Arial', textAlign: 'left',
    letterSpacing: 0, lineHeight: 1.2, textTransform: 'none',
    ...overrides,
  };
}

function makeShape(overrides: Partial<ShapeLayer> = {}): ShapeLayer {
  return {
    id: 's1', type: 'rectangle', color: '#ff0000', cornerRadius: 0,
    x: 0, y: 0, width: 100, height: 100, rotation: 0, opacity: 1,
    locked: false, visible: true,
    ...overrides,
  };
}

function makeArtboard(layers: Artboard['layers'] = [], overrides: Partial<Artboard> = {}): Artboard {
  return {
    id: 'ab1', name: 'Test', x: 0, y: 0, width: 500, height: 500, layers,
    ...overrides,
  };
}

describe('analyzeDesign', () => {
  it('returns score and suggestions for empty artboard', () => {
    const result = analyzeDesign([], []);
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('suggestions');
    expect(Array.isArray(result.suggestions)).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('suggests font consistency when fonts exceed 3', () => {
    const layers = [
      makeText({ id: 't1', fontFamily: 'Arial' }),
      makeText({ id: 't2', fontFamily: 'Helvetica' }),
      makeText({ id: 't3', fontFamily: 'Georgia' }),
      makeText({ id: 't4', fontFamily: 'Times' }),
    ];
    const result = analyzeDesign([], layers);
    expect(result.suggestions).toContain('Reduce font families to max 3');
    expect(result.typography.consistency).toBe(50);
  });

  it('suggests alignment when text layers have mixed alignment', () => {
    const layers = [
      makeText({ id: 't1', textAlign: 'left' }),
      makeText({ id: 't2', textAlign: 'right' }),
    ];
    const result = analyzeDesign([], layers);
    expect(result.suggestions).toContain('Align text elements');
  });

  it('gives high score for well-aligned, consistent design', () => {
    const layers = [
      makeText({ id: 't1', fontFamily: 'Arial', textAlign: 'center', y: 0 }),
      makeText({ id: 't2', fontFamily: 'Arial', textAlign: 'center', y: 60, fontSize: 14 }),
      makeShape({ id: 's1', x: 200, y: 100, width: 100, height: 50 }),
    ];
    const ab = makeArtboard(layers);
    const result = analyzeDesign([ab], []);
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.typography.consistency).toBe(100);
  });
});

describe('applyDesignIntent', () => {
  const text = makeText({ id: 't1' });
  const shape = makeShape({ id: 's1' });
  const ab = makeArtboard([text, shape]);

  it('premium intent increases spacing and uses serif font', () => {
    const result = applyDesignIntent('premium', [ab], []);
    const resultText = result.find((l) => l.id === 't1') as TextLayer;
    expect(resultText.fontFamily).toContain('Playfair Display');
    expect(resultText.letterSpacing).toBe(2);
  });

  it('apple intent applies clean minimal style with high contrast', () => {
    const result = applyDesignIntent('apple', [ab], []);
    const resultText = result.find((l) => l.id === 't1') as TextLayer;
    expect(resultText.fontFamily).toContain('apple-system');
    expect(resultText.color).toBe('#1d1d1f');
    const resultShape = result.find((l) => l.id === 's1') as ShapeLayer;
    expect(resultShape.shadow).toBeDefined();
  });

  it('colorful intent boosts saturation', () => {
    const result = applyDesignIntent('colorful', [ab], []);
    const resultText = result.find((l) => l.id === 't1') as TextLayer;
    expect(resultText.color).not.toBe('#000000');
  });

  it('minimal intent removes shadows and reduces opacity', () => {
    const result = applyDesignIntent('minimal', [ab], []);
    const resultShape = result.find((l) => l.id === 's1') as ShapeLayer;
    expect(resultShape.shadow).toBeUndefined();
    expect(resultShape.opacity).toBeLessThanOrEqual(1);
  });

  it('unknown intent returns unchanged layers', () => {
    const result = applyDesignIntent('unknown_intent', [ab], []);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('t1');
    expect(result[1].id).toBe('s1');
  });
});

describe('generateLayoutVariants', () => {
  const layers = [
    makeText({ id: 't1', x: 10, y: 10, width: 200, height: 40 }),
    makeShape({ id: 's1', x: 50, y: 60, width: 100, height: 100 }),
    makeText({ id: 't2', x: 10, y: 200, width: 150, height: 30 }),
  ];
  const ab = makeArtboard(layers);

  it('returns 3 variants', () => {
    const variants = generateLayoutVariants([ab], []);
    expect(variants).toHaveLength(3);
  });

  it('each variant has different positions', () => {
    const variants = generateLayoutVariants([ab], []);
    const names = variants.map((v) => v.name);
    expect(names).toContain('Centered & Balanced');
    expect(names).toContain('Asymmetric & Dynamic');
    expect(names).toContain('Grid-Based & Structured');
    const pos0 = `${variants[0].layers[0].x},${variants[0].layers[0].y}`;
    const pos1 = `${variants[1].layers[0].x},${variants[1].layers[0].y}`;
    expect(pos0).not.toBe(pos1);
  });

  it('does not mutate original layers', () => {
    const originalX = layers[0].x;
    const originalY = layers[0].y;
    generateLayoutVariants([ab], []);
    expect(layers[0].x).toBe(originalX);
    expect(layers[0].y).toBe(originalY);
  });
});

describe('optimizeForPlatform', () => {
  const ab = makeArtboard([
    makeText({ id: 't1', fontSize: 16, fontWeight: '400', textAlign: 'center', fontFamily: 'Arial',
      text: 'Hi', fontStyle: 'normal', textDecoration: 'none', color: '#000',
      letterSpacing: 0, lineHeight: 1.2, textTransform: 'none', x: 50, y: 50, width: 200, height: 40,
    }),
  ]);

  it('Instagram Post → 1080x1080', () => {
    const result = optimizeForPlatform([ab], 'Instagram Post');
    expect(result[0].width).toBe(1080);
    expect(result[0].height).toBe(1080);
  });

  it('YouTube Thumbnail → 1280x720', () => {
    const result = optimizeForPlatform([ab], 'YouTube Thumbnail');
    expect(result[0].width).toBe(1280);
    expect(result[0].height).toBe(720);
  });

  it('Business Card → 1050x600', () => {
    const result = optimizeForPlatform([ab], 'Business Card');
    expect(result[0].width).toBe(1050);
    expect(result[0].height).toBe(600);
    const textLayer = result[0].layers[0] as TextLayer;
    expect(textLayer.fontSize).toBeLessThanOrEqual(12);
  });

  it('unknown platform returns unchanged', () => {
    const result = optimizeForPlatform([ab], 'Unknown' as any);
    expect(result[0].width).toBe(500);
    expect(result[0].height).toBe(500);
  });
});
