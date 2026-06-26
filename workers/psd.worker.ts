import { readPsd, writePsd, initializeCanvas, Psd, Layer as PsdLayer } from 'ag-psd';
import { v4 as uuidv4 } from 'uuid';

// Define simplified layer types for the worker to avoid circular dependencies with main app types
interface WorkerLayer {
  id: string;
  type: 'text' | 'image' | 'shape' | 'group' | 'path' | 'circle';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  blendMode: string;
  src?: string; // For images
  text?: string; // For text
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  shadow?: any;
  stroke?: any;
  groupId?: string;
  // ... add other necessary props as needed
}

self.onmessage = async (e: MessageEvent) => {
  const { type, payload, id } = e.data;

  try {
    if (type === 'PARSE') {
      const layers = await parsePsdToLayers(payload.buffer);
      self.postMessage({ type: 'SUCCESS', id, payload: layers });
    } else if (type === 'EXPORT') {
      const blob = await exportLayersToPsd(payload.width, payload.height, payload.layers);
      self.postMessage({ type: 'SUCCESS', id, payload: blob });
    }
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', id, error: error.message });
  }
};

/**
 * Parses a PSD file (as ArrayBuffer) into WorkerLayers.
 */
async function parsePsdToLayers(buffer: ArrayBuffer): Promise<WorkerLayer[]> {
  // initializeCanvas is needed for ag-psd to handle image data in a worker
  // @ts-ignore - ignore type mismatch
  if (typeof OffscreenCanvas !== 'undefined' && initializeCanvas) {
    // @ts-ignore - ignore type mismatch
    initializeCanvas((width, height) => new OffscreenCanvas(width, height));
  }

  const psd = readPsd(buffer, { skipLayerImageData: false, skipThumbnail: true });

  if (!psd.children) {
    return [];
  }

  const layers: WorkerLayer[] = [];

  // Process children recursively
  const processLayer = async (psdLayer: PsdLayer, parentId?: string) => {
    const id = uuidv4();

    // Map common blending modes
    const blendModeMap: Record<string, string> = {
      'pass through': 'normal',
      normal: 'normal',
      multiply: 'multiply',
      screen: 'screen',
      overlay: 'overlay',
      darken: 'darken',
      lighten: 'lighten',
      'color dodge': 'color-dodge',
      'color burn': 'color-burn',
      'hard light': 'hard-light',
      'soft light': 'soft-light',
      difference: 'difference',
      exclusion: 'exclusion',
      hue: 'hue',
      saturation: 'saturation',
      color: 'color',
      luminosity: 'luminosity',
    };

    const common = {
      id,
      name: psdLayer.name || 'Layer',
      x: psdLayer.left || 0,
      y: psdLayer.top || 0,
      width: (psdLayer.right || 0) - (psdLayer.left || 0),
      height: (psdLayer.bottom || 0) - (psdLayer.top || 0),
      rotation: 0,
      opacity: (psdLayer.opacity ?? 255) / 255,
      locked: false,
      visible: psdLayer.hidden === false,
      groupId: parentId,
      blendMode: blendModeMap[psdLayer.blendMode || 'normal'] || 'normal',
    };

    // Map Layer Effects (Drop Shadow, etc.)
    let shadow: any = undefined;
    let stroke: any = undefined;

    const getVal = (v: any): number => {
      if (typeof v === 'number') {
        return v;
      }
      if (v && typeof v.value === 'number') {
        return v.value;
      }
      return 0;
    };

    if (psdLayer.effects) {
      if (psdLayer.effects.dropShadow && psdLayer.effects.dropShadow[0]) {
        const ds = psdLayer.effects.dropShadow[0];
        if (ds.enabled !== false) {
          const c = ds.color as any;
          const color = c ? `rgba(${c.r}, ${c.g}, ${c.b}, ${ds.opacity ?? 1})` : 'rgba(0,0,0,0.5)';
          const angle = getVal(ds.angle ?? 120);
          const distance = getVal(ds.distance ?? 5);
          const angleRad = (angle * Math.PI) / 180;

          shadow = {
            color,
            blur: getVal(ds.size ?? 5),
            offsetX: Math.cos(angleRad) * distance,
            offsetY: -Math.sin(angleRad) * distance,
          };
        }
      }

      if (psdLayer.effects.outerGlow) {
        const og = psdLayer.effects.outerGlow;
        if (og.enabled !== false && !shadow) {
          const c = og.color as any;
          shadow = {
            color: c ? `rgba(${c.r}, ${c.g}, ${c.b}, ${og.opacity ?? 1})` : 'rgba(255,255,255,0.5)',
            blur: getVal(og.size ?? 5),
            offsetX: 0,
            offsetY: 0,
          };
        }
      }

      if (psdLayer.effects.stroke && psdLayer.effects.stroke[0]) {
        const s = psdLayer.effects.stroke[0];
        if (s.enabled !== false) {
          const c = s.color as any;
          stroke = {
            color: c ? `rgba(${c.r}, ${c.g}, ${c.b}, ${s.opacity ?? 1})` : '#000000',
            width: getVal(s.size ?? 1),
            opacity: s.opacity ?? 1,
          };
        }
      }
    }

    // Handle Group
    if (psdLayer.children) {
      for (const child of psdLayer.children) {
        await processLayer(child, id);
      }
      return;
    }

    // Handle Text Layer
    if (psdLayer.text) {
      const style = psdLayer.text.style;
      const fillColor = style?.fillColor as any;
      const color = fillColor
        ? `rgba(${fillColor.r ?? 0}, ${fillColor.g ?? 0}, ${fillColor.b ?? 0}, ${fillColor.a ?? 1})`
        : '#000000';

      const textLayer: WorkerLayer = {
        ...common,
        type: 'text',
        text: psdLayer.text.text || '',
        fontSize: style?.fontSize || 24,
        fontFamily: style?.font?.name || 'Inter',
        color,
        textAlign: 'left',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        shadow,
        stroke,
      };
      layers.push(textLayer);
      return;
    }

    // Handle Image/Pixel Data
    if (psdLayer.canvas) {
      // In a worker, psdLayer.canvas will be an OffscreenCanvas if we initialized it correctly
      // We need to convert it to a Blob or DataURL.
      // construct dataURL manually or via FileReader if needed, but OffscreenCanvas supports convertToBlob

      let dataUrl = '';
      // @ts-ignore - ignore type mismatch
      if (psdLayer.canvas.convertToBlob) {
        // @ts-ignore - ignore type mismatch
        const blob = await psdLayer.canvas.convertToBlob({ type: 'image/png' });
        dataUrl = await blobToDataURL(blob);
      } else {
        // @ts-ignore - ignore type mismatch
        dataUrl = psdLayer.canvas.toDataURL('image/png');
      }

      const imageLayer: WorkerLayer = {
        ...common,
        type: 'image',
        src: dataUrl,
        shadow,
        stroke,
      };
      layers.push(imageLayer);
      return;
    }
  };

  for (const layer of psd.children) {
    await processLayer(layer);
  }

  return layers;
}

/**
 * Exports Layers to a PSD Blob.
 */
async function exportLayersToPsd(width: number, height: number, layers: WorkerLayer[]): Promise<Blob> {
  // @ts-ignore - ignore type mismatch
  if (typeof OffscreenCanvas !== 'undefined' && initializeCanvas) {
    // @ts-ignore - ignore type mismatch
    initializeCanvas((width, height) => new OffscreenCanvas(width, height));
  }

  const psd: Psd = {
    width,
    height,
    children: [],
  };

  const convertLayer = async (layer: WorkerLayer): Promise<PsdLayer | null> => {
    const isText = layer.type === 'text';
    const isImage = layer.type === 'image';
    const isShape = !isText && !isImage;

    const layerWidth = layer.width;
    const layerHeight = isText ? (layer.fontSize || 24) * 1.2 : layer.height || 0;

    // Map Shadows and Strokes to PSD Effects
    const effects: any = {};
    if (layer.shadow) {
      const s = layer.shadow;
      const match = s.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      const color = match
        ? { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) }
        : { r: 0, g: 0, b: 0 };
      const opacity = match && match[4] ? parseFloat(match[4]) : 0.5;

      const distance = Math.sqrt(s.offsetX * s.offsetX + s.offsetY * s.offsetY);
      const angle = Math.atan2(-s.offsetY, s.offsetX) * (180 / Math.PI);

      effects.dropShadow = [
        {
          enabled: true,
          color,
          opacity,
          distance,
          size: s.blur,
          angle: Math.round(angle),
        },
      ];
    }

    if (layer.stroke) {
      const st = layer.stroke;
      let color = { r: 0, g: 0, b: 0 };
      if (st.color.startsWith('#')) {
        const hex = st.color.replace('#', '');
        color = {
          r: parseInt(hex.substring(0, 2), 16),
          g: parseInt(hex.substring(2, 4), 16),
          b: parseInt(hex.substring(4, 6), 16),
        };
      }

      effects.stroke = [
        {
          enabled: true,
          color,
          size: st.width,
          opacity: st.opacity ?? 1,
          position: 'outside',
        },
      ];
    }

    const common: any = {
      name: layer.name || layer.type,
      left: layer.x,
      top: layer.y,
      right: layer.x + layerWidth,
      bottom: layer.y + layerHeight,
      opacity: Math.round((layer.opacity ?? 1) * 255),
      hidden: layer.visible === false,
      blendMode: layer.blendMode || 'normal',
      effects: Object.keys(effects).length > 0 ? effects : undefined,
    };

    if (isText) {
      const tl = layer;
      let fillColor = { r: 0, g: 0, b: 0, a: 1 };
      // Simple color parsing for now
      if (tl.color?.startsWith('#')) {
        const hex = tl.color.replace('#', '');
        fillColor = {
          r: parseInt(hex.substring(0, 2), 16),
          g: parseInt(hex.substring(2, 4), 16),
          b: parseInt(hex.substring(4, 6), 16),
          a: 1,
        };
      }

      return {
        ...common,
        text: {
          text: tl.text,
          style: {
            fontSize: tl.fontSize,
            font: { name: tl.fontFamily },
            fillColor,
          },
        },
      };
    }

    if (isImage || isShape) {
      const canvasW = layerWidth || 1;
      const canvasH = layerHeight || 1;
      // @ts-ignore - ignore type mismatch
      const canvas = new OffscreenCanvas(canvasW, canvasH);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return null;
      }

      if (isImage && layer.src) {
        const response = await fetch(layer.src);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        ctx.drawImage(bitmap, 0, 0, canvasW, canvasH);
      } else if (isShape) {
        ctx.save();

        // Handle gradient fills
        if ((layer as any).gradient?.enabled) {
          const grad = (layer as any).gradient;
          let fillGrad: CanvasGradient;
          if (grad.type === 'radial') {
            fillGrad = ctx.createRadialGradient(canvasW / 2, canvasH / 2, 0, canvasW / 2, canvasH / 2, canvasW / 2);
          } else {
            const angle = ((grad.angle || 0) * Math.PI) / 180;
            const cx = canvasW / 2, cy = canvasH / 2;
            const len = canvasW / 2;
            fillGrad = ctx.createLinearGradient(cx - Math.cos(angle) * len, cy - Math.sin(angle) * len, cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
          }
          for (const stop of grad.colors || []) {
            fillGrad.addColorStop(stop.position, stop.color);
          }
          ctx.fillStyle = fillGrad;
        } else {
          ctx.fillStyle = layer.color || '#000000';
        }

        if (layer.type === 'path' && (layer as any).pathData) {
          const p = new Path2D((layer as any).pathData);
          if (layer.id?.startsWith('draw_') || (layer as any).brushType) {
            ctx.strokeStyle = layer.stroke?.color || layer.color;
            ctx.lineWidth = layer.stroke?.width || 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke(p);
          } else {
            ctx.fill(p);
          }
        } else if (layer.type === 'circle') {
          ctx.beginPath();
          ctx.arc(canvasW / 2, canvasH / 2, Math.min(canvasW, canvasH) / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const r = (layer as any).cornerRadius || 0;
          if (r > 0) {
            ctx.beginPath();
            ctx.moveTo(r, 0);
            ctx.lineTo(canvasW - r, 0);
            ctx.quadraticCurveTo(canvasW, 0, canvasW, r);
            ctx.lineTo(canvasW, canvasH - r);
            ctx.quadraticCurveTo(canvasW, canvasH, canvasW - r, canvasH);
            ctx.lineTo(r, canvasH);
            ctx.quadraticCurveTo(0, canvasH, 0, canvasH - r);
            ctx.lineTo(0, r);
            ctx.quadraticCurveTo(0, 0, r, 0);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillRect(0, 0, canvasW, canvasH);
          }
        }

        // Draw stroke on top
        if (layer.stroke && layer.stroke.width > 0) {
          ctx.strokeStyle = layer.stroke.color || '#000000';
          ctx.lineWidth = layer.stroke.width;
          if (layer.type === 'path' && (layer as any).pathData) {
            ctx.stroke(new Path2D((layer as any).pathData));
          } else if (layer.type === 'circle') {
            ctx.beginPath();
            ctx.arc(canvasW / 2, canvasH / 2, Math.min(canvasW, canvasH) / 2, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.strokeRect(0, 0, canvasW, canvasH);
          }
        }

        ctx.restore();
      }

      return {
        ...common,
        canvas,
      };
    }

    return null;
  };

  for (const layer of layers) {
    const psdLayer = await convertLayer(layer);
    if (psdLayer) {
      psd.children?.push(psdLayer);
    }
  }

  const buffer = writePsd(psd);
  return new Blob([buffer], { type: 'image/vnd.adobe.photoshop' });
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
