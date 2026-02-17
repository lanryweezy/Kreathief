import { heavyService } from './heavyService';

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
            ...options
        };

        return heavyService.vectorize(imageUrl, defaultOptions);
    },

    /**
     * Extracts paths from a generated SVG string.
     * Useful if you want just the path data 'd' attributes.
     * @param svgString The full SVG string.
     * @returns An array of path data strings.
     */
    extractPaths: (svgString: string): { d: string, fill: string }[] => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, 'image/svg+xml');
        const paths = Array.from(doc.querySelectorAll('path'));
        return paths.map(p => ({
            d: p.getAttribute('d') || '',
            fill: p.getAttribute('fill') || '#000000'
        })).filter(p => p.d !== '');
    }
};
