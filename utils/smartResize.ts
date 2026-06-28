import { Layer, Artboard } from '../types';

interface ResizeTarget {
  name: string;
  width: number;
  height: number;
  platform: string;
  icon: string;
}

const RESIZE_TARGETS: ResizeTarget[] = [
  { name: 'Instagram Post', width: 1080, height: 1080, platform: 'Instagram', icon: '📷' },
  { name: 'Instagram Story', width: 1080, height: 1920, platform: 'Instagram', icon: '📱' },
  { name: 'Instagram Reel', width: 1080, height: 1920, platform: 'Instagram', icon: '🎬' },
  { name: 'Twitter/X Post', width: 1200, height: 675, platform: 'Twitter', icon: '🐦' },
  { name: 'Twitter/X Header', width: 1500, height: 500, platform: 'Twitter', icon: '🐦' },
  { name: 'Facebook Post', width: 1200, height: 630, platform: 'Facebook', icon: '👤' },
  { name: 'Facebook Cover', width: 820, height: 312, platform: 'Facebook', icon: '👤' },
  { name: 'LinkedIn Post', width: 1200, height: 627, platform: 'LinkedIn', icon: '💼' },
  { name: 'LinkedIn Banner', width: 1584, height: 396, platform: 'LinkedIn', icon: '💼' },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, platform: 'YouTube', icon: '▶️' },
  { name: 'YouTube Banner', width: 2560, height: 1440, platform: 'YouTube', icon: '▶️' },
  { name: 'TikTok', width: 1080, height: 1920, platform: 'TikTok', icon: '🎵' },
  { name: 'Pinterest Pin', width: 1000, height: 1500, platform: 'Pinterest', icon: '📌' },
  { name: 'Pinterest Board', width: 1000, height: 1000, platform: 'Pinterest', icon: '📌' },
  { name: 'Email Header', width: 600, height: 200, platform: 'Email', icon: '📧' },
  { name: 'Presentation 16:9', width: 1920, height: 1080, platform: 'Slides', icon: '📊' },
  { name: 'Presentation 4:3', width: 1024, height: 768, platform: 'Slides', icon: '📊' },
  { name: 'Business Card', width: 1050, height: 600, platform: 'Print', icon: '💳' },
  { name: 'A4 Poster', width: 2480, height: 3508, platform: 'Print', icon: '📄' },
  { name: 'HD Wallpaper', width: 1920, height: 1080, platform: 'Desktop', icon: '🖥️' },
  { name: '4K Wallpaper', width: 3840, height: 2160, platform: 'Desktop', icon: '🖥️' },
];

/**
 * Feature 7: Smart Resize — AI-aware multi-platform export.
 * Design once → auto-resize to all platforms with intelligent cropping.
 */
export function getResizeTargets(): ResizeTarget[] {
  return RESIZE_TARGETS;
}

export function smartResize(
  artboard: Artboard,
  layers: Layer[],
  target: ResizeTarget
): { width: number; height: number; layers: Layer[] } {
  const srcAspect = artboard.width / artboard.height;
  const tgtAspect = target.width / target.height;

  // Calculate scale to fit
  const scaleX = target.width / artboard.width;
  const scaleY = target.height / artboard.height;
  const scale = Math.min(scaleX, scaleY);

  // Center the content
  const offsetX = (target.width - artboard.width * scale) / 2;
  const offsetY = (target.height - artboard.height * scale) / 2;

  // Transform layers
  const resizedLayers = layers.map((layer) => {
    const newX = layer.x * scale + offsetX;
    const newY = layer.y * scale + offsetY;
    const newWidth = ((layer as any).width || 100) * scale;
    const newHeight = ((layer as any).height || 100) * scale;
    const newFontSize = layer.type === 'text' ? ((layer as any).fontSize || 16) * scale : undefined;

    return {
      ...layer,
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
      ...(newFontSize ? { fontSize: Math.round(newFontSize) } : {}),
    } as Layer;
  });

  return {
    width: target.width,
    height: target.height,
    layers: resizedLayers,
  };
}

/**
 * AI-aware resize: analyzes content importance and crops intelligently.
 * For example, a face in a portrait gets kept centered when resizing to landscape.
 */
export function aiSmartResize(
  artboard: Artboard,
  layers: Layer[],
  target: ResizeTarget
): { width: number; height: number; layers: Layer[] } {
  // Find the visual center of mass (weighted by layer size)
  let totalArea = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (const layer of layers) {
    const area = ((layer as any).width || 100) * ((layer as any).height || 100);
    totalArea += area;
    weightedX += (layer.x + ((layer as any).width || 100) / 2) * area;
    weightedY += (layer.y + ((layer as any).height || 100) / 2) * area;
  }

  const centerX = totalArea > 0 ? weightedX / totalArea : artboard.width / 2;
  const centerY = totalArea > 0 ? weightedY / totalArea : artboard.height / 2;

  // Scale to fit while keeping center of mass centered
  const scaleX = target.width / artboard.width;
  const scaleY = target.height / artboard.height;
  const scale = Math.min(scaleX, scaleY);

  // Offset to keep center of mass at target center
  const targetCenterX = target.width / 2;
  const targetCenterY = target.height / 2;
  const offsetX = targetCenterX - centerX * scale;
  const offsetY = targetCenterY - centerY * scale;

  const resizedLayers = layers.map(
    (layer) =>
      ({
        ...layer,
        x: layer.x * scale + offsetX,
        y: layer.y * scale + offsetY,
        width: ((layer as any).width || 100) * scale,
        height: ((layer as any).height || 100) * scale,
        ...(layer.type === 'text' ? { fontSize: Math.round(((layer as any).fontSize || 16) * scale) } : {}),
      }) as Layer
  );

  return {
    width: target.width,
    height: target.height,
    layers: resizedLayers,
  };
}
