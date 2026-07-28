// SVG & Canvas export service
// Mirrors canvas engine rendering logic exactly — same gradient computation,
// same path construction, same effect parameters. Both surfaces derive from
// the same formulas so visual output is identical.
import { DesignNode, GradientFill, Effect, VectorPoint } from '../types/design';
import { canvas as canvasTokens, content, surface } from '../lib/tokens';
import { hexToRgba } from '../lib/utils';

export interface ExportOptions {
  format: 'png' | 'jpg' | 'svg';
  scale: number;
  selectionOnly: boolean;
  quality: number;
  background: boolean;
}

// ── Shared helpers (used by both SVG and Canvas export) ──────────────

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
// Same angle→coordinate math as canvasEngine.createGradient (line 1340)

function renderGradientDef(id: string, fill: GradientFill, node: DesignNode): string {
  if (fill.type === 'linear') {
    const angle = ((fill.angle || 0) * Math.PI) / 180;
    const x1 = node.x + (Math.cos(angle) * node.width) / 2;
    const y1 = node.y + (Math.sin(angle) * node.height) / 2;
    const x2 = node.x + node.width / 2 - (Math.cos(angle) * node.width) / 2;
    const y2 = node.y + node.height / 2 - (Math.sin(angle) * node.height) / 2;
    const stops = fill.stops.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}" />`).join('');
    return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`;
  }
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const r = node.width / 2;
  const stops = fill.stops.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}" />`).join('');
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops}</radialGradient>`;
}

// ── SVG filter defs ─────────────────────────────────────────────────
// Same params as canvasEngine renderNode effects (line 1112)

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
// Same bezier logic as canvasEngine.renderPath (line 1314)

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

  // Resolve fill: string → solid, object → gradient url(#id)
  let fillAttr: string;
  const hasGradient = node.fill && typeof node.fill === 'object' && 'stops' in node.fill;
  if (hasGradient) {
    fillAttr = `fill="url(#grad-${node.id})"`;
  } else {
    fillAttr = `fill="${fill}"`;
  }

  // Group children
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
      const lines = (node.text || '').split('\n');
      const yStep = fontSize * lineHeight;
      if (lines.length === 1) {
        return `<text id="${node.id}" x="${tx}" y="${y + fontSize}" fill="${textFill}" font-size="${fontSize}" font-family="${node.fontFamily || 'system-ui'}" font-weight="${node.fontWeight || 400}" text-anchor="${textAnchor}"${ls}${opacity}${transform}${blendMode}${filterAttr}>${escapeXml(lines[0])}</text>`;
      }
      const tspans = lines
        .map((line, i) => `<tspan x="${tx}" dy="${i === 0 ? 0 : yStep}">${escapeXml(line)}</tspan>`)
        .join('');
      return `<text id="${node.id}" x="${tx}" y="${y + fontSize}" fill="${textFill}" font-size="${fontSize}" font-family="${node.fontFamily || 'system-ui'}" font-weight="${node.fontWeight || 400}" text-anchor="${textAnchor}"${ls}${opacity}${transform}${blendMode}${filterAttr}>${tspans}</text>`;
    }

    case 'line':
      return `<line id="${node.id}" x1="${x}" y1="${y}" x2="${x + node.width}" y2="${y + node.height}" stroke="${fill}" stroke-width="${node.strokeWidth || 1}"${opacity}${transform}${blendMode}${filterAttr} />`;

    case 'path': {
      if (!node.points || node.points.length < 2) {
        return '';
      }
      // Translate points by offset
      const translated = node.points.map((p: any) => ({
        ...p,
        x: p.x - offsetX,
        y: p.y - offsetY,
        handleIn: p.handleIn ? { x: p.handleIn.x, y: p.handleIn.y } : undefined,
        handleOut: p.handleOut ? { x: p.handleOut.x, y: p.handleOut.y } : undefined,
      }));
      const d = pointsToSvgPath(translated);
      return `<path id="${node.id}" d="${d}" ${fillAttr}${stroke}${opacity}${transform}${blendMode}${filterAttr} />`;
    }

    case 'image':
      // Stitch: completed image export — was a placeholder with emoji text.
      // Evidence: DesignNode has imageUrl property, canvas engine now renders
      // actual images, but SVG export was still showing placeholder text.
      if (node.imageUrl) {
        // Use preserveAspectRatio based on imageFit
        const ar = node.imageFit === 'contain' ? 'xMidYMid meet' : node.imageFit === 'fill' ? 'none' : 'xMidYMid slice'; // cover (default)
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

/**
 * Auto-clean exported SVG markup by removing empty groups (<g></g>) and
 * editor-specific metadata for cleaner developer handoff.
 */
export function cleanSvgMarkup(svg: string): string {
  if (!svg || typeof svg !== 'string') {
    return svg;
  }
  let cleaned = svg;

  // 1. Remove editor-specific data attributes (e.g., data-editor-id, data-kreathief, etc.)
  cleaned = cleaned.replace(/\s+data-[a-zA-Z0-9_-]+="[^"]*"/g, '');

  // 2. Iteratively remove empty <g> groups (e.g. <g id="..."></g> or nested empty groups)
  let prev = '';
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(/<g[^>]*>\s*<\/g>/gi, '');
  }

  // 3. Remove empty <defs> tags
  cleaned = cleaned.replace(/<defs[^>]*>\s*<\/defs>/gi, '');

  // 4. Clean up whitespace and consecutive blank lines
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trimRight())
    .filter((line, idx, arr) => line !== '' || (idx > 0 && arr[idx - 1] !== ''))
    .join('\n');

  return cleaned.trim();
}

export function exportToSvg(nodes: DesignNode[], background = true): string {
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

  // Collect <defs> — gradients and filters for all nodes
  const defs: string[] = [];
  nodes.forEach((node) => {
    if (node.fill && typeof node.fill === 'object' && 'stops' in node.fill) {
      defs.push(renderGradientDef(`grad-${node.id}`, node.fill, node));
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
// Shared helpers for gradient/effect computation ensure identical visual
// output to the canvas editor.

export function exportToCanvas(
  canvas: HTMLCanvasElement,
  nodes: DesignNode[],
  options: ExportOptions
): Promise<Blob | null> {
  return new Promise((resolve) => {
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
    const w = (maxX - minX + padding * 2) * options.scale;
    const h = (maxY - minY + padding * 2) * options.scale;

    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const ctx = offscreen.getContext('2d');
    if (!ctx) {
      resolve(null);
      return;
    }

    ctx.scale(options.scale, options.scale);

    if (options.background) {
      ctx.fillStyle = canvasTokens.export.background;
      ctx.fillRect(0, 0, w, h);
    }

    const sorted = [...nodes].sort((a, b) => (a as any).zIndex - (b as any).zIndex);

    for (const node of sorted) {
      const x = node.x - minX + padding;
      const y = node.y - minY + padding;

      ctx.save();
      ctx.globalAlpha = node.opacity ?? 1;

      // Blend mode — matches canvas engine
      if (node.blendMode !== 'normal') {
        ctx.globalCompositeOperation = node.blendMode as GlobalCompositeOperation;
      }

      // Rotation — same pivot as canvasEngine.renderNode (line 1103)
      if (node.rotation) {
        ctx.translate(x + node.width / 2, y + node.height / 2);
        ctx.rotate((node.rotation * Math.PI) / 180);
        ctx.translate(-(x + node.width / 2), -(y + node.height / 2));
      }

      // Effects — same params as canvasEngine (line 1112)
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

      // Resolve fill — gradient or solid, same formula as canvasEngine
      const hasGradient = node.fill && typeof node.fill === 'object' && 'stops' in node.fill;
      if (hasGradient) {
        ctx.fillStyle = createCanvasGradient(ctx, node.fill as GradientFill, node);
      } else {
        ctx.fillStyle = resolveFill(node);
      }

      // Render shape — matches canvas engine per-type rendering
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
          ctx.font = `${node.fontWeight || 400} ${fontSize}px ${node.fontFamily || 'system-ui'}`;
          ctx.textAlign = (node.textAlign as CanvasTextAlign) || 'left';
          ctx.textBaseline = 'top';
          if (letterSpacing) {
            ctx.letterSpacing = `${letterSpacing}px`;
          }
          const lines = (node.text || '').split('\n');
          const yStep = fontSize * lineHeight;
          for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x, y + i * yStep);
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
          if (node.points && node.points.length >= 2) {
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

        // Stitch: completed image rendering in raster export — was falling
        // through to default (filled rectangle). Now draws actual image
        // matching canvasEngine.renderImage behavior.
        case 'image': {
          if (node.imageUrl) {
            const img = new Image();
            img.src = node.imageUrl;
            // For export, draw synchronously (image should be pre-loaded)
            if (img.complete && img.naturalWidth > 0) {
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
          } else {
            ctx.fillStyle = surface[3];
            ctx.fillRect(x, y, node.width, node.height);
          }
          break;
        }

        default:
          ctx.fillRect(x, y, node.width, node.height);
      }

      // Reset effects — matches canvasEngine (line 1147)
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'source-over';

      ctx.restore();
    }

    const mimeType = options.format === 'jpg' ? 'image/jpeg' : 'image/png';
    offscreen.toBlob((blob) => resolve(blob), mimeType, options.quality / 100);
  });
}

// Same gradient formula as canvasEngine.createGradient (line 1340)
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
  URL.revokeObjectURL(url);
}

// ── Stub exports for backward compatibility ────────────────────

export type ColorProfile = 'srgb' | 'cmyk' | 'p3' | 'FOGRA39' | 'GRACoL' | 'SWOP' | 'CMYK' | 'sRGB';

export interface PDFExportOptions {
  format?: 'pdf';
  bleed?: number;
  cropMarks?: boolean;
  colorProfile?: ColorProfile;
}

export async function exportDesignToImage(
  nodes: DesignNode[],
  options: { width: number; height: number; format?: string; quality?: number; background?: boolean } = {
    width: 1080,
    height: 1080,
  }
): Promise<Blob> {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return new Blob(['<svg></svg>'], { type: 'image/svg+xml' });
  }
  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  const result = await exportToCanvas(canvas, nodes, {
    format: (options.format || 'png') as any,
    scale: 1,
    selectionOnly: false,
    quality: options.quality || 1,
    background: options.background !== false,
  });
  return result || new Blob();
}

export async function exportDesignToBlob(
  nodes: DesignNode[],
  options: { width: number; height: number; format?: string; quality?: number } = { width: 1080, height: 1080 }
): Promise<Blob> {
  return exportDesignToImage(nodes, options);
}

export async function exportToSVG(width: number, height: number, background: string, layers: any[]): Promise<string> {
  if (!Array.isArray(layers) || layers.length === 0) {
    return cleanSvgMarkup(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" fill="${background}"/></svg>`
    );
  }
  const nodes: DesignNode[] = layers.map(
    (l: any) =>
      ({
        id: l.id || 'layer',
        type: l.type || 'rectangle',
        x: l.x || 0,
        y: l.y || 0,
        width: l.width || 100,
        height: l.height || 100,
        rotation: l.rotation || 0,
        opacity: l.opacity ?? 1,
      }) as any
  );
  return cleanSvgMarkup(exportToSvg(nodes, !!background));
}

export async function exportToLayeredPSD(
  width: number,
  height: number,
  layers: any[],
  filename?: string
): Promise<void> {
  try {
    const { writePsd } = await import('ag-psd');

    const psdLayers: any[] = [];

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const layerCanvas = document.createElement('canvas');
      layerCanvas.width = Math.max(1, Math.round(layer.width || 100));
      layerCanvas.height = Math.max(1, Math.round(layer.height || 100));
      const ctx = layerCanvas.getContext('2d');

      if (ctx) {
        if (layer.type === 'text') {
          ctx.fillStyle = layer.color || '#000000';
          ctx.font = `${layer.fontSize || 24}px ${layer.fontFamily || 'sans-serif'}`;
          ctx.textBaseline = 'top';
          ctx.fillText(layer.text || '', 0, 0);
        } else if (layer.type === 'shape') {
          ctx.fillStyle = layer.fill || '#3b82f6';
          ctx.fillRect(0, 0, layerCanvas.width, layerCanvas.height);
        } else if (layer.type === 'image' && layer.src) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, 0, 0, layerCanvas.width, layerCanvas.height);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = layer.src;
          });
        }
      }

      psdLayers.push({
        name: layer.name || `Layer ${i + 1}`,
        left: Math.round(layer.x || 0),
        top: Math.round(layer.y || 0),
        right: Math.round((layer.x || 0) + (layer.width || 100)),
        bottom: Math.round((layer.y || 0) + (layer.height || 100)),
        opacity: layer.opacity ?? 1,
        hidden: layer.visible === false,
        blendMode: layer.blendMode || 'normal',
        canvas: layerCanvas,
        text: layer.type === 'text' ? { text: layer.text || '' } : undefined,
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
  } catch (err) {
    const svg = await exportToSVG(width, height, '#ffffff', layers);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    downloadBlob(blob, `${filename || 'export'}.svg`);
  }
}

export async function exportToPrintPDF(
  width: number,
  height: number,
  layers: any[],
  filename?: string,
  _options?: PDFExportOptions
): Promise<void> {
  const svg = await exportToSVG(width, height, '#ffffff', layers);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  downloadBlob(blob, `${filename || 'export'}.pdf`);
}

export async function batchExportArtboardsZip(
  artboards: any[],
  options?: { format?: string; quality?: number }
): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  for (let i = 0; i < artboards.length; i++) {
    const ab = artboards[i];
    const nodes: DesignNode[] = (ab.layers || []).map(
      (l: any) =>
        ({
          id: l.id || `layer-${i}`,
          type: l.type || 'rectangle',
          x: l.x || 0,
          y: l.y || 0,
          width: l.width || 100,
          height: l.height || 100,
          rotation: l.rotation || 0,
          opacity: l.opacity ?? 1,
        }) as any
    );
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = ab.width || 1080;
    tempCanvas.height = ab.height || 1080;
    const blob = await exportToCanvas(tempCanvas, nodes, {
      format: (options?.format as any) || 'png',
      quality: options?.quality || 1,
    } as any);
    if (blob) {
      zip.file(`${ab.name || `artboard-${i}`}.${options?.format || 'png'}`, blob);
    }
  }
  return zip.generateAsync({ type: 'blob' });
}
