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
  const startX = textAlign === 'center' ? (width - textWidth) / 2 
    : textAlign === 'right' ? width - textWidth 
    : 10;

  // Render each character with transformations
  let charIndex = 0;
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const y = lineIdx * totalLineHeight + fontSize;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const charWidth = tempCtx.measureText(char).width;
      const x = startX + charIndex * charWidth;
      const progress = charIndex / line.length; // 0 to 1 across the text
      const angle = transformDirection * Math.PI / 180;

      tempCtx.save();
      tempCtx.translate(x + charWidth / 2, y);

      // Apply different transform types
      switch (effectType) {
        case 'arch':
        case 'arc': {
          // Arch text up or down
          const archOffset = Math.sin(progress * Math.PI) * intensity * 50;
          tempCtx.translate(0, archOffset);
          break;
        }

        case 'wave': {
          // Wave effect
          const waveOffset = Math.sin(progress * Math.PI * 4) * intensity * 20;
          tempCtx.translate(0, waveOffset);
          tempCtx.rotate(Math.cos(progress * Math.PI * 4) * intensity * 0.3);
          break;
        }

        case 'rise': {
          // Rise effect (text rises from left to right)
          const riseOffset = progress * intensity * 50;
          tempCtx.translate(0, -riseOffset);
          break;
        }

        case 'flag': {
          // Flag effect (waving flag)
          const flagOffset = Math.sin(progress * Math.PI * 2) * intensity * 15;
          tempCtx.translate(0, flagOffset);
          tempCtx.rotate(Math.cos(progress * Math.PI * 2) * intensity * 0.2);
          break;
        }

        case 'fish': {
          // Fish effect (bulge in middle)
          const fishOffset = Math.sin(progress * Math.PI) * intensity * 30;
          tempCtx.translate(0, fishOffset);
          const fishScale = 1 + Math.sin(progress * Math.PI) * intensity * 0.2;
          tempCtx.scale(fishScale, 1 / fishScale);
          break;
        }

        case 'circle': {
          // Circle text
          const circleAngle = (progress * Math.PI * 2) + angle;
          const radius = 100 * (1 + intensity);
          tempCtx.rotate(circleAngle);
          tempCtx.translate(radius, 0);
          tempCtx.rotate(Math.PI / 2);
          break;
        }

        case 'distort': {
          // Distort effect (perspective-like)
          const distortY = Math.sin(progress * Math.PI) * intensity * 40;
          const distortScale = 1 + (progress - 0.5) * intensity * 0.3;
          tempCtx.translate(0, distortY);
          tempCtx.scale(distortScale, 1 / distortScale);
          break;
        }

        case 'angle': {
          // Angle/shear effect
          tempCtx.rotate(angle);
          tempCtx.transform(1, 0, Math.tan(angle) * intensity, 1, 0, 0);
          break;
        }

        case 'mesh': {
          // Mesh/grid distortion
          const meshX = Math.sin(progress * Math.PI * 6) * intensity * 5;
          const meshY = Math.cos(progress * Math.PI * 6) * intensity * 5;
          tempCtx.translate(meshX, meshY);
          break;
        }

        default:
          // No special effect
          break;
      }

      tempCtx.fillText(char, -charWidth / 2, 0);
      tempCtx.restore();
      charIndex++;
    }
    charIndex = 0; // Reset for next line
  }

  // Copy to main canvas
  canvas.width = tempCanvas.width;
  canvas.height = tempCanvas.height;
  ctx.drawImage(tempCanvas, 0, 0);
};
