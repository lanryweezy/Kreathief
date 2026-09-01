// SVG & Canvas export service
// Mirrors canvas engine rendering logic exactly — same gradient computation,
// same path construction, same effect parameters. Both surfaces derive from
// the same formulas so visual output is identical.
import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { StaticLayerRenderer } from '../components/StaticLayerRenderer';
import { DesignNode, GradientFill, Effect, VectorPoint } from '../types/design';
import { canvas as canvasTokens, content, surface } from '../lib/tokens';
import { hexToRgba } from '../lib/utils';
import { resolveTextLines } from '../utils/textRendering';
import { getShapeDefinition } from '../utils/layers/shapeRegistry';

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'jpg' | 'webp' | 'svg';
  scale: number;
  selectionOnly: boolean;
  quality: number;
  background: boolean;
}

// ── Shared helpers (used by both SVG and Canvas export) ──────────────

function resolveNodeType(rawType: string, layer: any): DesignNode['type'] {
  if (rawType === 'text') {
    return 'text';
  }
  if (
    rawType === 'circle' ||
    rawType === 'ellipse' ||
    (rawType === 'shape' && (layer.shapeType === 'circle' || layer.shapeType === 'ellipse'))
  ) {
    return 'ellipse';
  }
  if (rawType === 'line') {
    return 'line';
  }
  if (rawType === 'image') {
    return 'image';
  }
  if (rawType === 'group' || layer.isGroup) {
    return 'group';
  }
  if (rawType === 'frame') {
    return 'frame';
  }
  if (
    rawType === 'path' ||
    layer.pathData ||
    layer.vectorPath ||
    (rawType === 'shape' && layer.shapeType !== 'rectangle')
  ) {
    return 'path';
  }
  return 'rect';
}

function resolveNodeFill(layer: any): string | GradientFill {
  let fill: string | GradientFill = layer.fill || layer.color || surface[3];
  if (layer.gradient?.enabled && Array.isArray(layer.gradient.colors) && layer.gradient.colors.length > 0) {
    fill = {
      type: layer.gradient.type || 'linear',
      angle: layer.gradient.angle || 0,
      stops: layer.gradient.colors.map((c: any) => ({
        color: c.color || '#000000',
        offset: typeof c.position === 'number' ? c.position : typeof c.offset === 'number' ? c.offset : 0,
      })),
    };
  }
  return fill;
}

function resolveNodeStroke(layer: any): { stroke?: string; strokeWidth?: number } {
  if (typeof layer.stroke === 'string') {
    return { stroke: layer.stroke, strokeWidth: layer.strokeWidth || 1 };
  }
  if (layer.stroke && typeof layer.stroke === 'object') {
    return { stroke: layer.stroke.color, strokeWidth: layer.stroke.width };
  }
  return {};
}

function resolveNodeEffects(layer: any): Effect[] {
  const effects: Effect[] = [];
  if (layer.shadow) {
    effects.push({
      id: `shadow-${layer.id || '1'}`,
      type: 'shadow',
      enabled: true,
      params: {
        x: layer.shadow.offsetX ?? 0,
        y: layer.shadow.offsetY ?? 4,
        blur: layer.shadow.blur ?? 8,
        color: layer.shadow.color ?? content.inverse,
        opacity: layer.shadow.opacity ?? 0.25,
      },
    } as any);
  }
  if (layer.filters?.blur) {
    effects.push({
      id: `blur-${layer.id || '1'}`,
      type: 'blur',
      enabled: true,
      params: { radius: layer.filters.blur },
    } as any);
  }
  return effects;
}

function resolveVectorPoints(layer: any): VectorPoint[] | undefined {
  if (!layer.vectorPath?.points) {
    return undefined;
  }
  return layer.vectorPath.points.map((p: any) => ({
    x: p.x,
    y: p.y,
    handleIn: p.handleIn,
    handleOut: p.handleOut,
  }));
}

/**
 * Bridges the editor Layer model (from types.ts) to the canonical DesignNode format.
 * Ensures 100% WYSIWYG fidelity for shapes, colors, images, text, gradients, shadows, and strokes.
 */
export function layerToDesignNode(layer: any): DesignNode {
  if (!layer) {
    return {
      id: 'empty',
      type: 'rect',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
      fill: surface[3],
    } as DesignNode;
  }

  // If already a canonical DesignNode format, return pass-through
  if (layer.fill && (layer.type === 'rect' || layer.type === 'ellipse') && typeof layer.color === 'undefined') {
    return layer as DesignNode;
  }

  const rawType = (layer.type || 'rectangle').toLowerCase();
  const type = resolveNodeType(rawType, layer);
  const fill = resolveNodeFill(layer);
  const { stroke, strokeWidth } = resolveNodeStroke(layer);
  const effects = resolveNodeEffects(layer);
  const points = resolveVectorPoints(layer);
  const cornerRadius = typeof layer.cornerRadius === 'number' ? layer.cornerRadius : 0;
  const imageUrl = layer.src || layer.url || layer.imageUrl;

  return {
    id: layer.id || 'layer',
    name: layer.name,
    type,
    x: layer.x || 0,
    y: layer.y || 0,
    width: layer.width || 100,
    height: layer.height || 100,
    rotation: layer.rotation || 0,
    opacity: layer.opacity ?? 1,
    blendMode: layer.blendMode || 'normal',
    fill,
    stroke,
    strokeWidth,
    cornerRadius,
    text: layer.text,
    fontSize: layer.fontSize,
    fontFamily: layer.fontFamily,
    fontWeight: layer.fontWeight,
    fontStyle: layer.fontStyle,
    textAlign: layer.textAlign,
    lineHeight: layer.lineHeight,
    letterSpacing: layer.letterSpacing,
    textTransform: layer.textTransform,
    textShadow: layer.textShadow,
    textStroke: layer.textStroke,
    imageUrl,
    effects,
    points,
    pathData: layer.pathData,
    shapeType: layer.shapeType,
    children: layer.children || layer.layerIds,
    zIndex: layer.zIndex ?? 0,
  } as DesignNode;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function resolveFill(node: DesignNode): string {
  return typeof node.fill === 'string' ? node.fill : surface[3];
}

// ── SVG gradient defs ───────────────────────────────────────────────
// Same angle→coordinate math as canvasEngine.createGradient

function renderGradientDef(id: string, fill: GradientFill, node: DesignNode, offsetX = 0, offsetY = 0): string {
  // Coordinates are absolute user-space values, so gradientUnits must be
  // userSpaceOnUse (SVG defaults to objectBoundingBox, which expects 0–1
  // fractions) and they must be shifted into the exported viewBox.
  const nx = node.x - offsetX;
  const ny = node.y - offsetY;
  if (fill.type === 'linear') {
    const angle = ((fill.angle || 0) * Math.PI) / 180;
    const x1 = nx + (Math.cos(angle) * node.width) / 2;
    const y1 = ny + (Math.sin(angle) * node.height) / 2;
    const x2 = nx + node.width / 2 - (Math.cos(angle) * node.width) / 2;
    const y2 = ny + node.height / 2 - (Math.sin(angle) * node.height) / 2;
    const stops = fill.stops.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}" />`).join('');
    return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`;
  }
  const cx = nx + node.width / 2;
  const cy = ny + node.height / 2;
  const r = node.width / 2;
  const stops = fill.stops.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}" />`).join('');
  return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}">${stops}</radialGradient>`;
}

// ── SVG filter defs ─────────────────────────────────────────────────

function renderEffectDefs(nodeId: string, effects: Effect[]): string {
  let filterPrimitives = '';
  let hasFilter = false;

  for (const effect of effects) {
    if (!effect.enabled) {
      continue;
    }
    if ((effect.type as any) === 'shadow') {
      const p = (effect as any).params;
      filterPrimitives += `<feDropShadow dx="${p.x ?? 0}" dy="${p.y ?? 4}" stdDeviation="${p.blur ?? 8}" flood-color="${p.color ?? content.inverse}" flood-opacity="${p.opacity ?? 0.25}" />`;
      hasFilter = true;
    }
    if ((effect.type as any) === 'blur') {
      filterPrimitives += `<feGaussianBlur in="SourceGraphic" stdDeviation="${(effect as any).params.radius ?? 4}" />`;
      hasFilter = true;
    }
    if ((effect.type as any) === 'glow') {
      const p = (effect as any).params;
      filterPrimitives += `<feDropShadow dx="0" dy="0" stdDeviation="${p.blur ?? 12}" flood-color="${p.color ?? content.primary}" flood-opacity="${p.opacity ?? 0.6}" />`;
      hasFilter = true;
    }
  }

  return hasFilter ? `<filter id="filter-${nodeId}">${filterPrimitives}</filter>` : '';
}

// ── SVG path data from VectorPoint[] ────────────────────────────────

function pointsToSvgPath(points: VectorPoint[]): string {
  if (points.length < 2) {
    return '';
  }
  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const prev = points[i - 1];
    if (prev.handleOut || p.handleIn) {
      const cp1x = prev.x + (prev.handleOut?.x ?? 0);
      const cp1y = prev.y + (prev.handleOut?.y ?? 0);
      const cp2x = p.x + (p.handleIn?.x ?? 0);
      const cp2y = p.y + (p.handleIn?.y ?? 0);
      d += ` C${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p.x} ${p.y}`;
    } else {
      d += ` L${p.x} ${p.y}`;
    }
  }
  return d;
}

// ── Single node → SVG element ───────────────────────────────────────

function renderNodeToSvg(
  node: DesignNode,
  nodesMap: Map<string, DesignNode>,
  offsetX: number,
  offsetY: number
): string {
  const x = node.x - offsetX;
  const y = node.y - offsetY;
  const fill = resolveFill(node);
  const stroke = node.stroke ? `stroke="${node.stroke}" stroke-width="${node.strokeWidth}"` : '';
  const opacity = (node.opacity ?? 1) < 1 ? ` opacity="${node.opacity ?? 1}"` : '';
  const transform = node.rotation
    ? ` transform="rotate(${node.rotation} ${x + node.width / 2} ${y + node.height / 2})"`
    : '';
  const blendMode = node.blendMode !== 'normal' ? ` style="mix-blend-mode:${node.blendMode}"` : '';
  const filterAttr = node.effects?.some((e) => e.enabled) ? ` filter="url(#filter-${node.id})"` : '';

  let fillAttr: string;
  const hasGradient = node.fill && typeof node.fill === 'object' && 'stops' in node.fill;
  if (hasGradient) {
    fillAttr = `fill="url(#grad-${node.id})"`;
  } else {
    fillAttr = `fill="${fill}"`;
  }

  if (node.type === 'group' || node.type === 'frame') {
    const childSvgs = (node.children || [])
      .map((id) => nodesMap.get(id))
      .filter(Boolean)
      .map((child) => renderNodeToSvg(child!, nodesMap, offsetX, offsetY))
      .join('\n    ');
    const fillBg =
      node.type === 'frame'
        ? `<rect x="${x}" y="${y}" width="${node.width}" height="${node.height}" ${fillAttr}${stroke} />`
        : '';
    return `<g id="${node.id}"${opacity}${blendMode}${filterAttr}>\n    ${fillBg}\n    ${childSvgs}\n  </g>`;
  }

  switch (node.type) {
    case 'rect':
      if ((node.cornerRadius || 0) > 0) {
        return `<rect id="${node.id}" x="${x}" y="${y}" width="${node.width}" height="${node.height}" rx="${node.cornerRadius || 0}" ry="${node.cornerRadius || 0}" ${fillAttr}${stroke}${opacity}${transform}${blendMode}${filterAttr} />`;
      }
      return `<rect id="${node.id}" x="${x}" y="${y}" width="${node.width}" height="${node.height}" ${fillAttr}${stroke}${opacity}${transform}${blendMode}${filterAttr} />`;

    case 'ellipse':
      return `<ellipse id="${node.id}" cx="${x + node.width / 2}" cy="${y + node.height / 2}" rx="${node.width / 2}" ry="${node.height / 2}" ${fillAttr}${stroke}${opacity}${transform}${blendMode}${filterAttr} />`;

    case 'text': {
      const fontSize = node.fontSize || 16;
      const textFill = node.fill && typeof node.fill === 'string' ? node.fill : content.inverse;
      const lineHeight = (node as any).lineHeight || 1.2;
      const letterSpacing = (node as any).letterSpacing || 0;
      const textAnchor = node.textAlign === 'center' ? 'middle' : node.textAlign === 'right' ? 'end' : 'start';
      const tx = node.textAlign === 'center' ? x + node.width / 2 : node.textAlign === 'right' ? x + node.width : x;
      const ls = letterSpacing ? ` letter-spacing="${letterSpacing}"` : '';
      // Shared resolver: applies textTransform and word-wraps to layer width,
      // matching the editor and raster export exactly.
      const lines = resolveTextLines(node as any);
      const yStep = fontSize * lineHeight;
      const tStroke = (node as any).textStroke;
      const strokeAttr =
        tStroke && tStroke.width > 0
          ? ` stroke="${tStroke.color || '#000000'}" stroke-width="${tStroke.width}" paint-order="stroke"`
          : '';
      const fontStyleAttr =
        (node as any).fontStyle && (node as any).fontStyle !== 'normal'
          ? ` font-style="${(node as any).fontStyle}"`
          : '';
      if (lines.length === 1) {
        return `<text id="${node.id}" x="${tx}" y="${y + fontSize}" fill="${textFill}" font-size="${fontSize}" font-family="${node.fontFamily || 'system-ui'}" font-weight="${node.fontWeight || 400}"${fontStyleAttr} text-anchor="${textAnchor}"${ls}${strokeAttr}${opacity}${transform}${blendMode}${filterAttr}>${escapeXml(lines[0])}</text>`;
      }
      const tspans = lines
        .map((line, i) => `<tspan x="${tx}" dy="${i === 0 ? 0 : yStep}">${escapeXml(line)}</tspan>`)
        .join('');
      return `<text id="${node.id}" x="${tx}" y="${y + fontSize}" fill="${textFill}" font-size="${fontSize}" font-family="${node.fontFamily || 'system-ui'}" font-weight="${node.fontWeight || 400}"${fontStyleAttr} text-anchor="${textAnchor}"${ls}${strokeAttr}${opacity}${transform}${blendMode}${filterAttr}>${tspans}</text>`;
    }

    case 'line':
      return `<line id="${node.id}" x1="${x}" y1="${y}" x2="${x + node.width}" y2="${y + node.height}" stroke="${fill}" stroke-width="${node.strokeWidth || 1}"${opacity}${transform}${blendMode}${filterAttr} />`;

    case 'path': {
      let d = '';
      if (node.pathData) {
        d = node.pathData;
      } else if (node.shapeType) {
        const clipPath = getShapeDefinition(node.shapeType);
        if (clipPath && clipPath.startsWith('polygon(')) {
          const inner = clipPath.slice(8, -1).trim();
          const points = inner.split(',').map((p) => p.trim());
          points.forEach((point, index) => {
            const coords = point.split(/\s+/);
            if (coords.length === 2) {
              const px = coords[0].endsWith('%') ? (parseFloat(coords[0]) / 100) * node.width : parseFloat(coords[0]);
              const py = coords[1].endsWith('%') ? (parseFloat(coords[1]) / 100) * node.height : parseFloat(coords[1]);
              d += `${index === 0 ? 'M' : 'L'} ${px + x} ${py + y} `;
            }
          });
          if (d) {
            d += 'Z';
          }
        }
      }

      if (!d && (!node.points || node.points.length < 2)) {
        return '';
      }

      if (!d) {
        const translated = node.points.map((p: any) => ({
          ...p,
          x: p.x - offsetX,
          y: p.y - offsetY,
          handleIn: p.handleIn ? { x: p.handleIn.x, y: p.handleIn.y } : undefined,
          handleOut: p.handleOut ? { x: p.handleOut.x, y: p.handleOut.y } : undefined,
        }));
        d = pointsToSvgPath(translated);
      }

      return `<path id="${node.id}" d="${d}" ${fillAttr}${stroke}${opacity}${transform}${blendMode}${filterAttr} />`;
    }

    case 'image':
      if (node.imageUrl) {
        const ar = node.imageFit === 'contain' ? 'xMidYMid meet' : node.imageFit === 'fill' ? 'none' : 'xMidYMid slice';
        return `<image id="${node.id}" x="${x}" y="${y}" width="${node.width}" height="${node.height}" href="${escapeXml(node.imageUrl)}" preserveAspectRatio="${ar}"${opacity}${transform}${blendMode}${filterAttr} />`;
      }
      return `<g id="${node.id}"${opacity}${transform}${blendMode}${filterAttr}>
    <rect x="${x}" y="${y}" width="${node.width}" height="${node.height}" fill="${surface[3]}" />
    <text x="${x + node.width / 2}" y="${y + node.height / 2}" fill="${content.muted}" font-size="12" text-anchor="middle" dominant-baseline="central">image</text>
  </g>`;

    default:
      return `<rect id="${node.id}" x="${x}" y="${y}" width="${node.width}" height="${node.height}" ${fillAttr}${opacity}${transform}${blendMode}${filterAttr} />`;
  }
}

// ── Main SVG export ─────────────────────────────────────────────────

export function cleanSvgMarkup(svg: string): string {
  if (!svg || typeof svg !== 'string') {
    return svg;
  }
  let cleaned = svg;

  cleaned = cleaned.replace(/\s+data-[a-zA-Z0-9_-]+="[^"]*"/g, '');

  let prev = '';
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(/<g[^>]*>\s*<\/g>/gi, '');
  }

  cleaned = cleaned.replace(/<defs[^>]*>\s*<\/defs>/gi, '');

  cleaned = cleaned
    .split('\n')
    .map((line) => line.trimRight())
    .filter((line, idx, arr) => line !== '' || (idx > 0 && arr[idx - 1] !== ''))
    .join('\n');

  return cleaned.trim();
}

export function exportToSvg(nodesInput: (DesignNode | any)[], background = true): string {
  const nodes = (nodesInput || []).map(layerToDesignNode);
  if (nodes.length === 0) {
    return '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  }

  const nodesMap = new Map(nodes.map((n) => [n.id, n]));

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  nodes.forEach((n) => {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  });

  const w = maxX - minX;
  const h = maxY - minY;

  const defs: string[] = [];
  nodes.forEach((node) => {
    if (node.fill && typeof node.fill === 'object' && 'stops' in node.fill) {
      defs.push(renderGradientDef(`grad-${node.id}`, node.fill, node, minX, minY));
    }
    if (node.effects?.length) {
      const filterDef = renderEffectDefs(node.id, node.effects);
      if (filterDef) {
        defs.push(filterDef);
      }
    }
  });

  const bg = background ? `<rect x="0" y="0" width="${w}" height="${h}" fill="white" />` : '';

  const inner = nodes
    .sort((a, b) => (a as any).zIndex - (b as any).zIndex)
    .map((n) => `  ${renderNodeToSvg(n, nodesMap, minX, minY)}`)
    .join('\n');

  const defsBlock = defs.length > 0 ? `<defs>\n    ${defs.join('\n    ')}\n  </defs>\n` : '';

  const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${defsBlock}${bg}
  ${inner}
</svg>`;
  return cleanSvgMarkup(rawSvg);
}

// ── Canvas (raster) export ──────────────────────────────────────────

export async function exportToCanvas(
  canvas: HTMLCanvasElement,
  nodesInput: (DesignNode | any)[],
  options: ExportOptions
): Promise<Blob | null> {
  const allNodes = (nodesInput || []).map(layerToDesignNode);

  // Preload every image up-front so drawImage never races the network —
  // previously uncached images were silently replaced by placeholder fills.
  const imageCache = new Map<string, HTMLImageElement>();
  const imageUrls = Array.from(
    new Set(allNodes.filter((n: any) => n.type === 'image' && n.imageUrl).map((n: any) => n.imageUrl as string))
  );
  await Promise.all(
    imageUrls.map(
      (url) =>
        new Promise<void>((done) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            imageCache.set(url, img);
            done();
          };
          img.onerror = () => done();
          img.src = url;
        })
    )
  );

  return new Promise((resolve) => {
    const nodes = allNodes;
    if (nodes.length === 0) {
      resolve(null);
      return;
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    nodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    });

    const padding = 10;
    const scale = options.scale || 1;
    const w = (maxX - minX + padding * 2) * scale;
    const h = (maxY - minY + padding * 2) * scale;

    const offscreen = document.createElement('canvas');
    offscreen.width = Math.max(1, Math.round(w));
    offscreen.height = Math.max(1, Math.round(h));
    const ctx = offscreen.getContext('2d');
    if (!ctx) {
      resolve(null);
      return;
    }

    ctx.scale(scale, scale);

    if (options.background) {
      ctx.fillStyle = canvasTokens.export.background;
      ctx.fillRect(0, 0, w / scale, h / scale);
    }

    const sorted = [...nodes].sort((a, b) => (a as any).zIndex - (b as any).zIndex);

    for (const node of sorted) {
      const x = node.x - minX + padding;
      const y = node.y - minY + padding;

      ctx.save();
      ctx.globalAlpha = node.opacity ?? 1;

      if (node.blendMode !== 'normal') {
        ctx.globalCompositeOperation = node.blendMode as GlobalCompositeOperation;
      }

      if (node.rotation) {
        ctx.translate(x + node.width / 2, y + node.height / 2);
        ctx.rotate((node.rotation * Math.PI) / 180);
        ctx.translate(-(x + node.width / 2), -(y + node.height / 2));
      }

      if (node.effects?.length) {
        for (const effect of node.effects) {
          if (!effect.enabled) {
            continue;
          }
          if ((effect.type as any) === 'shadow') {
            const p = (effect as any).params;
            ctx.shadowOffsetX = p.x ?? 0;
            ctx.shadowOffsetY = p.y ?? 4;
            ctx.shadowBlur = p.blur ?? 8;
            ctx.shadowColor = hexToRgba(p.color ?? content.inverse, p.opacity ?? 0.25);
          }
          if ((effect.type as any) === 'blur') {
            ctx.filter = `blur(${(effect as any).params.radius ?? 4}px)`;
          }
          if ((effect.type as any) === 'glow') {
            const p = (effect as any).params;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = p.blur ?? 12;
            ctx.shadowColor = hexToRgba(p.color ?? content.primary, p.opacity ?? 0.6);
          }
        }
      }

      const hasGradient = node.fill && typeof node.fill === 'object' && 'stops' in node.fill;
      if (hasGradient) {
        ctx.fillStyle = createCanvasGradient(ctx, node.fill as GradientFill, node);
      } else {
        ctx.fillStyle = resolveFill(node);
      }

      switch (node.type) {
        case 'rect':
          if ((node.cornerRadius || 0) > 0) {
            canvasRoundRect(ctx, x, y, node.width, node.height, node.cornerRadius || 0);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, node.width, node.height);
          }
          if (node.stroke) {
            ctx.strokeStyle = node.stroke;
            ctx.lineWidth = node.strokeWidth || 0;
            if ((node.cornerRadius || 0) > 0) {
              canvasRoundRect(ctx, x, y, node.width, node.height, node.cornerRadius || 0);
              ctx.stroke();
            } else {
              ctx.strokeRect(x, y, node.width, node.height);
            }
          }
          break;

        case 'ellipse':
          ctx.beginPath();
          ctx.ellipse(x + node.width / 2, y + node.height / 2, node.width / 2, node.height / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          if (node.stroke) {
            ctx.strokeStyle = node.stroke;
            ctx.lineWidth = node.strokeWidth || 0;
            ctx.stroke();
          }
          break;

        case 'text': {
          const fontSize = node.fontSize || 16;
          const lineHeight = (node as any).lineHeight || 1.2;
          const letterSpacing = (node as any).letterSpacing || 0;
          ctx.font = `${(node as any).fontStyle || 'normal'} ${node.fontWeight || 400} ${fontSize}px ${node.fontFamily || 'system-ui'}`;
          ctx.textAlign = (node.textAlign as CanvasTextAlign) || 'left';
          ctx.textBaseline = 'top';
          if (letterSpacing) {
            ctx.letterSpacing = `${letterSpacing}px`;
          }
          // Shared resolver: textTransform + word wrap to layer width, matching the editor.
          const lines = resolveTextLines(node as any, (t) => ctx.measureText(t).width);
          const yStep = fontSize * lineHeight;
          // ctx.textAlign anchors at the given x, so shift it to the box center/right edge.
          const tx = node.textAlign === 'center' ? x + node.width / 2 : node.textAlign === 'right' ? x + node.width : x;
          const tShadow = (node as any).textShadow;
          if (tShadow) {
            ctx.shadowOffsetX = tShadow.offsetX ?? 0;
            ctx.shadowOffsetY = tShadow.offsetY ?? 0;
            ctx.shadowBlur = tShadow.blur ?? 0;
            ctx.shadowColor = tShadow.color ?? 'rgba(0,0,0,0.5)';
          }
          const tStroke = (node as any).textStroke;
          for (let i = 0; i < lines.length; i++) {
            if (tStroke && tStroke.width > 0) {
              ctx.strokeStyle = tStroke.color || '#000000';
              ctx.lineWidth = tStroke.width;
              ctx.lineJoin = 'round';
              ctx.strokeText(lines[i], tx, y + i * yStep);
            }
            ctx.fillText(lines[i], tx, y + i * yStep);
          }
          break;
        }

        case 'line':
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + node.width, y + node.height);
          ctx.strokeStyle = resolveFill(node);
          ctx.lineWidth = node.strokeWidth || 1;
          ctx.stroke();
          break;

        case 'path': {
          if (node.shapeType || node.pathData) {
            let pathObj = new Path2D(node.pathData || '');
            if (!node.pathData && node.shapeType) {
              const clipPath = getShapeDefinition(node.shapeType);
              if (clipPath && clipPath.startsWith('polygon(')) {
                let d = '';
                const inner = clipPath.slice(8, -1).trim();
                const points = inner.split(',').map((p) => p.trim());
                points.forEach((point, index) => {
                  const coords = point.split(/\s+/);
                  if (coords.length === 2) {
                    const px = coords[0].endsWith('%')
                      ? (parseFloat(coords[0]) / 100) * node.width
                      : parseFloat(coords[0]);
                    const py = coords[1].endsWith('%')
                      ? (parseFloat(coords[1]) / 100) * node.height
                      : parseFloat(coords[1]);
                    d += `${index === 0 ? 'M' : 'L'} ${px + x} ${py + y} `;
                  }
                });
                if (d) {
                  d += 'Z';
                }
                pathObj = new Path2D(d);
              }
            }
            if (pathObj) {
              ctx.fill(pathObj);
              if (node.stroke) {
                ctx.strokeStyle = node.stroke;
                ctx.lineWidth = node.strokeWidth || 0;
                ctx.stroke(pathObj);
              }
            }
          } else if (node.points && node.points.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(node.points[0].x - minX + padding, node.points[0].y - minY + padding);
            for (let i = 1; i < node.points.length; i++) {
              const p = node.points[i];
              const prev = node.points[i - 1];
              if (prev.handleOut || p.handleIn) {
                const cp1x = prev.x + (prev.handleOut?.x ?? 0) - minX + padding;
                const cp1y = prev.y + (prev.handleOut?.y ?? 0) - minY + padding;
                const cp2x = p.x + (p.handleIn?.x ?? 0) - minX + padding;
                const cp2y = p.y + (p.handleIn?.y ?? 0) - minY + padding;
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p.x - minX + padding, p.y - minY + padding);
              } else {
                ctx.lineTo(p.x - minX + padding, p.y - minY + padding);
              }
            }
            ctx.fill();
            if (node.stroke) {
              ctx.strokeStyle = node.stroke;
              ctx.lineWidth = node.strokeWidth || 0;
              ctx.stroke();
            }
          }
          break;
        }

        case 'image': {
          const img = node.imageUrl ? imageCache.get(node.imageUrl) : undefined;
          if (img && img.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, node.width, node.height);
            ctx.clip();
            const fit = node.imageFit || 'cover';
            let sx = 0,
              sy = 0,
              sw = img.naturalWidth,
              sh = img.naturalHeight;
            let dx = x,
              dy = y,
              dw = node.width,
              dh = node.height;
            if (fit === 'cover') {
              const imgRatio = sw / sh;
              const nodeRatio = dw / dh;
              if (imgRatio > nodeRatio) {
                sw = sh * nodeRatio;
                sx = (img.naturalWidth - sw) / 2;
              } else {
                sh = sw / nodeRatio;
                sy = (img.naturalHeight - sh) / 2;
              }
            } else if (fit === 'contain') {
              const imgRatio = sw / sh;
              const nodeRatio = dw / dh;
              if (imgRatio > nodeRatio) {
                dh = dw / imgRatio;
                dy = y + (node.height - dh) / 2;
              } else {
                dw = dh * imgRatio;
                dx = x + (node.width - dw) / 2;
              }
            }
            ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
            ctx.restore();
          } else {
            ctx.fillStyle = surface[3];
            ctx.fillRect(x, y, node.width, node.height);
          }
          break;
        }

        default:
          ctx.fillRect(x, y, node.width, node.height);
      }

      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'source-over';

      ctx.restore();
    }

    const format = (options.format || 'png').toLowerCase();
    const mimeType =
      format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';

    const qualityValue =
      typeof options.quality === 'number' ? (options.quality > 1 ? options.quality / 100 : options.quality) : 0.95;

    offscreen.toBlob((blob) => resolve(blob), mimeType, qualityValue);
  });
}

function createCanvasGradient(ctx: CanvasRenderingContext2D, fill: GradientFill, node: DesignNode): CanvasGradient {
  if (fill.type === 'linear') {
    const angle = ((fill.angle || 0) * Math.PI) / 180;
    const grad = ctx.createLinearGradient(
      node.x + (Math.cos(angle) * node.width) / 2,
      node.y + (Math.sin(angle) * node.height) / 2,
      node.x + node.width / 2 - (Math.cos(angle) * node.width) / 2,
      node.y + node.height / 2 - (Math.sin(angle) * node.height) / 2
    );
    fill.stops.forEach((s) => grad.addColorStop(s.offset, s.color));
    return grad;
  }
  const grad = ctx.createRadialGradient(
    node.x + node.width / 2,
    node.y + node.height / 2,
    0,
    node.x + node.width / 2,
    node.y + node.height / 2,
    node.width / 2
  );
  fill.stops.forEach((s) => grad.addColorStop(s.offset, s.color));
  return grad;
}

function canvasRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x + r, y + h);
  ctx.lineTo(x + r, y);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Export helpers for compatibility ─────────────────────────────────

export type ColorProfile = 'srgb' | 'cmyk' | 'p3' | 'FOGRA39' | 'GRACoL' | 'SWOP' | 'CMYK' | 'sRGB';

export interface PDFExportOptions {
  format?: 'pdf';
  bleed?: number;
  cropMarks?: boolean;
  colorProfile?: ColorProfile;
  targetDPI?: number;
}

export async function exportDesignToImage(
  nodes: (DesignNode | any)[],
  options: { width: number; height: number; format?: string; quality?: number; background?: boolean } = {
    width: 1080,
    height: 1080,
  }
): Promise<Blob> {
  const adaptedNodes = (nodes || []).map(layerToDesignNode);
  if (!Array.isArray(adaptedNodes) || adaptedNodes.length === 0) {
    return new Blob(['<svg></svg>'], { type: 'image/svg+xml' });
  }
  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  const result = await exportToCanvas(canvas, adaptedNodes, {
    format: (options.format || 'png') as any,
    scale: 1,
    selectionOnly: false,
    quality: options.quality || 0.95,
    background: options.background !== false,
  });
  return result || new Blob();
}

export async function exportDesignToBlob(
  nodes: (DesignNode | any)[],
  options: { width: number; height: number; format?: string; quality?: number } = { width: 1080, height: 1080 }
): Promise<Blob> {
  return exportDesignToImage(nodes, options);
}

export async function exportToSVG(width: number, height: number, background: string, layers: any[]): Promise<string> {
  if (!Array.isArray(layers) || layers.length === 0) {
    return cleanSvgMarkup(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" fill="${background || '#ffffff'}"/></svg>`
    );
  }
  const nodes: DesignNode[] = layers.map(layerToDesignNode);
  return cleanSvgMarkup(exportToSvg(nodes, !!background));
}

export async function exportToLayeredPSD(
  width: number,
  height: number,
  layers: any[],
  filename?: string
): Promise<void> {
  const { writePsd } = await import('ag-psd');
  const psdLayers: any[] = [];
  const adaptedNodes = (layers || []).map(layerToDesignNode);

  // Preload images concurrently to avoid sequential network delays
  const imageCache = new Map<string, HTMLImageElement>();
  const imageUrls = Array.from(
    new Set(adaptedNodes.filter((n: any) => n.type === 'image' && n.imageUrl).map((n: any) => n.imageUrl as string))
  );

  await Promise.all(
    imageUrls.map(
      (url) =>
        new Promise<void>((done) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            imageCache.set(url, img);
            done();
          };
          img.onerror = () => done();
          img.src = url;
        })
    )
  );

  for (let i = 0; i < adaptedNodes.length; i++) {
    const node = adaptedNodes[i];
    const layerCanvas = document.createElement('canvas');
    layerCanvas.width = Math.max(1, Math.round(node.width || 100));
    layerCanvas.height = Math.max(1, Math.round(node.height || 100));
    const ctx = layerCanvas.getContext('2d');

    if (ctx) {
      const fillStr = resolveFill(node);
      if (node.type === 'text') {
        ctx.fillStyle = typeof node.fill === 'string' ? node.fill : content.inverse;
        ctx.font = `${node.fontWeight || 400} ${node.fontSize || 24}px ${node.fontFamily || 'sans-serif'}`;
        ctx.textBaseline = 'top';
        ctx.fillText(node.text || '', 0, 0);
      } else if (node.type === 'rect' || node.type === 'ellipse' || node.type === 'line' || node.type === 'path') {
        ctx.fillStyle = fillStr;
        if (node.type === 'ellipse') {
          ctx.beginPath();
          ctx.ellipse(node.width / 2, node.height / 2, node.width / 2, node.height / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(0, 0, layerCanvas.width, layerCanvas.height);
        }
        if (node.stroke) {
          ctx.strokeStyle = node.stroke;
          ctx.lineWidth = node.strokeWidth || 1;
          ctx.strokeRect(0, 0, layerCanvas.width, layerCanvas.height);
        }
      } else if (node.type === 'image' && node.imageUrl) {
        const img = imageCache.get(node.imageUrl);
        if (img) {
          ctx.drawImage(img, 0, 0, layerCanvas.width, layerCanvas.height);
        }
      }
    }

    psdLayers.push({
      name: node.name || `Layer ${i + 1}`,
      left: Math.round(node.x || 0),
      top: Math.round(node.y || 0),
      right: Math.round((node.x || 0) + (node.width || 100)),
      bottom: Math.round((node.y || 0) + (node.height || 100)),
      opacity: node.opacity ?? 1,
      hidden: (node as any).visible === false,
      blendMode: node.blendMode || 'normal',
      canvas: layerCanvas,
      text: node.type === 'text' ? { text: node.text || '' } : undefined,
    });
  }

  const psd = {
    width: Math.round(width),
    height: Math.round(height),
    children: psdLayers,
  };

  const buffer = writePsd(psd);
  const blob = new Blob([buffer], { type: 'image/vnd.adobe.photoshop' });
  downloadBlob(blob, `${filename || 'design'}.psd`);
}

export async function exportToPrintPDF(
  width: number,
  height: number,
  layers: any[],
  filename?: string,
  options?: PDFExportOptions
): Promise<void> {
  const safeFilename = filename || 'export';
  const adaptedLayers = (layers || []).map(layerToDesignNode);

  // Try pdf.worker.ts for background CMYK + PDF generation
  try {
    const worker = new Worker(new URL('../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
    await new Promise<void>((resolve, reject) => {
      worker.onmessage = (e: MessageEvent) => {
        if (e.data.type === 'SUCCESS') {
          downloadBlob(e.data.payload, `${safeFilename}.pdf`);
          worker.terminate();
          resolve();
        } else if (e.data.type === 'ERROR') {
          worker.terminate();
          reject(new Error(e.data.error));
        }
      };
      worker.onerror = (err) => {
        worker.terminate();
        reject(err);
      };
      worker.postMessage({
        width,
        height,
        layers: adaptedLayers,
        fileName: safeFilename,
        options: options || {},
      });
    });
    return;
  } catch (workerErr) {
    // Fallback to jsPDF export
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [width, height],
    });
    const svg = await exportToSVG(width, height, '#ffffff', layers);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      await new Promise<void>((r, rej) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          r();
        };
        // Reject instead of silently resolving — otherwise a blank page is exported.
        img.onerror = () => rej(new Error('PDF export failed: could not rasterize the design'));
      });
      const pngData = canvas.toDataURL('image/png');
      pdf.addImage(pngData, 'PNG', 0, 0, width, height);
    }
    const blob = pdf.output('blob');
    downloadBlob(blob, `${safeFilename}.pdf`);
  }
}

export async function batchExportArtboardsZip(
  artboards: any[],
  options?: { format?: string; quality?: number }
): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const format = options?.format || 'png';
  const quality = options?.quality || 0.95;

  await Promise.all(
    artboards.map(async (ab, i) => {
      const nodes: DesignNode[] = (ab.layers || []).map(layerToDesignNode);
      const tempCanvas = document.createElement('canvas');
      const w = ab.width || 1080;
      const h = ab.height || 1080;
      tempCanvas.width = w;
      tempCanvas.height = h;
      const blob = await exportToCanvas(tempCanvas, nodes, {
        format: format as any,
        scale: 1,
        selectionOnly: false,
        quality,
        background: true,
      });
      if (blob) {
        const filename = `${ab.name ? ab.name.replace(/[^a-zA-Z0-9_-]/g, '-') : `artboard-${i + 1}`}.${format}`;
        zip.file(filename, blob);
      }
    })
  );

  return zip.generateAsync({ type: 'blob' });
}
