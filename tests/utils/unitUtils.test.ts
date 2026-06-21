import { describe, it, expect } from 'vitest';
import { pxToUnit, unitToPx, formatUnitValue, DPI, MM_PER_INCH, CM_PER_INCH } from '../../utils/unitUtils';
import { CanvasUnit } from '../../types';

describe('unitUtils', () => {
  describe('pxToUnit', () => {
    it('converts px to px correctly (identity)', () => {
      expect(pxToUnit(100, 'px')).toBe(100);
      expect(pxToUnit(100.5, 'px')).toBe(101); // should round
    });

    it('converts px to inches correctly', () => {
      expect(pxToUnit(DPI, 'in')).toBe(1);
      expect(pxToUnit(DPI * 2.5, 'in')).toBe(2.5);
    });

    it('converts px to mm correctly', () => {
      expect(pxToUnit(DPI, 'mm')).toBe(MM_PER_INCH);
    });

    it('converts px to cm correctly', () => {
      expect(pxToUnit(DPI, 'cm')).toBe(CM_PER_INCH);
    });

    it('respects precision argument', () => {
      // 100 px / 96 dpi = 1.041666...
      expect(pxToUnit(100, 'in', 2)).toBe(1.04);
      expect(pxToUnit(100, 'in', 4)).toBe(1.0417);
    });
  });

  describe('unitToPx', () => {
    it('converts px to px correctly', () => {
      expect(unitToPx(100, 'px')).toBe(100);
    });

    it('converts inches to px correctly', () => {
      expect(unitToPx(1, 'in')).toBe(DPI);
      expect(unitToPx(2.5, 'in')).toBe(DPI * 2.5);
    });

    it('converts mm to px correctly', () => {
      expect(unitToPx(MM_PER_INCH, 'mm')).toBe(DPI);
    });

    it('converts cm to px correctly', () => {
      expect(unitToPx(CM_PER_INCH, 'cm')).toBe(DPI);
    });
  });

  describe('formatUnitValue', () => {
    it('formats px correctly', () => {
      expect(formatUnitValue(100, 'px')).toBe('100 px');
    });

    it('formats inches correctly', () => {
      expect(formatUnitValue(DPI, 'in')).toBe('1 in');
    });

    it('formats mm correctly', () => {
      expect(formatUnitValue(DPI, 'mm')).toBe(`${MM_PER_INCH} mm`);
    });

    it('formats cm correctly', () => {
      expect(formatUnitValue(DPI, 'cm')).toBe(`${CM_PER_INCH} cm`);
    });
  });
});
