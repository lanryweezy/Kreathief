import { Layer, ImageLayer } from '../types';

export interface PrepressWarning {
  layerId: string;
  layerName: string;
  message: string;
  type: 'resolution' | 'color' | 'font';
}

export const validatePrepress = (layers: Layer[], targetDpi: number = 300): PrepressWarning[] => {
  const warnings: PrepressWarning[] = [];

  // Assuming canvas is 72 DPI natively.
  // To print at 300 DPI, the naturalWidth needs to be >= layer.width * (300/72)
  const REQUIRED_RATIO = targetDpi / 72;

  layers.forEach((layer) => {
    if (layer.type === 'image') {
      const imgLayer = layer as ImageLayer;

      // If we don't have natural dimensions, we can't reliably calculate DPI
      if (imgLayer.naturalWidth && imgLayer.naturalHeight) {
        const ratioX = imgLayer.naturalWidth / imgLayer.width;
        const ratioY = imgLayer.naturalHeight / imgLayer.height;

        if (ratioX < REQUIRED_RATIO || ratioY < REQUIRED_RATIO) {
          const effectiveDpi = Math.round(Math.min(ratioX, ratioY) * 72);
          warnings.push({
            layerId: imgLayer.id,
            layerName: imgLayer.name || 'Image',
            message: `Low resolution: Effective DPI is ${effectiveDpi} (Target: ${targetDpi}). Print may be pixelated.`,
            type: 'resolution',
          });
        }
      }
    }
  });

  return warnings;
};
