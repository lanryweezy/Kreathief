import { TextLayer, ShapeLayer, ImageLayer, CanvasFilters, Layer } from '../types';
import { writePsd, Psd } from 'ag-psd';

export type ColorProfile = 'sRGB' | 'CMYK' | 'FOGRA39' | 'GRACoL' | 'SWOP';

export interface PDFExportOptions {
  colorProfile: ColorProfile;
  bleed: number;
  cropMarks: boolean;
  quality?: 'draft' | 'print' | 'high' | 'screen' | 'prepress';
}

/**
 * Downloads a Blob object as a file.
 */
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports the design as a print-ready PDF via Worker.
 */
export const exportToPrintPDF = async (
  width: number,
  height: number,
  imgDataUrl: string,
  fileName: string,
  options: PDFExportOptions
) => {
  return new Promise<void>((resolve, reject) => {
    try {
      const worker = new Worker(new URL('../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
      
      worker.onmessage = (e) => {
        const { type, payload, error } = e.data;
        if (type === 'SUCCESS') {
          downloadBlob(payload, fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
          worker.terminate();
          resolve();
        } else {
          worker.terminate();
          reject(new Error(error || 'PDF Generation failed'));
        }
      };

      worker.onerror = (err) => {
        worker.terminate();
        reject(err);
      };

      worker.postMessage({ width, height, imgDataUrl, fileName, options });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Exports the design as a layered Photoshop (PSD) file.
 */
export const exportToLayeredPSD = async (
  width: number,
  height: number,
  layers: Layer[],
  fileName: string
) => {
  const psd: Psd = {
    width,
    height,
    children: [],
  };

  for (const layer of layers) {
    if (!layer.visible) continue;

    const canvas = document.createElement('canvas');
    canvas.width = layer.width || width;
    canvas.height = (layer as any).height || height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const origX = layer.x;
      const origY = layer.y;
      
      // Temporary "zeroing" for individual layer render
      const tempLayer = { ...layer, x: 0, y: 0 };

      if (tempLayer.type === 'image') {
        await drawImageLayerToContext(ctx, tempLayer as ImageLayer);
      } else if (tempLayer.type === 'text') {
        drawTextLayerToContext(ctx, tempLayer as TextLayer);
      } else if (tempLayer.type !== 'adjustment' && tempLayer.type !== 'group') {
        drawShapeToContext(ctx, tempLayer as ShapeLayer);
      }

      psd.children!.push({
        name: layer.name || `Layer ${layer.id}`,
        left: origX,
        top: origY,
        canvas: canvas,
        opacity: layer.opacity,
        hidden: !layer.visible,
      });
    }
  }

  const buffer = writePsd(psd);
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  downloadBlob(blob, fileName.endsWith('.psd') ? fileName : `${fileName}.psd`);
};

/**
 * Main design to Image export
 */
export const exportDesignToImage = async (
  width: number,
  height: number,
  backgroundColor: string,
  backgroundImageUrl: string | null,
  layers: Layer[],
  filters?: CanvasFilters,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality: number = 0.95
): Promise<string> => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not create canvas context');

  if (backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  if (backgroundImageUrl) {
    try {
      const img = await loadImage(backgroundImageUrl);
      ctx.save();
      if (filters) {
        ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) sepia(${filters.sepia}%) grayscale(${filters.grayscale}%) blur(${filters.blur}px)`;
        ctx.globalAlpha = filters.opacity;
      }
      ctx.drawImage(img, 0, 0, width, height);
      ctx.restore();
    } catch (err) {
      console.warn('Failed to load bg image', err);
    }
  }

  for (const layer of layers) {
    if (!layer.visible) continue;
    if (layer.type === 'image') await drawImageLayerToContext(ctx, layer as ImageLayer);
    else if (layer.type === 'text') drawTextLayerToContext(ctx, layer as TextLayer);
    else if (layer.type !== 'adjustment' && layer.type !== 'group') drawShapeToContext(ctx, layer as ShapeLayer);
  }

  return canvas.toDataURL(`image/${format}`, quality);
};

export const exportDesignToBlob = async (
  width: number,
  height: number,
  backgroundColor: string,
  backgroundImageUrl: string | null,
  layers: Layer[],
  filters?: CanvasFilters,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality: number = 0.95
): Promise<Blob> => {
  const dataUrl = await exportDesignToImage(width, height, backgroundColor, backgroundImageUrl, layers, filters, format, quality);
  const response = await fetch(dataUrl);
  return await response.blob();
};

export const exportToSVG = async (width: number, height: number, backgroundColor: string, layers: Layer[]): Promise<string> => {
   // Simplified SVG export placeholder
   return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
     <rect width="100%" height="100%" fill="${backgroundColor}" />
     ${layers.map(l => `<g id="${l.id}"></g>`).join('')}
   </svg>`;
};

/* --- HELPER FUNCTIONS --- */

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

const drawImageLayerToContext = async (ctx: CanvasRenderingContext2D, layer: ImageLayer) => {
  try {
    const img = await loadImage(layer.src);
    ctx.save();
    ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.globalAlpha = layer.opacity;
    ctx.drawImage(img, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
    ctx.restore();
  } catch (err) {
    console.warn('Failed to draw image layer', err);
  }
};

const drawTextLayerToContext = (ctx: CanvasRenderingContext2D, layer: TextLayer) => {
  ctx.save();
  ctx.translate(layer.x, layer.y);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  ctx.globalAlpha = layer.opacity;
  ctx.fillStyle = layer.color;
  ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
  ctx.textBaseline = 'top';
  ctx.fillText(layer.text, 0, 0);
  ctx.restore();
};

const drawShapeToContext = (ctx: CanvasRenderingContext2D, layer: ShapeLayer) => {
  if (layer.type === 'path' && layer.pathData) {
    ctx.save();
    ctx.translate(layer.x, layer.y);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.globalAlpha = layer.opacity;

    const p = new Path2D(layer.pathData);
    if (layer.id?.startsWith('draw_') || (layer as any).brushType) {
      ctx.strokeStyle = layer.stroke?.color || layer.color;
      ctx.lineWidth = layer.stroke?.width || 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(p);
    } else {
      ctx.fillStyle = layer.color || '#333333';
      ctx.fill(p);
    }
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  ctx.globalAlpha = layer.opacity;
  ctx.fillStyle = layer.color;
  
  if (layer.type === 'rectangle') {
    ctx.fillRect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
  } else if (layer.type === 'circle') {
    ctx.beginPath();
    ctx.arc(0, 0, layer.width / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};
