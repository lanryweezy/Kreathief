/**
 * Advanced Text Effects Presets Engine
 * Signature agency typography effects codified from Kittl, Pentagram, and Behance.
 */

import { TextLayer, TextGradient } from '../types';

export type TextEffectCategory = 'all' | 'popular' | 'retro' | 'futuristic' | 'luxury';

export interface TextEffectPreset {
  id: string;
  name: string;
  category: 'popular' | 'retro' | 'futuristic' | 'luxury';
  icon: string;
  tagline: string;
  previewColor: string;
  previewBg: string;
  previewTextShadow: string;
  previewBorder?: string;
  changes: Partial<TextLayer>;
}

export const TEXT_EFFECT_PRESETS: Record<string, TextEffectPreset> = {
  // 1. Y2K Liquid Chrome
  liquidChrome: {
    id: 'liquidChrome',
    name: 'Liquid Chrome',
    category: 'futuristic',
    icon: '💿',
    tagline: 'Specular silver liquid chrome with cyan halo glow',
    previewColor: '#e2e8f0',
    previewBg: '#090d16',
    previewTextShadow: '0 0 10px rgba(56, 189, 248, 0.7), 0 4px 8px rgba(0, 0, 0, 0.9)',
    previewBorder: '1px solid #38bdf8',
    changes: {
      color: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 28%, #475569 50%, #94a3b8 72%, #1e293b 100%)',
      gradient: {
        enabled: true,
        startColor: '#ffffff',
        endColor: '#1e293b',
        angle: 180,
      },
      textStroke: {
        width: 1,
        color: '#38bdf8',
      },
      textShadow: {
        offsetX: 0,
        offsetY: 4,
        blur: 12,
        color: 'rgba(56, 189, 248, 0.5)',
      },
      neonGlow: {
        enabled: true,
        color: '#38bdf8',
        intensity: 45,
        spread: 15,
        flicker: false,
      },
      warpStyle: 'wave',
      curve: 12,
      letterSpacing: 3,
      textTransform: 'uppercase',
      fontWeight: '800',
    },
  },

  // 2. Pop Art Comic Boom
  comicBoom: {
    id: 'comicBoom',
    name: 'Comic Boom',
    category: 'popular',
    icon: '💥',
    tagline: 'Sunflower yellow fill with heavy 45° offset comic shadow',
    previewColor: '#facc15',
    previewBg: '#18181b',
    previewTextShadow: '3px 3px 0 #000000',
    previewBorder: '2px solid #000000',
    changes: {
      color: '#facc15',
      gradient: undefined,
      textStroke: {
        width: 2.5,
        color: '#000000',
      },
      textShadow: {
        offsetX: 5,
        offsetY: 5,
        blur: 0,
        color: '#000000',
      },
      neonGlow: {
        enabled: false,
        color: '#000000',
        intensity: 0,
        spread: 0,
        flicker: false,
      },
      warpStyle: 'arc',
      curve: 24,
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontWeight: '900',
    },
  },

  // 3. Neo-Brutalist 3D Block
  neoBrutalistBlock: {
    id: 'neoBrutalistBlock',
    name: 'Neo-Brutalist',
    category: 'popular',
    icon: '⚡',
    tagline: 'High-voltage lime with sharp unblurred 5px black block shadow',
    previewColor: '#00ff66',
    previewBg: '#121212',
    previewTextShadow: '4px 4px 0 #000000',
    previewBorder: '2px solid #000000',
    changes: {
      color: '#00ff66',
      gradient: undefined,
      textStroke: {
        width: 2,
        color: '#000000',
      },
      textShadow: {
        offsetX: 5,
        offsetY: 5,
        blur: 0,
        color: '#000000',
      },
      neonGlow: {
        enabled: false,
        color: '#000000',
        intensity: 0,
        spread: 0,
        flicker: false,
      },
      warpStyle: 'none',
      curve: 0,
      letterSpacing: 1,
      textTransform: 'uppercase',
      fontWeight: '900',
    },
  },

  // 4. 80s Synthwave Sunset
  synthwaveSunset: {
    id: 'synthwaveSunset',
    name: '80s Synthwave',
    category: 'retro',
    icon: '🌆',
    tagline: 'Hot magenta to golden amber gradient with atmospheric neon aura',
    previewColor: '#ff007f',
    previewBg: '#090117',
    previewTextShadow: '0 0 12px #ff007f, 0 0 24px #06b6d4',
    previewBorder: '1px solid #ff007f',
    changes: {
      color: 'linear-gradient(180deg, #ff007f 0%, #f43f5e 40%, #fbbf24 85%, #fb923c 100%)',
      gradient: {
        enabled: true,
        startColor: '#ff007f',
        endColor: '#fb923c',
        angle: 180,
      },
      textStroke: {
        width: 1,
        color: '#ff007f',
      },
      textShadow: {
        offsetX: 0,
        offsetY: 0,
        blur: 15,
        color: '#ff007f',
      },
      neonGlow: {
        enabled: true,
        color: '#ff007f',
        intensity: 75,
        spread: 25,
        flicker: false,
      },
      warpStyle: 'arc',
      curve: -18,
      letterSpacing: 4,
      textTransform: 'uppercase',
      fontWeight: '800',
    },
  },

  // 5. Vintage Gold Foil
  goldFoil: {
    id: 'goldFoil',
    name: 'Vintage Gold Foil',
    category: 'luxury',
    icon: '🍸',
    tagline: 'Gilded metallic gold leaf with dark bronze outline and luxury spacing',
    previewColor: '#facc15',
    previewBg: '#0a0a0f',
    previewTextShadow: '0 3px 8px rgba(0, 0, 0, 0.7)',
    previewBorder: '1px solid #ca8a04',
    changes: {
      color: 'linear-gradient(135deg, #fef08a 0%, #ca8a04 38%, #fef9c3 65%, #a16207 100%)',
      gradient: {
        enabled: true,
        startColor: '#fef08a',
        endColor: '#a16207',
        angle: 135,
      },
      textStroke: {
        width: 1,
        color: '#713f12',
      },
      textShadow: {
        offsetX: 0,
        offsetY: 4,
        blur: 10,
        color: 'rgba(0, 0, 0, 0.75)',
      },
      neonGlow: {
        enabled: false,
        color: '#ca8a04',
        intensity: 0,
        spread: 0,
        flicker: false,
      },
      warpStyle: 'arc',
      curve: 28,
      letterSpacing: 6,
      textTransform: 'uppercase',
      fontWeight: '700',
      fontFamily: 'Cinzel',
    },
  },

  // 6. Cyberpunk Glitch
  cyberpunkGlitch: {
    id: 'cyberpunkGlitch',
    name: 'Cyberpunk Glitch',
    category: 'futuristic',
    icon: '🤖',
    tagline: 'Electric cyan with chromatic aberration dual RGB split shadow',
    previewColor: '#00f0ff',
    previewBg: '#05050a',
    previewTextShadow: '-2px 0 0 #ff0055, 2px 0 0 #00f0ff',
    previewBorder: '1px solid #00f0ff',
    changes: {
      color: '#00f0ff',
      gradient: undefined,
      textStroke: {
        width: 1,
        color: '#ff0055',
      },
      textShadow: {
        offsetX: 3,
        offsetY: 0,
        blur: 0,
        color: '#ff0055',
      },
      neonGlow: {
        enabled: true,
        color: '#00f0ff',
        intensity: 60,
        spread: 12,
        flicker: true,
      },
      warpStyle: 'rise',
      curve: 14,
      letterSpacing: 3,
      textTransform: 'uppercase',
      fontWeight: '900',
    },
  },

  // 7. Retro Risograph Halftone
  risographHalftone: {
    id: 'risographHalftone',
    name: 'Risograph Print',
    category: 'retro',
    icon: '📼',
    tagline: 'Two-tone spot color with intentional misregistered print shadow',
    previewColor: '#ff2a7a',
    previewBg: '#faf5eb',
    previewTextShadow: '3px 3px 0 #1e1b4b',
    previewBorder: '1px solid #1e1b4b',
    changes: {
      color: '#ff2a7a',
      gradient: undefined,
      textStroke: {
        width: 1,
        color: '#1e1b4b',
      },
      textShadow: {
        offsetX: 4,
        offsetY: 4,
        blur: 0,
        color: '#1e1b4b',
      },
      neonGlow: {
        enabled: false,
        color: '#000000',
        intensity: 0,
        spread: 0,
        flicker: false,
      },
      warpStyle: 'none',
      curve: 0,
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontWeight: '800',
    },
  },

  // 8. Acid Psychedelic Trippy
  psychedelicTrippy: {
    id: 'psychedelicTrippy',
    name: 'Acid Psychedelic',
    category: 'retro',
    icon: '🍄',
    tagline: 'Warped horizontal rainbow spectrum with glowing aura wave',
    previewColor: '#ec4899',
    previewBg: '#0f051d',
    previewTextShadow: '0 0 12px #8b5cf6, 0 0 24px #ec4899',
    previewBorder: '1px solid #ffffff',
    changes: {
      color: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 35%, #06b6d4 70%, #10b981 100%)',
      gradient: {
        enabled: true,
        startColor: '#ec4899',
        endColor: '#10b981',
        angle: 90,
      },
      textStroke: {
        width: 1.5,
        color: '#ffffff',
      },
      textShadow: {
        offsetX: 0,
        offsetY: 0,
        blur: 16,
        color: '#8b5cf6',
      },
      neonGlow: {
        enabled: true,
        color: '#ec4899',
        intensity: 70,
        spread: 22,
        flicker: false,
      },
      warpStyle: 'wave',
      curve: 32,
      letterSpacing: 4,
      textTransform: 'uppercase',
      fontWeight: '900',
    },
  },

  // 9. Dark Gothic Bloodline
  gothicBloodline: {
    id: 'gothicBloodline',
    name: 'Gothic Bloodline',
    category: 'luxury',
    icon: '🩸',
    tagline: 'Deep crimson bloodline with pitch black stroke and sinister shadow',
    previewColor: '#dc2626',
    previewBg: '#050505',
    previewTextShadow: '0 0 10px rgba(220, 38, 38, 0.7), 3px 3px 0 #000000',
    previewBorder: '1px solid #000000',
    changes: {
      color: '#dc2626',
      gradient: undefined,
      textStroke: {
        width: 1.5,
        color: '#000000',
      },
      textShadow: {
        offsetX: 3,
        offsetY: 4,
        blur: 8,
        color: '#000000',
      },
      neonGlow: {
        enabled: true,
        color: '#dc2626',
        intensity: 55,
        spread: 14,
        flicker: false,
      },
      warpStyle: 'flag',
      curve: 12,
      letterSpacing: 5,
      textTransform: 'uppercase',
      fontWeight: '700',
      fontFamily: 'Cinzel',
    },
  },

  // 10. Clean Minimalist Hollow
  minimalHollow: {
    id: 'minimalHollow',
    name: 'Minimal Hollow',
    category: 'luxury',
    icon: '🕊️',
    tagline: 'Transparent knockout fill with crisp hairline stroke and 8px letterspacing',
    previewColor: 'transparent',
    previewBg: '#18181b',
    previewTextShadow: 'none',
    previewBorder: '1.5px solid #ffffff',
    changes: {
      color: 'transparent',
      gradient: undefined,
      textStroke: {
        width: 1.5,
        color: '#ffffff',
      },
      textShadow: {
        offsetX: 0,
        offsetY: 2,
        blur: 6,
        color: 'rgba(0, 0, 0, 0.4)',
      },
      neonGlow: {
        enabled: false,
        color: '#ffffff',
        intensity: 0,
        spread: 0,
        flicker: false,
      },
      warpStyle: 'none',
      curve: 0,
      letterSpacing: 8,
      textTransform: 'uppercase',
      fontWeight: '600',
      fontFamily: 'Inter',
    },
  },
};

export const TEXT_EFFECT_PRESET_LIST = Object.values(TEXT_EFFECT_PRESETS);

export function getPresetsByCategory(category: TextEffectCategory): TextEffectPreset[] {
  if (category === 'all') return TEXT_EFFECT_PRESET_LIST;
  return TEXT_EFFECT_PRESET_LIST.filter((p) => p.category === category);
}

export function applyTextEffectPreset(layer: TextLayer, presetId: string): Partial<TextLayer> {
  const preset = TEXT_EFFECT_PRESETS[presetId];
  if (!preset) return {};
  return {
    ...preset.changes,
  };
}
