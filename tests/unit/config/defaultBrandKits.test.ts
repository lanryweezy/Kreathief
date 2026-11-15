import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { DEFAULT_BRAND_KITS, mergeDefaultBrandKits } from '../../../config/defaultBrandKits';
import { useStore } from '../../../store/useStore';
import { BrandKit, Project } from '../../../types';

const createCustomBrandKit = (overrides: Partial<BrandKit> = {}): BrandKit => ({
  ...DEFAULT_BRAND_KITS[0],
  id: 'custom-kit-lagos-1',
  name: 'Lagos Studio Kit',
  isDefault: false,
  ...overrides,
});

describe('mergeDefaultBrandKits', () => {
  it('returns all default brand kits when user kits are undefined or empty', () => {
    const fromUndefined = mergeDefaultBrandKits(undefined);
    const fromEmpty = mergeDefaultBrandKits([]);

    expect(fromUndefined).toHaveLength(DEFAULT_BRAND_KITS.length);
    expect(fromEmpty).toHaveLength(DEFAULT_BRAND_KITS.length);
    expect(fromEmpty.map((k) => k.id)).toEqual(DEFAULT_BRAND_KITS.map((k) => k.id));
  });

  it('preserves custom user brand kits ahead of appended default kits', () => {
    const customKit = createCustomBrandKit();

    const merged = mergeDefaultBrandKits([customKit]);

    expect(merged).toHaveLength(DEFAULT_BRAND_KITS.length + 1);
    expect(merged[0]).toEqual(customKit);
  });

  it('does not duplicate or overwrite a default brand kit customized by the user', () => {
    const overriddenDefault = createCustomBrandKit({
      id: DEFAULT_BRAND_KITS[0].id,
      name: 'Customized Apple Kit',
      colors: ['#111111', '#222222'],
    });

    const merged = mergeDefaultBrandKits([overriddenDefault]);

    const matchingKits = merged.filter((k) => k.id === DEFAULT_BRAND_KITS[0].id);
    expect(merged).toHaveLength(DEFAULT_BRAND_KITS.length);
    expect(matchingKits).toHaveLength(1);
    expect(matchingKits[0].name).toBe('Customized Apple Kit');
    expect(matchingKits[0].colors).toEqual(['#111111', '#222222']);
  });
});

describe('projectSlice.initializeProject brand kit merging', () => {
  beforeEach(() => {
    act(() => {
      useStore.getState().reset();
    });
  });

  it('merges default brand kits when initializing a saved project with an empty brandKits array', () => {
    const legacyProject: Project = {
      id: 'legacy-proj-1',
      name: 'Legacy Project',
      updatedAt: Date.now(),
      state: {
        artboards: [
          {
            id: 'ab-1',
            name: 'Artboard 1',
            width: 1080,
            height: 1080,
            x: 0,
            y: 0,
            layers: [],
          },
        ],
        activeArtboardId: 'ab-1',
        canvasSize: { width: 1080, height: 1080, name: 'Square (IG Post)' },
        brandKits: [],
      },
    };

    act(() => {
      useStore.getState().initializeProject(legacyProject);
    });

    const loadedKits = useStore.getState().brandKits;
    expect(loadedKits).toHaveLength(DEFAULT_BRAND_KITS.length);
    expect(loadedKits.some((k) => k.id === DEFAULT_BRAND_KITS[0].id)).toBe(true);
  });

  it('preserves custom project brand kits while merging missing default brand kits on initializeProject', () => {
    const customKit = createCustomBrandKit();
    const projectWithCustomKit: Project = {
      id: 'proj-with-custom-kit',
      name: 'Custom Brand Project',
      updatedAt: Date.now(),
      state: {
        artboards: [
          {
            id: 'ab-1',
            name: 'Artboard 1',
            width: 1080,
            height: 1080,
            x: 0,
            y: 0,
            layers: [],
          },
        ],
        activeArtboardId: 'ab-1',
        canvasSize: { width: 1080, height: 1080, name: 'Square (IG Post)' },
        brandKits: [customKit],
      },
    };

    act(() => {
      useStore.getState().initializeProject(projectWithCustomKit);
    });

    const loadedKits = useStore.getState().brandKits;
    expect(loadedKits).toHaveLength(DEFAULT_BRAND_KITS.length + 1);
    expect(loadedKits[0]).toEqual(customKit);
  });
});
