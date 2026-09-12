/**
 * SVG Vector Texture Overlay Engine
 * Resolution-independent procedural textures codified for agency-grade graphic design.
 */

import { TextureOverlayConfig } from '../types';

export interface TextureDefinition {
  id: string;
  name: string;
  category: 'paper' | 'halftone' | 'grunge' | 'film' | 'holographic' | 'fabric' | 'microgrid' | 'foil';
  icon: string;
  description: string;
  defaultBlendMode: 'overlay' | 'multiply' | 'screen' | 'soft-light' | 'hard-light';
  defaultOpacity: number;
  generateSvgUri: () => string;
}

/**
 * Helper to turn SVG markup into a clean, URL-encoded data URI
 */
function svgToDataUri(svg: string): string {
  const cleaned = svg
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleaned)}`;
}

export const TEXTURE_DEFINITIONS: Record<string, TextureDefinition> = {
  // 1. Vintage Paper Grain & Kraft
  paperGrain: {
    id: 'paperGrain',
    name: 'Vintage Paper Grain',
    category: 'paper',
    icon: '📜',
    description: 'Organic pulp fibers and tooth for vintage editorial and posters',
    defaultBlendMode: 'multiply',
    defaultOpacity: 0.35,
    generateSvgUri: () =>
      svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
          <filter id="paperNoise" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0.85 0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#paperNoise)" opacity="0.9" />
        </svg>
      `),
  },

  // 2. Risograph Halftone Dot Screen
  risoHalftone: {
    id: 'risoHalftone',
    name: 'Risograph Halftone',
    category: 'halftone',
    icon: '📼',
    description: 'Classic 45° offset halftone dot matrix from Japanese stencil printmakers',
    defaultBlendMode: 'multiply',
    defaultOpacity: 0.3,
    generateSvgUri: () =>
      svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <pattern id="halftonePattern" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <circle cx="2" cy="2" r="2.2" fill="#111827" />
            <circle cx="8" cy="8" r="1.4" fill="#111827" />
            <circle cx="2" cy="8" r="0.8" fill="#374151" />
            <circle cx="8" cy="2" r="0.8" fill="#374151" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#halftonePattern)" />
        </svg>
      `),
  },

  // 3. Distressed Grunge & Scratches
  grungeScratches: {
    id: 'grungeScratches',
    name: 'Grunge Scratches',
    category: 'grunge',
    icon: '🛹',
    description: 'Tactile vinyl scuffs, street distressing, and weathered scratches',
    defaultBlendMode: 'overlay',
    defaultOpacity: 0.4,
    generateSvgUri: () =>
      svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
          <filter id="grungeFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.04 0.95" numOctaves="3" result="streaks" />
            <feDisplacementMap in="SourceGraphic" in2="streaks" scale="30" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <g filter="url(#grungeFilter)" stroke="#000000" opacity="0.75" stroke-linecap="round">
            <line x1="20" y1="30" x2="380" y2="40" stroke-width="1.8" />
            <line x1="60" y1="120" x2="340" y2="135" stroke-width="2.4" />
            <line x1="10" y1="220" x2="390" y2="215" stroke-width="1.2" />
            <line x1="40" y1="310" x2="360" y2="330" stroke-width="2.2" />
            <line x1="100" y1="70" x2="280" y2="85" stroke-width="3" />
          </g>
        </svg>
      `),
  },

  // 4. Subtle 35mm Analog Film Grain
  filmGrain: {
    id: 'filmGrain',
    name: '35mm Film Grain',
    category: 'film',
    icon: '🎞️',
    description: 'Crisp cinematic silver-halide grain for depth and atmospheric warmth',
    defaultBlendMode: 'overlay',
    defaultOpacity: 0.28,
    generateSvgUri: () =>
      svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 250 250">
          <filter id="filmNoise">
            <feTurbulence type="turbulence" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.4" />
              <feFuncG type="linear" slope="1.4" />
              <feFuncB type="linear" slope="1.4" />
            </feComponentTransfer>
          </filter>
          <rect width="100%" height="100%" filter="url(#filmNoise)" />
        </svg>
      `),
  },

  // 5. Holographic Foil & Iridescent Waves
  holographicFoil: {
    id: 'holographicFoil',
    name: 'Holographic Foil',
    category: 'holographic',
    icon: '💿',
    description: 'Specular iridescent color wave sheen for Y2K, cybercore, and packaging',
    defaultBlendMode: 'screen',
    defaultOpacity: 0.35,
    generateSvgUri: () =>
      svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
          <defs>
            <linearGradient id="holoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff0080" stop-opacity="0.8"/>
              <stop offset="25%" stop-color="#7928ca" stop-opacity="0.8"/>
              <stop offset="50%" stop-color="#0070f3" stop-opacity="0.8"/>
              <stop offset="75%" stop-color="#00dfd8" stop-opacity="0.8"/>
              <stop offset="100%" stop-color="#ff4d4d" stop-opacity="0.8"/>
            </linearGradient>
            <filter id="holoWave">
              <feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="2" result="wave" />
              <feDisplacementMap in="SourceGraphic" in2="wave" scale="40" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#holoGrad)" filter="url(#holoWave)" />
        </svg>
      `),
  },

  // 6. Woven Canvas & Fabric Texture
  canvasWeave: {
    id: 'canvasWeave',
    name: 'Canvas & Fabric Weave',
    category: 'fabric',
    icon: '🧵',
    description: 'Fine crosshatch warp and weft fibers for tactile physical artboards',
    defaultBlendMode: 'multiply',
    defaultOpacity: 0.25,
    generateSvgUri: () =>
      svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
          <pattern id="weave" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M0,0 L10,10 M10,0 L0,10" stroke="#4b5563" stroke-width="0.8" stroke-opacity="0.6" />
            <rect x="1" y="1" width="3" height="3" fill="#9ca3af" opacity="0.3" />
            <rect x="6" y="6" width="3" height="3" fill="#9ca3af" opacity="0.3" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#weave)" />
        </svg>
      `),
  },

  // 7. Blueprint Microgrid & Coordinates
  blueprintGrid: {
    id: 'blueprintGrid',
    name: 'Blueprint Microgrid',
    category: 'microgrid',
    icon: '📐',
    description: 'Technical draftsman millimeter grid lines with coordinate crosshairs',
    defaultBlendMode: 'overlay',
    defaultOpacity: 0.3,
    generateSvgUri: () =>
      svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <pattern id="microgrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#94a3b8" stroke-width="0.75" stroke-opacity="0.4" />
            <circle cx="20" cy="20" r="1" fill="#38bdf8" opacity="0.7" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#microgrid)" />
        </svg>
      `),
  },

  // 8. Acid Psychedelic Marbled Grain
  marbledAcid: {
    id: 'marbledAcid',
    name: 'Acid Marbled Grain',
    category: 'grunge',
    icon: '🍄',
    description: 'Swirling liquid fluid dynamics for 60s/70s acid rock and rave aesthetics',
    defaultBlendMode: 'soft-light',
    defaultOpacity: 0.35,
    generateSvgUri: () =>
      svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" width="350" height="350" viewBox="0 0 350 350">
          <filter id="marbleFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="4" result="warp" />
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 18 -7" />
          </filter>
          <rect width="100%" height="100%" filter="url(#marbleFilter)" fill="#6366f1" opacity="0.8" />
        </svg>
      `),
  },

  // 9. Dust Specks & Specks
  dustSpecks: {
    id: 'dustSpecks',
    name: 'Dust & Specks',
    category: 'film',
    icon: '✨',
    description: 'Authentic camera lens dust fibers and film gate lint artifacts',
    defaultBlendMode: 'screen',
    defaultOpacity: 0.45,
    generateSvgUri: () =>
      svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
          <g fill="#ffffff" opacity="0.85">
            <circle cx="24" cy="48" r="1.5" />
            <circle cx="88" cy="19" r="2.2" />
            <circle cx="152" cy="112" r="1.1" />
            <circle cx="240" cy="85" r="1.8" />
            <circle cx="45" cy="210" r="2.0" />
            <circle cx="180" cy="240" r="1.4" />
            <circle cx="270" cy="270" r="2.5" />
            <circle cx="120" cy="285" r="0.9" />
            <circle cx="210" cy="160" r="1.3" />
            <path d="M95,140 Q100,145 105,142" stroke="#ffffff" stroke-width="1.2" fill="none" />
            <path d="M220,50 Q225,58 222,65" stroke="#ffffff" stroke-width="1" fill="none" />
          </g>
        </svg>
      `),
  },

  // 10. Crinkled Gold Foil Specular
  goldFoilTexture: {
    id: 'goldFoilTexture',
    name: 'Crinkled Gold Foil',
    category: 'foil',
    icon: '🍸',
    description: 'Crumpled metallic gold leaf with specular micro-highlights',
    defaultBlendMode: 'overlay',
    defaultOpacity: 0.38,
    generateSvgUri: () =>
      svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
          <defs>
            <linearGradient id="goldSheen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fef08a"/>
              <stop offset="50%" stop-color="#ca8a04"/>
              <stop offset="100%" stop-color="#854d0e"/>
            </linearGradient>
            <filter id="crinkle">
              <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="4" result="crinkles" />
              <feDiffuseLighting in="crinkles" lighting-color="#fef9c3" surfaceScale="2" result="light">
                <feDistantLight azimuth="45" elevation="60" />
              </feDiffuseLighting>
              <feBlend mode="multiply" in="SourceGraphic" in2="light" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#goldSheen)" filter="url(#crinkle)" />
        </svg>
      `),
  },
};

export const ALL_TEXTURE_DEFINITIONS = Object.values(TEXTURE_DEFINITIONS);

export function getTextureById(id: string): TextureDefinition | undefined {
  return TEXTURE_DEFINITIONS[id];
}

/**
 * Creates a TextureOverlayConfig ready for artboard assignment
 */
export function createTextureOverlayConfig(
  textureId: string,
  options?: Partial<{
    opacity: number;
    blendMode: 'overlay' | 'multiply' | 'screen' | 'soft-light' | 'hard-light' | 'normal';
    scale: number;
    invert: boolean;
  }>
): TextureOverlayConfig | null {
  const def = getTextureById(textureId);
  if (!def) return null;

  return {
    id: def.id,
    name: def.name,
    category: def.category,
    svgDataUri: def.generateSvgUri(),
    opacity: options?.opacity ?? def.defaultOpacity,
    blendMode: options?.blendMode ?? def.defaultBlendMode,
    scale: options?.scale ?? 1,
    invert: options?.invert ?? false,
  };
}
