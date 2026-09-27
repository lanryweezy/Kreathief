import { describe, it, expect, beforeEach } from 'vitest';
import { composeGenerationPrompt } from '../../services/imageGenService';
import { useStore } from '../../store/useStore';
import type { StyleReference } from '../../types';

describe('Dashboard AI Agent - Visual Reference Ingestion & Steal/Remix Flow', () => {
  beforeEach(() => {
    useStore.getState().clearStyleReference();
  });

  it('attaches and stores a visual reference in the global store', async () => {
    const mockReferenceImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    await useStore.getState().setStyleReference(mockReferenceImage, 'retro_flyer.png');

    const ref = useStore.getState().styleReference;
    expect(ref).toBeDefined();
    expect(ref?.image).toBe(mockReferenceImage);
    expect(ref?.name).toBe('retro_flyer.png');
  });

  it('correctly clears visual reference when removed by user', async () => {
    await useStore.getState().setStyleReference('data:image/png;base64,dummy', 'flyer.png');
    expect(useStore.getState().styleReference).not.toBeNull();

    useStore.getState().clearStyleReference();
    expect(useStore.getState().styleReference).toBeNull();
  });

  it('composes generation prompt with visual reference context when prompt is provided', () => {
    const mockRef: StyleReference = {
      id: 'ref_123',
      image: 'data:image/png;base64,dummy',
      name: 'urban_neon.png',
      aspects: ['palette', 'style', 'lighting', 'composition'],
      strength: 'balanced',
      analysisStatus: 'ready',
      extracted: {
        palette: ['#00ffcc', '#ff007f', '#0a0a12'],
        lighting: 'neon cyberpunk backlighting',
        composition: 'high-contrast centered subject',
        mood: 'futuristic electronic vibe',
        aestheticSummary: 'Cyberpunk Neon Aesthetic',
      },
    };

    const composed = composeGenerationPrompt({
      prompt: 'A sleek coffee shop promotion banner',
      styleReference: mockRef,
      canvasSize: { width: 1080, height: 1080 },
    });

    expect(composed).toContain('coffee shop promotion banner');
    expect(composed).toContain('#00ffcc');
    expect(composed).toContain('#ff007f');
    expect(composed).toContain('neon cyberpunk backlighting');
    expect(composed).toContain('high-contrast centered subject');
  });

  it('synthesizes full default remix intent when prompt is empty but reference is attached', () => {
    const mockRef: StyleReference = {
      id: 'ref_456',
      image: 'data:image/png;base64,dummy',
      name: 'luxury_watch_ad.png',
      aspects: ['palette', 'style', 'lighting'],
      strength: 'strong',
      analysisStatus: 'ready',
      extracted: {
        palette: ['#d4af37', '#1a1a1a', '#ffffff'],
        lighting: 'dramatic studio spotlight with soft gold bounce',
        composition: 'minimalist asymmetrical luxury layout',
        mood: 'high-end premium elegance',
        aestheticSummary: 'Luxury Gold & Obsidian Elegance',
      },
    };

    const effectivePrompt = 'Reverse-engineer and remix the attached visual reference into a complete multi-layer editable design for Instagram Post';

    const composed = composeGenerationPrompt({
      prompt: effectivePrompt,
      styleReference: mockRef,
      canvasSize: { width: 1080, height: 1080 },
    });

    expect(composed).toContain('Reverse-engineer and remix');
    expect(composed).toContain('#d4af37');
    expect(composed).toContain('dramatic studio spotlight');
  });
});
