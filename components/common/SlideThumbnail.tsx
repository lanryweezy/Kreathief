import React, { useRef, useEffect } from 'react';
import { Artboard } from '../../types';

interface SlideThumbnailProps {
  artboard: Artboard;
  isActive: boolean;
  width?: number;
  height?: number;
}

export const SlideThumbnail: React.FC<SlideThumbnailProps> = ({
  artboard,
  isActive,
  width = 320,
  height = 180,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const W = canvas.width;
    const H = canvas.height;
    const scaleX = W / artboard.width;
    const scaleY = H / artboard.height;

    // Background
    ctx.fillStyle = artboard.backgroundColor || '#1e293b';
    ctx.fillRect(0, 0, W, H);

    // Render each layer as a simplified shape
    artboard.layers.forEach((layer: any) => {
      if (layer.visible === false) {
        return;
      }
      ctx.globalAlpha = layer.opacity ?? 1;

      const lx = (layer.x || 0) * scaleX;
      const ly = (layer.y || 0) * scaleY;
      const lw = (layer.width || 0) * scaleX;
      const lh = (layer.height || 0) * scaleY;

      if (layer.type === 'text') {
        ctx.fillStyle = layer.color || '#ffffff';
        const fontSize = Math.max(2, (layer.fontSize || 16) * Math.min(scaleX, scaleY));
        ctx.font = `${layer.fontWeight || '400'} ${fontSize}px ${layer.fontFamily || 'sans-serif'}`;
        ctx.textAlign = (layer.textAlign as CanvasTextAlign) || 'left';
        ctx.fillText(layer.text || '', lx, ly + fontSize, lw);
      } else if (['rectangle', 'circle', 'hexagon', 'diamond'].includes(layer.type)) {
        ctx.fillStyle = layer.color || '#334155';
        if (layer.type === 'circle') {
          ctx.beginPath();
          ctx.ellipse(lx + lw / 2, ly + lh / 2, lw / 2, lh / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.roundRect(lx, ly, lw, lh, (layer.cornerRadius || 0) * Math.min(scaleX, scaleY));
          ctx.fill();
        }
      } else if (layer.type === 'image' && layer.src) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, lx, ly, lw, lh);
        };
        img.src = layer.src;
      }

      ctx.globalAlpha = 1;
    });
  }, [artboard, artboard.layers.length]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`w-full rounded-lg border transition-all duration-200 ${
        isActive ? 'border-brand-500/80 shadow-lg shadow-brand-500/10' : 'border-surface-dark-0'
      }`}
    />
  );
};
