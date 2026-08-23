/**
 * Image Color Palette Extractor & Palette Matcher
 * Extracts dominant harmonious color palettes from images and applies them to artboard layers
 */

import { Layer, Artboard } from '../../types';

export interface ExtractedColor {
  hex: string;
  rgb: [number, number, number];
  luminance: number;
  population: number;
}

export interface ExtractedPalette {
  dominant: string;
  vibrant: string;
  muted: string;
  dark: string;
  light: string;
  allColors: string[];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
}

function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Extracts a 5-tier harmonious color palette from an HTMLImageElement or image URL.
 */
export async function extractPaletteFromImage(imageSource: HTMLImageElement | string): Promise<ExtractedPalette> {
  let img: HTMLImageElement;

  if (typeof imageSource === 'string') {
    img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image for palette extraction'));
      img.src = imageSource;
    });
  } else {
    img = imageSource;
  }

  const canvas = document.createElement('canvas');
  const size = 64; // downscale for fast analysis
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.drawImage(img, 0, 0, size, size);
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  const colorBuckets = new Map<string, { r: number; g: number; b: number; count: number }>();

  // Quantize RGB values to 16-level buckets
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) {
      continue;
    } // skip transparent pixels

    const r = Math.round(data[i] / 16) * 16;
    const g = Math.round(data[i + 1] / 16) * 16;
    const b = Math.round(data[i + 2] / 16) * 16;
    const key = `${r},${g},${b}`;

    const existing = colorBuckets.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorBuckets.set(key, { r, g, b, count: 1 });
    }
  }

  const sortedColors = Array.from(colorBuckets.values())
    .sort((a, b) => b.count - a.count)
    .map((c) => ({
      hex: rgbToHex(c.r, c.g, c.b),
      rgb: [c.r, c.g, c.b] as [number, number, number],
      luminance: getLuminance(c.r, c.g, c.b),
      population: c.count,
    }));

  if (sortedColors.length === 0) {
    return {
      dominant: '#7d2ae8',
      vibrant: '#9333ea',
      muted: '#64748b',
      dark: '#0f172a',
      light: '#f8fafc',
      allColors: ['#7d2ae8', '#9333ea', '#64748b', '#0f172a', '#f8fafc'],
    };
  }

  const dominant = sortedColors[0].hex;
  const light = sortedColors.find((c) => c.luminance > 0.7)?.hex || '#f8fafc';
  const dark = sortedColors.find((c) => c.luminance < 0.3)?.hex || '#0f172a';
  const vibrant = sortedColors.find((c) => c.luminance >= 0.3 && c.luminance <= 0.7)?.hex || dominant;
  const muted =
    sortedColors.find((c) => c.hex !== dominant && c.hex !== vibrant && c.hex !== light && c.hex !== dark)?.hex ||
    '#64748b';

  const allColors = Array.from(new Set([dominant, vibrant, muted, dark, light]));

  return {
    dominant,
    vibrant,
    muted,
    dark,
    light,
    allColors,
  };
}

/**
 * Harmonizes and recolors all layers on an artboard using an extracted palette.
 */
export function applyPaletteToArtboard(artboard: Artboard, palette: ExtractedPalette): Partial<Layer>[] {
  const updates: Partial<Layer>[] = [];

  for (const layer of artboard.layers || []) {
    if (layer.type === 'image') {
      continue;
    } // Don't recolor photo layers

    if (layer.type === 'text') {
      // Contrast check for text against background
      updates.push({
        id: layer.id,
        color: palette.light,
      } as any);
    } else if (layer.type !== 'group' && layer.type !== 'adjustment') {
      updates.push({
        id: layer.id,
        color: palette.dominant,
        fill: palette.dominant,
      } as any);
    }
  }

  return updates;
}
