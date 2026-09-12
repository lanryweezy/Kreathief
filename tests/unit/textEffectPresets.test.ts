import { describe, it, expect } from 'vitest';
import {
  TEXT_EFFECT_PRESETS,
  TEXT_EFFECT_PRESET_LIST,
  getPresetsByCategory,
  applyTextEffectPreset,
} from '../../services/textEffectPresets';
import { TextLayer } from '../../types';

describe('TextEffectPresets Engine', () => {
  it('should have exactly 10 signature design presets', () => {
    expect(TEXT_EFFECT_PRESET_LIST).toHaveLength(10);
    expect(Object.keys(TEXT_EFFECT_PRESETS)).toHaveLength(10);
  });

  it('should contain all signature preset IDs', () => {
    const expectedIds = [
      'liquidChrome',
      'comicBoom',
      'neoBrutalistBlock',
      'synthwaveSunset',
      'goldFoil',
      'cyberpunkGlitch',
      'risographHalftone',
      'psychedelicTrippy',
      'gothicBloodline',
      'minimalHollow',
    ];

    expectedIds.forEach((id) => {
      expect(TEXT_EFFECT_PRESETS[id]).toBeDefined();
      expect(TEXT_EFFECT_PRESETS[id].id).toBe(id);
      expect(TEXT_EFFECT_PRESETS[id].name).toBeTruthy();
      expect(TEXT_EFFECT_PRESETS[id].tagline).toBeTruthy();
      expect(TEXT_EFFECT_PRESETS[id].previewColor).toBeTruthy();
      expect(TEXT_EFFECT_PRESETS[id].previewBg).toBeTruthy();
      expect(TEXT_EFFECT_PRESETS[id].changes).toBeDefined();
    });
  });

  it('should filter presets by category properly', () => {
    const all = getPresetsByCategory('all');
    expect(all).toHaveLength(10);

    const popular = getPresetsByCategory('popular');
    expect(popular.length).toBeGreaterThan(0);
    popular.forEach((p) => expect(p.category).toBe('popular'));

    const retro = getPresetsByCategory('retro');
    expect(retro.length).toBeGreaterThan(0);
    retro.forEach((p) => expect(p.category).toBe('retro'));

    const futuristic = getPresetsByCategory('futuristic');
    expect(futuristic.length).toBeGreaterThan(0);
    futuristic.forEach((p) => expect(p.category).toBe('futuristic'));

    const luxury = getPresetsByCategory('luxury');
    expect(luxury.length).toBeGreaterThan(0);
    luxury.forEach((p) => expect(p.category).toBe('luxury'));
  });

  it('should apply liquidChrome preset with spec silver gradient and cyan neon glow', () => {
    const baseLayer: TextLayer = {
      id: 'layer-text-1',
      type: 'text',
      name: 'Heading',
      text: 'CYBER',
      x: 100,
      y: 100,
      width: 400,
      height: 100,
      fontSize: 64,
      fontFamily: 'Inter',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'center',
      color: '#ffffff',
      opacity: 1,
      rotation: 0,
      locked: false,
      visible: true,
      zIndex: 1,
    };

    const changes = applyTextEffectPreset(baseLayer, 'liquidChrome');
    expect(changes.color).toContain('linear-gradient');
    expect(changes.textStroke?.color).toBe('#38bdf8');
    expect(changes.neonGlow?.enabled).toBe(true);
    expect(changes.neonGlow?.color).toBe('#38bdf8');
    expect(changes.warpStyle).toBe('wave');
    expect(changes.curve).toBe(12);
  });

  it('should apply comicBoom preset with heavy comic offset shadow and uppercase', () => {
    const baseLayer: TextLayer = {
      id: 'layer-text-2',
      type: 'text',
      name: 'Comic Text',
      text: 'KAPOW',
      x: 50,
      y: 50,
      width: 300,
      height: 80,
      fontSize: 50,
      fontFamily: 'Inter',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'center',
      color: '#ffffff',
      opacity: 1,
      rotation: 0,
      locked: false,
      visible: true,
      zIndex: 1,
    };

    const changes = applyTextEffectPreset(baseLayer, 'comicBoom');
    expect(changes.color).toBe('#facc15');
    expect(changes.textShadow?.offsetX).toBe(5);
    expect(changes.textShadow?.offsetY).toBe(5);
    expect(changes.textShadow?.blur).toBe(0);
    expect(changes.textStroke?.width).toBe(2.5);
    expect(changes.warpStyle).toBe('arc');
    expect(changes.curve).toBe(24);
  });

  it('should return empty object for non-existent preset', () => {
    const baseLayer = { id: 'test' } as TextLayer;
    const changes = applyTextEffectPreset(baseLayer, 'nonExistentPresetId');
    expect(changes).toEqual({});
  });
});
