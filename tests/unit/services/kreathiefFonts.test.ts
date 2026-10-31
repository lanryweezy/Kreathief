import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { FONT_CATEGORIES, FONT_FAMILIES } from '../../../constants';
import { AVAILABLE_FONTS, loadFont } from '../../../services/FontLoader';
import { fontManager } from '../../../services/fontManager';
import { TextLayer } from '../../../types';

const EXPECTED_KREATHIEF_FONTS = [
  'Kreathief001',
  'Kreathief002',
  'Kreathief003',
  'Kreathief004',
  'Kreathief005',
  'Kreathief006',
  'Kreathief007',
  'Kreathief009',
  'Kreathief010',
  'Kreathief014',
  'Kreathief015',
  'Kreathief016',
  'Kreathief017',
  'Kreathief018',
  'Kreathief019',
];

describe('Kreathief Brand Fonts Integration', () => {
  beforeEach(() => {
    fontManager.reset();
  });

  it('registers all Kreathief fonts in FONT_CATEGORIES', () => {
    const brandFonts = FONT_CATEGORIES['Kreathief Brand'];
    expect(brandFonts).toBeDefined();
    EXPECTED_KREATHIEF_FONTS.forEach((font) => {
      expect(brandFonts).toContain(font);
    });
  });

  it('includes all Kreathief fonts in FONT_FAMILIES and AVAILABLE_FONTS', () => {
    EXPECTED_KREATHIEF_FONTS.forEach((font) => {
      expect(FONT_FAMILIES).toContain(font);
      expect(AVAILABLE_FONTS).toContain(font);
    });
  });

  it('verifies every Kreathief font file exists in public/fonts/', () => {
    const fontsDir = path.resolve(__dirname, '../../../public/fonts');
    EXPECTED_KREATHIEF_FONTS.forEach((font) => {
      const filePath = path.join(fontsDir, `${font}.ttf`);
      expect(fs.existsSync(filePath)).toBe(true);
      const stat = fs.statSync(filePath);
      expect(stat.size).toBeGreaterThan(1000);
    });
  });

  it('verifies all Kreathief fonts are defined in public/styles/fonts.css', () => {
    const cssPath = path.resolve(__dirname, '../../../public/styles/fonts.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    EXPECTED_KREATHIEF_FONTS.forEach((font) => {
      expect(cssContent).toContain(`font-family: '${font}'`);
      expect(cssContent).toContain(`url('../fonts/${font}.ttf')`);
    });
  });

  it('verifies all Kreathief fonts are defined in public/fonts/fonts.css', () => {
    const cssPath = path.resolve(__dirname, '../../../public/fonts/fonts.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    EXPECTED_KREATHIEF_FONTS.forEach((font) => {
      expect(cssContent).toContain(`font-family: '${font}'`);
      expect(cssContent).toContain(`url('/fonts/${font}.ttf')`);
    });
  });

  it('loads Kreathief fonts via fontManager without attempting Google Fonts requests', async () => {
    const layers: TextLayer[] = EXPECTED_KREATHIEF_FONTS.map((font, idx) => ({
      id: `text-layer-${idx}`,
      type: 'text',
      x: 0,
      y: 0,
      width: 200,
      height: 50,
      text: `Preview for ${font}`,
      fontFamily: font,
      fontSize: 24,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    }));

    // Should resolve cleanly without timeout or error
    await expect(fontManager.loadFontsForLayers(layers, 500)).resolves.toBeUndefined();
  });

  it('loads a Kreathief font via loadFont helper', async () => {
    const result = await loadFont('Kreathief014');
    expect(result).toBe(true);
  });
});
