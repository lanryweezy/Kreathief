import { describe, it, expect } from 'vitest';
import { computeAutoLayout, hasAutoLayoutTree } from '../../utils/autoLayout';
import type { Layer } from '../../types';

function makeLayer(overrides: Partial<Layer> = {}): Layer {
  return {
    id: 'l1', type: 'rectangle', x: 0, y: 0, width: 100, height: 50,
    rotation: 0, opacity: 1, locked: false, visible: true, color: '#000',
    cornerRadius: 0,
    ...overrides,
  } as Layer;
}

function makeParent(overrides: Partial<Layer> = {}): Layer {
  return makeLayer({
    id: 'parent',
    width: 500,
    height: 200,
    autoLayout: { direction: 'row', padding: 10, spacing: 5, alignment: 'center' },
    ...overrides,
  });
}

describe('computeAutoLayout', () => {
  it('horizontal layout arranges elements left-to-right', () => {
    const parent = makeParent();
    const children = [
      makeLayer({ id: 'a', width: 100, height: 50 }),
      makeLayer({ id: 'b', width: 80, height: 50 }),
    ];
    const result = computeAutoLayout(parent, children, [parent, ...children]);
    expect(result['a'].x).toBeLessThan(result['b'].x);
  });

  it('vertical layout arranges elements top-to-bottom', () => {
    const parent = makeParent({
      autoLayout: { direction: 'col', padding: 10, spacing: 5, alignment: 'center' },
    });
    const children = [
      makeLayer({ id: 'a', width: 100, height: 50 }),
      makeLayer({ id: 'b', width: 100, height: 60 }),
    ];
    const result = computeAutoLayout(parent, children, [parent, ...children]);
    expect(result['a'].y).toBeLessThan(result['b'].y);
  });

  it('padding is applied around container', () => {
    const parent = makeParent();
    const children = [makeLayer({ id: 'a', width: 100, height: 50 })];
    const result = computeAutoLayout(parent, children, [parent, ...children]);
    expect(result['a'].x).toBeGreaterThanOrEqual(parent.x + 10);
    expect(result['a'].y).toBeGreaterThanOrEqual(parent.y);
  });

  it('spacing between elements is consistent', () => {
    const parent = makeParent();
    const children = [
      makeLayer({ id: 'a', width: 100, height: 50 }),
      makeLayer({ id: 'b', width: 100, height: 50 }),
      makeLayer({ id: 'c', width: 100, height: 50 }),
    ];
    const result = computeAutoLayout(parent, children, [parent, ...children]);
    const gap1 = result['b'].x - (result['a'].x + 100);
    const gap2 = result['c'].x - (result['b'].x + 100);
    expect(gap1).toBe(gap2);
    expect(gap1).toBe(5);
  });

  it('alignment "start" positions children at top/left', () => {
    const parent = makeParent({
      autoLayout: { direction: 'row', padding: 10, spacing: 0, alignment: 'start' },
    });
    const children = [makeLayer({ id: 'a', width: 100, height: 50 })];
    const result = computeAutoLayout(parent, children, [parent, ...children]);
    expect(result['a'].y).toBe(parent.y + 10);
  });

  it('alignment "end" positions children at bottom/right', () => {
    const parent = makeParent({
      autoLayout: { direction: 'row', padding: 10, spacing: 0, alignment: 'end' },
    });
    const children = [makeLayer({ id: 'a', width: 100, height: 50 })];
    const result = computeAutoLayout(parent, children, [parent, ...children]);
    expect(result['a'].y).toBe(parent.y + parent.height - 10 - 50);
  });

  it('empty input returns empty output', () => {
    const parent = makeParent();
    const result = computeAutoLayout(parent, [], [parent]);
    expect(result).toEqual({});
  });

  it('returns empty when no autoLayout on parent', () => {
    const parent = makeLayer({ id: 'parent', autoLayout: undefined } as any);
    const children = [makeLayer({ id: 'a' })];
    const result = computeAutoLayout(parent, children, [parent, ...children]);
    expect(result).toEqual({});
  });
});

describe('hasAutoLayoutTree', () => {
  it('returns true when any layer has autoLayout', () => {
    const layers = [
      makeLayer({ id: 'a' }),
      makeLayer({ id: 'b', autoLayout: { direction: 'row', padding: 0, spacing: 0, alignment: 'center' } }),
    ];
    expect(hasAutoLayoutTree(layers)).toBe(true);
  });

  it('returns false when no layers have autoLayout', () => {
    const layers = [makeLayer({ id: 'a' }), makeLayer({ id: 'b' })];
    expect(hasAutoLayoutTree(layers)).toBe(false);
  });
});
