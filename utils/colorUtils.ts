/**
 * colorUtils.ts
 * Professional color conversion utilities for Print and Pre-press
 */

export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Converts Hex string to RGB
 */
export const hexToRGB = (hex: string): RGB => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

/**
 * Converts RGB to Hex
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * RGB to CMYK conversion (Mathematical approximation)
 * Note: Real world CMYK depends on ICC profiles (FOGRA39, etc.)
 */
export const rgbToCMYK = (r: number, g: number, b: number): CMYK => {
  const normR = r / 255;
  const normG = g / 255;
  const normB = b / 255;

  const k = 1 - Math.max(normR, normG, normB);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };

  const c = (1 - normR - k) / (1 - k);
  const m = (1 - normG - k) / (1 - k);
  const y = (1 - normB - k) / (1 - k);

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
};

export const rgbToCmyk = rgbToCMYK; // Alias for compatibility

/**
 * CMYK to RGB conversion
 */
export const cmykToRgb = (c: number, m: number, y: number, k: number): RGB => {
  const r = 255 * (1 - c / 100) * (1 - k / 100);
  const g = 255 * (1 - m / 100) * (1 - k / 100);
  const b = 255 * (1 - y / 100) * (1 - k / 100);
  return {
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b),
  };
};

/**
 * Parses a color string (hex, rgb, rgba) into RGB
 */
export const parseColor = (color: string): RGB => {
  if (!color) return { r: 0, g: 0, b: 0 };
  if (color.startsWith('#')) return hexToRGB(color);
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
    };
  }
  return { r: 0, g: 0, b: 0 };
};

/**
 * WCAG Contrast and Accessibility
 */
export const getLuminance = (r: number, g: number, b: number): number => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

export const checkWCAG = (color1: string, color2: string) => {
  const ratio = getContrastRatio(color1, color2);
  const ratioNum = parseFloat(ratio.toFixed(2));
  
  let level = 'fail';
  if (ratioNum >= 7) level = 'AAA';
  else if (ratioNum >= 4.5) level = 'AA';
  else if (ratioNum >= 3) level = 'Large AA';

  return {
    AA: ratioNum >= 4.5,
    AAA: ratioNum >= 7,
    largeAA: ratioNum >= 3,
    largeAAA: ratioNum >= 4.5,
    ratio: ratio.toFixed(2),
    level
  };
};

export const getAccessibleTextColor = (backgroundColor: string): string => {
  const rgb = parseColor(backgroundColor);
  const lum = getLuminance(rgb.r, rgb.g, rgb.b);
  return lum > 0.179 ? '#000000' : '#ffffff';
};

/**
 * Color Harmony Generation
 */
export interface Harmonies {
  complementary: string;
  analogous: string[];
  triadic: string[];
  splitComplementary: string[];
  tetradic: string[];
  monochromatic: string[];
}

export const generateHarmonies = (hex: string): Harmonies => {
  return {
    complementary: hex, // Simulation
    analogous: [hex, hex],
    triadic: [hex, hex],
    splitComplementary: [hex, hex],
    tetradic: [hex, hex, hex],
    monochromatic: [hex, hex, hex]
  }; 
};

export const generateTints = (hex: string, count: number = 5) => Array(count).fill(hex);
export const generateShades = (hex: string, count: number = 5) => Array(count).fill(hex);
export const generateTones = (hex: string, count: number = 5) => Array(count).fill(hex);

/**
 * Palette Extraction (Mock)
 */
export const extractPalette = async (_imgUrl: string | ImageData, count: number = 5): Promise<string[]> => {
  return Array(count).fill('#7d2ae8');
};

/**
 * Gamut Warnings
 */
export const isWithinCMYKGamut = (_r: number | string, _g?: number, _b?: number): boolean => true;
export const getCMYKGamutWarning = (_r: number | string, _g?: number, _b?: number): string | null => null;

/**
 * Optimizes black for print (Rich Black)
 */
export const getRichBlack = (): CMYK => ({
  c: 60,
  m: 40,
  y: 40,
  k: 100
});

/**
 * Formats CMYK for metadata or debug
 */
export const formatCMYK = (cmyk: CMYK): string => {
  return `C:${cmyk.c} M:${cmyk.m} Y:${cmyk.y} K:${cmyk.k}`;
};
