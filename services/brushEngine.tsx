import React from 'react';
import { buildVariableStrokeOutline, profileWidthFn } from '../utils/variableStroke';

export interface BrushConfig {
  strokeWidthMultiplier: number;
  opacity: number;
  filterId?: string;
  lineCap: 'butt' | 'round' | 'square';
  lineJoin: 'miter' | 'round' | 'bevel';
  dashArray?: string;
  strokeProfile?: 'uniform' | 'taper-start' | 'taper-end' | 'taper-both';
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';
}

export const BrushRegistry: Record<string, BrushConfig> = {
  pencil: {
    strokeWidthMultiplier: 1.0,
    opacity: 0.7,
    lineCap: 'round',
    lineJoin: 'round',
    strokeProfile: 'uniform',
    blendMode: 'normal',
  },
  calligraphy: {
    strokeWidthMultiplier: 1.6,
    opacity: 1.0,
    lineCap: 'butt',
    lineJoin: 'miter',
    strokeProfile: 'taper-both',
    blendMode: 'normal',
  },
  crayon: {
    strokeWidthMultiplier: 1.0,
    opacity: 0.7,
    lineCap: 'round',
    lineJoin: 'round',
    dashArray: '2,5',
    strokeProfile: 'uniform',
    blendMode: 'normal',
  },
  oil: {
    strokeWidthMultiplier: 1.8,
    opacity: 1.0,
    lineCap: 'round',
    lineJoin: 'round',
    filterId: 'brush-oil',
    strokeProfile: 'taper-both',
    blendMode: 'normal',
  },
  watercolor: {
    strokeWidthMultiplier: 2.5,
    opacity: 0.55, // Adjusted to balance multiply blend mode
    lineCap: 'round',
    lineJoin: 'round',
    filterId: 'brush-watercolor',
    strokeProfile: 'taper-both',
    blendMode: 'multiply', // Pigment blends into paper fiber
  },
  vector_pencil: {
    strokeWidthMultiplier: 0.75,
    opacity: 1.0,
    lineCap: 'square',
    lineJoin: 'miter',
    strokeProfile: 'uniform',
    blendMode: 'normal',
  },
};

export const getBrushConfig = (brushType: string): BrushConfig => {
  return BrushRegistry[brushType] || {
    strokeWidthMultiplier: 1.0,
    opacity: 1.0,
    lineCap: 'round',
    lineJoin: 'round',
    strokeProfile: 'uniform',
    blendMode: 'normal',
  };
};

/**
 * Gets a deterministic index from 0-9 based on a string ID.
 */
const getDeterministicIndex = (str?: string): number => {
  if (!str) {return 0;}
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 10;
};

/**
 * BrushFilters Component
 * Centralizes high-performance procedural rendering filters.
 * Now features a state-of-the-art "wet edge" pigment concentration filter for Watercolor.
 */
export const BrushFilters: React.FC = React.memo(() => {
  return (
    <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none', visibility: 'hidden' }}>
      <defs>
        {/* Pre-seeded oil brush textures (0 to 9) */}
        {Array.from({ length: 10 }).map((_, idx) => (
          <filter key={`oil-${idx}`} id={`brush-oil-${idx}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="3" seed={idx * 149 + 37} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
          </filter>
        ))}
        {/* Pre-seeded watercolor wet-edge filters (0 to 9) */}
        {Array.from({ length: 10 }).map((_, idx) => (
          <filter key={`watercolor-${idx}`} id={`brush-watercolor-${idx}`}>
            {/* Create organic dispersion turbulence */}
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed={idx * 281 + 83} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" result="dispersed" />
            
            {/* Apply core pigment blur */}
            <feGaussianBlur in="dispersed" stdDeviation="1.5" result="blurred" />
            
            {/* Morphological dilation to create wet outer boundary edges */}
            <feMorphology in="dispersed" operator="dilate" radius="1.2" result="dilated" />
            <feGaussianBlur in="dilated" stdDeviation="0.8" result="blurredDilated" />
            
            {/* Wet outer border pigment concentration compositing */}
            <feComposite in="blurred" in2="blurredDilated" operator="over" />
          </filter>
        ))}
      </defs>
    </svg>
  );
});

interface BrushStrokeRendererProps {
  id?: string;
  pathData: string;
  width: number;
  height: number;
  viewBox?: string;
  brushType?: string;
  color: string;
  strokeWidth?: number;
  opacity?: number;
  mode?: 'canvas' | 'thumbnail';
}

/**
 * Universal BrushStrokeRenderer Component
 * Same engine, 100% rendering parity across canvas and previews.
 * Features: Variable-width tapered outlines, seeded deterministic filter textures,
 * mix-blend-modes (e.g. Multiply for watercolor), and hardware-accelerated rendering transitions.
 */
export const BrushStrokeRenderer: React.FC<BrushStrokeRendererProps> = ({
  id,
  pathData,
  width,
  height,
  viewBox,
  brushType,
  color,
  strokeWidth = 1,
  opacity = 1,
  mode = 'canvas',
}) => {
  const config = getBrushConfig(brushType || 'pencil');
  
  const finalStrokeWidth = strokeWidth * config.strokeWidthMultiplier;
  const finalOpacity = opacity * config.opacity;
  
  // Pick one of the 10 pre-seeded filters deterministically based on layer ID
  const seedIndex = getDeterministicIndex(id);
  const filterUrl = config.filterId ? `url(#${config.filterId}-${seedIndex})` : undefined;

  const profile = config.strokeProfile || 'uniform';

  // Premium CSS transition style for hardware-accelerated rendering transitions
  const transitionStyle: React.CSSProperties = {
    overflow: 'visible',
    opacity: finalOpacity,
    mixBlendMode: config.blendMode || 'normal',
    transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s ease-out',
    transformOrigin: 'center',
    willChange: 'opacity, filter',
  };

  return (
    <svg
      width={mode === 'canvas' ? '100%' : width}
      height={mode === 'canvas' ? '100%' : height}
      viewBox={viewBox || `0 0 ${width} ${height}`}
      style={transitionStyle}
      preserveAspectRatio={mode === 'canvas' ? 'none' : 'xMidYMid meet'}
    >
      {profile !== 'uniform' ? (
        (() => {
          // Dynamic variable stroke outline (tapered)
          const widthFn = profileWidthFn(profile, finalStrokeWidth);
          const samples = mode === 'canvas' ? 128 : 48; // High quality on canvas, fast in previews
          const outline = buildVariableStrokeOutline(pathData, widthFn, samples);
          if (!outline) {return null;}
          
          return (
            <path
              d={outline}
              fill={color}
              filter={filterUrl}
              style={{ transition: 'fill 0.2s ease' }}
            />
          );
        })()
      ) : (
        // Uniform stroke width
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={finalStrokeWidth}
          strokeLinecap={config.lineCap}
          strokeLinejoin={config.lineJoin}
          strokeDasharray={config.dashArray}
          filter={filterUrl}
          style={{ transition: 'stroke 0.2s ease, stroke-width 0.2s ease' }}
        />
      )}
    </svg>
  );
};
-e
BrushFilters.displayName = 'BrushFilters';
