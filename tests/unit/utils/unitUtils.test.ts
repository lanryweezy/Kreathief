import { describe, it, expect } from 'vitest';
import { pxToUnit, unitToPx, formatUnitValue, DPI, MM_PER_INCH, CM_PER_INCH } from '../../../utils/unitUtils';

describe('unitUtils', () => {
  describe('pxToUnit', () => {
    it('converts pixels to inches based on DPI', () => {
      expect(pxToUnit(DPI, 'in')).toBe(1);
      expect(pxToUnit(DPI * 2, 'in')).toBe(2);
      expect(pxToUnit(DPI / 2, 'in')).toBe(0.5);
    });

    it('converts pixels to millimeters', () => {
      expect(pxToUnit(DPI, 'mm')).toBe(MM_PER_INCH);
    });

    it('converts pixels to centimeters', () => {
      expect(pxToUnit(DPI, 'cm')).toBe(CM_PER_INCH);
    });

    it('returns original pixels for px unit', () => {
      expect(pxToUnit(100, 'px')).toBe(100);
      expect(pxToUnit(100.5, 'px')).toBe(101); // rounds pixel values
    });

    it('applies custom precision correctly', () => {
      expect(pxToUnit(DPI / 3, 'in', 3)).toBe(0.333);
      expect(pxToUnit(DPI / 3, 'in', 1)).toBe(0.3);
    });
  });

  describe('unitToPx', () => {
    it('converts inches to pixels', () => {
      expect(unitToPx(1, 'in')).toBe(DPI);
      expect(unitToPx(0.5, 'in')).toBe(DPI / 2);
    });

    it('converts millimeters to pixels', () => {
      expect(unitToPx(MM_PER_INCH, 'mm')).toBe(DPI);
    });

    it('converts centimeters to pixels', () => {
      expect(unitToPx(CM_PER_INCH, 'cm')).toBe(DPI);
    });

    it('returns original value for px unit', () => {
      expect(unitToPx(100, 'px')).toBe(100);
    });
  });

  describe('formatUnitValue', () => {
    it('formats inches with unit string', () => {
      expect(formatUnitValue(DPI, 'in')).toBe('1 in');
      expect(formatUnitValue(DPI * 1.5, 'in')).toBe('1.5 in');
    });

    it('formats millimeters with unit string', () => {
      expect(formatUnitValue(DPI, 'mm')).toBe(`${MM_PER_INCH} mm`);
    });

    it('formats pixels with unit string', () => {
      expect(formatUnitValue(100, 'px')).toBe('100 px');
    });
  });
});
