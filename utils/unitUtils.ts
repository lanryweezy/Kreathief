import { CanvasUnit } from '../types';

export const DPI = 96;
export const MM_PER_INCH = 25.4;
export const CM_PER_INCH = 2.54;

/**
 * Extensibility Point: UnitConverter Strategy Registry
 * Evidence of pressure: Both pxToUnit and unitToPx used duplicate hard-coded switch
 * statements across 4 units (px, in, mm, cm). Adding custom or design-oriented units
 * (such as points 'pt' or picas 'pc') required modifying core conversion logic.
 * Contract: Implementors provide bidirectional conversion formulas:
 *   - toUnit(px): converts pixel values to the custom unit
 *   - toPx(value): converts the custom unit back to pixels
 */
export interface UnitConverter {
  toUnit: (px: number) => number;
  toPx: (value: number) => number;
}

export const unitConverters = new Map<string, UnitConverter>();

export function registerUnitConverter(unit: string, converter: UnitConverter): void {
  unitConverters.set(unit, converter);
}

registerUnitConverter('px', {
  toUnit: (px) => Math.round(px),
  toPx: (val) => val,
});
registerUnitConverter('in', {
  toUnit: (px) => px / DPI,
  toPx: (val) => val * DPI,
});
registerUnitConverter('mm', {
  toUnit: (px) => (px / DPI) * MM_PER_INCH,
  toPx: (val) => (val / MM_PER_INCH) * DPI,
});
registerUnitConverter('cm', {
  toUnit: (px) => (px / DPI) * CM_PER_INCH,
  toPx: (val) => (val / CM_PER_INCH) * DPI,
});

/**
 * Converts a pixel value to the target unit.
 */
export const pxToUnit = (px: number, unit: CanvasUnit | string, precision: number = 2): number => {
  const converter = unitConverters.get(unit);
  if (!converter || unit === 'px') {
    return Math.round(px);
  }
  const value = converter.toUnit(px);
  return parseFloat(value.toFixed(precision));
};

/**
 * Converts a value in the target unit back to pixels.
 */
export const unitToPx = (value: number, unit: CanvasUnit | string): number => {
  const converter = unitConverters.get(unit);
  return converter ? converter.toPx(value) : value;
};

/**
 * Formats a value with its unit label.
 */
export const formatUnitValue = (px: number, unit: CanvasUnit | string): string => {
  const value = pxToUnit(px, unit);
  return `${value} ${unit}`;
};
