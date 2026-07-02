/**
 * Text Rendering Utilities
 * Helper functions for rendering text on path and warped text
 */

import { TextLayer } from '../types';
import { GeometryOracle } from './geometryOracle';
import { warpRegistry } from './layers/warpRegistry';

/**
 * Apply text shadow from layer to canvas context
 */
function applyTextShadow(ctx: CanvasRenderingContext2D, layer: TextLayer): void {
  const shadow = layer.shadow;
  if (shadow) {
    ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = shadow.blur || 0;
    ctx.shadowOffsetX = shadow.offsetX || 0;
    ctx.shadowOffsetY = shadow.offsetY || 0;
  }
}

/**
 * Reset shadow settings on canvas context
 */
function resetShadow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Apply stroke before fill if textStroke exists
 */
function applyTextStroke(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  layer: TextLayer
): void {
  const stroke = layer.stroke;
  if (stroke && stroke.width > 0) {
    ctx.strokeStyle = stroke.color || '#000000';
    ctx.lineWidth = stroke.width;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, x, y);
  }
}

/**
 * Convert straight quotes to typographic curly quotes and double hyphens to em-dashes.
 */
export function applySmartQuotes(text: string): string {
  // Convert straight double quotes to curly quotes
  let result = text.replace(/(^|[\s[{(])"/g, '$1\u201c');
  result = result.replace(/"/g, '\u201d');

  // Convert straight single quotes to curly quotes
  result = result.replace(/(^|[\s[{(])'/g, '$1\u2018');
  result = result.replace(/'/g, '\u2019');

  // Convert double hyphens to em-dash
  result = result.replace(/--/g, '\u2014');

  return result;
}

/**
 * Applies text transformation (uppercase, lowercase) to the text string.
 * This ensures consistency across canvas export/preview and the editor DOM.
 */
export function applyTextTransform(text: string, transform?: 'none' | 'uppercase' | 'lowercase'): string {
  if (transform === 'uppercase') return text.toUpperCase();
  if (transform === 'lowercase') return text.toLowerCase();
  return text;
}


/**
 * Helper for rendering text along a path
 */
export const renderTextOnPath = (canvas: HTMLCanvasElement, layer: TextLayer) => {
  const ctx = canvas.getContext('2d');
  if (!ctx || !layer.textPath) {
    return;
  }

  const { text, color, fontSize, fontFamily, fontWeight, fontStyle, width } = layer;
  const dpr = 2; // High DPI

  canvas.width = width * dpr;
  canvas.height = width * dpr; // Square aspect for paths usually
  ctx.scale(dpr, dpr);
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  try { ctx.textRendering = 'optimizeLegibility'; } catch (_e) {}

  // Apply text effects
  applyTextShadow(ctx, layer);

  const pathMetrics = GeometryOracle.measurePath(layer.textPath);

  const processedText = applyTextTransform(text, layer.textTransform);

  const textWidth = ctx.measureText(processedText).width;

  // Center text on path
  const startOffset = (pathMetrics.totalLength - textWidth) / 2;

  let currentDistance = startOffset;
  for (let i = 0; i < processedText.length; i++) {
    const char = processedText[i];
    const charWidth = ctx.measureText(char).width;

    // Position at center of character
    const charMiddleDistance = currentDistance + charWidth / 2;

    if (charMiddleDistance >= 0 && charMiddleDistance <= pathMetrics.totalLength) {
      const { x, y, angle } = pathMetrics.getPointAt(charMiddleDistance);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      applyTextStroke(ctx, char, 0, 0, layer);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }

    currentDistance += charWidth;
  }

  resetShadow(ctx);
};

/**
 * Helper for rendering warped text to a canvas
 * Supports: arc, flag, rise, wave, fish, circle, distort, angle, mesh
 */
export const renderWarpedText = (canvas: HTMLCanvasElement, layer: TextLayer) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const {
    text,
    color,
    fontSize,
    fontFamily,
    fontWeight,
    fontStyle,
    warpStyle,
    transformType,
    curve = 0,
    transformIntensity = 50,
    transformDirection = 0,
    width,
    lineHeight = 1.2,
    textAlign = 'left',
  } = layer;

  const dpr = 2;
  const font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  const intensity = (transformType ? transformIntensity : curve) / 100;
  const effectType = transformType || warpStyle;

  const processedText = applyTextTransform(text, layer.textTransform);

  const lines = processedText.split('\n');
  const totalLineHeight = fontSize * lineHeight;
  const textBlockHeight = lines.length * totalLineHeight;

  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) {
    return;
  }

  tempCanvas.width = width * dpr;
  tempCanvas.height = (textBlockHeight + fontSize * 2) * dpr;
  tempCtx.scale(dpr, dpr);
  tempCtx.imageSmoothingEnabled = true;
  tempCtx.imageSmoothingQuality = 'high';

  tempCtx.font = font;
  tempCtx.fillStyle = color;
  tempCtx.textBaseline = 'top';
  tempCtx.textAlign = textAlign as CanvasTextAlign;
  try { tempCtx.textRendering = 'optimizeLegibility'; } catch (_e) {}

  // Apply text effects
  applyTextShadow(tempCtx, layer);

  // Get text metrics
  const textWidth = tempCtx.measureText(processedText).width;
  const startX = textAlign === 'center' ? (width - textWidth) / 2 : textAlign === 'right' ? width - textWidth : 10;

  // Render each character with transformations
  let charX = startX;
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const y = lineIdx * totalLineHeight + fontSize;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const charWidth = tempCtx.measureText(char).width;
      const progress = i / Math.max(line.length - 1, 1); // 0 to 1 across the line
      const angle = (transformDirection * Math.PI) / 180;

      tempCtx.save();
      tempCtx.translate(charX + charWidth / 2, y);

      // Apply different transform types
      if (effectType) {
        warpRegistry.applyTransform(effectType, tempCtx, progress, intensity, angle);
      }

      applyTextStroke(tempCtx, char, -charWidth / 2, 0, layer);
      tempCtx.fillText(char, -charWidth / 2, 0);
      tempCtx.restore();
      charX += charWidth;
    }
    charX = startX; // Reset for next line
  }

  resetShadow(tempCtx);

  // Copy to main canvas
  canvas.width = tempCanvas.width;
  canvas.height = tempCanvas.height;
  ctx.drawImage(tempCanvas, 0, 0);
};

/**
 * Render multiline text onto a 2D canvas context.
 * Handles word wrap, letter spacing, text alignment, and line height.
 */
export const renderMultilineText = (ctx: CanvasRenderingContext2D, layer: TextLayer) => {
  const {
    text,
    color,
    fontSize,
    fontFamily,
    fontWeight,
    fontStyle = 'normal',
    width,
    lineHeight = 1.2,
    textAlign = 'left',
    letterSpacing = 0,
  } = layer;

  const font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  try { ctx.textRendering = 'optimizeLegibility'; } catch (_e) {}

  // Apply text effects
  applyTextShadow(ctx, layer);

  // Helper for word wrapping
  const wrapText = (text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const wrappedLines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && i > 0) {
        wrappedLines.push(currentLine.trimEnd());
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    wrappedLines.push(currentLine.trimEnd());
    return wrappedLines;
  };

  const processedText = applyTextTransform(text, layer.textTransform);

  const manualLines = processedText.split('\n');
  const allLines: string[] = [];

  // Apply word wrap if width is defined
  if (width) {
    manualLines.forEach((line) => {
      allLines.push(...wrapText(line, width));
    });
  } else {
    allLines.push(...manualLines);
  }

  // Safe line height computation
  const lineHeightStr = lineHeight || 1.2;
  let lineHeightPx = fontSize * 1.2; // default
  if (typeof lineHeightStr === 'number') {
    lineHeightPx = fontSize * lineHeightStr;
  } else if (typeof lineHeightStr === 'string' && !isNaN(parseFloat(lineHeightStr as string))) {
    // Check if it's px or relative
    if ((lineHeightStr as string).endsWith('px')) {
      lineHeightPx = parseFloat(lineHeightStr as string);
    } else {
      lineHeightPx = fontSize * parseFloat(lineHeightStr as string);
    }
  }

  const spaceBeforeOffset = (layer as any).spaceBefore || 0;

  allLines.forEach((line, lineIndex) => {
    const yOffset = lineIndex * lineHeightPx + spaceBeforeOffset;
    let startX = 0;

    // Calculate line width with letter spacing
    let lineWidth = 0;
    if (letterSpacing !== 0) {
      for (let i = 0; i < line.length; i++) {
        lineWidth += ctx.measureText(line[i]).width;
        if (i < line.length - 1) {
          lineWidth += letterSpacing;
        }
      }
    } else {
      lineWidth = ctx.measureText(line).width;
    }

    if (textAlign === 'center') {
      startX = (width - lineWidth) / 2;
    } else if (textAlign === 'right') {
      startX = width - lineWidth;
    } else {
      startX = 0; // default left
    }

    if (letterSpacing !== 0) {
      let currentX = startX;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        applyTextStroke(ctx, char, currentX, yOffset, layer);
        ctx.fillText(char, currentX, yOffset);
        currentX += ctx.measureText(char).width + letterSpacing;
      }
    } else {
      applyTextStroke(ctx, line, startX, yOffset, layer);
      ctx.fillText(line, startX, yOffset);
    }
  });

  resetShadow(ctx);
};

/**
 * Convert a text layer to SVG path outlines by rendering to canvas then tracing with ImageTracer.
 * Returns an SVG string containing the text as vector paths.
 */
export async function convertTextToOutlines(
  layer: TextLayer,
  options?: { scale?: number }
): Promise<string> {
  const scale = options?.scale || 2;
  const {
    text,
    fontSize,
    fontFamily,
    fontWeight,
    fontStyle = 'normal',
    letterSpacing = 0,
    lineHeight = 1.2,
    textAlign = 'left',
  } = layer;

  const font = `${fontStyle} ${fontWeight} ${fontSize * scale}px ${fontFamily}`;

  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) throw new Error('Could not create canvas context');

  tempCtx.font = font;
  const processedText = applyTextTransform(text, layer.textTransform);
  const lines = processedText.split('\n');
  const lineHeightPx = fontSize * scale * lineHeight;

  let maxWidth = 0;
  for (const line of lines) {
    const metrics = tempCtx.measureText(line);
    if (metrics.width > maxWidth) maxWidth = metrics.width;
  }

  const padding = fontSize * scale;
  tempCanvas.width = Math.ceil(maxWidth + padding * 2);
  tempCanvas.height = Math.ceil(lines.length * lineHeightPx + padding * 2);

  tempCtx.font = font;
  tempCtx.fillStyle = '#000000';
  tempCtx.textBaseline = 'top';

  let charX = padding;
  if (textAlign === 'center') charX = (tempCanvas.width - maxWidth) / 2;
  else if (textAlign === 'right') charX = tempCanvas.width - maxWidth - padding;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const y = padding + lineIdx * lineHeightPx;
    let currentX = charX;

    if (letterSpacing !== 0) {
      for (let i = 0; i < line.length; i++) {
        tempCtx.fillText(line[i], currentX, y);
        currentX += tempCtx.measureText(line[i]).width + letterSpacing * scale;
      }
    } else {
      tempCtx.fillText(line, charX, y);
    }
  }

  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

  const ImageTracerModule = await import('imagetracerjs');
  const ImageTracer = ImageTracerModule.default || ImageTracerModule;

  const svgString: string = await new Promise((resolve, reject) => {
    ImageTracer.imageToSVG(
      imageData,
      (svg: string) => resolve(svg),
      { scale: 1 / scale }
    );
  });

  return svgString;
}
