import { describe, it, expect } from 'vitest';
import { generateMultiLayerDesign } from '../../services/aiDesignDirector';

describe('aiDesignDirector', () => {
  it('generates multi-layer cyberpunk artboard with proper typography hierarchy and badges', async () => {
    const result = await generateMultiLayerDesign('Modern Cyberpunk Neon Sale Banner for Instagram', 1080, 1080);
    expect(result).toBeDefined();
    expect(result.width).toBe(1080);
    expect(result.height).toBe(1080);
    expect(result.layers.length).toBeGreaterThanOrEqual(5);

    const hasText = result.layers.some((l) => l.type === 'text');
    const hasShape = result.layers.some((l) => l.type === 'rect' || l.type === 'ellipse');
    expect(hasText).toBe(true);
    expect(hasShape).toBe(true);
  });

  it('generates multi-layer editorial artboard for minimalism prompts', async () => {
    const result = await generateMultiLayerDesign('Minimalist Architecture Magazine Cover', 1200, 800);
    expect(result).toBeDefined();
    expect(result.width).toBe(1200);
    expect(result.height).toBe(800);
    expect(result.layers.length).toBeGreaterThanOrEqual(4);
  });

  it('generates SaaS product header for cloud/software prompts', async () => {
    const result = await generateMultiLayerDesign('NextGen AI Cloud SaaS Platform Launch', 1920, 1080);
    expect(result).toBeDefined();
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
    expect(result.layers.length).toBeGreaterThanOrEqual(5);
  });
});
