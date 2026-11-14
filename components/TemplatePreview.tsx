import React from 'react';
import { StarterTemplate } from '../data/templates';
import { StaticLayerRenderer } from './StaticLayerRenderer';
import { Layer } from '../types';

interface TemplatePreviewProps {
  template: StarterTemplate | any;
  containerWidth?: number;
  containerHeight?: number;
  className?: string;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  containerWidth = 260,
  containerHeight = 180,
  className = '',
}) => {
  const artboards = template?.state?.artboards || [];
  const activeArtboard = artboards.find((a: any) => a.id === template?.state?.activeArtboardId) || artboards[0];

  const canvasWidth = activeArtboard?.width || template?.size?.width || template?.state?.canvasSize?.width || 1080;
  const canvasHeight = activeArtboard?.height || template?.size?.height || template?.state?.canvasSize?.height || 1080;
  const bgColor =
    activeArtboard?.backgroundColor ||
    template?.state?.canvasBackgroundColor ||
    template?.state?.backgroundColor ||
    template?.backgroundColor ||
    '#0f172a';

  // Normalize layers from both possible state structures
  const rawLayers: Layer[] = activeArtboard?.layers || template?.state?.layers || template?.layers || [];

  const textureOverlay = activeArtboard?.textureOverlay;
  const filters = template?.state?.canvasFilters;
  const filterCss = filters
    ? [
        filters.brightness !== undefined && filters.brightness !== 100 ? `brightness(${filters.brightness}%)` : '',
        filters.contrast !== undefined && filters.contrast !== 100 ? `contrast(${filters.contrast}%)` : '',
        filters.saturation !== undefined && filters.saturation !== 100 ? `saturate(${filters.saturation}%)` : '',
        filters.sepia ? `sepia(${filters.sepia}%)` : '',
        filters.grayscale ? `grayscale(${filters.grayscale}%)` : '',
        filters.blur ? `blur(${filters.blur}px)` : '',
      ]
        .filter(Boolean)
        .join(' ')
    : undefined;

  // Compute uniform scale to fit neatly inside the thumbnail container
  const scale = Math.min(containerWidth / canvasWidth, containerHeight / canvasHeight);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none pointer-events-none ${className}`}
    >
      <div
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          backgroundColor: bgColor,
          filter: filterCss || undefined,
        }}
        className="relative shadow-2xl overflow-hidden shrink-0 border border-white/10"
      >
        <StaticLayerRenderer layers={rawLayers} scale={1} width={canvasWidth} height={canvasHeight} />
        {textureOverlay && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("${textureOverlay.svgDataUri}")`,
              backgroundRepeat: 'repeat',
              backgroundSize: `${240 * (textureOverlay.scale || 1)}px ${240 * (textureOverlay.scale || 1)}px`,
              opacity: textureOverlay.opacity,
              mixBlendMode: textureOverlay.blendMode as any,
              filter: textureOverlay.invert ? 'invert(1)' : undefined,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TemplatePreview;
