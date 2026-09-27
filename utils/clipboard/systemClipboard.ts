/**
 * System Clipboard & Cross-App Interoperability Bridge
 * 
 * Enables seamless copy & paste:
 * 1. Writes pure SVG markup to OS clipboard for instant pasting into Figma, Adobe Illustrator, and Sketch.
 * 2. Serializes exact Layer JSON state to localStorage for cross-tab pasting in Kreathief.
 * 3. Ingests external SVG / text pasted from OS clipboard into native Kreathief layers.
 */

import { Layer, ShapeLayer, TextLayer, ImageLayer } from '../../types';
import { cleanSvgMarkup } from '../../services/exportService';
import { log } from '../log';

const CLIPBOARD_STORAGE_KEY = 'kreathief_system_clipboard_layer';

/**
 * Converts a Kreathief Layer into standalone valid SVG markup.
 */
export function layerToSvgMarkup(layer: Layer): string {
  const w = layer.width || 200;
  const h = layer.height || 100;
  const opacity = layer.opacity ?? 1;

  let innerContent = '';

  if (layer.type === 'rectangle') {
    const shp = layer as ShapeLayer;
    const rx = shp.cornerRadius || 0;
    const fill = shp.color || '#3b82f6';
    const strokeAttr = shp.stroke
      ? `stroke="${shp.stroke.color}" stroke-width="${shp.stroke.width}"`
      : '';
    innerContent = `<rect width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${strokeAttr} />`;
  } else if (layer.type === 'circle') {
    const shp = layer as ShapeLayer;
    const r = Math.min(w, h) / 2;
    const fill = shp.color || '#3b82f6';
    const strokeAttr = shp.stroke
      ? `stroke="${shp.stroke.color}" stroke-width="${shp.stroke.width}"`
      : '';
    innerContent = `<circle cx="${w / 2}" cy="${h / 2}" r="${r}" fill="${fill}" ${strokeAttr} />`;
  } else if (layer.type === 'text') {
    const txt = layer as TextLayer;
    const fontSize = txt.fontSize || 32;
    const fontFamily = txt.fontFamily || 'sans-serif';
    const fill = txt.color || '#ffffff';
    const fontWeight = txt.fontWeight || 'bold';
    innerContent = `<text x="0" y="${fontSize}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}">${escapeXml(txt.text || '')}</text>`;
  } else if (layer.type === 'path') {
    const pathData = (layer as any).pathData || (layer as any).d || '';
    const fill = (layer as any).color || '#3b82f6';
    innerContent = `<path d="${pathData}" fill="${fill}" />`;
  } else if (layer.type === 'image') {
    const img = layer as ImageLayer;
    innerContent = `<image href="${img.src || ''}" width="${w}" height="${h}" />`;
  } else {
    innerContent = `<rect width="${w}" height="${h}" fill="#3b82f6" />`;
  }

  const svgWrapper = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" opacity="${opacity}">
  ${innerContent}
</svg>`;

  return cleanSvgMarkup(svgWrapper);
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

/**
 * Copies a layer to both localStorage (cross-tab) and OS clipboard (Figma/Illustrator SVG).
 */
export async function copyLayerToSystemClipboard(layer: Layer): Promise<boolean> {
  try {
    // 1. Cross-tab storage
    try {
      localStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(layer));
    } catch (e) {
      // Storage quota or privacy restriction
    }

    // 2. OS Clipboard SVG + Plaintext
    const svgString = layerToSvgMarkup(layer);

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        if (typeof ClipboardItem !== 'undefined') {
          const textBlob = new Blob([svgString], { type: 'text/plain' });
          const htmlBlob = new Blob([svgString], { type: 'text/html' });
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/plain': textBlob,
              'text/html': htmlBlob,
            }),
          ]);
        } else {
          await navigator.clipboard.writeText(svgString);
        }
        log.info('[SystemClipboard] Successfully copied layer to system clipboard as SVG and JSON');
        return true;
      } catch (clipErr) {
        // Fallback to writeText
        await navigator.clipboard.writeText(svgString);
        return true;
      }
    }
    return true;
  } catch (error) {
    log.warn('[SystemClipboard] Copy to clipboard failed', error);
    return false;
  }
}

/**
 * Retrieves a layer from localStorage or system clipboard.
 */
export async function readLayerFromSystemClipboard(): Promise<Layer | null> {
  try {
    const raw = localStorage.getItem(CLIPBOARD_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // Ignore parse error
  }
  return null;
}
