import { describe, it, expect } from 'vitest';
import {
  classifyDesignIntent,
  FALLBACK_ARCHETYPES,
  generateMultiLayerDesign,
} from '../../services/aiDesignDirector';
import {
  hexToHSL,
  hslToHex,
  generateAnalogousPalette,
  generateComplementaryPalette,
  generateTriadicPalette,
  generateSplitComplementary,
  getContrastRatio,
  deriveAccessibleTextColor,
  generateBrandAwarePalette,
  generatePalettePromptConstraint,
} from '../../utils/colorHarmony';
import {
  snapToGrid,
  snapCornerRadius,
  enforceTypographyHierarchy,
  addMissingShadows,
  fixOverlappingText,
  ensureBackgroundGradient,
  polishDesignOutput,
} from '../../utils/designPolish';
import { Layer } from '../../types';

describe('AI Design System — Color Harmony', () => {
  it('converts hex to HSL and back with high fidelity', () => {
    const hex = '#3b82f6';
    const hsl = hexToHSL(hex);
    expect(hsl.h).toBeGreaterThanOrEqual(210);
    expect(hsl.h).toBeLessThanOrEqual(225);
    expect(hsl.s).toBeGreaterThanOrEqual(80);
    expect(hsl.l).toBeGreaterThanOrEqual(50);

    const reconstructed = hslToHex(hsl.h, hsl.s, hsl.l);
    expect(reconstructed).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('generates harmonic palettes correctly', () => {
    const base = '#7c3aed'; // Purple
    const analogous = generateAnalogousPalette(base, 5);
    expect(analogous.length).toBe(5);

    const complementary = generateComplementaryPalette(base);
    expect(complementary.length).toBe(2);
    expect(complementary[0]).toBe(base);

    const triadic = generateTriadicPalette(base);
    expect(triadic.length).toBe(3);

    const splitComp = generateSplitComplementary(base);
    expect(splitComp.length).toBe(3);
  });

  it('derives accessible text colors via WCAG contrast', () => {
    expect(deriveAccessibleTextColor('#ffffff')).toBe('#000000');
    expect(deriveAccessibleTextColor('#000000')).toBe('#ffffff');
    expect(deriveAccessibleTextColor('#0a0a14')).toBe('#ffffff');
    expect(deriveAccessibleTextColor('#fef9c3')).toBe('#000000');

    const highContrast = getContrastRatio('#ffffff', '#000000');
    expect(highContrast).toBeCloseTo(21, 0);

    const lowContrast = getContrastRatio('#888888', '#888888');
    expect(lowContrast).toBeCloseTo(1, 1);
  });

  it('builds brand-aware palettes and prompt constraints', () => {
    const palette = generateBrandAwarePalette(['#ff007f', '#00f0ff']);
    expect(palette.primary).toBe('#ff007f');
    expect(palette.secondary).toBe('#00f0ff');
    expect(palette.background).toBeTruthy();

    const constraint = generatePalettePromptConstraint('Neon cyberpunk gaming drop');
    expect(constraint).toContain('COLOR PALETTE CONSTRAINT');
    expect(constraint).toContain('WCAG AA');
  });
});

describe('AI Design System — Post-Generation Polish', () => {
  it('snaps coordinates and dimensions to 4px grid', () => {
    expect(snapToGrid(17)).toBe(16);
    expect(snapToGrid(18)).toBe(20);
    expect(snapToGrid(24)).toBe(24);
  });

  it('snaps corner radius to design-standard values', () => {
    expect(snapCornerRadius(3)).toBe(4);
    expect(snapCornerRadius(10)).toBe(8); // 8 or 12, distance to 8 is 2, to 12 is 2
    expect(snapCornerRadius(25)).toBe(24);
    expect(snapCornerRadius(1000)).toBe(999);
  });

  it('enforces typographic hierarchy so headline is boldest', () => {
    const layers: Layer[] = [
      { id: '1', type: 'text', text: 'Small subtitle', fontSize: 16, fontWeight: '400', x: 0, y: 0, width: 200, height: 30 } as any,
      { id: '2', type: 'text', text: 'Massive headline', fontSize: 64, fontWeight: '400', x: 0, y: 50, width: 600, height: 100 } as any,
    ];

    const polished = enforceTypographyHierarchy(layers);
    const headline = polished.find((l) => l.id === '2');
    expect((headline as any).fontWeight).toBe('700');
  });

  it('adds missing shadows to interactive buttons and cards', () => {
    const layers: Layer[] = [
      { id: '1', type: 'rectangle', name: 'CTA Button', x: 100, y: 500, width: 200, height: 50 } as any,
      { id: '2', type: 'rectangle', name: 'Background Frame', x: 0, y: 0, width: 1080, height: 1080 } as any,
    ];

    const polished = addMissingShadows(layers);
    const button = polished.find((l) => l.id === '1');
    expect((button as any).shadow).toBeDefined();
    expect((button as any).shadow.offsetY).toBe(4);
  });

  it('resolves vertical text collisions', () => {
    const layers: Layer[] = [
      { id: '1', type: 'text', text: 'Line One', fontSize: 40, y: 100, height: 50, x: 50, width: 400 } as any,
      { id: '2', type: 'text', text: 'Line Two Colliding', fontSize: 20, y: 120, height: 30, x: 50, width: 400 } as any,
    ];

    const fixed = fixOverlappingText(layers, 1080);
    const lineTwo = fixed.find((l) => l.id === '2');
    expect(lineTwo?.y).toBeGreaterThanOrEqual(160); // 100 + 50 + 8
  });

  it('runs complete polish pipeline on an artboard result', () => {
    const raw = FALLBACK_ARCHETYPES.saas(1080, 1080, 'Test AI App');
    const polished = polishDesignOutput(raw);

    expect(polished.layers.length).toBeGreaterThanOrEqual(7);
    expect(polished.backgroundGradient).toBeDefined();
    polished.layers.forEach((l) => {
      expect(l.x % 4).toBe(0);
      expect(l.y % 4).toBe(0);
    });
  });
});

describe('AI Design System — Semantic Classifier & 12 Archetypes', () => {
  it('classifies intents with weighted semantic scoring', () => {
    expect(classifyDesignIntent('crossfit high intensity gym workout')).toBe('fitness');
    expect(classifyDesignIntent('haute couture autumn fashion collection')).toBe('fashion');
    expect(classifyDesignIntent('modern penthouse luxury apartment listing')).toBe('realEstate');
    expect(classifyDesignIntent('techno music live festival tickets')).toBe('event');
    expect(classifyDesignIntent('online masterclass python bootcamp course')).toBe('education');
    expect(classifyDesignIntent('black friday 50% discount flash sale promo')).toBe('ecommerce');
    expect(classifyDesignIntent('neon cyber glitch futuristic game')).toBe('cyberpunk');
    expect(classifyDesignIntent('cloud analytics saas developer platform')).toBe('saas');
    expect(classifyDesignIntent('slow smoked wagyu steakhouse menu')).toBe('food');
    expect(classifyDesignIntent('lagos afrobeat heritage festival brand')).toBe('africanMarket');
    expect(classifyDesignIntent('minimalist scandinavian architecture journal')).toBe('editorial');
    expect(classifyDesignIntent('swiss luxury 24k gold skincare serum')).toBe('luxury');
  });

  it('all 12 archetypes generate rich, compliant multi-layer designs', () => {
    const archetypes = [
      'cyberpunk', 'editorial', 'saas', 'luxury', 'food', 'africanMarket',
      'fitness', 'fashion', 'realEstate', 'event', 'education', 'ecommerce',
    ];

    expect(Object.keys(FALLBACK_ARCHETYPES).length).toBe(12);

    archetypes.forEach((archKey) => {
      const fn = FALLBACK_ARCHETYPES[archKey];
      expect(fn).toBeDefined();

      const result = fn(1080, 1080, `Creative brief for ${archKey}`);
      expect(result.title).toBeTruthy();
      expect(result.layers.length).toBeGreaterThanOrEqual(7);
      expect(result.backgroundColor).toBeTruthy();

      const textLayers = result.layers.filter((l) => l.type === 'text');
      const shapeLayers = result.layers.filter((l) => l.type === 'rect' || l.type === 'rectangle' || l.type === 'ellipse' || l.type === 'circle');

      expect(textLayers.length).toBeGreaterThanOrEqual(3);
      expect(shapeLayers.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('generateMultiLayerDesign uses classifier and applies post-polish', async () => {
    const result = await generateMultiLayerDesign('Epic marathon workout club', 1080, 1080);
    expect(result).toBeDefined();
    expect(result.layers.length).toBeGreaterThanOrEqual(8);

    // Verify subpixel grid alignment from polishDesignOutput
    result.layers.forEach((l) => {
      expect(l.x % 4).toBe(0);
      expect(l.y % 4).toBe(0);
    });
  });
});
