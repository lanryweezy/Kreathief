/**
 * Color Utilities Library
 * Comprehensive color manipulation, harmonies, and accessibility tools
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
}

export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface ColorHarmony {
  complementary: string;
  analogous: string[];
  triadic: string[];
  splitComplementary: string[];
  tetradic: string[];
  monochromatic: string[];
}

export interface WCAGResult {
  ratio: number;
  AA: boolean;
  AAA: boolean;
  level: 'AA' | 'AAA' | 'fail';
}

// ============ CONVERSION FUNCTIONS ============

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    const hex = clamped.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) {t += 1;}
      if (t > 1) {t -= 1;}
      if (t < 1 / 6) {return p + (q - p) * 6 * t;}
      if (t < 1 / 2) {return q;}
      if (t < 2 / 3) {return p + (q - p) * (2 / 3 - t) * 6;}
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert RGB to HSV
 */
export function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  let h = 0;

  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

/**
 * Convert HSV to RGB
 */
export function hsvToRgb(h: number, s: number, v: number): RGB {
  h /= 360;
  s /= 100;
  v /= 100;

  let r = 0,
    g = 0,
    b = 0;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert RGB to CMYK
 */
export function rgbToCmyk(r: number, g: number, b: number): CMYK {
  r /= 255;
  g /= 255;
  b /= 255;

  const k = 1 - Math.max(r, g, b);
  const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
  const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
  const y = k === 1 ? 0 : (1 - b - k) / (1 - k);

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

/**
 * Convert CMYK to RGB
 */
export function cmykToRgb(c: number, m: number, y: number, k: number): RGB {
  c /= 100;
  m /= 100;
  y /= 100;
  k /= 100;

  const r = 255 * (1 - c) * (1 - k);
  const g = 255 * (1 - m) * (1 - k);
  const b = 255 * (1 - y) * (1 - k);

  return {
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b),
  };
}

/**
 * Check if an RGB color is within CMYK printable gamut
 * Returns true if the color can be accurately reproduced in print
 */
export function isWithinCMYKGamut(r: number, g: number, b: number): boolean {
  const cmyk = rgbToCmyk(r, g, b);
  
  // Check for extreme CMYK values that indicate out-of-gamut
  // Bright/neon colors typically have very low K and extreme C/M/Y
  const totalInk = cmyk.c + cmyk.m + cmyk.y + cmyk.k;
  
  // Out of gamut if:
  // - Very bright colors (low K, low total ink but high RGB)
  // - Neon colors (extreme individual channels)
  if (cmyk.k < 5 && totalInk < 100) {
    // Very bright colors may not print accurately
    if (r > 200 || g > 200 || b > 200) {
      return false;
    }
  }
  
  // Check for pure RGB primaries which are out of CMYK gamut
  if ((r === 255 && g === 0 && b === 0) ||
      (r === 0 && g === 255 && b === 0) ||
      (r === 0 && g === 0 && b === 255)) {
    return false;
  }
  
  return true;
}

/**
 * Get CMYK gamut warning level
 * Returns: 'safe' | 'warning' | 'critical'
 */
export function getCMYKGamutWarning(r: number, g: number, b: number): 'safe' | 'warning' | 'critical' {
  if (isWithinCMYKGamut(r, g, b)) {
    return 'safe';
  }
  
  const cmyk = rgbToCmyk(r, g, b);
  const totalInk = cmyk.c + cmyk.m + cmyk.y + cmyk.k;
  
  // Critical: Pure RGB colors that will shift significantly
  if ((r === 255 && g === 0 && b === 0) ||
      (r === 0 && g === 255 && b === 0) ||
      (r === 0 && g === 0 && b === 255) ||
      (r === 255 && g === 255 && b === 0) ||
      (r === 0 && g === 255 && b === 255) ||
      (r === 255 && g === 0 && b === 255)) {
    return 'critical';
  }
  
  // Warning: Very bright colors
  if (cmyk.k < 5 && totalInk < 100) {
    return 'warning';
  }
  
  return 'warning';
}

/**
 * Convert RGB to CMYK with total ink limit (TIL) for professional printing
 * Standard TIL is 240-300% depending on paper stock
 */
export function rgbToCmykWithTIL(r: number, g: number, b: number, maxTotalInk: number = 280): CMYK {
  const cmyk = rgbToCmyk(r, g, b);
  const totalInk = cmyk.c + cmyk.m + cmyk.y + cmyk.k;
  
  if (totalInk > maxTotalInk) {
    const scale = maxTotalInk / totalInk;
    return {
      c: Math.round(cmyk.c * scale),
      m: Math.round(cmyk.m * scale),
      y: Math.round(cmyk.y * scale),
      k: Math.round(cmyk.k * scale),
    };
  }
  
  return cmyk;
}

/**
 * Get the closest printable CMYK color for an RGB value
 */
export function getClosestPrintableCMYK(r: number, g: number, b: number): CMYK {
  // For out-of-gamut colors, reduce saturation
  const hsl = rgbToHsl(r, g, b);
  
  // Reduce saturation for very bright colors
  if (hsl.l > 85 || hsl.s > 90) {
    const adjusted = hslToRgb(hsl.h, Math.min(75, hsl.s), Math.min(80, hsl.l));
    return rgbToCmyk(adjusted.r, adjusted.g, adjusted.b);
  }
  
  return rgbToCmyk(r, g, b);
}

// ============ STRING PARSING ============

/**
 * Parse any color format to RGB
 */
export function parseColor(color: string): RGB {
  // Hex
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }

  // rgb()
  const rgbMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }

  // hsl()
  const hslMatch = color.match(/hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%/i);
  if (hslMatch) {
    return hslToRgb(parseInt(hslMatch[1]), parseInt(hslMatch[2]), parseInt(hslMatch[3]));
  }

  throw new Error(`Unable to parse color: ${color}`);
}

/**
 * Convert RGB to hex string
 */
export function rgbToHexStr(rgb: RGB): string {
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Convert RGB to HSL string
 */
export function rgbToHslStr(rgb: RGB): string {
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

// ============ COLOR HARMONIES ============

/**
 * Generate color harmonies from a base color
 */
export function generateHarmonies(hex: string): ColorHarmony {
  const rgb = parseColor(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  return {
    complementary: hslToHexStr(rotateHue(hsl, 180)),
    analogous: [
      hslToHexStr(rotateHue(hsl, -30)),
      hslToHexStr(rotateHue(hsl, 30)),
    ],
    triadic: [
      hslToHexStr(rotateHue(hsl, 120)),
      hslToHexStr(rotateHue(hsl, 240)),
    ],
    splitComplementary: [
      hslToHexStr(rotateHue(hsl, 150)),
      hslToHexStr(rotateHue(hsl, 210)),
    ],
    tetradic: [
      hslToHexStr(rotateHue(hsl, 90)),
      hslToHexStr(rotateHue(hsl, 180)),
      hslToHexStr(rotateHue(hsl, 270)),
    ],
    monochromatic: [
      hslToHexStr({ ...hsl, l: Math.max(0, hsl.l - 30) }),
      hslToHexStr({ ...hsl, l: Math.max(0, hsl.l - 15) }),
      hslToHexStr({ ...hsl, l: Math.min(100, hsl.l + 15) }),
      hslToHexStr({ ...hsl, l: Math.min(100, hsl.l + 30) }),
    ],
  };
}

/**
 * Rotate HSL hue by degrees
 */
function rotateHue(hsl: HSL, degrees: number): HSL {
  let newHue = hsl.h + degrees;
  while (newHue < 0) {newHue += 360;}
  while (newHue >= 360) {newHue -= 360;}
  return { ...hsl, h: newHue };
}

/**
 * Helper to convert HSL to hex string
 */
function hslToHexStr(hsl: HSL): string {
  const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

// ============ COLOR VARIATIONS ============

/**
 * Generate tints (add white)
 */
export function generateTints(hex: string, steps: number = 5): string[] {
  const rgb = parseColor(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const tints: string[] = [];

  for (let i = 1; i <= steps; i++) {
    const lightness = hsl.l + ((100 - hsl.l) / steps) * i;
    tints.push(hslToHexStr({ ...hsl, l: Math.min(95, Math.round(lightness)) }));
  }

  return tints;
}

/**
 * Generate shades (add black)
 */
export function generateShades(hex: string, steps: number = 5): string[] {
  const rgb = parseColor(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const shades: string[] = [];

  for (let i = 1; i <= steps; i++) {
    const lightness = hsl.l - (hsl.l / steps) * i;
    shades.push(hslToHexStr({ ...hsl, l: Math.max(5, Math.round(lightness)) }));
  }

  return shades;
}

/**
 * Generate tones (add gray)
 */
export function generateTones(hex: string, steps: number = 5): string[] {
  const rgb = parseColor(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const tones: string[] = [];

  for (let i = 1; i <= steps; i++) {
    const saturation = hsl.s - ((hsl.s - 20) / steps) * i;
    tones.push(hslToHexStr({ ...hsl, s: Math.max(0, Math.round(saturation)) }));
  }

  return tones;
}

// ============ ACCESSIBILITY ============

/**
 * Calculate relative luminance (WCAG 2.1)
 */
export function getLuminance(hex: string): number {
  const rgb = parseColor(hex);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors (WCAG 2.1)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check WCAG compliance
 */
export function checkWCAG(hex1: string, hex2: string): WCAGResult {
  const ratio = getContrastRatio(hex1, hex2);

  return {
    ratio: Math.round(ratio * 100) / 100,
    AA: ratio >= 4.5,
    AAA: ratio >= 7,
    level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'fail',
  };
}

/**
 * Get accessible text color for a background
 */
export function getAccessibleTextColor(bgHex: string): string {
  const luminance = getLuminance(bgHex);
  return luminance > 0.179 ? '#000000' : '#FFFFFF';
}

// ============ COLOR BLINDNESS SIMULATION ============

export type ColorBlindnessType =
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'achromatopsia';

/**
 * Simulate color blindness
 */
export function simulateColorBlindness(hex: string, type: ColorBlindnessType): string {
  const rgb = parseColor(hex);

  const matrices: Record<ColorBlindnessType, number[][]> = {
    protanopia: [
      [0.567, 0.433, 0],
      [0.558, 0.442, 0],
      [0, 0.242, 0.758],
    ],
    deuteranopia: [
      [0.625, 0.375, 0],
      [0.7, 0.3, 0],
      [0, 0.3, 0.7],
    ],
    tritanopia: [
      [0.95, 0.05, 0],
      [0, 0.433, 0.567],
      [0, 0.475, 0.525],
    ],
    achromatopsia: [
      [0.299, 0.587, 0.114],
      [0.299, 0.587, 0.114],
      [0.299, 0.587, 0.114],
    ],
  };

  const matrix = matrices[type];
  const r = Math.round(rgb.r * matrix[0][0] + rgb.g * matrix[0][1] + rgb.b * matrix[0][2]);
  const g = Math.round(rgb.r * matrix[1][0] + rgb.g * matrix[1][1] + rgb.b * matrix[1][2]);
  const b = Math.round(rgb.r * matrix[2][0] + rgb.g * matrix[2][1] + rgb.b * matrix[2][2]);

  return rgbToHex(
    Math.min(255, Math.max(0, r)),
    Math.min(255, Math.max(0, g)),
    Math.min(255, Math.max(0, b))
  );
}

// ============ COLOR NAMES ============

const COLOR_NAMES: Record<string, string> = {
  '#000000': 'Black',
  '#ffffff': 'White',
  '#ff0000': 'Red',
  '#00ff00': 'Lime',
  '#0000ff': 'Blue',
  '#ffff00': 'Yellow',
  '#ff00ff': 'Magenta',
  '#00ffff': 'Cyan',
  '#800000': 'Maroon',
  '#808000': 'Olive',
  '#008000': 'Green',
  '#800080': 'Purple',
  '#008080': 'Teal',
  '#000080': 'Navy',
  '#ffa500': 'Orange',
  '#ffc0cb': 'Pink',
  '#a52a2a': 'Brown',
  '#808080': 'Gray',
  '#c0c0c0': 'Silver',
  '#7d2ae8': 'Kreathief Purple',
  '#00c4cc': 'Kreathief Cyan',
};

/**
 * Find closest named color
 */
export function getClosestColorName(hex: string): string {
  const normalized = hex.toLowerCase();
  if (COLOR_NAMES[normalized]) {
    return COLOR_NAMES[normalized];
  }

  // Find closest by Euclidean distance
  const rgb = parseColor(hex);
  let minDistance = Infinity;
  let closestName = 'Custom Color';

  Object.entries(COLOR_NAMES).forEach(([colorHex, name]) => {
    const otherRgb = parseColor(colorHex);
    const distance = Math.sqrt(
      Math.pow(rgb.r - otherRgb.r, 2) +
        Math.pow(rgb.g - otherRgb.g, 2) +
        Math.pow(rgb.b - otherRgb.b, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestName = name;
    }
  });

  return closestName;
}

// ============ PALETTE UTILITIES ============

/**
 * Extract dominant colors from image data
 */
export function extractPalette(imageData: ImageData, colors: number = 5): string[] {
  const pixelCount = imageData.width * imageData.height;
  const colorMap = new Map<string, number>();

  // Count color frequencies (quantize to reduce unique colors)
  for (let i = 0; i < pixelCount; i++) {
    const r = Math.round(imageData.data[i * 4] / 16) * 16;
    const g = Math.round(imageData.data[i * 4 + 1] / 16) * 16;
    const b = Math.round(imageData.data[i * 4 + 2] / 16) * 16;
    const hex = rgbToHex(r, g, b);
    colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
  }

  // Sort by frequency and return top colors
  const sorted = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, colors * 2);

  // Filter out similar colors
  const result: string[] = [];
  for (const [hex] of sorted) {
    if (result.length >= colors) {break;}

    const isSimilar = result.some((existing) => {
      const existingRgb = parseColor(existing);
      const newRgb = parseColor(hex);
      const distance =
        Math.abs(existingRgb.r - newRgb.r) +
        Math.abs(existingRgb.g - newRgb.g) +
        Math.abs(existingRgb.b - newRgb.b);
      return distance < 50;
    });

    if (!isSimilar) {
      result.push(hex);
    }
  }

  return result;
}

/**
 * Generate gradient between two colors
 */
export function generateGradient(start: string, end: string, steps: number = 5): string[] {
  const startRgb = parseColor(start);
  const endRgb = parseColor(end);
  const gradient: string[] = [];

  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    const r = Math.round(startRgb.r + (endRgb.r - startRgb.r) * ratio);
    const g = Math.round(startRgb.g + (endRgb.g - startRgb.g) * ratio);
    const b = Math.round(startRgb.b + (endRgb.b - startRgb.b) * ratio);
    gradient.push(rgbToHex(r, g, b));
  }

  return gradient;
}

/**
 * Mix two colors
 */
export function mixColors(color1: string, color2: string, ratio: number = 0.5): string {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);

  return rgbToHex(r, g, b);
}

/**
 * Lighten a color
 */
export function lighten(hex: string, percent: number): string {
  const rgb = parseColor(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return hslToHexStr({ ...hsl, l: Math.min(100, hsl.l + percent) });
}

/**
 * Darken a color
 */
export function darken(hex: string, percent: number): string {
  const rgb = parseColor(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return hslToHexStr({ ...hsl, l: Math.max(0, hsl.l - percent) });
}

/**
 * Saturate a color
 */
export function saturate(hex: string, percent: number): string {
  const rgb = parseColor(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return hslToHexStr({ ...hsl, s: Math.min(100, hsl.s + percent) });
}

/**
 * Desaturate a color
 */
export function desaturate(hex: string, percent: number): string {
  const rgb = parseColor(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return hslToHexStr({ ...hsl, s: Math.max(0, hsl.s - percent) });
}
