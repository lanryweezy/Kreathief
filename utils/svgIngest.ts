import type { DesignNode } from '../types/design';
import { cleanPathData, type CleanOptions } from '../geometry/simplify';

/**
 * Pure SVG-string -> editable DesignNode[] ingest.
 *
 * Why this exists (Phase 1.3 "never dead-end"): every vector-producing path we
 * have — Recraft's native SVG, an imported .svg, or a raster the user traced with
 * ImageTracer (vectorizerService.traceImage) — ultimately hands us an *SVG string*.
 * The browser-only `vectorizerService.extractPaths` throws away everything except
 * `d` + `fill`, needs DOMParser, and cannot run in a unit test. That made
 * "drop a traced logo onto the canvas as editable layers" untestable and lossy.
 *
 * This module is the missing kernel: no DOM, no canvas, deterministic. It turns an
 * SVG string into flat, genuinely-editable DesignNodes and (optionally) runs the
 * Phase 1.2 `cleanPathData` pass so traced/penTool bloat becomes sensible node
 * counts. That is the defensible differentiator: competitors hand back a flattened
 * raster or a single opaque path; we hand back editable vector layers.
 *
 * Scope / honest limitations (documented, not silently wrong):
 *   - Handles <path>, <rect>, <circle>, <ellipse> with fill/stroke/opacity.
 *   - Honors a leading `translate(x y)` on elements or their <g> ancestors.
 *   - rotate/skew/matrix transforms are NOT applied (nodes stay editable; their
 *     placement is approximate). Callers needing exact transform baking should
 *     rasterize the group first.
 *   - <linearGradient>/<radialGradient> referenced via fill="url(#id)" resolve to a
 *     GradientFill so the fill survives as data, not a broken id string.
 */

export interface SvgIngestOptions extends CleanOptions {
  /** Run the geometry cleaner on every path. Default true. */
  clean?: boolean;
  /** Prefix for generated node ids (keeps tests deterministic). Default 'svg'. */
  idPrefix?: string;
}

export interface IngestedSvg {
  nodes: DesignNode[];
  width: number;
  height: number;
  viewBox: { x: number; y: number; width: number; height: number };
}

type Attrs = Record<string, string>;

const ELEMENT_RE = /<(path|rect|circle|ellipse)\b([^>]*?)\/?>/gi;
const GROUP_OPEN_RE = /<g\b([^>]*?)>/gi;
const GROUP_CLOSE_RE = /<\/g>/i;
const ATTR_RE = /([\w:.-]+)\s*=\s*"([^"]*)"|([\w:.-]+)\s*=\s*'([^']*)'/g;
const SVG_ROOT_RE = /<svg\b[^>]*>/i;
const GRADIENT_STOP_RE = /<stop\b[^>]*?(?:stop-color|stopColor)\s*=\s*["']([^"']+)["'][^>]*?(?:offset\s*=\s*["']([^"']+)["'])?[^>]*\/?>/gi;
const GRADIENT_RE = /<(linearGradient|radialGradient)\b[^>]*\bid\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/\1>/gi;

function parseAttrs(chunk: string): Attrs {
  const attrs: Attrs = {};
  let m: RegExpExecArray | null;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(chunk)) !== null) {
    const key = (m[1] || m[3] || '').toLowerCase();
    const value = m[2] !== undefined ? m[2] : m[4];
    if (key) attrs[key] = value;
  }
  return attrs;
}

/** Returns {x,y} offset from a leading translate(...) in a transform, else {0,0}. */
function readTranslate(transform?: string): { x: number; y: number } {
  if (!transform) return { x: 0, y: 0 };
  const m = /translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/i.exec(transform);
  if (m) return { x: Number(m[1]) || 0, y: Number(m[2]) || 0 };
  const single = /translate\(\s*(-?[\d.]+)\s*\)/i.exec(transform);
  if (single) return { x: Number(single[1]) || 0, y: 0 };
  return { x: 0, y: 0 };
}

function numAttr(attrs: Attrs, key: string, fallback = 0): number {
  const raw = attrs[key];
  if (raw === undefined) return fallback;
  const n = Number(String(raw).replace(/(px|pt)$/i, '').trim());
  return Number.isFinite(n) ? n : fallback;
}

const norm = (v: string): string => v.trim().toLowerCase();

/** Very small named-color table for the fills/strokes we actually meet in traces. */
const NAMED: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  none: 'none',
};

function normalizePaint(attrs: Attrs, key: string): string | null {
  const raw = attrs[key];
  if (raw === undefined) return null;
  const v = raw.trim();
  if (!v) return null;
  const lower = norm(v);
  if (lower === 'none') return null;
  if (NAMED[lower]) return NAMED[lower];
  return v;
}

/** Rough bbox for a path from its numeric coordinate pairs (arcs included as-is). */
function pathBBox(d: string): { x: number; y: number; width: number; height: number } {
  const nums = (d.match(/-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) || []).map(Number).filter(Number.isFinite);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i];
    const y = nums[i + 1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, width: 0, height: 0 };
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function resolveGradients(source: string): Record<string, { type: 'linear' | 'radial'; stops: Array<{ color: string; offset: number }> }> {
  const map: Record<string, { type: 'linear' | 'radial'; stops: Array<{ color: string; offset: number }> }> = {};
  let m: RegExpExecArray | null;
  GRADIENT_RE.lastIndex = 0;
  while ((m = GRADIENT_RE.exec(source)) !== null) {
    const type = m[1] === 'radialGradient' ? 'radial' : 'linear';
    const id = m[2];
    const body = m[3];
    const stops: Array<{ color: string; offset: number }> = [];
    let s: RegExpExecArray | null;
    GRADIENT_STOP_RE.lastIndex = 0;
    while ((s = GRADIENT_STOP_RE.exec(body)) !== null) {
      const color = s[1];
      const offsetRaw = s[2];
      const offset =
        offsetRaw === undefined ? (stops.length === 0 ? 0 : 1) : offsetRaw.includes('%') ? Number(offsetRaw) / 100 : Number(offsetRaw);
      stops.push({ color, offset: Number.isFinite(offset) ? offset : 0 });
    }
    if (stops.length > 0) map[id] = { type, stops };
  }
  return map;
}

/**
 * Parse an SVG string into flat, editable DesignNodes.
 * Deterministic ids keep it unit-testable in plain Node (no DOM).
 */
export function svgToDesignNodes(svg: string, options: SvgIngestOptions = {}): IngestedSvg {
  const { clean = true, idPrefix = 'svg', ...cleanOpts } = options;
  const source = svg.replace(/<!--[\s\S]*?-->/g, '');

  // ---- canvas dimensions -------------------------------------------------
  const rootMatch = SVG_ROOT_RE.exec(source);
  const rootAttrs = rootMatch ? parseAttrs(rootMatch[0]) : {};
  let vb = { x: 0, y: 0, width: 0, height: 0 };
  if (rootAttrs.viewbox) {
    const parts = rootAttrs.viewbox.split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every(Number.isFinite)) {
      vb = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
    }
  }
  const rootW = numAttr(rootAttrs, 'width', 0);
  const rootH = numAttr(rootAttrs, 'height', 0);
  const width = vb.width || rootW || 512;
  const height = vb.height || rootH || 512;
  if (!vb.width || !vb.height) vb = { x: 0, y: 0, width, height };

  const gradients = resolveGradients(source);

  // ---- walk elements, tracking a cumulative translate from <g> ancestors --
  const nodes: DesignNode[] = [];
  let counter = 0;

  // Build a linear token stream of group opens/closes and elements so translate
  // inheritance works without a full XML parser.
  interface Token {
    kind: 'gopen' | 'gclose' | 'el';
    tag?: string;
    attrs?: Attrs;
    index: number;
  }
  const tokens: Token[] = [];
  let gm: RegExpExecArray | null;
  GROUP_OPEN_RE.lastIndex = 0;
  while ((gm = GROUP_OPEN_RE.exec(source)) !== null) {
    tokens.push({ kind: 'gopen', attrs: parseAttrs(gm[0]), index: gm.index });
  }
  let cm: RegExpExecArray | null;
  const closeRe = new RegExp(GROUP_CLOSE_RE.source, 'gi');
  while ((cm = closeRe.exec(source)) !== null) {
    tokens.push({ kind: 'gclose', index: cm.index });
  }
  let em: RegExpExecArray | null;
  ELEMENT_RE.lastIndex = 0;
  while ((em = ELEMENT_RE.exec(source)) !== null) {
    tokens.push({ kind: 'el', tag: em[1].toLowerCase(), attrs: parseAttrs(em[2] || ''), index: em.index });
  }
  tokens.sort((a, b) => a.index - b.index);

  const translateStack: Array<{ x: number; y: number }> = [{ x: 0, y: 0 }];
  const currentOffset = () => {
    const acc = { x: 0, y: 0 };
    for (const t of translateStack) {
      acc.x += t.x;
      acc.y += t.y;
    }
    return acc;
  };

  for (const tok of tokens) {
    if (tok.kind === 'gopen') {
      const off = readTranslate(tok.attrs?.transform);
      const top = translateStack[translateStack.length - 1];
      translateStack.push({ x: top.x + off.x, y: top.y + off.y });
      continue;
    }
    if (tok.kind === 'gclose') {
      if (translateStack.length > 1) translateStack.pop();
      continue;
    }

    const attrs = tok.attrs || {};
    const offset = currentOffset();
    const opacity = attrs.opacity !== undefined ? Number(attrs.opacity) : undefined;
    const stroke = normalizePaint(attrs, 'stroke');
    const strokeWidth = attrs['stroke-width'] !== undefined ? numAttr(attrs, 'stroke-width', 1) : undefined;

    const base: DesignNode = {
      id: `${idPrefix}-${counter++}`,
      name: attrs.id || attrs.name || `${tok.tag}-${counter}`,
      type: 'path',
      x: 0,
      y: 0,
      width,
      height,
      opacity: Number.isFinite(opacity as number) ? opacity : undefined,
      stroke: stroke || undefined,
      strokeWidth,
      fill: null,
    };

    // Attach a structured gradient fill when referenced; otherwise a solid/none.
    const gradRef = attrs.fill ? /url\(\s*#([^)\s]+)\s*\)/i.exec(attrs.fill) : null;
    if (gradRef && gradients[gradRef[1]]) {
      base.fill = gradients[gradRef[1]];
    } else {
      base.fill = normalizePaint(attrs, 'fill') || '#000000';
    }

    if (tok.tag === 'path') {
      const rawD = attrs.d || '';
      if (!rawD) continue;
      const bb = pathBBox(rawD);
      base.type = 'path';
      base.pathData = clean ? cleanPathData(rawD, cleanOpts) : rawD;
      base.x = bb.x + offset.x;
      base.y = bb.y + offset.y;
      base.width = bb.width;
      base.height = bb.height;
    } else if (tok.tag === 'rect') {
      const x = numAttr(attrs, 'x', 0);
      const y = numAttr(attrs, 'y', 0);
      const w = numAttr(attrs, 'width', 0);
      const h = numAttr(attrs, 'height', 0);
      if (w <= 0 || h <= 0) continue;
      base.type = 'rect';
      base.x = x + offset.x;
      base.y = y + offset.y;
      base.width = w;
      base.height = h;
      const rx = numAttr(attrs, 'rx', 0);
      if (rx > 0) base.cornerRadius = rx;
    } else if (tok.tag === 'circle' || tok.tag === 'ellipse') {
      let cx = 0;
      let cy = 0;
      let rx = 0;
      let ry = 0;
      if (tok.tag === 'circle') {
        cx = numAttr(attrs, 'cx', 0);
        cy = numAttr(attrs, 'cy', 0);
        rx = numAttr(attrs, 'r', 0);
        ry = rx;
      } else {
        cx = numAttr(attrs, 'cx', 0);
        cy = numAttr(attrs, 'cy', 0);
        rx = numAttr(attrs, 'rx', 0);
        ry = numAttr(attrs, 'ry', 0);
      }
      if (rx <= 0 || ry <= 0) continue;
      base.type = 'ellipse';
      base.x = cx - rx + offset.x;
      base.y = cy - ry + offset.y;
      base.width = rx * 2;
      base.height = ry * 2;
    } else {
      continue;
    }

    nodes.push(base);
  }

  return { nodes, width, height, viewBox: vb };
}
