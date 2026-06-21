import { TextLayer, ShapeLayer, ImageLayer, CanvasFilters, Layer } from '../types';
import { writePsd, Psd } from 'ag-psd';
import { logSecurityEvent } from '../utils/securityLogger';
import { renderMultilineText } from '../utils/textRendering';
import { buildFilterString } from '../utils/layers';
import { getLayerClipPath } from '../utils/layerRendering';

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

import { supabase } from '../lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../utils/log';

/**
 * Exports the design as a print-ready PDF via Worker or Serverless API.
 */
export const exportToPrintPDF = async (
  width: number,
  height: number,
  imgDataUrl: string,
  fileName: string,
  options: PDFExportOptions
) => {
  // If CMYK is selected, we must use the true ICC conversion serverless backend
  if (
    options.colorProfile === 'CMYK' ||
    options.colorProfile === 'FOGRA39' ||
    options.colorProfile === 'SWOP' ||
    options.colorProfile === 'GRACoL'
  ) {
    return (async () => {
      try {
        let imageUrlToProcess = imgDataUrl;

        // 1. Convert Data URL to Blob
        const response = await fetch(imgDataUrl);
        const blob = await response.blob();

        // 2. To bypass Vercel's 4.5MB request limit, upload to Supabase Storage if possible
        if (blob.size > 2 * 1024 * 1024) {
          // If larger than 2MB
          const tempFileName = `temp_${uuidv4()}.png`;
          const { error } = await supabase.storage
            .from('exports')
            .upload(tempFileName, blob, { contentType: 'image/png' });

          if (!error) {
            const { data } = supabase.storage.from('exports').getPublicUrl(tempFileName);
            imageUrlToProcess = data.publicUrl;
          }
        }

        // 3. Call Serverless API
        const apiResponse = await fetch('/api/export-cmyk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: imageUrlToProcess,
            bleed: options.bleed,
          }),
        });

        if (!apiResponse.ok) {
          throw new Error('CMYK Conversion failed on server');
        }

        // 4. Download Result
        const pdfBlob = await apiResponse.blob();
        downloadBlob(pdfBlob, fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
        logSecurityEvent('DATA_EXPORT', 'current_user', { fileName, options, format: 'pdf' });
      } catch (err) {
        log.error('Serverless CMYK Export Error', err, { fileName, options, width, height });
        return fallbackToWorker(width, height, imgDataUrl, fileName, options);
      }
    })();
  }

  // Standard sRGB export uses the client-side worker
  return fallbackToWorker(width, height, imgDataUrl, fileName, options);
};

const fallbackToWorker = (
  width: number,
  height: number,
  imgDataUrl: string,
  fileName: string,
  options: PDFExportOptions
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      const worker = new Worker(new URL('../workers/pdf.worker.ts', import.meta.url), { type: 'module' });

      worker.onmessage = (e) => {
        const { type, payload, error } = e.data;
        if (type === 'SUCCESS') {
          downloadBlob(payload, fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
          logSecurityEvent('DATA_EXPORT', 'current_user', { fileName, options, format: 'pdf_worker' });
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
export const exportToLayeredPSD = async (width: number, height: number, layers: Layer[], fileName: string) => {
  const psd: Psd = {
    width,
    height,
    children: [],
  };

  for (const layer of layers) {
    if (!layer.visible) {
      continue;
    }

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
  logSecurityEvent('DATA_EXPORT', 'current_user', { fileName, format: 'psd' });
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

  if (!ctx) {
    throw new Error('Could not create canvas context');
  }

  if (backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  if (backgroundImageUrl) {
    try {
      const img = await loadImage(backgroundImageUrl);
      ctx.save();
      if (filters) {
        ctx.filter = buildFilterString(filters);
        ctx.globalAlpha = filters.opacity;
      }
      ctx.drawImage(img, 0, 0, width, height);
      ctx.restore();
    } catch (err: any) {
      log.warn('Failed to load bg image', { error: err.message, src: backgroundImageUrl });
    }
  }

  for (const layer of layers) {
    if (!layer.visible) {
      continue;
    }
    if (layer.type === 'image') {
      await drawImageLayerToContext(ctx, layer as ImageLayer);
    } else if (layer.type === 'text') {
      drawTextLayerToContext(ctx, layer as TextLayer);
    } else if (layer.type !== 'adjustment' && layer.type !== 'group') {
      drawShapeToContext(ctx, layer as ShapeLayer);
    }
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
  const dataUrl = await exportDesignToImage(
    width,
    height,
    backgroundColor,
    backgroundImageUrl,
    layers,
    filters,
    format,
    quality
  );
  const response = await fetch(dataUrl);
  return await response.blob();
};

export const exportToSVG = (
  width: number,
  height: number,
  backgroundColor: string,
  layers: Layer[]
): string => {
  const svgParts: string[] = [
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`,
    `  <defs>`,
  ];

  // Collect all gradient definitions
  const gradientDefs: string[] = [];
  for (const layer of layers) {
    if (layer.type === 'shape' || layer.type === 'path') {
      const sl = layer as ShapeLayer;
      if (sl.gradient && sl.gradient.enabled && sl.gradient.colors.length > 0) {
        const gradId = `grad-${sl.id}`;
        if (sl.gradient.type === 'radial') {
          gradientDefs.push(
            `    <radialGradient id="${gradId}" cx="50%" cy="50%" r="50%">` +
            sl.gradient.colors.map((c: any) => `<stop offset="${c.position * 100}%" stop-color="${c.color}" />`).join('') +
            `</radialGradient>`
          );
        } else {
          const angle = sl.gradient.angle || 0;
          gradientDefs.push(
            `    <linearGradient id="${gradId}" gradientTransform="rotate(${angle}, 0.5, 0.5)" x1="0%" y1="0%" x2="100%" y2="0%">` +
            sl.gradient.colors.map((c: any) => `<stop offset="${c.position * 100}%" stop-color="${c.color}" />`).join('') +
            `</linearGradient>`
          );
        }
      }
    }
  }
  svgParts.push(...gradientDefs);
  svgParts.push(`  </defs>`);

  svgParts.push(`  <rect width="100%" height="100%" fill="${backgroundColor}" />`);

  for (const layer of layers) {
    if (!layer.visible) continue;

    const transform = [
      `translate(${layer.x + ('width' in layer ? (layer as any).width / 2 : 0)}, ${layer.y + ('height' in layer ? (layer as any).height / 2 : 0)})`,
      `rotate(${layer.rotation || 0})`,
    ].join(' ');

    const opacity = layer.opacity ?? 1;

    if (layer.type !== 'text' && layer.type !== 'image') {
      const sl = layer as ShapeLayer;
      let shape = '';
      const fill = sl.gradient?.enabled ? `url(#grad-${sl.id})` : sl.color;

      if (sl.type === 'rectangle') {
        const r = sl.cornerRadius || 0;
        if (r > 0) {
          shape = `<rect x="${-sl.width / 2}" y="${-sl.height / 2}" width="${sl.width}" height="${sl.height}" rx="${r}" fill="${fill}" />`;
        } else {
          shape = `<rect x="${-sl.width / 2}" y="${-sl.height / 2}" width="${sl.width}" height="${sl.height}" fill="${fill}" />`;
        }
      } else if (sl.type === 'circle') {
        shape = `<circle cx="0" cy="0" r="${sl.width / 2}" fill="${sl.color}" />`;
      } else if (sl.type === 'path' && sl.pathData) {
        shape = `<path d="${sl.pathData}" fill="${sl.id?.startsWith('draw_') || (sl as any).brushType ? 'none' : sl.color}" stroke="${(sl as any).stroke?.color || sl.color}" stroke-width="${(sl as any).stroke?.width || 0}" />`;
      } else {
        const clipPath = getLayerClipPath(layer);
        if (clipPath && clipPath.startsWith('polygon')) {
          const match = clipPath.match(/polygon\((.*)\)/);
          if (match) {
            const pts = match[1].split(',').map((p) => {
              const [xPerc, yPerc] = p.trim().split(/\s+/).map(parseFloat);
              return `${(xPerc / 100) * sl.width - sl.width / 2},${(yPerc / 100) * sl.height - sl.height / 2}`;
            });
            shape = `<polygon points="${pts.join(' ')}" fill="${sl.color}" />`;
          }
        }
      }

      if (shape) {
        svgParts.push(`  <g transform="${transform}" opacity="${opacity}">${shape}</g>`);
      }
    } else if (layer.type === 'text') {
      const tl = layer as TextLayer;
      const textLines = (tl.text || '').split('\n');
      const lineHeight = tl.fontSize * (tl.lineHeight || 1.2);
      const textContent = textLines
        .map((line, i) => `<tspan x="0" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
        .join('');
      const textAnchor = tl.textAlign === 'center' ? 'middle' : tl.textAlign === 'right' ? 'end' : 'start';
      svgParts.push(
        `  <g transform="${transform}" opacity="${opacity}">` +
          `<text font-family="${escapeXml(tl.fontFamily)}" font-size="${tl.fontSize}" fill="${tl.color}" text-anchor="${textAnchor}" font-weight="${tl.fontWeight}">${textContent}</text>` +
          `</g>`
      );
    } else if (layer.type === 'image') {
      const il = layer as ImageLayer;
      svgParts.push(
        `  <g transform="${transform}" opacity="${opacity}">` +
          `<image href="${il.src}" x="${-il.width / 2}" y="${-il.height / 2}" width="${il.width}" height="${il.height}" />` +
          `</g>`
      );
    }
  }

  svgParts.push('</svg>');
  return svgParts.join('\n');
};

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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

    // Apply perspective transform if set
    if (layer.perspective) {
      ctx.transform(
        1, 0,
        Math.tan(((layer.rotateY || 0) * Math.PI) / 180) * 0.01,
        1,
        0, 0
      );
    }

    // Apply skew
    if (layer.skewX || layer.skewY) {
      ctx.transform(1, Math.tan(((layer.skewY || 0) * Math.PI) / 180), Math.tan(((layer.skewX || 0) * Math.PI) / 180), 1, 0, 0);
    }

    // Apply flip
    const scaleX = layer.flipX ? -1 : 1;
    const scaleY = layer.flipY ? -1 : 1;
    ctx.scale(scaleX, scaleY);

    // Apply CSS filters if present
    if (layer.filters) {
      const filterStr = buildFilterString(layer.filters);
      if (filterStr && filterStr !== 'none') {
        ctx.filter = filterStr;
      }
    }

    ctx.drawImage(img, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
    ctx.restore();
  } catch (err: any) {
    log.warn('Failed to draw image layer', { error: err.message, layerId: layer.id, src: layer.src });
  }
};

const drawTextLayerToContext = (ctx: CanvasRenderingContext2D, layer: TextLayer) => {
  ctx.save();
  ctx.translate(layer.x, layer.y);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  ctx.globalAlpha = layer.opacity;

  // Use shared multiline layout renderer
  renderMultilineText(ctx, layer);

  ctx.restore();
};

const drawShapeToContext = (ctx: CanvasRenderingContext2D, layer: ShapeLayer) => {
  ctx.save();
  ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  ctx.globalAlpha = layer.opacity;

  // Apply perspective
  if (layer.perspective) {
    ctx.transform(1, 0, Math.tan(((layer.rotateY || 0) * Math.PI) / 180) * 0.01, 1, 0, 0);
  }

  // Apply skew
  if (layer.skewX || layer.skewY) {
    ctx.transform(1, Math.tan(((layer.skewY || 0) * Math.PI) / 180), Math.tan(((layer.skewX || 0) * Math.PI) / 180), 1, 0, 0);
  }

  // Apply CSS filters
  if (layer.filters) {
    const filterStr = buildFilterString(layer.filters);
    if (filterStr && filterStr !== 'none') {
      ctx.filter = filterStr;
    }
  }

  if (layer.type === 'path' && layer.pathData) {
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

  ctx.fillStyle = layer.color;
  const r = layer.cornerRadius || 0;

  if (layer.type === 'rectangle') {
    if (r > 0) {
      const x = -layer.width / 2;
      const y = -layer.height / 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + layer.width - r, y);
      ctx.quadraticCurveTo(x + layer.width, y, x + layer.width, y + r);
      ctx.lineTo(x + layer.width, y + layer.height - r);
      ctx.quadraticCurveTo(x + layer.width, y + layer.height, x + layer.width - r, y + layer.height);
      ctx.lineTo(x + r, y + layer.height);
      ctx.quadraticCurveTo(x, y + layer.height, x, y + layer.height - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
    }
  } else if (layer.type === 'circle') {
    ctx.beginPath();
    ctx.arc(0, 0, layer.width / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (layer.type === 'triangle') {
    ctx.beginPath();
    ctx.moveTo(0, -layer.height / 2);
    ctx.lineTo(layer.width / 2, layer.height / 2);
    ctx.lineTo(-layer.width / 2, layer.height / 2);
    ctx.closePath();
    ctx.fill();
  } else if (layer.type === 'star') {
    const cx = 0, cy = 0;
    const outerR = layer.width / 2;
    const innerR = outerR * 0.4;
    const points = 5;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const radius = i % 2 === 0 ? outerR : innerR;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
};

/**
 * Batch export multiple artboards as PNGs or SVGs.
 */
export const batchExportArtboards = async (
  artboards: Array<{ name: string; width: number; height: number; layers: Layer[]; backgroundColor: string }>,
  format: 'png' | 'svg' = 'png'
): Promise<void> => {
  for (let i = 0; i < artboards.length; i++) {
    const ab = artboards[i];
    const filename = ab.name || `Artboard ${i + 1}`;

    if (format === 'svg') {
      const svg = exportToSVG(ab.width, ab.height, ab.backgroundColor, ab.layers);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      downloadBlob(blob, `${filename}.svg`);
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = ab.width;
      canvas.height = ab.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.fillStyle = ab.backgroundColor;
      ctx.fillRect(0, 0, ab.width, ab.height);

      for (const layer of ab.layers) {
        if (!layer.visible) continue;
        if (layer.type === 'text') {
          drawTextLayerToContext(ctx, layer as TextLayer);
        } else if (layer.type === 'image') {
          await drawImageLayerToContext(ctx, layer as ImageLayer);
        } else {
          drawShapeToContext(ctx, layer as ShapeLayer);
        }
      }

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
      });
      downloadBlob(blob, `${filename}.png`);
    }

    if (i < artboards.length - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
};
