import { heavyService } from './heavyService';

/**
 * PhotoService
 * Handles client-side image operations like cropping, resizing, and filters.
 */

export const cropImage = (
    imageSrc: string,
    cropArea: { x: number; y: number; width: number; height: number }
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('Canvas context not available');

            canvas.width = cropArea.width;
            canvas.height = cropArea.height;

            ctx.drawImage(
                img,
                cropArea.x, cropArea.y, cropArea.width, cropArea.height,
                0, 0, cropArea.width, cropArea.height
            );

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = imageSrc;
    });
};

export const resizeImage = (
    imageSrc: string,
    width: number,
    height: number
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('Canvas context not available');

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = imageSrc;
    });
};

export const applyBlur = (
    imageSrc: string,
    amount: number, // px
    type: 'gaussian' | 'tilt-shift' = 'gaussian'
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('Canvas context not available');

            canvas.width = img.width;
            canvas.height = img.height;

            if (type === 'gaussian') {
                ctx.filter = `blur(${amount}px)`;
                ctx.drawImage(img, 0, 0);
            } else {
                // Simple Vertical Tilt-Shift Proxy
                ctx.drawImage(img, 0, 0);
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                const tempCtx = tempCanvas.getContext('2d');
                if (!tempCtx) return resolve(imageSrc);

                tempCtx.filter = `blur(${amount}px)`;
                tempCtx.drawImage(img, 0, 0);

                // Mask for center focus
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, 'rgba(0,0,0,1)');
                gradient.addColorStop(0.3, 'rgba(0,0,0,0)');
                gradient.addColorStop(0.7, 'rgba(0,0,0,0)');
                gradient.addColorStop(1, 'rgba(0,0,0,1)');

                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(tempCanvas, 0, 0);
                ctx.globalCompositeOperation = 'destination-out';
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = imageSrc;
    });
};

/**
 * Extract a color palette from an image using quantization via Web Worker.
 */
export const extractPalette = (imageSrc: string, colorCount: number = 5): Promise<string[]> => {
    return heavyService.extractPalette(imageSrc, colorCount);
};

/**
 * Algorithmic Auto-Enhance via Web Worker.
 */
export const algorithmicEnhance = (imageSrc: string): Promise<string> => {
    return heavyService.algorithmicEnhance(imageSrc);
};

/**
 * Trace image to SVG paths via Web Worker.
 */
export const traceImageToSVG = (imageSrc: string, colors: number = 2): Promise<{ path: string, color: string }[]> => {
    return heavyService.traceImageToSVG(imageSrc, colors);
};
