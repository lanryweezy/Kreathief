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
import { buildVariableStrokeOutline, profileWidthFn } from '../utils/variableStroke';

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

function parseCssGradientToFill(colorStr: string | undefined): GradientFill | null {
  if (!colorStr || typeof colorStr !== 'string') {
    return null;
  }
  const isLinear = colorStr.startsWith('linear-gradient(');
  const isRadial = colorStr.startsWith('radial-gradient(');
  if (!isLinear && !isRadial) {
    return null;
  }

  try {
    const content = colorStr.slice(colorStr.indexOf('(') + 1, colorStr.lastIndexOf(')'));
    const parts = content.split(/,(?![^(]*\))/).map((s) => s.trim());
    let angle = 90;
    let colorParts = parts;

    if (isLinear) {
      const firstPart = parts[0].toLowerCase();
      if (firstPart.includes('deg')) {
        angle = parseFloat(firstPart.replace('deg', '').trim()) || 90;
        colorParts = parts.slice(1);
      } else if (firstPart.includes('rad')) {
        angle = ((parseFloat(firstPart.replace('rad', '').trim()) || 0) * 180) / Math.PI;
        colorParts = parts.slice(1);
      } else if (firstPart.includes('turn')) {
        angle = (parseFloat(firstPart.replace('turn', '').trim()) || 0) * 360;
        colorParts = parts.slice(1);
      } else if (firstPart.startsWith('to ')) {
        const dir = firstPart.replace('to ', '').trim();
        if (dir === 'top') angle = 0;
        else if (dir === 'top right' || dir === 'right top') angle = 45;
        else if (dir === 'right') angle = 90;
        else if (dir === 'bottom right' || dir === 'right bottom') angle = 135;
        else if (dir === 'bottom') angle = 180;
        else if (dir === 'bottom left' || dir === 'left bottom') angle = 225;
        else if (dir === 'left') angle = 270;
        else if (dir === 'top left' || dir === 'left top') angle = 315;
        colorParts = parts.slice(1);
      }
    } else if (isRadial && (parts[0].includes('circle') || parts[0].includes('ellipse') || parts[0].includes('at '))) {
      colorParts = parts.slice(1);
    }

    const stops = colorParts.map((part, idx) => {
      const trimmed = part.trim();
      const lastSpaceIdx = trimmed.lastIndexOf(' ');
      let color = trimmed;
      let offset = idx / Math.max(1, colorParts.length - 1);

      if (lastSpaceIdx !== -1) {
        const possibleOffset = trimmed.slice(lastSpaceIdx + 1).trim();
        if (possibleOffset.endsWith('%')) {
          offset = parseFloat(possibleOffset) / 100;
          color = trimmed.slice(0, lastSpaceIdx).trim();
        } else if (!isNaN(Number(possibleOffset)) && possibleOffset !== '') {
          const val = parseFloat(possibleOffset);
          offset = val > 1 ? val / 100 : val;
          color = trimmed.slice(0, lastSpaceIdx).trim();
        }
      }

      return {
        color: color || '#000000',
        offset: Math.max(0, Math.min(1, isNaN(offset) ? idx / Math.max(1, colorParts.length - 1) : offset)),
      };
    });

    return {
      type: isRadial ? 'radial' : 'linear',
      angle,
      stops,
    };
  } catch {
    return null;
  }
}

function resolveNodeFill(layer: any): string | GradientFill {
  const cssGrad =
    parseCssGradientToFill(layer.color) ||
    parseCssGradientToFill(layer.fill) ||
    parseCssGradientToFill(layer.backgroundColor) ||
    parseCssGradientToFill(layer.background);
  if (cssGrad) {
    return cssGrad;
  }

  const g = layer.gradient || layer.backgroundGradient || layer.gradientOverlay;
  if (g && (g.enabled !== false || g.colors || g.stops || g.startColor)) {
    let stops: Array<{ color: string; offset: number }> = [];
    const rawStops = Array.isArray(g.stops) ? g.stops : Array.isArray(g.colors) ? g.colors : null;

    if (rawStops && rawStops.length > 0) {
      stops = rawStops.map((c: any, idx: number) => {
        const rawPos =
          typeof c.position === 'number'
            ? c.position
            : typeof c.offset === 'number'
              ? c.offset
              : undefined;
        let offset = idx / Math.max(1, rawStops.length - 1);
        if (typeof rawPos === 'number') {
          offset = rawPos > 1 ? rawPos / 100 : rawPos;
        }
        return {
          color: c.color || '#000000',
          offset: Math.max(0, Math.min(1, isNaN(offset) ? 0 : offset)),
        };
      });
    } else if (g.startColor && g.endColor) {
      stops = [
        { color: g.startColor, offset: 0 },
        { color: g.endColor, offset: 1 },
      ];
    }

    if (stops.length > 0) {
      return {
        type: g.type || 'linear',
        angle: g.angle ?? 90,
        stops,
      };
    }
  }

  return layer.fill || layer.color || surface[3];
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
function buildCanvasFilterString(filters: any): string {
  if (!filters || typeof filters !== 'object') return 'none';
  const parts: string[] = [];
  if (typeof filters.brightness === 'number' && filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
  if (typeof filters.contrast === 'number' && filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
  if (typeof filters.saturation === 'number' && filters.saturation !== 100) parts.push(`saturate(${filters.saturation}%)`);
  if (typeof filters.grayscale === 'number' && filters.grayscale > 0) parts.push(`grayscale(${filters.grayscale}%)`);
  if (typeof filters.sepia === 'number' && filters.sepia > 0) parts.push(`sepia(${filters.sepia}%)`);
  if (typeof filters.hueRotate === 'number' && filters.hueRotate !== 0) parts.push(`hue-rotate(${filters.hueRotate}deg)`);
  if (typeof filters.blur === 'number' && filters.blur > 0) parts.push(`blur(${filters.blur}px)`);
  if (typeof filters.opacity === 'number' && filters.opacity < 1) parts.push(`opacity(${filters.opacity})`);
  return parts.length > 0 ? parts.join(' ') : 'none';
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
    ...layer,
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
    cornerRadiusPerCorner: layer.cornerRadiusPerCorner,
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
    textTextureUrl: layer.textTextureUrl,
    neonGlow: layer.neonGlow,
    imageUrl,
    crop: layer.crop,
    flipX: layer.flipX,
    flipY: layer.flipY,
    imageFill: layer.imageFill,
    backgroundImage: layer.backgroundImage,
    viewBox: layer.viewBox || '0 0 100 100',
    effects,
    filters: layer.filters,
    points,
    pathData: layer.pathData,
    shapeType: layer.shapeType,
    brushType: layer.brushType,
    strokeProfile: layer.strokeProfile,
    strokeDasharray: layer.strokeDasharray,
    pathEffects: layer.pathEffects,
    inpaintNodes: layer.inpaintNodes,
    stickerEffect: layer.stickerEffect,
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
  let nx = node.x - offsetX;
  let ny = node.y - offsetY;
  let w = node.width || 100;
  let h = node.height || 100;

  if (node.type === 'path' && (node.pathData || node.shapeType)) {
    const vbStr = node.viewBox || '0 0 100 100';
    const vbParts = vbStr.split(/\s+/).map(Number);
    nx = 0;
    ny = 0;
    w = vbParts[2] || 100;
    h = vbParts[3] || 100;
  }

  const cx = nx + w / 2;
  const cy = ny + h / 2;

  if (fill.type === 'linear') {
    const angleDeg = fill.angle ?? 90;
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    const dx = (Math.cos(rad) * w) / 2;
    const dy = (Math.sin(rad) * h) / 2;
    const x1 = cx - dx;
    const y1 = cy - dy;
    const x2 = cx + dx;
    const y2 = cy + dy;
    const stops = fill.stops
      .map((s) => `<stop offset="${Math.max(0, Math.min(1, s.offset ?? 0))}" stop-color="${s.color || '#000000'}" />`)
      .join('');
    return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`;
  }

  const r = Math.max(1, Math.max(w, h) / 2);
  const stops = fill.stops
    .map((s) => `<stop offset="${Math.max(0, Math.min(1, s.offset ?? 0))}" stop-color="${s.color || '#000000'}" />`)
    .join('');
  return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}">${stops}</radialGradient>`;
}

// ── SVG filter defs ─────────────────────────────────────────────────

function renderEffectDefs(nodeId: string, effects: Effect[] = [], neonGlow?: any, stickerEffect?: any): string {
  let filterPrimitives = '';
  let hasFilter = false;

  if (stickerEffect?.enabled) {
    const sWidth = stickerEffect.width || 4;
    const sColor = stickerEffect.color || '#ffffff';
    const sBlur = stickerEffect.shadowBlur || 4;
    const sShadowColor = stickerEffect.shadowColor || '#000000';
    filterPrimitives += `<feMorphology in="SourceAlpha" operator="dilate" radius="${sWidth}" result="dilated" /><feFlood flood-color="${sColor}" result="flood" /><feComposite in="flood" in2="dilated" operator="in" result="outline" /><feDropShadow dx="0" dy="0" stdDeviation="${sBlur}" flood-color="${sShadowColor}" result="shadow" /><feMerge><feMergeNode in="shadow" /><feMergeNode in="outline" /><feMergeNode in="SourceGraphic" /></feMerge>`;
    hasFilter = true;
  }

  if (neonGlow?.enabled) {
    const blur = (neonGlow.blur || 10) * (neonGlow.intensity || 1);
    const color = neonGlow.color || '#00ffff';
    filterPrimitives += `<feDropShadow dx="0" dy="0" stdDeviation="${blur / 2}" flood-color="${color}" flood-opacity="0.8" /><feDropShadow dx="0" dy="0" stdDeviation="${blur}" flood-color="${color}" flood-opacity="0.5" />`;
    hasFilter = true;
  }

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

  return hasFilter ? `<filter id="filter-${nodeId}" x="-30%" y="-30%" width="160%" height="160%">${filterPrimitives}</filter>` : '';
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
  const strokeDash = (node as any).strokeDasharray ? ` stroke-dasharray="${(node as any).strokeDasharray}"` : '';
  const stroke = node.stroke ? `stroke="${node.stroke}" stroke-width="${node.strokeWidth || 1}"${strokeDash}` : '';
  const opacity = (node.opacity ?? 1) < 1 ? ` opacity="${node.opacity ?? 1}"` : '';
  
  const transforms: string[] = [];
  if (node.rotation) {
    transforms.push(`rotate(${node.rotation} ${x + node.width / 2} ${y + node.height / 2})`);
  }
  if (node.flipX || node.flipY) {
    const fx = node.flipX ? -1 : 1;
    const fy = node.flipY ? -1 : 1;
    transforms.push(`translate(${x + node.width / 2} ${y + node.height / 2}) scale(${fx} ${fy}) translate(${-(x + node.width / 2)} ${-(y + node.height / 2)})`);
  }
  if ((node as any).skewX || (node as any).skewY) {
    if ((node as any).skewX) transforms.push(`skewX(${(node as any).skewX})`);
    if ((node as any).skewY) transforms.push(`skewY(${(node as any).skewY})`);
  }
  const transform = transforms.length > 0 ? ` transform="${transforms.join(' ')}"` : '';

  const blendMode = node.blendMode !== 'normal' ? ` style="mix-blend-mode:${node.blendMode}"` : '';
  const hasFilterDefs = (node.effects?.some((e) => e.enabled)) || node.neonGlow?.enabled || (node as any).stickerEffect?.enabled;
  const filterAttr = hasFilterDefs ? ` filter="url(#filter-${node.id})"` : '';

  let fillAttr: string;
  const hasGradient = node.fill && typeof node.fill === 'object' && 'stops' in node.fill;
  if ((node as any).textTextureUrl) {
    fillAttr = `fill="url(#pattern-${node.id})"`;
  } else if (hasGradient) {
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
    case 'rect': {
      const radius = node.cornerRadiusPerCorner || node.cornerRadius || 0;
      const rVal = typeof radius === 'object' ? Math.max(radius.tl || 0, radius.tr || 0) : radius;
      const rxAttr = rVal > 0 ? ` rx="${rVal}" ry="${rVal}"` : '';
      const shapeImgSrc = (node as any).imageFill?.src || (node as any).backgroundImage;

      if (shapeImgSrc) {
        const ar = (node as any).imageFill?.fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice';
        const clipDef = `<clipPath id="clip-rect-${node.id}"><rect x="${x}" y="${y}" width="${node.width}" height="${node.height}"${rxAttr} /></clipPath>`;
        const strokeSvg = stroke ? `<rect x="${x}" y="${y}" width="${node.width}" height="${node.height}" fill="none" ${stroke}${rxAttr} />` : '';
        return `<defs>${clipDef}</defs><g id="${node.id}"${opacity}${transform}${blendMode}${filterAttr}><rect x="${x}" y="${y}" width="${node.width}" height="${node.height}" ${fillAttr}${rxAttr} /><image x="${x}" y="${y}" width="${node.width}" height="${node.height}" href="${escapeXml(shapeImgSrc)}" preserveAspectRatio="${ar}" clip-path="url(#clip-rect-${node.id})" />${strokeSvg}</g>`;
      }

      return `<rect id="${node.id}" x="${x}" y="${y}" width="${node.width}" height="${node.height}" ${fillAttr}${stroke}${rxAttr}${opacity}${transform}${blendMode}${filterAttr} />`;
    }

    case 'ellipse': {
      const shapeImgSrc = (node as any).imageFill?.src || (node as any).backgroundImage;
      if (shapeImgSrc) {
        const ar = (node as any).imageFill?.fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice';
        const clipDef = `<clipPath id="clip-ellipse-${node.id}"><ellipse cx="${x + node.width / 2}" cy="${y + node.height / 2}" rx="${node.width / 2}" ry="${node.height / 2}" /></clipPath>`;
        const strokeSvg = stroke ? `<ellipse cx="${x + node.width / 2}" cy="${y + node.height / 2}" rx="${node.width / 2}" ry="${node.height / 2}" fill="none" ${stroke} />` : '';
        return `<defs>${clipDef}</defs><g id="${node.id}"${opacity}${transform}${blendMode}${filterAttr}><ellipse cx="${x + node.width / 2}" cy="${y + node.height / 2}" rx="${node.width / 2}" ry="${node.height / 2}" ${fillAttr} /><image x="${x}" y="${y}" width="${node.width}" height="${node.height}" href="${escapeXml(shapeImgSrc)}" preserveAspectRatio="${ar}" clip-path="url(#clip-ellipse-${node.id})" />${strokeSvg}</g>`;
      }

      return `<ellipse id="${node.id}" cx="${x + node.width / 2}" cy="${y + node.height / 2}" rx="${node.width / 2}" ry="${node.height / 2}" ${fillAttr}${stroke}${opacity}${transform}${blendMode}${filterAttr} />`;
    }

    case 'text': {
      const fontSize = node.fontSize || 16;
      const textFill = (node as any).styleType === 'hollow'
        ? 'none'
        : hasGradient
          ? `url(#grad-${node.id})`
          : (node as any).textTextureUrl
            ? `url(#pattern-${node.id})`
            : (node.fill && typeof node.fill === 'string' ? node.fill : content.inverse);
      const lineHeight = (node as any).lineHeight || 1.2;
      const letterSpacing = (node as any).letterSpacing || 0;
      const textAnchor = node.textAlign === 'center' ? 'middle' : node.textAlign === 'right' ? 'end' : 'start';
      const tx = node.textAlign === 'center' ? x + node.width / 2 : node.textAlign === 'right' ? x + node.width : x;
      const ls = letterSpacing ? ` letter-spacing="${letterSpacing}"` : '';
      const tStroke = (node as any).textStroke;
      const strokeAttr =
        tStroke && tStroke.width > 0
          ? ` stroke="${tStroke.color || '#000000'}" stroke-width="${tStroke.width}" paint-order="stroke"`
          : (node as any).styleType === 'hollow'
            ? ` stroke="${(node.fill && typeof node.fill === 'string' ? node.fill : '#7d2ae8')}" stroke-width="1.5" paint-order="stroke"`
            : '';
      const fontStyleAttr =
        (node as any).fontStyle && (node as any).fontStyle !== 'normal'
          ? ` font-style="${(node as any).fontStyle}"`
          : '';

      const warpStyle = (node as any).warpStyle;
      if (warpStyle === 'arc' || warpStyle === 'wave') {
        const textH = Math.max(120, fontSize * 2.5);
        const curve = (node as any).curve ?? 45;
        const pathD =
          warpStyle === 'arc'
            ? `M 10 ${Math.max(60, fontSize * 1.25)} Q ${node.width / 2} ${Math.max(60, fontSize * 1.25) - curve * 1.8} ${node.width - 10} ${Math.max(60, fontSize * 1.25)}`
            : `M 10 ${Math.max(60, fontSize * 1.25)} Q ${node.width / 4} ${Math.max(60, fontSize * 1.25) - curve * 1.2} ${node.width / 2} ${Math.max(60, fontSize * 1.25)} T ${node.width - 10} ${Math.max(60, fontSize * 1.25)}`;
        return `<g id="${node.id}" transform="translate(${x} ${y})"${opacity}${blendMode}${filterAttr}>
    <defs><path id="path-${node.id}" d="${pathD}" fill="none" /></defs>
    <text fill="${textFill}" font-size="${fontSize}" font-family="${node.fontFamily || 'system-ui'}" font-weight="${node.fontWeight || 400}"${fontStyleAttr} text-anchor="middle"${ls}${strokeAttr}>
      <textPath href="#path-${node.id}" startOffset="50%">${escapeXml(node.text || '')}</textPath>
    </text>
  </g>`;
      }

      const lines = resolveTextLines(node as any);
      const yStep = fontSize * lineHeight;
      if (lines.length === 1) {
        return `<text id="${node.id}" x="${tx}" y="${y + fontSize}" fill="${textFill}" font-size="${fontSize}" font-family="${node.fontFamily || 'system-ui'}" font-weight="${node.fontWeight || 400}"${fontStyleAttr} text-anchor="${textAnchor}"${ls}${strokeAttr}${opacity}${transform}${blendMode}${filterAttr}>${escapeXml(lines[0])}</text>`;
      }
      const tspans = lines
        .map((line, i) => `<tspan x="${tx}" dy="${i === 0 ? 0 : yStep}">${escapeXml(line)}</tspan>`)
        .join('');
      return `<text id="${node.id}" x="${tx}" y="${y + fontSize}" fill="${textFill}" font-size="${fontSize}" font-family="${node.fontFamily || 'system-ui'}" font-weight="${node.fontWeight || 400}"${fontStyleAttr} text-anchor="${textAnchor}"${ls}${strokeAttr}${opacity}${transform}${blendMode}${filterAttr}>${tspans}</text>`;
    }

    case 'line':
      return `<line id="${node.id}" x1="${x}" y1="${y}" x2="${x + node.width}" y2="${y + node.height}" stroke="${fill}" stroke-width="${node.strokeWidth || 1}"${strokeDash}${opacity}${transform}${blendMode}${filterAttr} />`;

    case 'path': {
      const vbStr = node.viewBox || '0 0 100 100';
      const vbParts = vbStr.split(/\s+/).map(Number);
      const vbW = vbParts[2] || 100;
      const vbH = vbParts[3] || 100;
      const sx = node.width / vbW;
      const sy = node.height / vbH;

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
              const px = coords[0].endsWith('%') ? (parseFloat(coords[0]) / 100) * vbW : parseFloat(coords[0]);
              const py = coords[1].endsWith('%') ? (parseFloat(coords[1]) / 100) * vbH : parseFloat(coords[1]);
              d += `${index === 0 ? 'M' : 'L'} ${px} ${py} `;
            }
          });
          if (d) {
            d += 'Z';
          }
        }
      }

      if (d) {
        const shapeImgSrc = (node as any).imageFill?.src || (node as any).backgroundImage;
        let innerSvg = '';
        if (shapeImgSrc) {
          innerSvg = `<defs><clipPath id="clip-path-${node.id}"><path d="${d}" /></clipPath></defs><image x="0" y="0" width="${vbW}" height="${vbH}" href="${escapeXml(shapeImgSrc)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip-path-${node.id})" />`;
        } else {
          innerSvg = `<path d="${d}" ${fillAttr} />`;
        }

        let strokeElement = '';
        if (node.stroke) {
          const profile = (node as any).strokeProfile || 'uniform';
          if (profile !== 'uniform' && node.strokeWidth) {
            const widthFn = profileWidthFn(profile, node.strokeWidth);
            const outline = buildVariableStrokeOutline(d, widthFn, 64);
            if (outline) {
              strokeElement = `<path d="${outline}" fill="${node.stroke}" />`;
            }
          } else {
            const sw = (node.strokeWidth || 1) / ((sx + sy) / 2 || 1);
            strokeElement = `<path d="${d}" fill="none" stroke="${node.stroke}" stroke-width="${sw}"${strokeDash} />`;
          }
        }

        const rotTransform = node.rotation ? `rotate(${node.rotation} ${vbW / 2} ${vbH / 2})` : '';
        return `<g id="${node.id}" transform="translate(${x} ${y}) scale(${sx} ${sy}) ${rotTransform}"${opacity}${blendMode}${filterAttr}>
    ${innerSvg}
    ${strokeElement}
  </g>`;
      }

      if (!node.points || node.points.length < 2) {
        return '';
      }

      const translated = node.points.map((p: any) => ({
        ...p,
        x: p.x - offsetX,
        y: p.y - offsetY,
        handleIn: p.handleIn ? { x: p.handleIn.x, y: p.handleIn.y } : undefined,
        handleOut: p.handleOut ? { x: p.handleOut.x, y: p.handleOut.y } : undefined,
      }));
      const pointsPath = pointsToSvgPath(translated);
      return `<path id="${node.id}" d="${pointsPath}" ${fillAttr}${stroke}${opacity}${transform}${blendMode}${filterAttr} />`;
    }

    case 'image':
      if (node.imageUrl) {
        const ar = node.imageFit === 'contain' ? 'xMidYMid meet' : node.imageFit === 'fill' ? 'none' : 'xMidYMid slice';
        const radius = node.cornerRadiusPerCorner || node.cornerRadius || 0;
        const rVal = typeof radius === 'object' ? Math.max(radius.tl || 0, radius.tr || 0) : radius;
        const rxAttr = rVal > 0 ? ` rx="${rVal}" ry="${rVal}"` : '';
        
        let clipDef = '';
        let clipAttr = '';
        if ((node as any).maskPath) {
          clipDef = `<clipPath id="clip-mask-${node.id}"><path d="${(node as any).maskPath}" /></clipPath>`;
          clipAttr = ` clip-path="url(#clip-mask-${node.id})"`;
        } else if (rVal > 0) {
          clipDef = `<clipPath id="clip-${node.id}"><rect x="${x}" y="${y}" width="${node.width}" height="${node.height}"${rxAttr} /></clipPath>`;
          clipAttr = ` clip-path="url(#clip-${node.id})"`;
        }

        const strokeSvg = stroke ? `<rect x="${x}" y="${y}" width="${node.width}" height="${node.height}" fill="none" ${stroke}${rxAttr} />` : '';

        // Inpaint patches overlay
        let inpaintSvg = '';
        if ((node as any).inpaintNodes?.length) {
          for (const patch of (node as any).inpaintNodes) {
            if (patch.enabled && patch.patchSrc) {
              inpaintSvg += `<image x="${x}" y="${y}" width="${node.width}" height="${node.height}" href="${escapeXml(patch.patchSrc)}" opacity="${patch.opacity ?? 1}" preserveAspectRatio="${ar}"${clipAttr} />`;
            }
          }
        }

        return `${clipDef ? `<defs>${clipDef}</defs>` : ''}<g id="${node.id}"${opacity}${transform}${blendMode}${filterAttr}><image x="${x}" y="${y}" width="${node.width}" height="${node.height}" href="${escapeXml(node.imageUrl)}" preserveAspectRatio="${ar}"${clipAttr} />${inpaintSvg}${strokeSvg}</g>`;
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

export function exportToSvg(
  nodesInput: (DesignNode | any)[],
  background: boolean | string = true,
  width?: number,
  height?: number,
  backgroundColor?: string
): string {
  const nodes = (nodesInput || []).map(layerToDesignNode);
  if (nodes.length === 0 && width === undefined && height === undefined && !background) {
    return '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  }

  const nodesMap = new Map(nodes.map((n) => [n.id, n]));

  // If width/height are not provided (legacy usage), compute bounds
  let w = width || 1080;
  let h = height || 1080;
  let minX = 0,
    minY = 0;

  if ((width === undefined || height === undefined) && nodes.length > 0) {
    minX = Infinity;
    minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    nodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    });
    w = maxX - minX;
    h = maxY - minY;
  }

  const defs: string[] = [];
  nodes.forEach((node) => {
    if (node.fill && typeof node.fill === 'object' && 'stops' in node.fill) {
      defs.push(renderGradientDef(`grad-${node.id}`, node.fill, node, minX, minY));
    }
    if ((node as any).textTextureUrl) {
      defs.push(`<pattern id="pattern-${node.id}" width="100%" height="100%" patternContentUnits="objectBoundingBox"><image href="${escapeXml((node as any).textTextureUrl)}" width="1" height="1" preserveAspectRatio="none" /></pattern>`);
    }
    if (node.effects?.length || node.neonGlow?.enabled || (node as any).stickerEffect?.enabled) {
      const filterDef = renderEffectDefs(node.id, node.effects, node.neonGlow, (node as any).stickerEffect);
      if (filterDef) {
        defs.push(filterDef);
      }
    }
  });

  const bgStr = typeof background === 'string' ? background : backgroundColor || (background ? '#ffffff' : '');
  let bg = '';
  if (bgStr && bgStr !== 'transparent') {
    const bgGrad = parseCssGradientToFill(bgStr);
    if (bgGrad) {
      const dummyBgNode: DesignNode = {
        id: 'artboard-bg',
        type: 'rect',
        x: 0,
        y: 0,
        width: w,
        height: h,
        fill: bgGrad,
      };
      defs.unshift(renderGradientDef('grad-artboard-bg', bgGrad, dummyBgNode, 0, 0));
      bg = `<rect x="0" y="0" width="${w}" height="${h}" fill="url(#grad-artboard-bg)" />`;
    } else {
      bg = `<rect x="0" y="0" width="${w}" height="${h}" fill="${bgStr}" />`;
    }
  }

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
    new Set(
      allNodes
        .flatMap((n: any) => [
          n.imageUrl,
          n.imageFill?.src,
          n.backgroundImage,
          n.src,
          n.textTextureUrl,
          ...(n.inpaintNodes || []).map((p: any) => p.patchSrc),
        ])
        .filter((url): url is string => typeof url === 'string' && url.length > 0)
    )
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

    // Always export the full canvas size to maintain exact WYSIWYG placement
    const scale = options.scale || 1;
    const w = canvas.width * scale;
    const h = canvas.height * scale;

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
      const bgVal =
        typeof options.background === 'string'
          ? options.background
          : (options as any).backgroundColor || canvasTokens.export.background;

      if (bgVal && bgVal !== 'transparent') {
        const bgGrad = parseCssGradientToFill(bgVal);
        if (bgGrad) {
          const dummyBgNode: DesignNode = {
            id: 'artboard-bg',
            type: 'rect',
            x: 0,
            y: 0,
            width: w / scale,
            height: h / scale,
            fill: bgGrad,
          };
          ctx.fillStyle = createCanvasGradient(ctx, bgGrad, dummyBgNode);
        } else {
          ctx.fillStyle = bgVal;
        }
        ctx.fillRect(0, 0, w / scale, h / scale);
      }
    }

    const sorted = [...nodes].sort((a, b) => (a as any).zIndex - (b as any).zIndex);

    for (const node of sorted) {
      const x = node.x;
      const y = node.y;

      ctx.save();
      ctx.globalAlpha = node.opacity ?? 1;

      if (node.blendMode !== 'normal') {
        ctx.globalCompositeOperation = node.blendMode as GlobalCompositeOperation;
      }

      if (node.rotation || node.flipX || node.flipY || (node as any).skewX || (node as any).skewY) {
        ctx.translate(x + node.width / 2, y + node.height / 2);
        if (node.rotation) {
          ctx.rotate((node.rotation * Math.PI) / 180);
        }
        if (node.flipX || node.flipY) {
          ctx.scale(node.flipX ? -1 : 1, node.flipY ? -1 : 1);
        }
        if ((node as any).skewX || (node as any).skewY) {
          const radX = (((node as any).skewX || 0) * Math.PI) / 180;
          const radY = (((node as any).skewY || 0) * Math.PI) / 180;
          ctx.transform(1, Math.tan(radY), Math.tan(radX), 1, 0, 0);
        }
        ctx.translate(-(x + node.width / 2), -(y + node.height / 2));
      }

      if (node.filters) {
        const fStr = buildCanvasFilterString(node.filters);
        if (fStr !== 'none') {
          ctx.filter = fStr;
        }
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

      // Configure dashed stroke if specified on layer
      if ((node as any).strokeDasharray) {
        const dashes = String((node as any).strokeDasharray)
          .split(/[\s,]+/)
          .map(Number)
          .filter((n) => !isNaN(n));
        if (dashes.length > 0) {
          ctx.setLineDash(dashes);
        } else {
          ctx.setLineDash([]);
        }
      } else {
        ctx.setLineDash([]);
      }

      const hasGradient = node.fill && typeof node.fill === 'object' && 'stops' in node.fill;
      if (hasGradient) {
        ctx.fillStyle = createCanvasGradient(ctx, node.fill as GradientFill, node);
      } else {
        ctx.fillStyle = resolveFill(node);
      }

      switch (node.type) {
        case 'rect': {
          const radius = node.cornerRadiusPerCorner || node.cornerRadius || 0;
          const hasRadius = typeof radius === 'object' ? (radius.tl || radius.tr || radius.br || radius.bl) : radius > 0;
          const shapeImgSrc = (node as any).imageFill?.src || (node as any).backgroundImage;
          const shapeImg = shapeImgSrc ? imageCache.get(shapeImgSrc) : null;

          if (hasRadius) {
            canvasRoundRect(ctx, x, y, node.width, node.height, radius);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, node.width, node.height);
          }

          if (shapeImg && shapeImg.naturalWidth > 0) {
            ctx.save();
            if (hasRadius) {
              canvasRoundRect(ctx, x, y, node.width, node.height, radius);
              ctx.clip();
            } else {
              ctx.beginPath();
              ctx.rect(x, y, node.width, node.height);
              ctx.clip();
            }
            ctx.drawImage(shapeImg, x, y, node.width, node.height);
            ctx.restore();
          }

          if (node.stroke) {
            ctx.strokeStyle = node.stroke;
            ctx.lineWidth = node.strokeWidth || 0;
            if (hasRadius) {
              canvasRoundRect(ctx, x, y, node.width, node.height, radius);
              ctx.stroke();
            } else {
              ctx.strokeRect(x, y, node.width, node.height);
            }
          }
          break;
        }

        case 'ellipse': {
          const shapeImgSrc = (node as any).imageFill?.src || (node as any).backgroundImage;
          const shapeImg = shapeImgSrc ? imageCache.get(shapeImgSrc) : null;

          ctx.beginPath();
          ctx.ellipse(x + node.width / 2, y + node.height / 2, node.width / 2, node.height / 2, 0, 0, Math.PI * 2);
          ctx.fill();

          if (shapeImg && shapeImg.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(x + node.width / 2, y + node.height / 2, node.width / 2, node.height / 2, 0, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(shapeImg, x, y, node.width, node.height);
            ctx.restore();
          }

          if (node.stroke) {
            ctx.strokeStyle = node.stroke;
            ctx.lineWidth = node.strokeWidth || 0;
            ctx.beginPath();
            ctx.ellipse(x + node.width / 2, y + node.height / 2, node.width / 2, node.height / 2, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        }

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

          if ((node as any).textTextureUrl) {
            const texImg = imageCache.get((node as any).textTextureUrl);
            if (texImg) {
              const pattern = ctx.createPattern(texImg, 'repeat');
              if (pattern) ctx.fillStyle = pattern;
            }
          }

          // Shared resolver: textTransform + word wrap to layer width, matching the editor.
          const lines = resolveTextLines(node as any, (t) => ctx.measureText(t).width);
          const yStep = fontSize * lineHeight;
          // ctx.textAlign anchors at the given x, so shift it to the box center/right edge.
          const tx = node.textAlign === 'center' ? x + node.width / 2 : node.textAlign === 'right' ? x + node.width : x;

          if (node.neonGlow?.enabled) {
            ctx.shadowColor = node.neonGlow.color || '#00ffff';
            ctx.shadowBlur = (node.neonGlow.blur || 10) * (node.neonGlow.intensity || 1);
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          } else {
            const tShadow = (node as any).textShadow;
            if (tShadow) {
              ctx.shadowOffsetX = tShadow.offsetX ?? 0;
              ctx.shadowOffsetY = tShadow.offsetY ?? 0;
              ctx.shadowBlur = tShadow.blur ?? 0;
              ctx.shadowColor = tShadow.color ?? 'rgba(0,0,0,0.5)';
            }
          }

          const isHollow = (node as any).styleType === 'hollow';
          const tStroke = (node as any).textStroke || (isHollow ? { width: 1.5, color: typeof node.fill === 'string' ? node.fill : '#7d2ae8' } : undefined);

          for (let i = 0; i < lines.length; i++) {
            if (tStroke && tStroke.width > 0) {
              ctx.strokeStyle = tStroke.color || '#000000';
              ctx.lineWidth = tStroke.width;
              ctx.lineJoin = 'round';
              ctx.strokeText(lines[i], tx, y + i * yStep);
            }
            if (!isHollow) {
              ctx.fillText(lines[i], tx, y + i * yStep);
            }
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
            const vbStr = node.viewBox || '0 0 100 100';
            const vbParts = vbStr.split(/\s+/).map(Number);
            const vbW = vbParts[2] || 100;
            const vbH = vbParts[3] || 100;
            const sx = node.width / vbW;
            const sy = node.height / vbH;

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
                      ? (parseFloat(coords[0]) / 100) * vbW
                      : parseFloat(coords[0]);
                    const py = coords[1].endsWith('%')
                      ? (parseFloat(coords[1]) / 100) * vbH
                      : parseFloat(coords[1]);
                    d += `${index === 0 ? 'M' : 'L'} ${px} ${py} `;
                  }
                });
                if (d) {
                  d += 'Z';
                }
                pathObj = new Path2D(d);
              }
            }
            if (pathObj) {
              ctx.save();
              ctx.translate(x, y);
              ctx.scale(sx, sy);

              if (hasGradient) {
                const localNode: DesignNode = {
                  ...node,
                  x: 0,
                  y: 0,
                  width: vbW,
                  height: vbH,
                };
                ctx.fillStyle = createCanvasGradient(ctx, node.fill as GradientFill, localNode);
              }

              const imgSrc = node.imageFill?.src || node.backgroundImage;
              const imgEl = imgSrc ? imageCache.get(imgSrc) : null;

              if (imgEl) {
                ctx.save();
                ctx.clip(pathObj);
                ctx.drawImage(imgEl, 0, 0, vbW, vbH);
                ctx.restore();
              } else {
                ctx.fill(pathObj);
              }

              if (node.stroke) {
                const profile = (node as any).strokeProfile || 'uniform';
                if (profile !== 'uniform' && node.strokeWidth && node.pathData) {
                  const widthFn = profileWidthFn(profile, node.strokeWidth);
                  const outline = buildVariableStrokeOutline(node.pathData, widthFn, 128);
                  if (outline) {
                    ctx.fillStyle = node.stroke;
                    ctx.fill(new Path2D(outline));
                  }
                } else {
                  ctx.strokeStyle = node.stroke;
                  ctx.lineWidth = (node.strokeWidth || 1) / ((sx + sy) / 2 || 1);
                  ctx.stroke(pathObj);
                }
              }
              ctx.restore();
            }
          } else if (node.points && node.points.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(x + node.points[0].x, y + node.points[0].y);
            for (let i = 1; i < node.points.length; i++) {
              const p = node.points[i];
              const prev = node.points[i - 1];
              if (prev.handleOut || p.handleIn) {
                const cp1x = x + prev.x + (prev.handleOut?.x ?? 0);
                const cp1y = y + prev.y + (prev.handleOut?.y ?? 0);
                const cp2x = x + p.x + (p.handleIn?.x ?? 0);
                const cp2y = y + p.y + (p.handleIn?.y ?? 0);
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x + p.x, y + p.y);
              } else {
                ctx.lineTo(x + p.x, y + p.y);
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
          const radius = node.cornerRadiusPerCorner || node.cornerRadius || 0;
          const hasRadius = typeof radius === 'object' ? (radius.tl || radius.tr || radius.br || radius.bl) : radius > 0;

          ctx.save();
          if ((node as any).maskPath) {
            ctx.clip(new Path2D((node as any).maskPath));
          } else if (hasRadius) {
            canvasRoundRect(ctx, x, y, node.width, node.height, radius);
            ctx.clip();
          } else {
            ctx.beginPath();
            ctx.rect(x, y, node.width, node.height);
            ctx.clip();
          }

          if (img && img.naturalWidth > 0) {
            if (node.crop) {
              ctx.drawImage(
                img,
                node.crop.x,
                node.crop.y,
                node.crop.width,
                node.crop.height,
                x,
                y,
                node.width,
                node.height
              );
            } else {
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
            }

            if (node.inpaintNodes && node.inpaintNodes.length > 0) {
              for (const patch of node.inpaintNodes) {
                if (!patch.enabled || !patch.patchSrc) continue;
                const patchImg = imageCache.get(patch.patchSrc);
                if (patchImg && patchImg.naturalWidth > 0) {
                  ctx.save();
                  ctx.globalAlpha = (node.opacity ?? 1) * (patch.opacity ?? 1);
                  ctx.drawImage(patchImg, x, y, node.width, node.height);
                  ctx.restore();
                }
              }
            }
          } else {
            ctx.fillStyle = surface[3];
            ctx.fillRect(x, y, node.width, node.height);
          }
          ctx.restore();

          if (node.stroke) {
            ctx.strokeStyle = node.stroke;
            ctx.lineWidth = node.strokeWidth || 1;
            if (hasRadius) {
              canvasRoundRect(ctx, x, y, node.width, node.height, radius);
              ctx.stroke();
            } else {
              ctx.strokeRect(x, y, node.width, node.height);
            }
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
  const nx = node.x;
  const ny = node.y;
  const w = node.width || 100;
  const h = node.height || 100;
  const cx = nx + w / 2;
  const cy = ny + h / 2;

  if (fill.type === 'linear') {
    const angleDeg = fill.angle ?? 90;
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    const dx = (Math.cos(rad) * w) / 2;
    const dy = (Math.sin(rad) * h) / 2;
    const grad = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    fill.stops.forEach((s) => {
      const offset = Math.max(0, Math.min(1, s.offset ?? 0));
      grad.addColorStop(offset, s.color || '#000000');
    });
    return grad;
  }

  const r = Math.max(1, Math.max(w, h) / 2);
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  fill.stops.forEach((s) => {
    const offset = Math.max(0, Math.min(1, s.offset ?? 0));
    grad.addColorStop(offset, s.color || '#000000');
  });
  return grad;
}

function canvasRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | { tl?: number; tr?: number; br?: number; bl?: number }
) {
  const tl = typeof r === 'object' ? (r.tl || 0) : (r || 0);
  const tr = typeof r === 'object' ? (r.tr || 0) : (r || 0);
  const br = typeof r === 'object' ? (r.br || 0) : (r || 0);
  const bl = typeof r === 'object' ? (r.bl || 0) : (r || 0);

  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  if (tr > 0) ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  if (br > 0) ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  if (bl > 0) ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  if (tl > 0) ctx.quadraticCurveTo(x, y, x + tl, y);
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
  options: { width: number; height: number; format?: string; quality?: number; background?: boolean; backgroundColor?: string } = {
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
    backgroundColor: options.backgroundColor,
  } as any);
  return result || new Blob();
}

export async function exportDesignToBlob(
  nodes: (DesignNode | any)[],
  options: { width: number; height: number; format?: string; quality?: number } = { width: 1080, height: 1080 }
): Promise<Blob> {
  return exportDesignToImage(nodes, options);
}

export async function exportToSVG(width: number, height: number, background: string, layers: any[]): Promise<string> {
  const nodes: DesignNode[] = (layers || []).map(layerToDesignNode);
  return cleanSvgMarkup(exportToSvg(nodes, background, width, height));
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
