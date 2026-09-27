import { log } from '../utils/log';

export class VectorTracerService {
  /**
   * Traces a raster image URL and converts it to a raw SVG string.
   * This provides a fallback SVG path if a model (like Recraft) fails to output native SVG,
   * ensuring "generate logo" never dead-ends.
   */
  public async traceImageToSVG(imageUrl: string, options = { ltres: 1, qtres: 1, pathomit: 8 }): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        log.info('[VectorTracer] Starting raster-to-vector trace for:', imageUrl);

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;

        img.onload = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Failed to get 2d context'));

          ctx.drawImage(img, 0, 0);
          
          // Image data for tracing
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Dynamic import of imagetracerjs
          const ImageTracerModule = await import('imagetracerjs');
          const ImageTracer = ImageTracerModule.default || ImageTracerModule;
          
          ImageTracer.imageToSVG(
            imageData,
            (svgStr: string) => {
              log.info('[VectorTracer] Tracing complete!');
              resolve(svgStr);
            },
            options
          );
        };

        img.onerror = (e) => reject(new Error('Failed to load image for tracing'));
      } catch (e) {
        log.error('[VectorTracer] Tracing failed', e);
        reject(e);
      }
    });
  }
}

export const vectorTracer = new VectorTracerService();
