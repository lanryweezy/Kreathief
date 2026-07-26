/**
 * Native PDF Generation Service
 *
 * Renders artboard layers directly to jsPDF using native vector primitives.
 * Text is selectable, shapes are vector, images are embedded at full resolution.
 * Falls back to raster embedding for individual layers with complex effects.
 */
import { jsPDF } from 'jspdf';
import { Layer, ShapeLayer, TextLayer, ImageLayer, GroupLayer, AdjustmentLayer, Artboard } from '../types';
import { getLayerClipPath } from '../utils/layerRendering';
import { downloadBlob, exportDesignToImage } from './exportService';
import { logSecurityEvent } from '../utils/securityLogger';
import { log } from '../utils/log';
import { resolveTextLines } from '../utils/textRendering';

// Conversion: 1px = 0.75pt (at 72 DPI)
const PX_TO_PT = 72 / 96;

function pxToPt(px: number): number {
  return px * PX_TO_PT;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function parseColor(color: string): { r: number; g: number; b: number; a: number } {
  if (!color) return { r: 0, g: 0, b: 0, a: 1 };

  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    if (color.length === 9) {
      const a = parseInt(color.substring(7, 9), 16) / 255;
      return { ...rgb, a };
    }
    return { ...rgb, a: 1 };
  }

  if (color.startsWith('rgba')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: match[4] ? parseFloat(match[4]) : 1,
      };
    }
  }

  if (color.startsWith('rgb')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: 1,
      };
    }
  }

  return { r: 0, g: 0, b: 0, a: 1 };
}

/**
 * Checks if a layer has complex effects that require raster fallback.
 */
function hasComplexEffects(layer: Layer): boolean {
  if ((layer as any).blendMode && (layer as any).blendMode !== 'normal') return true;
  if ((layer as any).maskPath || (layer as any).maskDataURL) return true;
  if ((layer as any).filters) {
    const f = (layer as any).filters;
    if (f.blur > 0 || f.grayscale > 0 || f.sepia > 0 || f.hueRotate !== 0) return true;
  }
  if ((layer as any).shadow) return true;
  if (layer.type === 'text') {
    const tl = layer as TextLayer;
    if (tl.gradient?.enabled) return true;
    if (tl.curve && tl.curve !== 0) return true;
    if (tl.warpStyle && tl.warpStyle !== 'none') return true;
    if (tl.styleType && tl.styleType !== 'normal') return true;
    if (tl.textPath) return true;
    if (tl.neonGlow?.enabled) return true;
  }
  const type = layer.type as any;
  if (type === 'rectangle' || type === 'circle' || type === 'path' || type === 'triangle' || type === 'star' || type === 'polygon') {
    const sl = layer as ShapeLayer;
    if (sl.gradient?.enabled) return true;
    if (sl.imageFill) return true;
    if (sl.backgroundImage) return true;
  }
  return false;
}

/**
 * Rasterize a single layer into a data URL using the existing canvas strategy.
 */
async function rasterizeLayer(layer: Layer, width: number, height: number): Promise<string> {
  const blob = await exportDesignToImage([layer as any], { width, height, format: 'png', background: false });
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Load an image and return it as a data URL for embedding.
 */
function loadImageAsDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (src.startsWith('data:')) {
      resolve(src);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Draw a text layer natively to jsPDF.
 */
function drawTextLayer(pdf: jsPDF, layer: TextLayer): void {
  const { r, g, b } = parseColor(layer.color);
  pdf.setTextColor(r, g, b);

  const fontSizePt = layer.fontSize * PX_TO_PT;
  pdf.setFontSize(fontSizePt);

  // Map font weight
  let fontStyle = 'normal';
  const weight = parseInt(layer.fontWeight) || 400;
  const isItalic = layer.fontStyle === 'italic';
  if (weight >= 700 && isItalic) {
    fontStyle = 'bolditalic';
  } else if (weight >= 700) {
    fontStyle = 'bold';
  } else if (isItalic) {
    fontStyle = 'italic';
  }

  // Use Helvetica as fallback (always available in jsPDF)
  try {
    pdf.setFont('helvetica', fontStyle);
  } catch {
    pdf.setFont('helvetica', 'normal');
  }

  let text = layer.text || '';
  if (layer.textTransform === 'uppercase') text = text.toUpperCase();
  if (layer.textTransform === 'lowercase') text = text.toLowerCase();

  const lines = resolveTextLines(layer);
  const lineHeight = layer.fontSize * (layer.lineHeight || 1.2);

  // Determine text alignment
  const align: 'left' | 'center' | 'right' | 'justify' = layer.textAlign || 'left';
  let xOffset = pxToPt(layer.x);

  if (align === 'center') {
    xOffset = pxToPt(layer.x + layer.width / 2);
  } else if (align === 'right') {
    xOffset = pxToPt(layer.x + layer.width);
  }

  const yStart = pxToPt(layer.y + layer.fontSize);

  // Handle letter spacing
  if (layer.letterSpacing && layer.letterSpacing !== 0) {
    pdf.setCharSpace(layer.letterSpacing * PX_TO_PT);
  }

  lines.forEach((line, i) => {
    const yPos = yStart + pxToPt(lineHeight * i);
    pdf.text(line, xOffset, yPos, {
      align: align === 'justify' ? 'left' : align,
      maxWidth: pxToPt(layer.width),
    });
  });

  // Reset char space
  if (layer.letterSpacing && layer.letterSpacing !== 0) {
    pdf.setCharSpace(0);
  }
}

/**
 * Draw a shape layer natively to jsPDF.
 */
function drawShapeLayer(pdf: jsPDF, layer: ShapeLayer): void {
  const { r, g, b } = parseColor(layer.color);
  const x = pxToPt(layer.x);
  const y = pxToPt(layer.y);
  const w = pxToPt(layer.width);
  const h = pxToPt(layer.height);

  pdf.setFillColor(r, g, b);

  // Handle stroke
  const stroke = (layer as any).stroke;
  let drawMode: 'F' | 'S' | 'FD' = 'F';
  if (stroke && stroke.width > 0) {
    const sc = parseColor(stroke.color || '#000000');
    pdf.setDrawColor(sc.r, sc.g, sc.b);
    pdf.setLineWidth(pxToPt(stroke.width));
    drawMode = 'FD';
  }

  const shapeType = layer.type as string;

  if (shapeType === 'rectangle' || shapeType === 'shape') {
    const radius = layer.cornerRadius || 0;
    if (radius > 0) {
      pdf.roundedRect(x, y, w, h, pxToPt(radius), pxToPt(radius), drawMode);
    } else {
      pdf.rect(x, y, w, h, drawMode);
    }
  } else if (shapeType === 'circle') {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const rx = w / 2;
    const ry = h / 2;
    pdf.ellipse(cx, cy, rx, ry, drawMode);
  } else if (shapeType === 'path' && layer.pathData) {
    drawSvgPathToPdf(pdf, layer.pathData, { r, g, b }, stroke);
  } else {
    // Polygons (hexagon, diamond, star, etc.)
    const clipPath = getLayerClipPath(layer);
    if (clipPath && clipPath.startsWith('polygon')) {
      drawPolygonToPdf(pdf, clipPath, layer, drawMode);
    } else {
      pdf.rect(x, y, w, h, drawMode);
    }
  }
}

/**
 * Parse and draw an SVG path string to jsPDF using line segments.
 */
function drawSvgPathToPdf(
  pdf: jsPDF,
  pathData: string,
  fillColor: { r: number; g: number; b: number },
  stroke: any
): void {
  pdf.setFillColor(fillColor.r, fillColor.g, fillColor.b);

  if (stroke && stroke.width > 0) {
    const sc = parseColor(stroke.color || '#000000');
    pdf.setDrawColor(sc.r, sc.g, sc.b);
    pdf.setLineWidth(pxToPt(stroke.width));
  }

  const commands = pathData.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

  for (const cmd of commands) {
    const type = cmd[0];
    const nums = cmd
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(parseFloat)
      .filter((n) => !isNaN(n));

    switch (type.toUpperCase()) {
      case 'M':
        currentX = pxToPt(nums[0]);
        currentY = pxToPt(nums[1]);
        startX = currentX;
        startY = currentY;
        break;
      case 'L': {
        const lx = pxToPt(nums[0]);
        const ly = pxToPt(nums[1]);
        segments.push({ x1: currentX, y1: currentY, x2: lx, y2: ly });
        currentX = lx;
        currentY = ly;
        break;
      }
      case 'H': {
        const hx = pxToPt(nums[0]);
        segments.push({ x1: currentX, y1: currentY, x2: hx, y2: currentY });
        currentX = hx;
        break;
      }
      case 'V': {
        const vy = pxToPt(nums[0]);
        segments.push({ x1: currentX, y1: currentY, x2: currentX, y2: vy });
        currentY = vy;
        break;
      }
      case 'Z':
        segments.push({ x1: currentX, y1: currentY, x2: startX, y2: startY });
        currentX = startX;
        currentY = startY;
        break;
    }
  }

  for (const seg of segments) {
    pdf.line(seg.x1, seg.y1, seg.x2, seg.y2);
  }
}

/**
 * Draw a CSS polygon clip-path shape to jsPDF.
 */
function drawPolygonToPdf(pdf: jsPDF, clipPath: string, layer: ShapeLayer, drawMode: 'F' | 'S' | 'FD'): void {
  const match = clipPath.match(/polygon\((.*)\)/);
  if (!match) return;

  const { r, g, b } = parseColor(layer.color);
  pdf.setFillColor(r, g, b);

  const points = match[1].split(',').map((p) => {
    const [xPerc, yPerc] = p.trim().split(/\s+/).map(parseFloat);
    return {
      x: pxToPt(layer.x + (xPerc / 100) * layer.width),
      y: pxToPt(layer.y + (yPerc / 100) * layer.height),
    };
  });

  if (points.length < 3) return;

  if (points.length === 3) {
    pdf.triangle(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y, drawMode);
  } else {
    for (let i = 0; i < points.length; i++) {
      const next = points[(i + 1) % points.length];
      pdf.line(points[i].x, points[i].y, next.x, next.y);
    }
  }
}

/**
 * Draw an image layer to jsPDF, with optional Pro auto-upscale for low-DPI images.
 */
async function drawImageLayer(pdf: jsPDF, layer: ImageLayer, isPro = false): Promise<void> {
  if (!layer.src) return;

  try {
    let srcToEmbed = layer.src;

    if (isPro) {
      // Upscale service not available — use original image
    }

    const dataUrl = await loadImageAsDataUrl(srcToEmbed);
    const imgFormat = dataUrl.includes('image/png') ? 'PNG' : 'JPEG';

    const x = pxToPt(layer.x);
    const y = pxToPt(layer.y);
    const w = pxToPt(layer.width);
    const h = pxToPt(layer.height);

    pdf.addImage(dataUrl, imgFormat, x, y, w, h);
  } catch (err) {
    log.warn('[NativePDF] Failed to embed image layer', { layerId: layer.id, error: err });
  }
}

/**
 * Draw a table layer to jsPDF.
 */
function drawTableLayer(pdf: jsPDF, layer: any): void {
  const x = pxToPt(layer.x);
  const y = pxToPt(layer.y);
  const w = pxToPt(layer.width);
  const h = pxToPt(layer.height);

  const cols = layer.columns || [];
  const rows = layer.rows || [];
  const totalRows = rows.length + 1;
  const colWidth = cols.length > 0 ? w / cols.length : w;
  const rowHeight = totalRows > 0 ? h / totalRows : 20;

  const fontSize = (layer.fontSize || 10) * PX_TO_PT;
  pdf.setFontSize(fontSize);

  // Draw header
  const headerColor = parseColor(layer.headerColor || '#333333');
  pdf.setFillColor(headerColor.r, headerColor.g, headerColor.b);
  pdf.rect(x, y, w, rowHeight, 'F');

  const textColor = parseColor(layer.textColor || '#ffffff');
  pdf.setTextColor(textColor.r, textColor.g, textColor.b);

  cols.forEach((col: string, i: number) => {
    pdf.text(col, x + colWidth * i + 4, y + rowHeight * 0.65, {
      maxWidth: colWidth - 8,
    });
  });

  // Draw rows
  const cellColor = parseColor(layer.cellColor || '#ffffff');
  const rowTextColor = parseColor(layer.textColor || '#000000');

  rows.forEach((row: string[], rowIdx: number) => {
    const ry = y + rowHeight * (rowIdx + 1);
    pdf.setFillColor(cellColor.r, cellColor.g, cellColor.b);
    pdf.rect(x, ry, w, rowHeight, 'F');

    const borderColor = parseColor(layer.borderColor || '#e0e0e0');
    pdf.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
    pdf.setLineWidth(0.5);
    pdf.rect(x, ry, w, rowHeight, 'S');

    pdf.setTextColor(rowTextColor.r, rowTextColor.g, rowTextColor.b);
    row.forEach((cell: string, colIdx: number) => {
      pdf.text(cell || '', x + colWidth * colIdx + 4, ry + rowHeight * 0.65, {
        maxWidth: colWidth - 8,
      });
    });
  });
}

/**
 * Draw crop marks on the PDF page.
 */
function drawCropMarks(pdf: jsPDF, pageW: number, pageH: number, bleed: number): void {
  const markLen = pxToPt(20);
  const bleedPt = pxToPt(bleed);

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.25);

  // Top-left
  pdf.line(bleedPt - markLen, bleedPt, bleedPt - 2, bleedPt);
  pdf.line(bleedPt, bleedPt - markLen, bleedPt, bleedPt - 2);
  // Top-right
  pdf.line(pageW - bleedPt + 2, bleedPt, pageW - bleedPt + markLen, bleedPt);
  pdf.line(pageW - bleedPt, bleedPt - markLen, pageW - bleedPt, bleedPt - 2);
  // Bottom-left
  pdf.line(bleedPt - markLen, pageH - bleedPt, bleedPt - 2, pageH - bleedPt);
  pdf.line(bleedPt, pageH - bleedPt + 2, bleedPt, pageH - bleedPt + markLen);
  // Bottom-right
  pdf.line(pageW - bleedPt + 2, pageH - bleedPt, pageW - bleedPt + markLen, pageH - bleedPt);
  pdf.line(pageW - bleedPt, pageH - bleedPt + 2, pageW - bleedPt, pageH - bleedPt + markLen);
}

export interface NativePdfOptions {
  bleed?: number;
  cropMarks?: boolean;
  fileName?: string;
  /** Enable Pro-tier auto-upscale of low-DPI images before embedding */
  isPro?: boolean;
}

/**
 * Export a single artboard to a native vector PDF.
 */
export async function exportArtboardToNativePdf(
  artboard: Artboard,
  backgroundColor: string,
  options: NativePdfOptions = {}
): Promise<Blob> {
  const { bleed = 0, cropMarks = false } = options;

  const totalWidth = artboard.width + bleed * 2;
  const totalHeight = artboard.height + bleed * 2;

  const pageW = pxToPt(totalWidth);
  const pageH = pxToPt(totalHeight);

  const orientation = pageW > pageH ? 'landscape' : 'portrait';

  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: [pageW, pageH],
    compress: true,
  });

  // Fill background
  if (backgroundColor && backgroundColor !== 'transparent') {
    const bg = parseColor(backgroundColor);
    pdf.setFillColor(bg.r, bg.g, bg.b);
    pdf.rect(0, 0, pageW, pageH, 'F');
  }

  // Render layers
  const visibleLayers = (artboard.layers || []).filter((l: any) => l.visible !== false);

  for (const layer of visibleLayers) {
    if (layer.type === 'adjustment' || layer.type === 'group') continue;

    // Apply opacity via graphics state
    const opacity = layer.opacity !== undefined ? layer.opacity : 1;
    if (opacity < 1) {
      try {
        const gState = (pdf as any).GState({ opacity });
        (pdf as any).setGState(gState);
      } catch {
        // GState not supported in older jsPDF builds -- skip
      }
    }

    // Offset by bleed
    const offsetLayer = bleed > 0 ? ({ ...layer, x: layer.x + bleed, y: layer.y + bleed } as any) : layer;
    await drawLayerToPdf(pdf, offsetLayer, options.isPro ?? false);

    // Reset opacity
    if (opacity < 1) {
      try {
        const resetState = (pdf as any).GState({ opacity: 1 });
        (pdf as any).setGState(resetState);
      } catch {
        // skip
      }
    }
  }

  // Draw crop marks if enabled
  if (cropMarks && bleed > 0) {
    drawCropMarks(pdf, pageW, pageH, bleed);
  }

  return pdf.output('blob');
}

/**
 * Draw a single layer to PDF, using native rendering or raster fallback.
 */
async function drawLayerToPdf(pdf: jsPDF, layer: Layer, isPro = false): Promise<void> {
  // Check if this layer needs raster fallback
  if (hasComplexEffects(layer)) {
    try {
      const rasterWidth = Math.ceil(layer.width * 2);
      const rasterHeight = Math.ceil((layer as any).height * 2 || layer.width * 2);

      const zeroPosLayer = { ...layer, x: 0, y: 0 } as any;
      const dataUrl = await rasterizeLayer(zeroPosLayer, rasterWidth, rasterHeight);

      pdf.addImage(
        dataUrl,
        'PNG',
        pxToPt(layer.x),
        pxToPt(layer.y),
        pxToPt(layer.width),
        pxToPt((layer as any).height || layer.width)
      );
    } catch (err) {
      log.warn('[NativePDF] Raster fallback failed for layer', { layerId: layer.id, error: err });
    }
    return;
  }

  // Native rendering by layer type
  switch ((layer.type as any)) {
    case 'text':
      drawTextLayer(pdf, layer as TextLayer);
      break;
    case 'image':
      await drawImageLayer(pdf, layer as ImageLayer, isPro);
      break;
    case 'table':
      drawTableLayer(pdf, layer as any);
      break;
    default:
      drawShapeLayer(pdf, layer as ShapeLayer);
      break;
  }
}

/**
 * Export multiple artboards as a multi-page native PDF.
 */
export async function exportToNativePdf(
  artboards: Artboard[],
  backgroundColor: string,
  fileName: string,
  options: NativePdfOptions = {}
): Promise<void> {
  const { bleed = 0, cropMarks = false } = options;

  if (artboards.length === 0) {
    throw new Error('No artboards to export');
  }

  // Single artboard shortcut
  if (artboards.length === 1) {
    const blob = await exportArtboardToNativePdf(artboards[0], backgroundColor, options);
    downloadBlob(blob, fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
    logSecurityEvent('DATA_EXPORT', 'current_user', { fileName, format: 'native_pdf', pages: 1 });
    return;
  }

  // Multi-page
  const first = artboards[0];
  const firstTotalW = first.width + bleed * 2;
  const firstTotalH = first.height + bleed * 2;
  const firstPageW = pxToPt(firstTotalW);
  const firstPageH = pxToPt(firstTotalH);
  const orientation = firstPageW > firstPageH ? 'landscape' : 'portrait';

  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: [firstPageW, firstPageH],
    compress: true,
  });

  for (let i = 0; i < artboards.length; i++) {
    const artboard = artboards[i];

    if (i > 0) {
      const totalW = artboard.width + bleed * 2;
      const totalH = artboard.height + bleed * 2;
      const pageW = pxToPt(totalW);
      const pageH = pxToPt(totalH);
      pdf.addPage([pageW, pageH], pageW > pageH ? 'landscape' : 'portrait');
    }

    // Fill background
    const bg = artboard.backgroundColor || backgroundColor;
    if (bg && bg !== 'transparent') {
      const bgColor = parseColor(bg);
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      pdf.setFillColor(bgColor.r, bgColor.g, bgColor.b);
      pdf.rect(0, 0, pageW, pageH, 'F');
    }

    // Render layers
    const visibleLayers = (artboard.layers || []).filter((l: any) => l.visible !== false);

    for (const layer of visibleLayers) {
      if (layer.type === 'adjustment' || layer.type === 'group') continue;

      const opacity = layer.opacity !== undefined ? layer.opacity : 1;
      if (opacity < 1) {
        try {
          const gState = (pdf as any).GState({ opacity });
          (pdf as any).setGState(gState);
        } catch {
          /* skip */
        }
      }

      const offsetLayer = bleed > 0 ? ({ ...layer, x: layer.x + bleed, y: layer.y + bleed } as any) : layer;
      await drawLayerToPdf(pdf, offsetLayer, options.isPro ?? false);

      if (opacity < 1) {
        try {
          const resetState = (pdf as any).GState({ opacity: 1 });
          (pdf as any).setGState(resetState);
        } catch {
          /* skip */
        }
      }
    }

    // Crop marks
    if (cropMarks && bleed > 0) {
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      drawCropMarks(pdf, pageW, pageH, bleed);
    }
  }

  const blob = pdf.output('blob');
  downloadBlob(blob, fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
  logSecurityEvent('DATA_EXPORT', 'current_user', {
    fileName,
    format: 'native_pdf',
    pages: artboards.length,
  });
}
