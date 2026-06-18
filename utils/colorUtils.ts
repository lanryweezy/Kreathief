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
  // Handle invalid hex or shorthand
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h.split('').map(char => char + char).join('');
  }
  // Ensure we have at least 6 chars for parsing
  if (h.length < 6) {h = h.padEnd(6, '0');}
  
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
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
  if (k === 1) {return { c: 0, m: 0, y: 0, k: 100 };}

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
  if (!color) {return { r: 0, g: 0, b: 0 };}
  if (color.startsWith('#')) {return hexToRGB(color);}
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
  if (ratioNum >= 7) {level = 'AAA';}
  else if (ratioNum >= 4.5) {level = 'AA';}
  else if (ratioNum >= 3) {level = 'Large AA';}

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
 * HSL Conversion Utilities
 */
export interface HSL {
  h: number;
  s: number;
  l: number;
}

export const rgbToHSL = (r: number, g: number, b: number): HSL => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
};

export const hslToRGB = (h: number, s: number, l: number): RGB => {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) {t += 1;}
      if (t > 1) {t -= 1;}
      if (t < 1/6) {return p + (q - p) * 6 * t;}
      if (t < 1/2) {return q;}
      if (t < 2/3) {return p + (q - p) * (2/3 - t) * 6;}
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
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
  const rgb = parseColor(hex);
  const hsl = rgbToHSL(rgb.r, rgb.g, rgb.b);

  const getHex = (h: number, s: number, l: number) => {
    const r = hslToRGB((h + 360) % 360, s, l);
    return rgbToHex(r.r, r.g, r.b);
  };

  return {
    complementary: getHex(hsl.h + 180, hsl.s, hsl.l),
    analogous: [
      getHex(hsl.h - 30, hsl.s, hsl.l),
      getHex(hsl.h + 30, hsl.s, hsl.l)
    ],
    triadic: [
      getHex(hsl.h + 120, hsl.s, hsl.l),
      getHex(hsl.h + 240, hsl.s, hsl.l)
    ],
    splitComplementary: [
      getHex(hsl.h + 150, hsl.s, hsl.l),
      getHex(hsl.h + 210, hsl.s, hsl.l)
    ],
    tetradic: [
      getHex(hsl.h + 90, hsl.s, hsl.l),
      getHex(hsl.h + 180, hsl.s, hsl.l),
      getHex(hsl.h + 270, hsl.s, hsl.l)
    ],
    monochromatic: [
      getHex(hsl.h, hsl.s, Math.max(10, hsl.l - 20)),
      getHex(hsl.h, Math.max(10, hsl.s - 20), hsl.l),
      getHex(hsl.h, hsl.s, Math.min(90, hsl.l + 20))
    ]
  };
};

export const generateTints = (hex: string, count: number = 5): string[] => {
  const rgb = parseColor(hex);
  const hsl = rgbToHSL(rgb.r, rgb.g, rgb.b);
  return Array.from({ length: count }, (_, i) => {
    const l = hsl.l + (100 - hsl.l) * ((i + 1) / (count + 1));
    const r = hslToRGB(hsl.h, hsl.s, l);
    return rgbToHex(r.r, r.g, r.b);
  });
};

export const generateShades = (hex: string, count: number = 5): string[] => {
  const rgb = parseColor(hex);
  const hsl = rgbToHSL(rgb.r, rgb.g, rgb.b);
  return Array.from({ length: count }, (_, i) => {
    const l = hsl.l * (1 - (i + 1) / (count + 1));
    const r = hslToRGB(hsl.h, hsl.s, l);
    return rgbToHex(r.r, r.g, r.b);
  });
};

export const generateTones = (hex: string, count: number = 5): string[] => {
  const rgb = parseColor(hex);
  const hsl = rgbToHSL(rgb.r, rgb.g, rgb.b);
  return Array.from({ length: count }, (_, i) => {
    const s = hsl.s * (1 - (i + 1) / (count + 1));
    const r = hslToRGB(hsl.h, s, hsl.l);
    return rgbToHex(r.r, r.g, r.b);
  });
};

/**
 * Palette Extraction (Mock)
 */
/**
 * Palette Extraction using Color Quantization (Simple version)
 */
export const extractPalette = async (imgData: ImageData, count: number = 5): Promise<string[]> => {
  const pixels = imgData.data;
  const pixelCount = pixels.length / 4;
  const colorMap: Record<string, number> = {};

  // Sample every 10th pixel for performance
  for (let i = 0; i < pixels.length; i += 40) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    
    // Group similar colors by rounding
    const rounded = `${Math.round(r / 10) * 10},${Math.round(g / 10) * 10},${Math.round(b / 10) * 10}`;
    colorMap[rounded] = (colorMap[rounded] || 0) + 1;
  }

  // Sort by frequency and get top colors
  const sortedColors = Object.entries(colorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([colorStr]) => {
      const [r, g, b] = colorStr.split(',').map(Number);
      return rgbToHex(r, g, b);
    });

  return sortedColors;
};

/**
 * Gamut Warnings & Snapping
 */
export const isWithinCMYKGamut = (hex: string): boolean => {
  if (!hex || hex === 'transparent' || !hex.startsWith('#')) {return true;}
  const rgb = parseColor(hex);
  
  // High-end Gamut Check: 
  // Standard RGB (sRGB) covers colors that CMYK (Offset) cannot reproduce.
  // We check if the saturation or brightness is in the "Danger Zone" (Neons/Brights)
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  const brightness = max / 255;

  // Rule of thumb: If saturation > 85% and brightness > 85%, it's likely out of gamut
  if (saturation > 0.85 && brightness > 0.85) {return false;}
  
  // Specific Danger: Pure Blue (0,0,255) and Pure Green (0,255,0) are always out of gamut
  if (rgb.b > 230 && rgb.r < 50 && rgb.g < 50) {return false;}
  if (rgb.g > 230 && rgb.r < 50 && rgb.b < 50) {return false;}

  return true;
};

export const getCMYKGamutWarning = (hex: string): 'warning' | 'critical' | null => {
  if (isWithinCMYKGamut(hex)) {return null;}
  const rgb = parseColor(hex);
  // Critical if it's a neon or extremely saturated blue/green
  return (rgb.g > 240 || rgb.b > 240) ? 'critical' : 'warning';
};

export const getClosestCMYKSafeColor = (hex: string): string => {
  const rgb = parseColor(hex);
  
  // Simple "Snapping" algorithm: Desaturate and slightly darken until safe
  let r = rgb.r;
  let g = rgb.g;
  let b = rgb.b;

  // Reduce neons to printable levels
  r = Math.min(r, 220);
  g = Math.min(g, 220);
  b = Math.min(b, 210);

  // If it was a very bright blue/green, pull it back further
  if (rgb.b > 200) {b *= 0.85;}
  if (rgb.g > 200) {g *= 0.85;}

  return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
};

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
