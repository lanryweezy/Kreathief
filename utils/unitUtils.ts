
import { CanvasUnit } from '../types';

export const DPI = 96;
export const MM_PER_INCH = 25.4;
export const CM_PER_INCH = 2.54;

/**
 * Converts a pixel value to the target unit.
 */
export const pxToUnit = (px: number, unit: CanvasUnit, precision: number = 2): number => {
    let value: number;
    switch (unit) {
        case 'in':
            value = px / DPI;
            break;
        case 'mm':
            value = (px / DPI) * MM_PER_INCH;
            break;
        case 'cm':
            value = (px / DPI) * CM_PER_INCH;
            break;
        case 'px':
        default:
            return Math.round(px);
    }
    return parseFloat(value.toFixed(precision));
};

/**
 * Converts a value in the target unit back to pixels.
 */
export const unitToPx = (value: number, unit: CanvasUnit): number => {
    switch (unit) {
        case 'in':
            return value * DPI;
        case 'mm':
            return (value / MM_PER_INCH) * DPI;
        case 'cm':
            return (value / CM_PER_INCH) * DPI;
        case 'px':
        default:
            return value;
    }
};

/**
 * Formats a value with its unit label.
 */
export const formatUnitValue = (px: number, unit: CanvasUnit): string => {
    const value = pxToUnit(px, unit);
    return `${value} ${unit}`;
};
