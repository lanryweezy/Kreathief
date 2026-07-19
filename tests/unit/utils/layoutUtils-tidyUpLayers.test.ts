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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createLayerWithoutHeight = (id: string, x: number, y: number, width: number): any => {
  return {
    id,
    type: 'rectangle',
    x,
    y,
    width,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    color: '#000',
    cornerRadius: 0,
  };
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

  it('organizes multiple layers and prefers more columns if width is much larger than height', () => {
    const layers = [
      createLayer('1', 0, 0, 50, 50),
      createLayer('2', 200, 0, 50, 50),
      createLayer('3', 400, 0, 50, 50),
      createLayer('4', 600, 0, 50, 50),
      createLayer('5', 800, 0, 50, 50),
      createLayer('6', 1000, 0, 50, 50),
    ];
    // width: 1050, height: 50 -> aspectRatio = 21 -> cols = ceil(sqrt(6 * 21)) = ceil(sqrt(126)) = 12 -> min(6, 12) = 6
    const result = tidyUpLayers(layers);
    expect(result.length).toBe(6);
  });

  it('falls back to layer.width when layer.height is undefined', () => {
    const layers = [createLayerWithoutHeight('1', 0, 0, 50), createLayerWithoutHeight('2', 100, 0, 50)];

    const result = tidyUpLayers(layers);
    expect(result.length).toBe(2);
    expect(result[0].changes.y).toBe(0);
  });

  it('preserves sorting when layers are on the exact same row', () => {
    const layers = [createLayer('2', 100, 0, 50, 50), createLayer('1', 0, 0, 50, 50)];

    const result = tidyUpLayers(layers);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });
});
