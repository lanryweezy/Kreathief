import { describe, it, expect } from 'vitest';
import {
  PLACEMENT_PRESETS,
  getPlacementPreset,
  getPresetsForZones,
} from '../../services/mockupPlacementPresets';

describe('MockupPlacementPresets', () => {
  it('should have 8 placement presets', () => {
    expect(PLACEMENT_PRESETS).toHaveLength(8);
  });

  it('should return a preset by ID', () => {
    const preset = getPlacementPreset('center_hero');
    expect(preset).toBeDefined();
    expect(preset?.placement.width).toBe(40);
  });

  it('left_chest preset should be small (under 20% width)', () => {
    const preset = getPlacementPreset('left_chest');
    expect(preset?.placement.width).toBeLessThan(20);
  });

  it('oversized_streetwear preset should be large (over 50% width)', () => {
    const preset = getPlacementPreset('oversized_streetwear');
    expect(preset?.placement.width).toBeGreaterThan(50);
  });

  it('full_device should use source-over blend mode', () => {
    const preset = getPlacementPreset('full_device');
    expect(preset?.placement.blendMode).toBe('source-over');
  });

  it('should filter presets by zone IDs', () => {
    const zones = getPresetsForZones(['left_chest', 'center_hero', 'oversized_streetwear']);
    expect(zones).toHaveLength(3);
    expect(zones.map((z) => z.id)).toContain('left_chest');
  });

  it('all presets should have required placement fields', () => {
    PLACEMENT_PRESETS.forEach((p) => {
      expect(typeof p.placement.top).toBe('number');
      expect(typeof p.placement.left).toBe('number');
      expect(typeof p.placement.width).toBe('number');
      expect(p.placement.blendMode).toBeDefined();
    });
  });
});
