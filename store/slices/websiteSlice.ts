import { StateCreator } from 'zustand';
import type { StoreState } from '../useStore';
import { SiteSettings } from '../../types';

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  name: 'My Website',
  primaryColor: '#6366f1',
  fontFamily: 'Inter',
  defaultMetaDescription: 'Built with Kreathief',
  navStyle: 'solid',
};

export interface WebsiteSlice {
  websiteMode: boolean;
  siteSettings: SiteSettings;
  setWebsiteMode: (enabled: boolean) => void;
  updateSiteSettings: (partial: Partial<SiteSettings>) => void;
  addWebsitePage: (name?: string) => void;
  setPageSlug: (artboardId: string, slug: string) => void;
}

export const createWebsiteSlice: StateCreator<StoreState, [], [], Partial<WebsiteSlice>> = (
  set,
  get
) => ({
  websiteMode: false,
  siteSettings: { ...DEFAULT_SITE_SETTINGS },

  setWebsiteMode: (enabled) => set({ websiteMode: enabled }),

  updateSiteSettings: (partial) =>
    set((state: any) => ({
      siteSettings: { ...state.siteSettings, ...partial },
    })),

  addWebsitePage: (name = 'New Page') => {
    const state = get();
    const pages = (state.artboards || []).filter((a: any) => a.websitePage);
    const slug =
      '/' +
      name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    (state as any).addArtboard?.(name, 1440, 900);

    // After adding, mark the newest artboard as a website page
    setTimeout(() => {
      const newState = get();
      const newest = newState.artboards[newState.artboards.length - 1];
      if (newest) {
        (newState as any).updateArtboard?.(newest.id, {
          websitePage: {
            slug: pages.length === 0 ? '/' : slug,
            title: name,
            metaDescription: '',
            isHomePage: pages.length === 0,
            order: pages.length,
          },
        });
      }
    }, 50);
  },

  setPageSlug: (artboardId, slug) => {
    const state = get();
    const artboard = state.artboards.find((a: any) => a.id === artboardId);
    if (!artboard) return;
    const current = (artboard as any).websitePage || {};
    (state as any).updateArtboard?.(artboardId, {
      websitePage: { ...current, slug },
    });
  },
});
