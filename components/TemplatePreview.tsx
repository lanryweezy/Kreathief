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
  const canvasWidth = template?.size?.width || template?.state?.canvasSize?.width || 1080;
  const canvasHeight = template?.size?.height || template?.state?.canvasSize?.height || 1080;
  const bgColor =
    template?.state?.canvasBackgroundColor ||
    template?.state?.backgroundColor ||
    template?.backgroundColor ||
    '#0f172a';

  // Normalize layers from both possible state structures
  const rawLayers: Layer[] =
    template?.state?.artboards?.[0]?.layers ||
    template?.state?.layers ||
    template?.layers ||
    [];

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
        }}
        className="relative shadow-2xl overflow-hidden shrink-0 border border-white/10"
      >
        <StaticLayerRenderer
          layers={rawLayers}
          scale={1}
          width={canvasWidth}
          height={canvasHeight}
        />
      </div>
    </div>
  );
};

export default TemplatePreview;
