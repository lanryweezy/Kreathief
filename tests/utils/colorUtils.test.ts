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
  isWithinCMYKGamut,
  getCMYKGamutWarning,
  getClosestCMYKSafeColor,
  getRichBlack,
  formatCMYK,
  extractPalette,
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

    it('pads short hex strings with zeros', () => {
      const result = hexToRGB('12');
      expect(result).toEqual({ r: 18, g: 0, b: 0 }); // 120000
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

    it('returns black for unrecognized format', () => {
      const result = parseColor('hsl(0, 100%, 50%)');
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

    it('checks WCAG compliance correctly for AAA', () => {
      const result = checkWCAG('#ffffff', '#000000');
      expect(result.AAA).toBe(true);
      expect(result.level).toBe('AAA');
    });

    it('checks WCAG compliance correctly for AA', () => {
      const result = checkWCAG('#767676', '#ffffff'); // ~4.54
      expect(result.AA).toBe(true);
      expect(result.AAA).toBe(false);
      expect(result.level).toBe('AA');
    });

    it('checks WCAG compliance correctly for Large AA', () => {
      const result = checkWCAG('#949494', '#ffffff'); // ~3.03
      expect(result.largeAA).toBe(true);
      expect(result.AA).toBe(false);
      expect(result.level).toBe('Large AA');
    });

    it('checks WCAG compliance correctly for fail', () => {
      const result = checkWCAG('#dddddd', '#ffffff'); // < 3
      expect(result.largeAA).toBe(false);
      expect(result.level).toBe('fail');
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

    it('converts RGB to HSL correctly when l > 0.5', () => {
      const result = rgbToHSL(255, 128, 128);
      expect(result.h).toBe(0);
      expect(result.s).toBe(100);
      expect(result.l).toBeCloseTo(75, 0);
    });

    it('converts RGB to HSL correctly when g is max', () => {
      const result = rgbToHSL(0, 255, 0);
      expect(result.h).toBe(120);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('converts RGB to HSL correctly when b is max', () => {
      const result = rgbToHSL(0, 0, 255);
      expect(result.h).toBe(240);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('converts RGB to HSL correctly when r is max and g < b', () => {
      const result = rgbToHSL(255, 0, 255);
      expect(result.h).toBe(300);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('converts HSL to RGB correctly', () => {
      const result = hslToRGB(0, 100, 50);
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('converts HSL to RGB correctly when s is 0', () => {
      const result = hslToRGB(120, 0, 50);
      expect(result).toEqual({ r: 128, g: 128, b: 128 });
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

  describe('Gamut Warnings & Snapping', () => {
    it('identifies in-gamut color', () => {
      const result = isWithinCMYKGamut('#808080');
      expect(result).toBe(true);
    });

    it('identifies out-of-gamut neon color', () => {
      const result = isWithinCMYKGamut('#00ff00');
      expect(result).toBe(false);
    });

    it('identifies out-of-gamut pure blue color', () => {
      const result = isWithinCMYKGamut('#0000ff');
      expect(result).toBe(false);
    });

    it('identifies out-of-gamut pure green color', () => {
      const result = isWithinCMYKGamut('#00ff00');
      expect(result).toBe(false);
    });

    it('identifies high saturation high brightness color as out-of-gamut', () => {
      const result = isWithinCMYKGamut('#ff00ff');
      expect(result).toBe(false);
    });

    it('identifies pure red/blue specific danger combination as out-of-gamut', () => {
      const result = isWithinCMYKGamut('#2323e7'); // b > 230, r < 50, g < 50, but sat < 85% or br < 85%
      expect(result).toBe(false);
    });

    it('identifies pure green specific danger combination as out-of-gamut', () => {
      const result = isWithinCMYKGamut('#23e723'); // g > 230, r < 50, b < 50, but sat < 85% or br < 85%
      expect(result).toBe(false);
    });

    it('returns true for missing or transparent hex', () => {
      expect(isWithinCMYKGamut('')).toBe(true);
      expect(isWithinCMYKGamut('transparent')).toBe(true);
      expect(isWithinCMYKGamut('rgba(0,0,0,0)')).toBe(true);
    });

    it('returns true for black', () => {
      expect(isWithinCMYKGamut('#000000')).toBe(true);
    });

    it('returns null for in-gamut color warning', () => {
      const result = getCMYKGamutWarning('#808080');
      expect(result).toBe(null);
    });

    it('returns warning level for out-of-gamut neon color', () => {
      const result = getCMYKGamutWarning('#00ff00');
      expect(result).toBe('critical');
    });

    it('returns warning level for out-of-gamut non-neon color', () => {
      // Something that is out of gamut but not critical
      // e.g., something not matching the specific g > 240 || b > 240 logic
      const result = getCMYKGamutWarning('#ff8000');
      expect(result).toBe('warning');
    });

    it('returns safe fallback for out-of-gamut color', () => {
      const result = getClosestCMYKSafeColor('#00ff00');
      expect(result).toBe('#00bb00'); // Desaturated slightly
    });

    it('returns safe fallback for out-of-gamut bright blue color', () => {
      const result = getClosestCMYKSafeColor('#0000ff');
      expect(result).toBe('#0000b3');
    });

    it('returns safe fallback for out-of-gamut bright red color', () => {
      const result = getClosestCMYKSafeColor('#ff0000');
      expect(result).toBe('#dc0000'); // Red is capped at 220 which is #dc
    });

    it('returns safe fallback for out-of-gamut very bright green color', () => {
      const result = getClosestCMYKSafeColor('#00ff00'); // > 200 pulls back by 0.85
      // min(255, 220) = 220. 220 * 0.85 = 187 => #bb
      expect(result).toBe('#00bb00');
    });

    it('returns safe fallback for out-of-gamut very bright blue color', () => {
      const result = getClosestCMYKSafeColor('#0000ff'); // > 200 pulls back by 0.85
      // min(255, 210) = 210. 210 * 0.85 = 178.5 => 179 => #b3
      expect(result).toBe('#0000b3');
    });
  });

  describe('extractPalette', () => {
    it('extracts palette from ImageData correctly', async () => {
      const data = new Uint8ClampedArray(400); // 100 pixels
      for (let i = 0; i < 400; i += 4) {
        if (i < 200) {
          // Red
          data[i] = 255;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 255;
        } else {
          // Blue
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 255;
          data[i + 3] = 255;
        }
      }

      // Mock ImageData
      const imgData = {
        data,
        width: 10,
        height: 10,
        colorSpace: 'srgb',
      } as unknown as ImageData;

      const result = await extractPalette(imgData, 2);
      expect(result.length).toBe(2);
      expect(result).toContain('#ff0000');
      expect(result).toContain('#0000ff');
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
