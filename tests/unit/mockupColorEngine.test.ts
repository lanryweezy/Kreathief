import { describe, it, expect } from 'vitest';
import {
  APPAREL_COLOR_SWATCHES,
  PACKAGING_COLOR_SWATCHES,
  ALL_COLOR_SWATCHES,
  hexToRgb,
  getSwatchById,
} from '../../services/mockupColorEngine';

describe('MockupColorEngine', () => {
  it('should have 14 apparel color swatches', () => {
    expect(APPAREL_COLOR_SWATCHES).toHaveLength(14);
  });

  it('should have 6 packaging color swatches', () => {
    expect(PACKAGING_COLOR_SWATCHES).toHaveLength(6);
  });

  it('should have 20 total swatches', () => {
    expect(ALL_COLOR_SWATCHES).toHaveLength(20);
  });

  it('should correctly parse hex to RGB', () => {
    const rgb = hexToRgb('#1a2744');
    expect(rgb.r).toBe(26);
    expect(rgb.g).toBe(39);
    expect(rgb.b).toBe(68);
  });

  it('should parse white hex correctly', () => {
    const rgb = hexToRgb('#ffffff');
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(255);
    expect(rgb.b).toBe(255);
  });

  it('should parse black hex correctly', () => {
    const rgb = hexToRgb('#000000');
    expect(rgb.r).toBe(0);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(0);
  });

  it('should return a swatch by ID', () => {
    const swatch = getSwatchById('navy');
    expect(swatch).toBeDefined();
    expect(swatch?.hex).toBe('#1a2744');
    expect(swatch?.category).toBe('apparel');
  });

  it('should return undefined for unknown swatch ID', () => {
    expect(getSwatchById('unknown_color_xyz')).toBeUndefined();
  });

  it('all swatches should have valid hex format', () => {
    ALL_COLOR_SWATCHES.forEach((swatch) => {
      expect(swatch.hex).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});
