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
  formatCMYK
} from '../../../utils/colorUtils';

describe('colorUtils Conversions', () => {
  describe('Basic Conversions', () => {
    it('converts correctly when a 6-character hex string is provided', () => {
      // Arrange & Act
      const result = hexToRGB('#FF5733');

      // Assert
      expect(result).toEqual({ r: 255, g: 87, b: 51 });
    });

    it('converts correctly when a 3-character hex string is provided', () => {
      // Arrange & Act
      const result = hexToRGB('#F53');

      // Assert
      expect(result).toEqual({ r: 255, g: 85, b: 51 });
    });

    it('converts correctly when a hex string without a hash prefix is provided', () => {
      // Arrange & Act
      const result = hexToRGB('00FF00');

      // Assert
      expect(result).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('returns zeroes when an invalid hex string is provided', () => {
      // Arrange & Act
      const result = hexToRGB('not-a-color');

      // Assert
      expect(typeof result.r).toBe('number');
      expect(typeof result.g).toBe('number');
      expect(typeof result.b).toBe('number');
    });

    it('converts correctly when an RGB object is provided', () => {
      // Arrange & Act
      const result = rgbToHex(255, 87, 51);

      // Assert
      expect(result).toBe('#ff5733');
    });

    it('clamps RGB values when negative values are provided', () => {
      // Arrange & Act
      const result = rgbToHex(-10, 87, 51);

      // Assert
      expect(result).toBe('#005733');
    });

    it('clamps RGB values when values above 255 are provided', () => {
      // Arrange & Act
      const result = rgbToHex(300, 87, 51);

      // Assert
      expect(result).toBe('#ff5733');
    });
  });

  describe('CMYK Conversions', () => {
    it('returns CMYK approximation when pure RGB is provided', () => {
      // Arrange & Act
      const result = rgbToCMYK(255, 0, 0);

      // Assert
      expect(result).toEqual({ c: 0, m: 100, y: 100, k: 0 });
    });

    it('returns black CMYK when black RGB is provided', () => {
      // Arrange & Act
      const result = rgbToCMYK(0, 0, 0);

      // Assert
      expect(result).toEqual({ c: 0, m: 0, y: 0, k: 100 });
    });

    it('returns white CMYK when white RGB is provided', () => {
      // Arrange & Act
      const result = rgbToCMYK(255, 255, 255);

      // Assert
      expect(result).toEqual({ c: 0, m: 0, y: 0, k: 0 });
    });

    it('returns RGB object when CMYK values are provided', () => {
      // Arrange & Act
      const result = cmykToRgb(0, 100, 100, 0);

      // Assert
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });
  });

  describe('Parsing', () => {
    it('returns an RGB object when a hex string is provided', () => {
      // Arrange & Act
      const result = parseColor('#00ff00');

      // Assert
      expect(result).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('returns an RGB object when an rgb() string is provided', () => {
      // Arrange & Act
      const result = parseColor('rgb(10, 20, 30)');

      // Assert
      expect(result).toEqual({ r: 10, g: 20, b: 30 });
    });

    it('returns an RGB object when an rgba() string is provided', () => {
      // Arrange & Act
      const result = parseColor('rgba(10, 20, 30, 0.5)');

      // Assert
      expect(result).toEqual({ r: 10, g: 20, b: 30 });
    });

    it('returns black when an empty or invalid color string is provided', () => {
      // Arrange & Act
      const emptyResult = parseColor('');
      const invalidResult = parseColor('not a color');

      // Assert
      expect(emptyResult).toEqual({ r: 0, g: 0, b: 0 });
      expect(invalidResult).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('Accessibility', () => {
    it('calculates correctly when relative luminance of a color is requested', () => {
      // Arrange & Act
      const whiteLum = getLuminance(255, 255, 255);
      const blackLum = getLuminance(0, 0, 0);

      // Assert
      expect(whiteLum).toBeCloseTo(1, 4);
      expect(blackLum).toBeCloseTo(0, 4);
    });

    it('calculates correctly when the contrast ratio between two colors is requested', () => {
      // Arrange & Act
      const ratio = getContrastRatio('#ffffff', '#000000');

      // Assert
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('returns WCAG compliance object when a given contrast pair is evaluated', () => {
      // Arrange & Act
      const result = checkWCAG('#ffffff', '#000000');

      // Assert
      expect(result.AA).toBe(true);
      expect(result.AAA).toBe(true);
      expect(result.level).toBe('AAA');
    });

    it('returns failing WCAG compliance when low contrast colors are evaluated', () => {
      // Arrange & Act
      const result = checkWCAG('#ffffff', '#f0f0f0');

      // Assert
      expect(result.AA).toBe(false);
      expect(result.level).toBe('fail');
    });

    it('returns black text color when a light background color is evaluated', () => {
      // Arrange & Act
      const result = getAccessibleTextColor('#ffffff');

      // Assert
      expect(result).toBe('#000000');
    });

    it('returns white text color when a dark background color is evaluated', () => {
      // Arrange & Act
      const result = getAccessibleTextColor('#000000');

      // Assert
      expect(result).toBe('#ffffff');
    });
  });

  describe('HSL Conversions', () => {
    it('returns HSL values when pure RGB red is provided', () => {
      // Arrange & Act
      const result = rgbToHSL(255, 0, 0);

      // Assert
      expect(result.h).toBeCloseTo(0);
      expect(result.s).toBeCloseTo(100);
      expect(result.l).toBeCloseTo(50);
    });

    it('returns RGB values when pure red HSL is provided', () => {
      // Arrange & Act
      const result = hslToRGB(0, 100, 50);

      // Assert
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('returns gray RGB values when zero saturation HSL is provided', () => {
      // Arrange & Act
      const result = hslToRGB(0, 0, 50);

      // Assert
      expect(result).toEqual({ r: 128, g: 128, b: 128 });
    });
  });

  describe('Color Harmonies', () => {
    it('returns a set of color harmonies when a base hex color is provided', () => {
      // Arrange & Act
      const result = generateHarmonies('#ff0000');

      // Assert
      expect(result.complementary).toBeDefined();
      expect(result.analogous.length).toBe(2);
      expect(result.triadic.length).toBe(2);
      expect(result.splitComplementary.length).toBe(2);
      expect(result.tetradic.length).toBe(3);
      expect(result.monochromatic.length).toBe(3);
    });

    it('returns an array of lighter color tints when requested', () => {
      // Arrange & Act
      const result = generateTints('#ff0000', 3);

      // Assert
      expect(result.length).toBe(3);
    });

    it('returns an array of darker color shades when requested', () => {
      // Arrange & Act
      const result = generateShades('#ff0000', 3);

      // Assert
      expect(result.length).toBe(3);
    });

    it('returns an array of desaturated color tones when requested', () => {
      // Arrange & Act
      const result = generateTones('#ff0000', 3);

      // Assert
      expect(result.length).toBe(3);
    });
  });

  describe('Print / Gamut checks', () => {
    it('returns true when a normal color is checked against CMYK gamut', () => {
      // Arrange & Act
      const result = isWithinCMYKGamut('#808080');

      // Assert
      expect(result).toBe(true);
    });

    it('returns false when a highly saturated and bright color is checked against CMYK gamut', () => {
      // Arrange & Act
      const result = isWithinCMYKGamut('#00ff00'); // Pure green

      // Assert
      expect(result).toBe(false);
    });

    it('returns true when empty or transparent colors are checked against gamut', () => {
      // Arrange & Act
      const transparentResult = isWithinCMYKGamut('transparent');
      const emptyResult = isWithinCMYKGamut('');
      const rgbaResult = isWithinCMYKGamut('rgba(0,0,0,0)');

      // Assert
      expect(transparentResult).toBe(true);
      expect(emptyResult).toBe(true);
      expect(rgbaResult).toBe(true);
    });

    it('returns a critical warning when highly saturated neons are evaluated', () => {
      // Arrange & Act
      const result = getCMYKGamutWarning('#00ff00');

      // Assert
      expect(result).toBe('critical');
    });

    it('returns null when a safe CMYK color is evaluated', () => {
      // Arrange & Act
      const result = getCMYKGamutWarning('#808080');

      // Assert
      expect(result).toBeNull();
    });

    it('returns a safer printable alternative when an out of gamut neon color is snapped', () => {
      // Arrange & Act
      const safe = getClosestCMYKSafeColor('#00ff00');

      // Assert
      expect(safe).not.toBe('#00ff00');
      expect(isWithinCMYKGamut(safe)).toBe(true);
    });

    it('returns a standard rich black CMYK object when requested', () => {
      // Arrange & Act
      const result = getRichBlack();

      // Assert
      expect(result).toEqual({ c: 60, m: 40, y: 40, k: 100 });
    });

    it('returns a formatted string when a CMYK object is provided', () => {
      // Arrange & Act
      const result = formatCMYK({ c: 10, m: 20, y: 30, k: 40 });

      // Assert
      expect(result).toBe('C:10 M:20 Y:30 K:40');
    });
  });
});
