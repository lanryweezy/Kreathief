import { describe, it, expect } from 'vitest';
import {
  computeAutoLayout,
  applyAutoLayout,
  normalizePadding,
  parseLayoutIntent,
} from '../../layout/autoLayout';
import { Layer } from '../../types';

describe('Auto Layout Engine - normalizePadding', () => {
  it('normalizes single number to all 4 edges', () => {
    expect(normalizePadding(16)).toEqual({ top: 16, right: 16, bottom: 16, left: 16 });
  });

  it('normalizes object with independent edges', () => {
    expect(normalizePadding({ top: 10, right: 20, bottom: 30, left: 40 })).toEqual({
      top: 10,
      right: 20,
      bottom: 30,
      left: 40,
    });
  });

  it('defaults undefined to 0', () => {
    expect(normalizePadding(undefined)).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });
});

describe('Auto Layout Engine - computeAutoLayout with 4-way padding', () => {
  const parent: Layer = {
    id: 'parent',
    type: 'group',
    x: 0,
    y: 0,
    width: 300,
    height: 100,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    autoLayout: {
      direction: 'row',
      padding: { top: 10, right: 20, bottom: 15, left: 25 },
      spacing: 10,
      alignment: 'center',
    },
  } as Layer;

  const children: Layer[] = [
    { id: 'c1', type: 'rectangle', x: 0, y: 0, width: 40, height: 40 } as Layer,
    { id: 'c2', type: 'rectangle', x: 0, y: 0, width: 60, height: 40 } as Layer,
  ];

  it('positions children respecting 4-way padding', () => {
    const layout = computeAutoLayout(parent, children);
    expect(layout['c1'].x).toBe(25); // left pad
    expect(layout['c2'].x).toBe(25 + 40 + 10); // left pad + c1 width + spacing = 75
  });
});

describe('Auto Layout Engine - parseLayoutIntent', () => {
  it('parses vertical stack intent with gap', () => {
    const result = parseLayoutIntent('stack vertically with 20px gap');
    expect(result.autoLayout?.direction).toBe('col');
    expect(result.autoLayout?.spacing).toBe(20);
  });

  it('parses horizontal row intent with padding and hug', () => {
    const result = parseLayoutIntent('align horizontally with 12px padding and hug contents');
    expect(result.autoLayout?.direction).toBe('row');
    expect(result.autoLayout?.padding).toBe(12);
    expect(result.autoLayout?.sizing?.width).toBe('hug');
  });

  it('parses pinning constraints', () => {
    const result = parseLayoutIntent('pin to top and stretch full width');
    expect(result.constraints?.vertical).toBe('start');
    expect(result.constraints?.horizontal).toBe('both');
  });
});
