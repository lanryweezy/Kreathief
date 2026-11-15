import { describe, it, expect } from 'vitest';
import { resolveTextShadow, applyTextShadow } from '../../../utils/textRendering';

describe('textRendering - resolveTextShadow & applyTextShadow', () => {
  it('returns null for layers without shadows or style effects', () => {
    expect(resolveTextShadow(null)).toBeNull();
    expect(resolveTextShadow({ type: 'text', text: 'Hello' })).toBeNull();
    expect(resolveTextShadow({ type: 'text', styleType: 'normal' })).toBeNull();
  });

  it('resolves explicit textShadow correctly', () => {
    const layer = {
      type: 'text',
      textShadow: { offsetX: 3, offsetY: 5, blur: 10, color: '#ff0000' },
    };
    const shadow = resolveTextShadow(layer);
    expect(shadow).toEqual({
      offsetX: 3,
      offsetY: 5,
      blur: 10,
      color: '#ff0000',
    });
  });

  it('resolves neon glow using spread and intensity', () => {
    const layer = {
      type: 'text',
      neonGlow: { enabled: true, color: '#7d2ae8', spread: 20, intensity: 80, flicker: false },
    };
    const shadow = resolveTextShadow(layer);
    expect(shadow).not.toBeNull();
    expect(shadow?.offsetX).toBe(0);
    expect(shadow?.offsetY).toBe(0);
    expect(shadow?.blur).toBe(20);
    expect(shadow?.color).toContain('rgba(');
  });

  it('resolves lift styleType to elevated shadow', () => {
    const layer = { type: 'text', styleType: 'lift', depth: 6 };
    const shadow = resolveTextShadow(layer);
    expect(shadow).toEqual({
      offsetX: 0,
      offsetY: 6,
      blur: 12,
      color: 'rgba(0,0,0,0.45)',
    });
  });

  it('resolves echo styleType to hard shadow offset', () => {
    const layer = { type: 'text', styleType: 'echo', depth: 4, depthColor: '#000000' };
    const shadow = resolveTextShadow(layer);
    expect(shadow?.offsetX).toBe(4);
    expect(shadow?.offsetY).toBe(4);
    expect(shadow?.blur).toBe(0);
  });

  it('applies shadow to canvas context and clears when no shadow', () => {
    const fakeCtx = {
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowBlur: 0,
      shadowColor: 'transparent',
    } as unknown as CanvasRenderingContext2D;

    applyTextShadow(fakeCtx, { type: 'text', styleType: 'lift', depth: 4 });
    expect(fakeCtx.shadowOffsetY).toBe(4);
    expect(fakeCtx.shadowBlur).toBe(8);
    expect(fakeCtx.shadowColor).toBe('rgba(0,0,0,0.45)');

    applyTextShadow(fakeCtx, { type: 'text', styleType: 'normal' });
    expect(fakeCtx.shadowOffsetX).toBe(0);
    expect(fakeCtx.shadowOffsetY).toBe(0);
    expect(fakeCtx.shadowBlur).toBe(0);
    expect(fakeCtx.shadowColor).toBe('transparent');
  });
});
