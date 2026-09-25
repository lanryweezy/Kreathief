import { heavyService } from './heavyService';
import { svgToDesignNodes } from '../utils/svgIngest';

export interface VectorizeOptions {
  ltres?: number; // Linear error threshold (default 1)
  qtres?: number; // Quadratic error threshold (default 1)
  pathomit?: number; // Path omission threshold (default 8)
  colorsampling?: 0 | 1 | 2; // 0=disabled, 1=random, 2=deterministic
  numberofcolors?: number; // Number of colors to use (default 16)
  mincolorratio?: number; // Color ratio threshold (default 0)
  colorquantcycles?: number; // Color quantization cycles (default 3)
  scale?: number; // Scale factor (default 1)
  simplify?: number; // Simplification amount (custom wrapper logic)
  blurradius?: number; // Blur radius (default 0)
  blurdelta?: number; // Blur delta (default 20)
}

/**
 * Service to handle client-side vectorization of raster images using imagetracerjs.
 */
export const vectorizerService = {
  /**
   * Traces an image URL to an SVG string via Web Worker.
   * @param imageUrl The URL or Data URI of the image to vectorize.
   * @param options Configuration options for the tracer.
   * @returns A Promise that resolves to the SVG string.
   */
  traceImage: (imageUrl: string, options: VectorizeOptions = {}): Promise<string> => {
    // Default options suitable for general graphics
    const defaultOptions = {
      ltres: 0.5,
      qtres: 0.5,
      pathomit: 2,
      numberofcolors: 16,
      scale: 1,
      strokewidth: 0,
      viewbox: true,
      ...options,
    };

    return heavyService.vectorize(imageUrl, defaultOptions);
  },

  /**
   * Extracts editable paths from a generated/traced SVG string.
   *
   * Delegates to the pure `svgToDesignNodes` kernel (no DOMParser), which means this
   * now runs identically in Node tests and, with `clean` on by default, hands back
   * node-reduced paths instead of raw ImageTracer bloat — the exact metric pros check.
   * @param svgString The full SVG string.
   * @param options.clean Run the geometry cleaner on each path (default true).
   * @returns An array of { d, fill } path descriptors.
   */
  extractPaths: (svgString: string, options: { clean?: boolean } = {}): { d: string; fill: string }[] => {
    const { nodes } = svgToDesignNodes(svgString, { clean: options.clean ?? true });
    return nodes
      .filter((n) => n.type === 'path' && n.pathData)
      .map((n) => ({
        d: n.pathData as string,
        fill: typeof n.fill === 'string' ? n.fill : '#000000',
      }))
      .filter((p) => p.d !== '');
  },
};
