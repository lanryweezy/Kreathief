import { readPsd, Psd, Layer, Color } from 'ag-psd';
import { DesignNode } from '../types/design';
import { surface, content } from '../lib/tokens';

export interface ParsedPSD {
  name: string;
  width: number;
  height: number;
  nodes: Map<string, DesignNode>;
  rootId: string;
  thumbnail: string;
  layerCount: number;
  compressedSize: number;
  originalSize: number;
}

export interface PSDCompressionOptions {
  maxDimension: number;
  jpegQuality: number;
  stripHiddenLayers: boolean;
  stripEmptyLayers: boolean;
  generateThumbnail: boolean;
  thumbnailSize: number;
}

const DEFAULT_OPTIONS: PSDCompressionOptions = {
  maxDimension: 4096,
  jpegQuality: 0.85,
  stripHiddenLayers: true,
  stripEmptyLayers: true,
  generateThumbnail: true,
  thumbnailSize: 400,
};

function generateId(): string {
  return `psd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function colorToRGBA(c: Color | undefined): string | null {
  if (!c) return null;
  if ('r' in c && 'g' in c && 'b' in c) {
    const a = 'a' in c ? (c as any).a : 1;
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${a ?? 1})`;
  }
  return null;
}

function parseBlendMode(psdBlendMode: string | undefined): DesignNode['blendMode'] {
  const map: Record<string, DesignNode['blendMode']> = {
    normal: 'normal',
    multiply: 'multiply',
    screen: 'screen',
    overlay: 'overlay',
    darken: 'darken',
    lighten: 'lighten',
  };
  return map[psdBlendMode || 'normal'] || 'normal';
}

function effectsFromPSD(layer: Layer): DesignNode['effects'] {
  const effects: DesignNode['effects'] = [];
  const layerEffects = (layer as any).effects;

  if (!layerEffects) return effects;

  if (layerEffects.dropShadow) {
    const shadows = Array.isArray(layerEffects.dropShadow) ? layerEffects.dropShadow : [layerEffects.dropShadow];
    for (const ds of shadows) {
      if (ds?.enabled) {
        effects.push({
          type: 'shadow',
          enabled: true,
          params: {
            x: ds.distance?.value || 4,
            y: ds.distance?.value || 4,
            blur: ds.size?.value || 4,
            color: colorToRGBA(ds.color) || 'rgba(0,0,0,0.3)',
          },
        });
      }
    }
  }

  if (layerEffects.innerShadow) {
    const shadows = Array.isArray(layerEffects.innerShadow) ? layerEffects.innerShadow : [layerEffects.innerShadow];
    for (const is of shadows) {
      if (is?.enabled) {
        effects.push({
          type: 'shadow',
          enabled: true,
          params: {
            x: is.distance?.value || 4,
            y: is.distance?.value || 4,
            blur: is.size?.value || 4,
            inner: true,
            color: colorToRGBA(is.color) || 'rgba(0,0,0,0.3)',
          },
        });
      }
    }
  }

  if (layerEffects.outerGlow?.enabled) {
    const g = layerEffects.outerGlow;
    effects.push({
      type: 'glow',
      enabled: true,
      params: {
        blur: g.size?.value || 4,
        color: colorToRGBA(g.color) || 'rgba(255,255,255,0.5)',
      },
    });
  }

  return effects;
}

function rasterizeLayerToCanvas(
  layer: Layer,
  canvas: HTMLCanvasElement,
  options: PSDCompressionOptions
): string | null {
  if (!layer.canvas) return null;

  const srcW = layer.canvas.width;
  const srcH = layer.canvas.height;

  if (srcW === 0 || srcH === 0) return null;

  let drawW = srcW;
  let drawH = srcH;

  if (srcW > options.maxDimension || srcH > options.maxDimension) {
    const scale = options.maxDimension / Math.max(srcW, srcH);
    drawW = Math.round(srcW * scale);
    drawH = Math.round(srcH * scale);
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  canvas.width = drawW;
  canvas.height = drawH;
  ctx.clearRect(0, 0, drawW, drawH);
  ctx.drawImage(layer.canvas, 0, 0, drawW, drawH);

  return canvas.toDataURL('image/jpeg', options.jpegQuality);
}

function getLayerBounds(layer: Layer): { left: number; top: number; width: number; height: number } {
  const left = (layer as any).left ?? 0;
  const top = (layer as any).top ?? 0;
  const right = (layer as any).right ?? layer.canvas?.width ?? 100;
  const bottom = (layer as any).bottom ?? layer.canvas?.height ?? 100;
  return {
    left,
    top,
    width: right - left || 100,
    height: bottom - top || 100,
  };
}

function processPSDNode(
  psdNode: Layer,
  parentDesignNodeId: string | null,
  nodes: Map<string, DesignNode>,
  canvas: HTMLCanvasElement,
  options: PSDCompressionOptions,
  layerVisibility: boolean = true
): string | null {
  const isVisible = layerVisibility && psdNode.hidden !== true;

  if (options.stripHiddenLayers && psdNode.hidden) return null;

  const hasChildren = psdNode.children && psdNode.children.length > 0;
  const hasCanvas = !!psdNode.canvas;

  if (options.stripEmptyLayers && !hasCanvas && !hasChildren) {
    return null;
  }

  const nodeId = generateId();
  const bounds = getLayerBounds(psdNode);

  let nodeType: DesignNode['type'] = 'group';
  let imageUrl: string | undefined;

  if (hasCanvas && !hasChildren) {
    const rasterized = rasterizeLayerToCanvas(psdNode, canvas, options);
    if (rasterized) {
      imageUrl = rasterized;
      nodeType = 'image';
    }
  } else if (hasCanvas && hasChildren) {
    const rasterized = rasterizeLayerToCanvas(psdNode, canvas, options);
    if (rasterized) {
      imageUrl = rasterized;
    }
  }

  let textContent: string | undefined;
  let fontSize: number | undefined;
  let fontFamily: string | undefined;

  const layerText = (psdNode as any).text;
  if (layerText) {
    textContent = layerText.text || '';
    if (layerText.style?.fontSize) fontSize = layerText.style.fontSize;
    if (layerText.style?.font?.name) fontFamily = layerText.style.font.name;
  }

  const node: DesignNode = {
    id: nodeId,
    type: nodeType,
    name: psdNode.name || 'Untitled Layer',
    x: bounds.left,
    y: bounds.top,
    width: bounds.width,
    height: bounds.height,
    rotation: 0,
    opacity: (psdNode.opacity ?? 100) / 100,
    visible: isVisible,
    locked: false,
    blendMode: parseBlendMode(psdNode.blendMode as string),
    fill: null,
    stroke: null,
    strokeWidth: 0,
    cornerRadius: 0,
    effects: effectsFromPSD(psdNode),
    children: [],
    parentId: parentDesignNodeId,
    imageUrl,
    imageFit: 'cover',
    text: textContent,
    fontSize,
    fontFamily,
  };

  const vectorFill = (psdNode as any).vectorFill;
  if (vectorFill?.type === 'color' && vectorFill.color) {
    const c = vectorFill.color;
    if ('r' in c && 'g' in c && 'b' in c) {
      node.fill = `rgb(${c.r}, ${c.g}, ${c.b})`;
      node.type = 'rect';
    }
  }

  nodes.set(nodeId, node);

  if (hasChildren) {
    for (const child of psdNode.children!) {
      const childId = processPSDNode(child, nodeId, nodes, canvas, options, isVisible);
      if (childId) {
        node.children.push(childId);
      }
    }
  }

  return nodeId;
}

function generateThumbnail(psd: Psd, canvas: HTMLCanvasElement, size: number): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const srcW = psd.width || 100;
  const srcH = psd.height || 100;
  const scale = size / Math.max(srcW, srcH);
  const thumbW = Math.round(srcW * scale);
  const thumbH = Math.round(srcH * scale);

  canvas.width = thumbW;
  canvas.height = thumbH;
  ctx.clearRect(0, 0, thumbW, thumbH);

  if (psd.canvas) {
    ctx.drawImage(psd.canvas, 0, 0, thumbW, thumbH);
  } else {
    ctx.fillStyle = surface[3];
    ctx.fillRect(0, 0, thumbW, thumbH);
    ctx.fillStyle = content.muted;
    ctx.font = `${Math.max(12, thumbW / 10)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Preview', thumbW / 2, thumbH / 2);
  }

  return canvas.toDataURL('image/jpeg', 0.7);
}

export async function parsePSDFile(file: File, options: Partial<PSDCompressionOptions> = {}): Promise<ParsedPSD> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;

  const arrayBuffer = await file.arrayBuffer();

  const psd = readPsd(arrayBuffer);

  const canvas = document.createElement('canvas');
  const nodes = new Map<string, DesignNode>();

  const rootId = generateId();

  const rootChildren: string[] = [];
  if (psd.children) {
    for (const child of psd.children) {
      const childId = processPSDNode(child, rootId, nodes, canvas, opts, true);
      if (childId) rootChildren.push(childId);
    }
  }

  const rootNode: DesignNode = {
    id: rootId,
    type: 'frame',
    name: file.name.replace(/\.psd$/i, ''),
    x: 0,
    y: 0,
    width: psd.width || 100,
    height: psd.height || 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    blendMode: 'normal',
    fill: null,
    stroke: null,
    strokeWidth: 0,
    cornerRadius: 0,
    effects: [],
    children: rootChildren,
    parentId: null,
  };

  nodes.set(rootId, rootNode);

  let thumbnail = '';
  if (opts.generateThumbnail) {
    thumbnail = generateThumbnail(psd, canvas, opts.thumbnailSize);
  }

  let compressedSize = 0;
  nodes.forEach((node) => {
    if (node.imageUrl) {
      compressedSize += node.imageUrl.length * 0.75;
    }
  });

  return {
    name: file.name.replace(/\.psd$/i, ''),
    width: psd.width || 100,
    height: psd.height || 100,
    nodes,
    rootId,
    thumbnail,
    layerCount: nodes.size,
    compressedSize,
    originalSize,
  };
}

export function getCompressionRatio(parsed: ParsedPSD): number {
  if (parsed.originalSize === 0) return 0;
  return 1 - parsed.compressedSize / parsed.originalSize;
}

export function estimateMemoryUsage(parsed: ParsedPSD): number {
  let total = 0;
  parsed.nodes.forEach((node) => {
    total += 200;
    if (node.imageUrl) total += node.imageUrl.length;
    if (node.text) total += node.text.length * 2;
  });
  return total;
}
