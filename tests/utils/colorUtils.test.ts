import { describe, it, expect } from 'vitest';
import {
  hexToRGB,
  rgbToHex,
  rgbToCMYK,
  cmykToRgb,
  parseColor,
  getLuminance,
  getContrastRatio,
  checkWCAG,
  getAccessibleTextColor,
  rgbToHSL,
  hslToRGB,
  generateHarmonies,
  generateTints,
  generateShades,
  generateTones,
  extractPalette,
  isWithinCMYKGamut,
  getCMYKGamutWarning,
  getClosestCMYKSafeColor,
  getRichBlack,
  formatCMYK,
} from '../../utils/colorUtils';

describe('colorUtils', () => {
  describe('hexToRGB', () => {
    it('converts a standard 6-character hex to RGB', () => {
      const result = hexToRGB('#ff0000');
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('converts a 3-character hex shorthand to RGB', () => {
      const result = hexToRGB('#f00');
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('handles hex without hash', () => {
      const result = hexToRGB('00ff00');
      expect(result).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('returns black for invalid hex', () => {
      const result = hexToRGB('invalid');
      expect(result).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('rgbToHex', () => {
    it('converts standard RGB values to hex', () => {
      const result = rgbToHex(255, 0, 0);
      expect(result).toBe('#ff0000');
    });

    it('clamps values to valid 0-255 range', () => {
      const result = rgbToHex(300, -50, 128);
      expect(result).toBe('#ff0080');
    });
  });

  describe('rgbToCMYK', () => {
    it('converts RGB to CMYK correctly', () => {
      const result = rgbToCMYK(255, 0, 0);
      expect(result).toEqual({ c: 0, m: 100, y: 100, k: 0 });
    });

    it('handles black correctly', () => {
      const result = rgbToCMYK(0, 0, 0);
      expect(result).toEqual({ c: 0, m: 0, y: 0, k: 100 });
    });

    it('handles white correctly', () => {
      const result = rgbToCMYK(255, 255, 255);
      expect(result).toEqual({ c: 0, m: 0, y: 0, k: 0 });
    });
  });

  describe('cmykToRgb', () => {
    it('converts CMYK to RGB correctly', () => {
      const result = cmykToRgb(0, 100, 100, 0);
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('handles black correctly', () => {
      const result = cmykToRgb(0, 0, 0, 100);
      expect(result).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('parseColor', () => {
    it('parses a hex color', () => {
      const result = parseColor('#00ff00');
      expect(result).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('parses an rgb color string', () => {
      const result = parseColor('rgb(0, 255, 0)');
      expect(result).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('parses an rgba color string ignoring alpha', () => {
      const result = parseColor('rgba(0, 255, 0, 0.5)');
      expect(result).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('returns black for empty or invalid color', () => {
      const result = parseColor('');
      expect(result).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('WCAG Utilities', () => {
    it('calculates correct luminance for white', () => {
      const result = getLuminance(255, 255, 255);
      expect(result).toBeCloseTo(1, 4);
    });

    it('calculates correct contrast ratio', () => {
      const result = getContrastRatio('#ffffff', '#000000');
      expect(result).toBeCloseTo(21, 1);
    });

    it('checks WCAG compliance correctly', () => {
      const result = checkWCAG('#ffffff', '#000000');
      expect(result.AAA).toBe(true);
      expect(result.level).toBe('AAA');
    });

    it('returns white text for dark background', () => {
      const result = getAccessibleTextColor('#000000');
      expect(result).toBe('#ffffff');
    });

    it('returns black text for light background', () => {
      const result = getAccessibleTextColor('#ffffff');
      expect(result).toBe('#000000');
    });
  });

  describe('HSL Utilities', () => {
    it('converts RGB to HSL correctly', () => {
      const result = rgbToHSL(255, 0, 0);
      expect(result.h).toBe(0);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('converts HSL to RGB correctly', () => {
      const result = hslToRGB(0, 100, 50);
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });
  });

  describe('Color Harmonies', () => {
    it('generates complementary color', () => {
      const result = generateHarmonies('#ff0000');
      expect(result.complementary).toBe('#00ffff');
    });

    it('generates tints', () => {
      const result = generateTints('#ff0000', 3);
      expect(result.length).toBe(3);
    });

    it('generates shades', () => {
      const result = generateShades('#ff0000', 3);
      expect(result.length).toBe(3);
    });

    it('generates tones', () => {
      const result = generateTones('#ff0000', 3);
      expect(result.length).toBe(3);
    });
  });

  describe('extractPalette', () => {
    it('extracts top colors from image data', async () => {
      // Create a dummy image data array:
      // 40 red pixels, 40 blue pixels, 40 green pixels, so 120 pixels in total.
      // We will loop i from 0 to 480 (4 channels per pixel).
      // 60 red pixels, 30 blue pixels, 30 green pixels.
      const data = new Uint8ClampedArray(480);

      // 60 red pixels
      for (let i = 0; i < 60 * 4; i += 4) {
        data[i] = 255;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
      }

      // 30 blue pixels
      for (let i = 60 * 4; i < 90 * 4; i += 4) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }

      // 30 green pixels
      for (let i = 90 * 4; i < 120 * 4; i += 4) {
        data[i] = 0;
        data[i + 1] = 255;
        data[i + 2] = 0;
        data[i + 3] = 255;
      }

      const imgData = { data, width: 120, height: 1 } as unknown as ImageData;

      const palette = await extractPalette(imgData, 2);
      expect(palette.length).toBe(2);
      expect(palette[0]).toBe('#ff0000');
    });

    it('limits colors to the requested count', async () => {
      const data = new Uint8ClampedArray(160);
      for (let i = 0; i < 160; i += 4) {
        data[i] = i; // varying colors
        data[i + 1] = i;
        data[i + 2] = i;
        data[i + 3] = 255;
      }
      const imgData = { data, width: 40, height: 1 } as unknown as ImageData;

      const palette = await extractPalette(imgData, 2);
      expect(palette.length).toBe(2);
    });
  });

  describe('Gamut Warnings & Snapping', () => {
    it('identifies in-gamut color', () => {
      const result = isWithinCMYKGamut('#808080');
      expect(result).toBe(true);
    });

    it('identifies out-of-gamut neon color', () => {
      const result = isWithinCMYKGamut('#00ff00');
      expect(result).toBe(false);
    });

    it('returns warning level for out-of-gamut color', () => {
      const result = getCMYKGamutWarning('#00ff00');
      expect(result).toBe('critical');
    });

    it('returns safe fallback for out-of-gamut color', () => {
      const result = getClosestCMYKSafeColor('#00ff00');
      expect(result).toBe('#00bb00'); // Desaturated slightly
    });
  });

  describe('Print Utilities', () => {
    it('returns rich black CMYK values', () => {
      const result = getRichBlack();
      expect(result).toEqual({ c: 60, m: 40, y: 40, k: 100 });
    });

    it('formats CMYK values to string', () => {
      const result = formatCMYK({ c: 10, m: 20, y: 30, k: 40 });
      expect(result).toBe('C:10 M:20 Y:30 K:40');
    });
  });
});
