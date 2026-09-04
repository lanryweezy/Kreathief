import { Layer, CanvasFilters } from '../../types';

/**
 * Builds a CSS filter string from a CanvasFilters or LayerFilters object
 */
export const buildFilterString = (filters: CanvasFilters | undefined | null): string => {
  if (!filters) {
    return 'none';
  }
  const parts: string[] = [];

  if (filters.brightness !== 100) {
    parts.push(`brightness(${filters.brightness}%)`);
  }
  if (filters.contrast !== 100) {
    parts.push(`contrast(${filters.contrast}%)`);
  }
  if (filters.saturation !== 100) {
    parts.push(`saturate(${filters.saturation}%)`);
  }
  if (filters.grayscale !== 0) {
    parts.push(`grayscale(${filters.grayscale}%)`);
  }
  if (filters.sepia !== 0) {
    parts.push(`sepia(${filters.sepia}%)`);
  }
  if (filters.blur !== 0) {
    parts.push(`blur(${filters.blur}px)`);
  }
  if (filters.hueRotate !== 0) {
    parts.push(`hue-rotate(${filters.hueRotate}deg)`);
  }
  if ((filters as any).invert && (filters as any).invert !== 0) {
    parts.push(`invert(${(filters as any).invert}%)`);
  }

  return parts.join(' ') || 'none';
};

/**
 * Builds inline styles for a layer element
 */
export const getLayerStyle = (layer: Layer, zoom: number = 1): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: layer.x * zoom,
    top: layer.y * zoom,
    width: 'width' in layer ? layer.width * zoom : undefined,
    height: 'height' in layer ? layer.height * zoom : undefined,
    transform: `rotate(${layer.rotation}deg)`,
    opacity: typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? Math.max(0, Math.min(1, layer.opacity)) : 1,
    // Filters are deliberately excluded here because they often need to be applied to inner elements
    // rather than the container (which might hold selection handles that shouldn't be blurred)
    mixBlendMode: layer.blendMode as React.CSSProperties['mixBlendMode'],
    pointerEvents: layer.locked ? 'none' : 'auto',
    zIndex: typeof (layer as any).zIndex === 'number' ? (layer as any).zIndex : layer.locked ? 1 : 2,
  };

  return baseStyle;
};
