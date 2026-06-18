import { Layer, CanvasFilters } from '../../types';

/**
 * Builds a CSS filter string from a CanvasFilters or LayerFilters object
 */
export const buildFilterString = (filters: CanvasFilters | undefined | null): string => {
  if (!filters) return "none";
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
    opacity: layer.opacity,
    // Filters are deliberately excluded here because they often need to be applied to inner elements
    // rather than the container (which might hold selection handles that shouldn't be blurred)
    mixBlendMode: layer.blendMode as React.CSSProperties['mixBlendMode'],
    pointerEvents: layer.locked ? 'none' : 'auto',
    zIndex: layer.locked ? 49 : 50,
  };

  return baseStyle;
};
