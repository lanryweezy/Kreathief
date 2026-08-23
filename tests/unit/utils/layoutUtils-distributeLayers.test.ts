import { describe, it, expect } from 'vitest';
import { distributeLayers } from '../../../utils/layoutUtils';
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

const createLayerWithoutHeight = (id: string, x: number, y: number, width: number): Layer => {
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

describe('distributeLayers', () => {
  it('returns an empty array when there are less than 3 layers', () => {
    expect(distributeLayers([], 'h-spacing')).toEqual([]);
    expect(distributeLayers([createLayer('1', 0, 0, 10, 10)], 'h-spacing')).toEqual([]);
    expect(distributeLayers([createLayer('1', 0, 0, 10, 10), createLayer('2', 20, 0, 10, 10)], 'h-spacing')).toEqual(
      []
    );
  });

  it('distributes layers horizontally with even spacing', () => {
    const layers = [createLayer('1', 0, 0, 50, 50), createLayer('2', 60, 0, 50, 50), createLayer('3', 200, 0, 50, 50)];

    const result = distributeLayers(layers, 'h-spacing');

    expect(result).toEqual([{ id: '2', changes: { x: 100 } }]);
  });

  it('distributes layers vertically with even spacing', () => {
    const layers = [createLayer('1', 0, 0, 50, 50), createLayer('2', 0, 60, 50, 50), createLayer('3', 0, 200, 50, 50)];

    const result = distributeLayers(layers, 'v-spacing');

    expect(result).toEqual([{ id: '2', changes: { y: 100 } }]);
  });

  it('distributes layers horizontally by their center points', () => {
    const layers = [createLayer('1', 0, 0, 50, 50), createLayer('2', 60, 0, 50, 50), createLayer('3', 200, 0, 100, 50)];

    const result = distributeLayers(layers, 'h-center');

    expect(result).toEqual([{ id: '2', changes: { x: 112.5 } }]);
  });

  it('distributes layers vertically by their center points', () => {
    const layers = [createLayer('1', 0, 0, 50, 50), createLayer('2', 0, 60, 50, 50), createLayer('3', 0, 200, 50, 100)];

    const result = distributeLayers(layers, 'v-center');

    expect(result).toEqual([{ id: '2', changes: { y: 112.5 } }]);
  });

  it('handles layers without height when distributing vertically with even spacing', () => {
    const layers = [
      createLayerWithoutHeight('1', 0, 0, 50),
      createLayerWithoutHeight('2', 0, 60, 50),
      createLayerWithoutHeight('3', 0, 200, 50),
    ];
    const result = distributeLayers(layers, 'v-spacing');
    expect(result).toEqual([{ id: '2', changes: { y: 100 } }]);
  });

  it('handles layers without height when distributing vertically by center points', () => {
    const layers = [
      createLayerWithoutHeight('1', 0, 0, 50),
      createLayerWithoutHeight('2', 0, 60, 50),
      createLayerWithoutHeight('3', 0, 200, 50),
    ];
    const result = distributeLayers(layers, 'v-center');
    expect(result).toEqual([{ id: '2', changes: { y: 100 } }]);
  });

  it('returns empty array when distribution type is invalid', () => {
    // @ts-expect-error allow invalid distribution type for testing fallback branch
    expect(
      distributeLayers(
        [createLayer('1', 0, 0, 10, 10), createLayer('2', 0, 0, 10, 10), createLayer('3', 0, 0, 10, 10)],
        'invalid'
      )
    ).toEqual([]);
  });
});
