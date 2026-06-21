/**
 * Text Rendering Utilities
 * Helper functions for rendering text on path and warped text
 */

import { TextLayer } from '../types';
import { GeometryOracle } from './geometryOracle';
import { warpRegistry } from './layers/warpRegistry';

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

  const pathMetrics = GeometryOracle.measurePath(layer.textPath);
  const textWidth = ctx.measureText(text).width;

  // Center text on path
  const startOffset = (pathMetrics.totalLength - textWidth) / 2;

  let currentDistance = startOffset;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charWidth = ctx.measureText(char).width;

    // Position at center of character
    const charMiddleDistance = currentDistance + charWidth / 2;

    if (charMiddleDistance >= 0 && charMiddleDistance <= pathMetrics.totalLength) {
      const { x, y, angle } = pathMetrics.getPointAt(charMiddleDistance);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }

    currentDistance += charWidth;
  }
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

  const lines = text.split('\n');
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

  // Get text metrics
  const textWidth = tempCtx.measureText(text).width;
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

      tempCtx.fillText(char, -charWidth / 2, 0);
      tempCtx.restore();
      charX += charWidth;
    }
    charX = startX; // Reset for next line
  }

  // Copy to main canvas
  canvas.width = tempCanvas.width;
  canvas.height = tempCanvas.height;
  ctx.drawImage(tempCanvas, 0, 0);
};

/**
 * Helper for rendering multiline text to a canvas
 * Handles word wrap, letter spacing, alignment, and line height.
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

  const manualLines = text.split('\n');
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

  allLines.forEach((line, lineIndex) => {
    const yOffset = lineIndex * lineHeightPx;
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
        ctx.fillText(char, currentX, yOffset);
        currentX += ctx.measureText(char).width + letterSpacing;
      }
    } else {
      ctx.fillText(line, startX, yOffset);
    }
  });
};
