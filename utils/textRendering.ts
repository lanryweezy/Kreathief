/**
 * Text Rendering Utilities
 * Helper functions for rendering text on path and warped text
 */

import { TextLayer } from '../types';
import { GeometryOracle } from './geometryOracle';

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
    curve = 0,
    width,
    lineHeight = 1.2,
    textAlign = 'left',
  } = layer;
  const dpr = 2;
  const font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

  const lines = text.split('\n');
  const totalLineHeight = fontSize * lineHeight;
  const textBlockHeight = lines.length * totalLineHeight;

  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) {
    return;
  }

  tempCanvas.width = width * dpr;
  tempCanvas.height = textBlockHeight * dpr;
  tempCtx.scale(dpr, dpr);
  tempCtx.imageSmoothingEnabled = true;
  tempCtx.imageSmoothingQuality = 'high';

  tempCtx.font = font;
  tempCtx.fillStyle = color;
  tempCtx.textBaseline = 'top';
  const align = textAlign === 'justify' ? 'left' : textAlign;
  tempCtx.textAlign = align as CanvasTextAlign;

  lines.forEach((line, i) => {
    let xOffset = 0;
    if (textAlign === 'center') {
      xOffset = (width - tempCtx.measureText(line).width) / 2;
    } else if (textAlign === 'right') {
      xOffset = width - tempCtx.measureText(line).width;
    }
    tempCtx.fillText(line, xOffset, i * totalLineHeight);
  });

  canvas.width = width * dpr;
  canvas.height = (textBlockHeight + Math.abs(curve)) * dpr;
  const mainCtx = canvas.getContext('2d');
  if (!mainCtx) {
    return;
  }
  mainCtx.scale(dpr, dpr);

  const steps = width;
  for (let x = 0; x < steps; x++) {
    let ty = 0;
    if (warpStyle === 'arc') {
      const relX = (x / width) * 2 - 1;
      ty = (1 - relX * relX) * curve;
    } else if (warpStyle === 'wave') {
      ty = Math.sin((x / width) * Math.PI * 2) * curve;
    } else if (warpStyle === 'fish') {
      const relX = x / width;
      ty = Math.sin(relX * Math.PI) * curve * (1 - relX);
    }

    mainCtx.drawImage(tempCanvas, x * dpr, 0, 1 * dpr, textBlockHeight * dpr, x, ty, 1, textBlockHeight);
  }
};
