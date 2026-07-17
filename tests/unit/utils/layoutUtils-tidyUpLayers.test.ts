import { describe, it, expect } from 'vitest';
import { tidyUpLayers } from '../../../utils/layoutUtils';
import type { Layer, ShapeLayer } from '../../../types';

const createLayer = (id: string, x: number, y: number, width: number, height: number): Layer => {
  return {
    id,
    type: 'rectangle',
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    color: '#000',
    cornerRadius: 0,
  } as ShapeLayer;
};

describe('tidyUpLayers', () => {
  it('returns an empty array when there are less than 2 layers', () => {
    expect(tidyUpLayers([])).toEqual([]);
    expect(tidyUpLayers([createLayer('1', 0, 0, 10, 10)])).toEqual([]);
  });

  it('organizes multiple layers into a neat grid layout', () => {
    const layers = [
      createLayer('4', 150, 150, 50, 50),
      createLayer('1', 0, 0, 50, 50),
      createLayer('2', 150, 0, 50, 50),
      createLayer('3', 0, 150, 50, 50),
    ];

    const result = tidyUpLayers(layers);

    expect(result.length).toBe(4);
    expect(result.find((r) => r.id === '1')).toEqual({ id: '1', changes: { x: 0, y: 0 } });
    expect(result.find((r) => r.id === '2')).toEqual({ id: '2', changes: { x: 70, y: 0 } });
    expect(result.find((r) => r.id === '3')).toEqual({ id: '3', changes: { x: 0, y: 90 } });
    expect(result.find((r) => r.id === '4')).toEqual({ id: '4', changes: { x: 70, y: 90 } });
  });
});
