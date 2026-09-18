import { describe, it, expect, vi } from 'vitest';
import {
  buildSemanticHybridCompositionSync,
  buildSemanticHybridComposition,
  VECTOR_ACCENTS,
} from '../../services/semanticCompositionEngine';
import { buildCompositionForArchetype } from '../../services/designCompositionEngine';
import * as heroCutoutPipeline from '../../services/heroCutoutPipeline';

describe('semanticCompositionEngine', () => {
  it('builds a zero-collision semantic hybrid composition synchronously', () => {
    const res = buildSemanticHybridCompositionSync({
      prompt: 'Cloud AI Platform',
      width: 1200,
      height: 630,
      archetype: 'saas',
    });

    expect(res).toBeDefined();
    expect(res.width).toBe(1200);
    expect(res.height).toBe(630);
    expect(res.layers.length).toBeGreaterThanOrEqual(8);

    // Verify key layers exist
    const bg = res.layers.find((l) => l.name === 'Canvas Background');
    const hero = res.layers.find((l) => l.name === 'Hero Photograph' || l.name === 'Hero Subject Cutout');
    const headline = res.layers.find((l) => l.name === 'Primary Headline');
    const subhead = res.layers.find((l) => l.name === 'Descriptive Subtitle');
    const cta = res.layers.find((l) => l.name === 'CTA Button Background');
    const burst = res.layers.find((l) => l.name === '16-Point Burst Badge');

    expect(bg).toBeDefined();
    expect(hero).toBeDefined();
    expect(headline).toBeDefined();
    expect(subhead).toBeDefined();
    expect(cta).toBeDefined();
    expect(burst).toBeDefined();

    // Verify vector path is populated for burst badge
    expect((burst as any).pathData).toBe(VECTOR_ACCENTS.BURST_16.pathData);

    // Verify vertical layout bounds: headline top < subhead top < cta top
    expect((headline as any).y).toBeLessThan((subhead as any).y);
    expect((subhead as any).y).toBeLessThan((cta as any).y);
  });

  it('assembles transparent hero cutout when getHeroCutout succeeds', async () => {
    vi.spyOn(heroCutoutPipeline, 'getHeroCutout').mockResolvedValue({
      src: 'data:image/png;base64,TEST_TRANSPARENT_HERO_CUTOUT_12345678901234567890',
      isCutout: true,
    });

    const res = await buildSemanticHybridComposition({
      prompt: 'Next-Gen Performance Fitness Gear',
      width: 1080,
      height: 1080,
      archetype: 'fitness',
      enableCutout: true,
    });

    expect(res).toBeDefined();
    const heroCutout = res.layers.find((l) => l.name === 'Hero Subject Cutout');
    expect(heroCutout).toBeDefined();
    expect((heroCutout as any).src).toContain('TEST_TRANSPARENT_HERO_CUTOUT');
  });

  it('handles portrait layout adaptation without negative coords or overlap', () => {
    const res = buildSemanticHybridCompositionSync({
      prompt: 'Minimalist Luxury Watch',
      width: 1080,
      height: 1920,
      archetype: 'luxury',
    });

    expect(res.width).toBe(1080);
    expect(res.height).toBe(1920);

    const headline = res.layers.find((l) => l.name === 'Primary Headline');
    const hero = res.layers.find((l) => l.name === 'Hero Photograph' || l.name === 'Hero Subject Cutout');
    const cta = res.layers.find((l) => l.name === 'CTA Button Background');

    expect((hero as any).y).toBeGreaterThan(0);
    expect((headline as any).y).toBeGreaterThan((hero as any).y);
    expect((cta as any).y).toBeGreaterThan((headline as any).y);
  });

  it('integrates with buildCompositionForArchetype with semanticHybrid preference', () => {
    const res = buildCompositionForArchetype('saas', 1200, 630, 'Enterprise Observability', 'semanticHybrid');

    expect(res).toBeDefined();
    const burst = res.layers.find((l) => l.name === '16-Point Burst Badge');
    expect(burst).toBeDefined();
  });
});
