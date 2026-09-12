import { useState, useEffect, useRef } from 'react';
import { Layer, ShapeLayer } from '../../types';

export const useBitmapCache = (
  layers: Layer[],
  selectedLayerIds: string[],
  zoom: number,
  isInteracting?: boolean
) => {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [cachedLayerIds, setCachedLayerIds] = useState<Set<string>>(new Set());
  const cacheTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Debounce cache generation
    if (cacheTimeoutRef.current) {
      clearTimeout(cacheTimeoutRef.current);
    }

    if (isInteracting) {
      return;
    }

    cacheTimeoutRef.current = window.setTimeout(() => {
      // Find all static drawing paths
      const cacheableLayers = layers.filter((l) => {
        if (l.type !== 'path' || !(l as ShapeLayer).brushType) return false;
        if (selectedLayerIds.includes(l.id)) return false;
        if (l.visible === false) return false;
        if (l.animation && (l.animation as any).type !== 'none' && (l.animation as any).enabled !== false) return false;
        return true;
      });

      if (cacheableLayers.length === 0) {
        if (cachedUrl) {
          URL.revokeObjectURL(cachedUrl);
          setCachedUrl(null);
          setCachedLayerIds(new Set());
        }
        return;
      }

      // Check if cache needs update by comparing layer IDs
      const newCacheIds = new Set(cacheableLayers.map((l) => l.id));
      
      const generateCache = async () => {
        // Find bounding box
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        cacheableLayers.forEach((l) => {
          minX = Math.min(minX, l.x);
          minY = Math.min(minY, l.y);
          maxX = Math.max(maxX, l.x + (l as any).width);
          maxY = Math.max(maxY, l.y + (l as any).height);
        });

        if (minX === Infinity) return;

        const width = maxX - minX;
        const height = maxY - minY;

        if (width <= 0 || height <= 0) return;

        // Create an SVG string of all strokes
        const svgContent = cacheableLayers
          .map((layer) => {
            const shapeLayer = layer as ShapeLayer;
            const style = `opacity: ${shapeLayer.opacity ?? 1}`;
            return `<path d="${shapeLayer.pathData}" fill="none" stroke="${shapeLayer.color}" stroke-width="${shapeLayer.stroke?.width ?? 1}" stroke-linecap="round" stroke-linejoin="round" style="${style}" transform="translate(${shapeLayer.x - minX}, ${shapeLayer.y - minY})" />`;
          })
          .join('');

        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${svgContent}</svg>`;
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
          try {
            const canvas = new OffscreenCanvas(width, height);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              canvas.convertToBlob({ type: 'image/webp', quality: 1 }).then((webpBlob) => {
                if (cachedUrl) {
                  URL.revokeObjectURL(cachedUrl);
                }
                const newCachedUrl = URL.createObjectURL(webpBlob);
                setCachedUrl(newCachedUrl);
                setCachedLayerIds(newCacheIds);
                URL.revokeObjectURL(url);
              });
            }
          } catch (e) {
            // Fallback for browsers without OffscreenCanvas support
            if (cachedUrl) URL.revokeObjectURL(cachedUrl);
            setCachedUrl(url);
            setCachedLayerIds(newCacheIds);
          }
        };
        img.src = url;
      };

      generateCache();

    }, 500);

    return () => {
      if (cacheTimeoutRef.current) {
        clearTimeout(cacheTimeoutRef.current);
      }
    };
  }, [layers, selectedLayerIds, isInteracting, zoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cachedUrl) {
        URL.revokeObjectURL(cachedUrl);
      }
    };
  }, []); // Intentionally empty to only run on unmount

  return { cachedUrl, cachedLayerIds };
};
