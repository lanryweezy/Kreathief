import { describe, it, expect } from 'vitest';
import {
  applyStyleTransfer,
  shuffleStyleVariations,
  getContrastRatio,
  ensureAccessibleContrast,
} from '../../services/styleTransferEngine';
import { DESIGN_STYLE_DATABASE } from '../../services/designStyleDatabase';
import { Artboard, Layer, TextLayer } from '../../types';

describe('Magic Style Transfer & Aesthetic Movement Engine', () => {
  describe('WCAG Contrast & Luminance Engine', () => {
    it('computes correct contrast ratios for pure black and pure white', () => {
      const blackOnWhite = getContrastRatio('#000000', '#ffffff');
      expect(blackOnWhite).toBeCloseTo(21, 0);

      const sameColor = getContrastRatio('#ffffff', '#ffffff');
      expect(sameColor).toBeCloseTo(1, 0);
    });

    it('auto-corrects low contrast text to pass WCAG standards', () => {
      // Very low contrast dark gray on black background
      const corrected = ensureAccessibleContrast('#1a1a1a', '#000000', 4.5);
      const ratio = getContrastRatio(corrected, '#000000');
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('applyStyleTransfer', () => {
    const testArtboard: Artboard = {
      id: 'ab_test',
      name: 'Test Poster',
      width: 1080,
      height: 1080,
      x: 0,
      y: 0,
      backgroundColor: '#ffffff',
      layers: [
        {
          id: 'bg',
          type: 'rectangle',
          name: 'Background',
          x: 0,
          y: 0,
          width: 1080,
          height: 1080,
          color: '#ffffff',
        } as any,
        {
          id: 'head',
          type: 'text',
          name: 'Main Headline',
          text: 'Design of the Future',
          fontSize: 60,
          fontFamily: 'Inter',
          x: 100,
          y: 200,
          width: 880,
          height: 100,
        } as any,
        {
          id: 'sub',
          type: 'text',
          name: 'Subheadline',
          text: 'An exploration of digital creativity and AI aesthetics.',
          fontSize: 22,
          fontFamily: 'Inter',
          x: 100,
          y: 340,
          width: 880,
          height: 60,
        } as any,
        {
          id: 'btn',
          type: 'rectangle',
          name: 'CTA Button',
          x: 390,
          y: 800,
          width: 300,
          height: 60,
          color: '#3b82f6',
        } as any,
        {
          id: 'btn_txt',
          type: 'text',
          name: 'CTA Label',
          text: 'EXPLORE NOW →',
          fontSize: 18,
          x: 410,
          y: 820,
          width: 260,
          height: 24,
        } as any,
      ],
    };

    it('applies Neo-Brutalism style with 0px corner radius and thick dark borders', () => {
      const result = applyStyleTransfer(testArtboard, 'brutalism');
      const styleMeta = DESIGN_STYLE_DATABASE.brutalism;

      expect(result.backgroundColor).toBe(styleMeta.palette.background);

      const headline = result.layers.find((l) => l.name === 'Main Headline') as TextLayer;
      expect(headline.fontFamily).toBe(styleMeta.typography.headlineFont);

      const btn = result.layers.find((l) => l.name === 'CTA Button') as any;
      expect(btn.cornerRadius).toBe(0);
      expect(btn.stroke?.width).toBeGreaterThanOrEqual(2);
    });

    it('applies Synthwave retro neon style with glowing headline effects', () => {
      const result = applyStyleTransfer(testArtboard, 'synthwave');
      const styleMeta = DESIGN_STYLE_DATABASE.synthwave;

      expect(result.backgroundColor).toBe(styleMeta.palette.background);

      const headline = result.layers.find((l) => l.name === 'Main Headline') as TextLayer;
      expect(headline.neonGlow?.enabled).toBe(true);
      expect(headline.neonGlow?.color).toBe(styleMeta.palette.primary);
    });

    it('applies Luxury Typography movement with refined serif font pairing and gold accents', () => {
      const result = applyStyleTransfer(testArtboard, 'luxuryTypography');
      const styleMeta = DESIGN_STYLE_DATABASE.luxuryTypography;

      expect(result.backgroundColor).toBe(styleMeta.palette.background);

      const headline = result.layers.find((l) => l.name === 'Main Headline') as TextLayer;
      expect(headline.fontFamily).toBe(styleMeta.typography.headlineFont);
    });
  });

  describe('shuffleStyleVariations', () => {
    const baseArtboard: Artboard = {
      id: 'ab_shuffle',
      name: 'Shuffled Poster',
      width: 1080,
      height: 1080,
      x: 0,
      y: 0,
      backgroundColor: '#090a15',
      layers: [
        {
          id: 'head',
          type: 'text',
          name: 'Headline',
          text: 'VAPORWAVE DRIFT',
          fontSize: 54,
          x: 100,
          y: 200,
          width: 880,
          height: 80,
        } as any,
        {
          id: 'btn',
          type: 'rectangle',
          name: 'CTA Button',
          x: 390,
          y: 800,
          width: 300,
          height: 60,
          color: '#ec4899',
        } as any,
      ],
    };

    it('generates harmonic palette permutations while preserving layer count and structure', () => {
      const variation = shuffleStyleVariations(baseArtboard, 'synthwave');

      expect(variation.layers).toHaveLength(baseArtboard.layers.length);
      expect(variation.name).toContain('Harmonic Variation');
      expect(variation.backgroundColor).toBeTruthy();
    });
  });
});
