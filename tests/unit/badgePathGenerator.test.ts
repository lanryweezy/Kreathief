import { describe, it, expect } from 'vitest';
import {
  BADGE_PRESETS,
  generateBadgeLayers,
  BadgeConfig,
} from '../../services/badgePathGenerator';
import { TextLayer, ShapeLayer } from '../../types';

describe('BadgePathGenerator', () => {
  it('should have 4 curated badge presets', () => {
    expect(BADGE_PRESETS).toHaveLength(4);
  });

  it('should generate 6 coordinated multi-layer components per badge', () => {
    const stamp = BADGE_PRESETS[0];
    const layers = generateBadgeLayers(stamp, 1080, 1080);

    expect(layers).toHaveLength(6);

    // Outer base
    const base = layers[0] as ShapeLayer;
    expect(base.type).toBe('circle');
    expect(base.stroke?.width).toBeGreaterThan(0);
    expect(base.color).toBe(stamp.secondaryColor);

    // Inner ring
    const ring = layers[1] as ShapeLayer;
    expect(ring.type).toBe('circle');
    expect(ring.color).toBe('transparent');

    // Center core
    const core = layers[2] as ShapeLayer;
    expect(core.type).toBe('circle');

    // Top arc text
    const topText = layers[3] as TextLayer;
    expect(topText.type).toBe('text');
    expect(topText.text).toBe(stamp.topText);
    expect(topText.warpStyle).toBe('arc');
    expect(topText.curve).toBe(-24);

    // Center hero text
    const centerText = layers[4] as TextLayer;
    expect(centerText.type).toBe('text');
    expect(centerText.text).toBe(stamp.centerText);
    expect(centerText.fontWeight).toBe('900');

    // Bottom arc text
    const bottomText = layers[5] as TextLayer;
    expect(bottomText.type).toBe('text');
    expect(bottomText.text).toBe(stamp.bottomText);
    expect(bottomText.warpStyle).toBe('arc');
    expect(bottomText.curve).toBe(24);
  });

  it('should center the badge proportionally on any canvas dimensions', () => {
    const customBadge: BadgeConfig = {
      id: 'customTest',
      name: 'Custom Test',
      category: 'vintage',
      icon: '⭐',
      description: 'Test badge',
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      accentColor: '#cccccc',
      topText: 'TOP ARC',
      centerText: 'CENTER',
      bottomText: 'BOTTOM ARC',
      fontFamily: 'Inter',
    };

    const layers = generateBadgeLayers(customBadge, 1920, 1080);
    const base = layers[0];
    // Badge size is 1080 * 0.52 = 561.6
    expect(base.width).toBeCloseTo(1080 * 0.52, 0);
    // Center X should be centered within 1920
    expect(base.x).toBeCloseTo((1920 - 1080 * 0.52) / 2, 0);
  });
});
