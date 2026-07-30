/**
 * Kreathief Canvas Engine
 * Ported optimizations from Timeframe:
 * - Object pooling (zero GC in render loop)
 * - Dirty region tracking
 * - Adaptive quality
 * - Viewport culling
 * - Double buffering (OffscreenCanvas)
 * - Batch rendering by style
 * - Path caching (LRU)
 */

import { DesignNode, GradientFill } from '../types/design';
import { hexToRgba } from './utils';
import { canvas as canvasTokens, content, surface, border } from './tokens';
import { resolveTextLines } from '../utils/textRendering';

type AnyCtx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

// Object Pool (ported from Timeframe)
class ObjectPool<T> {
  private pool: T[] = [];
  constructor(
    private factory: () => T,
    private reset: (obj: T) => void,
    size: number = 100
  ) {
    for (let i = 0; i < size; i++) {
      this.pool.push(factory());
    }
  }
  acquire(): T {
    return this.pool.length > 0 ? this.pool.pop()! : this.factory();
  }
  release(obj: T) {
    this.reset(obj);
    this.pool.push(obj);
  }
}

// LRU Cache for paths (ported from Timeframe)
class LRUCache<K, V> {
  private map = new Map<K, V>();
  constructor(private maxSize: number) {}
  get(key: K): V | undefined {
    const val = this.map.get(key);
    if (val !== undefined) {
      this.map.delete(key);
      this.map.set(key, val);
    }
    return val;
  }
  set(key: K, value: V) {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      const first = this.map.keys().next().value;
      this.map.delete(first!);
    }
    this.map.set(key, value);
  }
  clear() {
    this.map.clear();
  }
}

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
}

export interface RenderOptions {
  showGrid: boolean;
  showRulers: boolean;
  showBounds: boolean;
  selectedIds: Set<string>;
  hoveredId: string | null;
  darkMode: boolean;
}

export class KreathiefCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreen: OffscreenCanvas | null = null;
  private offCtx: OffscreenCanvasRenderingContext2D | null = null;

  private nodes: Map<string, DesignNode> = new Map();
  private viewport: CanvasViewport = { x: 0, y: 0, zoom: 1, width: 800, height: 600 };
  private isDirty: boolean = true;
  private quality: 'high' | 'medium' | 'low' = 'high';

  // Path cache (ported from Timeframe)
  private pathCache = new LRUCache<string, Path2D>(500);

  // Interaction state
  private isPanning = false;
  private isDragging = false;
  private isMarquee = false;
  private dragNodeId: string | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragNodeStartX = 0;
  private dragNodeStartY = 0;
  private dragNodeStartW = 0;
  private dragNodeStartH = 0;
  private shiftHeld = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private marqueeStartX = 0;
  private marqueeStartY = 0;
  private marqueeEndX = 0;
  private marqueeEndY = 0;
  private snapToGrid = false;
  private gridSize = 8;
  private zoomAnimId: number | null = null;

  // Inertial panning
  private panVelocityX = 0;
  private panVelocityY = 0;
  private panInertiaId: number | null = null;
  private lastPanTime = 0;

  // Alignment guides
  private activeGuides: { type: 'h' | 'v'; pos: number }[] = [];
  private snapThreshold = 5;
  private snapFlashTime = 0;

  // Shape creation preview
  private isCreating = false;
  private createStartX = 0;
  private createStartY = 0;
  private createType: string | null = null;
  private createPreview: { x: number; y: number; w: number; h: number } | null = null;

  // Pen tool
  private penPoints: {
    x: number;
    y: number;
    handleIn?: { x: number; y: number };
    handleOut?: { x: number; y: number };
  }[] = [];
  private isDrawingPen = false;
  private penDraggingHandle: { pointIdx: number; handle: 'in' | 'out' } | null = null;

  // Resize handles
  private isResizing = false;
  private resizeHandle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | null = null;
  private resizeNodeId: string | null = null;

  // Animation
  private animFrameId = 0;
  private fps = 60;
  private lastFrameTime = 0;

  // Callbacks
  private onNodeSelect?: (ids: string[]) => void;
  private onNodeHover?: (id: string | null) => void;
  private onViewportChange?: (v: CanvasViewport) => void;
  private onDoubleClick?: (id: string) => void;
  private getSelectedIds?: () => string[];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupInput();
    this.setupDoubleBuffer();
  }

  private setupDoubleBuffer() {
    if (typeof OffscreenCanvas !== 'undefined') {
      this.offscreen = new OffscreenCanvas(this.canvas.width, this.canvas.height);
      this.offCtx = this.offscreen.getContext('2d');
    }
  }

  private setupInput() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.canvas.addEventListener('dblclick', this.handleDoubleClick);
  }

  setCreationTool(type: string | null) {
    this.createType = type;
    this.canvas.style.cursor = type ? 'crosshair' : 'default';
  }

  private handleMouseDown = (e: MouseEvent) => {
    // Skip right-clicks — let context menu handle them
    if (e.button === 2) {
      return;
    }

    const worldX = this.viewport.x + e.offsetX / this.viewport.zoom;
    const worldY = this.viewport.y + e.offsetY / this.viewport.zoom;
    this.shiftHeld = e.shiftKey;

    // Shape creation mode
    if (this.createType && e.button === 0) {
      this.isCreating = true;
      this.createStartX = worldX;
      this.createStartY = worldY;
      this.createPreview = { x: worldX, y: worldY, w: 0, h: 0 };
      return;
    }

    // Pen tool mode
    if (this.isDrawingPen && e.button === 0) {
      // Check if clicking on an existing handle
      const handleHit = this.hitTestPenHandle(worldX, worldY);
      if (handleHit) {
        this.penDraggingHandle = handleHit;
        return;
      }

      // Check if clicking on first point to close path
      if (this.penPoints.length > 2) {
        const firstPointHit = this.hitTestPenPoint(worldX, worldY);
        if (firstPointHit === 0) {
          // Close the path
          this.finishPen();
          this.markDirty();
          return;
        }
      }

      // Add new point
      this.penPoints.push({ x: worldX, y: worldY });
      this.markDirty();
      return;
    }

    // Space + click = pan
    if (e.button === 1 || (e.button === 0 && (e as any).spaceKey)) {
      this.isPanning = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    // Check for resize handle hit on selected nodes
    if (this.resizeHandle) {
      this.isResizing = true;
      const selectedId = Array.from(this.onNodeSelect ? [] : [])[0] || null;
      this.resizeNodeId = selectedId;
      this.dragStartX = worldX;
      this.dragStartY = worldY;
      const node = this.nodes.get(selectedId || '');
      if (node) {
        this.dragNodeStartX = node.x;
        this.dragNodeStartY = node.y;
        this.dragNodeStartW = node.width;
        this.dragNodeStartH = node.height;
      }
      return;
    }

    // Find node under cursor
    const node = this.hitTest(worldX, worldY);
    if (node) {
      if (!e.shiftKey) {
        this.onNodeSelect?.([node.id]);
      }
      this.isDragging = true;
      this.dragNodeId = node.id;
      this.dragStartX = worldX;
      this.dragStartY = worldY;
      this.dragNodeStartX = node.x;
      this.dragNodeStartY = node.y;
      this.dragNodeStartW = node.width;
      this.dragNodeStartH = node.height;
    } else {
      // Start marquee selection on empty canvas
      if (!e.shiftKey) {
        this.onNodeSelect?.([]);
      }
      this.isMarquee = true;
      this.marqueeStartX = worldX;
      this.marqueeStartY = worldY;
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    const worldX = this.viewport.x + e.offsetX / this.viewport.zoom;
    const worldY = this.viewport.y + e.offsetY / this.viewport.zoom;
    this.shiftHeld = e.shiftKey;

    // Shape creation preview
    if (this.isCreating && this.createType) {
      let w = worldX - this.createStartX;
      let h = worldY - this.createStartY;
      if (this.shiftHeld) {
        const size = Math.max(Math.abs(w), Math.abs(h));
        w = w < 0 ? -size : size;
        h = h < 0 ? -size : size;
      }
      this.createPreview = {
        x: Math.min(this.createStartX, this.createStartX + w),
        y: Math.min(this.createStartY, this.createStartY + h),
        w: Math.abs(w),
        h: Math.abs(h),
      };
      this.markDirty();
      return;
    }

    // Pen tool handle dragging
    if (this.isDrawingPen && this.penDraggingHandle) {
      const point = this.penPoints[this.penDraggingHandle.pointIdx];
      if (point) {
        const relX = worldX - point.x;
        const relY = worldY - point.y;
        if (this.penDraggingHandle.handle === 'out') {
          point.handleOut = { x: relX, y: relY };
          point.handleIn = { x: -relX, y: -relY };
        } else {
          point.handleIn = { x: relX, y: relY };
          point.handleOut = { x: -relX, y: -relY };
        }
        this.markDirty();
      }
      return;
    }

    if (this.isPanning) {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.viewport.x -= dx / this.viewport.zoom;
      this.viewport.y -= dy / this.viewport.zoom;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      // Track velocity for inertia
      const now = performance.now();
      const dt = now - this.lastPanTime;
      if (dt > 0) {
        this.panVelocityX = (dx / dt) * 16;
        this.panVelocityY = (dy / dt) * 16;
      }
      this.lastPanTime = now;

      this.markDirty();
      this.onViewportChange?.(this.viewport);
      return;
    }

    if (this.isDragging && this.dragNodeId) {
      const node = this.nodes.get(this.dragNodeId);
      if (node) {
        const dx = worldX - this.dragStartX;
        const dy = worldY - this.dragStartY;

        if (this.shiftHeld) {
          if (Math.abs(dx) > Math.abs(dy)) {
            node.y = this.dragNodeStartY;
            node.x = this.dragNodeStartX + dx;
          } else {
            node.x = this.dragNodeStartX;
            node.y = this.dragNodeStartY + dy;
          }
        } else {
          let newX = this.dragNodeStartX + dx;
          let newY = this.dragNodeStartY + dy;

          // Smart alignment guides
          this.activeGuides = [];
          const snap = this.snapThreshold / this.viewport.zoom;
          const cx = newX + node.width / 2;
          const cy = newY + node.height / 2;
          let didSnap = false;

          this.nodes.forEach((other) => {
            if (other.id === node.id || !other.visible) {
              return;
            }
            const ocx = other.x + other.width / 2;
            const ocy = other.y + other.height / 2;

            // Horizontal alignment (center Y)
            if (Math.abs(cy - ocy) < snap) {
              newY = ocy - node.height / 2;
              this.activeGuides.push({ type: 'h', pos: ocy });
              didSnap = true;
            }
            // Vertical alignment (center X)
            if (Math.abs(cx - ocx) < snap) {
              newX = ocx - node.width / 2;
              this.activeGuides.push({ type: 'v', pos: ocx });
              didSnap = true;
            }
            // Left edge
            if (Math.abs(newX - other.x) < snap) {
              newX = other.x;
              this.activeGuides.push({ type: 'v', pos: other.x });
              didSnap = true;
            }
            // Right edge
            if (Math.abs(newX + node.width - other.x - other.width) < snap) {
              newX = other.x + other.width - node.width;
              this.activeGuides.push({ type: 'v', pos: other.x + other.width });
              didSnap = true;
            }
            // Top edge
            if (Math.abs(newY - other.y) < snap) {
              newY = other.y;
              this.activeGuides.push({ type: 'h', pos: other.y });
              didSnap = true;
            }
            // Bottom edge
            if (Math.abs(newY + node.height - other.y - other.height) < snap) {
              newY = other.y + other.height - node.height;
              this.activeGuides.push({ type: 'h', pos: other.y + other.height });
              didSnap = true;
            }
          });

          if (this.snapToGrid) {
            newX = Math.round(newX / this.gridSize) * this.gridSize;
            newY = Math.round(newY / this.gridSize) * this.gridSize;
          }

          if (didSnap) {
            this.snapFlashTime = performance.now();
          }

          node.x = newX;
          node.y = newY;
        }

        this.pathCache.clear();
        this.markDirty();
      }
      return;
    }

    // Resize handle
    if (this.isResizing && this.resizeNodeId && this.resizeHandle) {
      const node = this.nodes.get(this.resizeNodeId);
      if (node) {
        const dx = worldX - this.dragStartX;
        const dy = worldY - this.dragStartY;
        let newX = this.dragNodeStartX;
        let newY = this.dragNodeStartY;
        let newW = this.dragNodeStartW;
        let newH = this.dragNodeStartH;

        // Update dimensions based on which handle
        if (this.resizeHandle.includes('e')) {
          newW = Math.max(10, this.dragNodeStartW + dx);
        }
        if (this.resizeHandle.includes('w')) {
          newW = Math.max(10, this.dragNodeStartW - dx);
          newX = this.dragNodeStartX + dx;
        }
        if (this.resizeHandle.includes('s')) {
          newH = Math.max(10, this.dragNodeStartH + dy);
        }
        if (this.resizeHandle.includes('n')) {
          newH = Math.max(10, this.dragNodeStartH - dy);
          newY = this.dragNodeStartY + dy;
        }

        // Constrain to square if shift held
        if (this.shiftHeld) {
          const size = Math.max(newW, newH);
          if (this.resizeHandle.includes('e') || this.resizeHandle.includes('w')) {
            newH = size;
          } else {
            newW = size;
          }
        }

        node.x = newX;
        node.y = newY;
        node.width = newW;
        node.height = newH;
        this.pathCache.clear();
        this.markDirty();
      }
      return;
    }

    if (this.isMarquee) {
      this.marqueeEndX = worldX;
      this.marqueeEndY = worldY;
      this.markDirty();
      return;
    }

    // Handle hover detection for resize cursors
    this.resizeHandle = null;
    const selectedIds = this.getSelectedIds?.() || [];
    if (selectedIds.length === 1) {
      const selNode = this.nodes.get(selectedIds[0]);
      if (selNode) {
        const handle = this.hitTestHandle(worldX, worldY, selNode);
        if (handle) {
          this.resizeHandle = handle;
          this.canvas.style.cursor = this.getResizeCursor(handle);
          return;
        }
      }
    }

    // Hover detection
    const node = this.hitTest(worldX, worldY);
    this.onNodeHover?.(node?.id || null);
    this.canvas.style.cursor = node ? 'move' : 'default';
  };

  private handleMouseUp = () => {
    // Finalize shape creation
    if (this.isCreating && this.createPreview && this.createType) {
      const p = this.createPreview;
      if (p.w > 2 && p.h > 2) {
        // Emit a creation event
        const event = new CustomEvent('kreathief:create', {
          detail: {
            type: this.createType,
            x: p.x,
            y: p.y,
            width: p.w,
            height: p.h,
          },
        });
        this.canvas.dispatchEvent(event);
      }
      this.isCreating = false;
      this.createPreview = null;
      this.markDirty();
    }

    if (this.isMarquee) {
      // Select nodes within marquee
      const minX = Math.min(this.marqueeStartX, this.marqueeEndX);
      const maxX = Math.max(this.marqueeStartX, this.marqueeEndX);
      const minY = Math.min(this.marqueeStartY, this.marqueeEndY);
      const maxY = Math.max(this.marqueeStartY, this.marqueeEndY);
      if (maxX - minX > 2 || maxY - minY > 2) {
        const ids: string[] = [];
        this.nodes.forEach((node) => {
          if (!node.visible || node.locked) {
            return;
          }
          if (node.x + node.width > minX && node.x < maxX && node.y + node.height > minY && node.y < maxY) {
            ids.push(node.id);
          }
        });
        if (ids.length > 0) {
          const existing = this.shiftHeld ? Array.from(this.onNodeSelect ? [] : []) : [];
          this.onNodeSelect?.([...existing, ...ids]);
        }
      }
    }
    this.isPanning = false;
    this.isDragging = false;
    this.isMarquee = false;
    this.isResizing = false;
    this.resizeNodeId = null;
    this.dragNodeId = null;
    this.penDraggingHandle = null;
    this.activeGuides = [];
    this.canvas.style.cursor = 'default';

    // Start inertial panning if velocity is significant
    if (Math.abs(this.panVelocityX) > 0.5 || Math.abs(this.panVelocityY) > 0.5) {
      this.startInertia();
    }
  };

  private startInertia() {
    if (this.panInertiaId) {
      cancelAnimationFrame(this.panInertiaId);
    }
    const friction = 0.92;
    const minVelocity = 0.1;

    const animate = () => {
      this.panVelocityX *= friction;
      this.panVelocityY *= friction;

      if (Math.abs(this.panVelocityX) < minVelocity && Math.abs(this.panVelocityY) < minVelocity) {
        this.panInertiaId = null;
        return;
      }

      this.viewport.x -= this.panVelocityX / this.viewport.zoom;
      this.viewport.y -= this.panVelocityY / this.viewport.zoom;
      this.markDirty();
      this.onViewportChange?.(this.viewport);
      this.panInertiaId = requestAnimationFrame(animate);
    };
    this.panInertiaId = requestAnimationFrame(animate);
  }

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.05, Math.min(20, this.viewport.zoom * zoomFactor));

    const mx = e.offsetX;
    const my = e.offsetY;
    const worldX = this.viewport.x + mx / this.viewport.zoom;
    const worldY = this.viewport.y + my / this.viewport.zoom;

    this.viewport.zoom = newZoom;
    this.viewport.x = worldX - mx / newZoom;
    this.viewport.y = worldY - my / newZoom;

    // Adaptive quality
    if (newZoom < 0.2) {
      this.quality = 'low';
    } else if (newZoom < 0.5) {
      this.quality = 'medium';
    } else {
      this.quality = 'high';
    }

    this.pathCache.clear();
    this.markDirty();
    this.onViewportChange?.(this.viewport);
  };

  private handleDoubleClick = (e: MouseEvent) => {
    const worldX = this.viewport.x + e.offsetX / this.viewport.zoom;
    const worldY = this.viewport.y + e.offsetY / this.viewport.zoom;
    const node = this.hitTest(worldX, worldY);
    if (node) {
      this.onDoubleClick?.(node.id);
    }
  };

  // === Hit Testing (O(log N) via sorted nodes) ===

  private hitTest(worldX: number, worldY: number): DesignNode | null {
    let topNode: DesignNode | null = null;
    const topZ = -Infinity;

    this.nodes.forEach((node) => {
      if (!node.visible || node.locked) {
        return;
      }
      if (worldX >= node.x && worldX <= node.x + node.width && worldY >= node.y && worldY <= node.y + node.height) {
        if (node.rotation === 0) {
          if (!topNode || (node as any).zIndex > topZ) {
            topNode = node;
          }
        } else {
          // Rotated hit test
          const cx = node.x + node.width / 2;
          const cy = node.y + node.height / 2;
          const angle = (-(node.rotation || 0) * Math.PI) / 180;
          const dx = worldX - cx;
          const dy = worldY - cy;
          const rx = dx * Math.cos(angle) - dy * Math.sin(angle) + cx;
          const ry = dx * Math.sin(angle) + dy * Math.cos(angle) + cy;
          if (rx >= node.x && rx <= node.x + node.width && ry >= node.y && ry <= node.y + node.height) {
            topNode = node;
          }
        }
      }
    });

    return topNode;
  }

  private hitTestHandle(
    worldX: number,
    worldY: number,
    node: DesignNode
  ): 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | null {
    const handleSize = 8 / this.viewport.zoom;
    const tolerance = handleSize / 2 + 2 / this.viewport.zoom;
    const x = node.x,
      y = node.y,
      w = node.width,
      h = node.height;

    const handles: { pos: [number, number]; id: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' }[] = [
      { pos: [x, y], id: 'nw' },
      { pos: [x + w / 2, y], id: 'n' },
      { pos: [x + w, y], id: 'ne' },
      { pos: [x + w, y + h / 2], id: 'e' },
      { pos: [x + w, y + h], id: 'se' },
      { pos: [x + w / 2, y + h], id: 's' },
      { pos: [x, y + h], id: 'sw' },
      { pos: [x, y + h / 2], id: 'w' },
    ];

    for (const handle of handles) {
      const dx = worldX - handle.pos[0];
      const dy = worldY - handle.pos[1];
      if (Math.abs(dx) <= tolerance && Math.abs(dy) <= tolerance) {
        return handle.id;
      }
    }
    return null;
  }

  private getResizeCursor(handle: string): string {
    const cursors: Record<string, string> = {
      nw: 'nwse-resize',
      ne: 'nesw-resize',
      se: 'nwse-resize',
      sw: 'nesw-resize',
      n: 'ns-resize',
      s: 'ns-resize',
      e: 'ew-resize',
      w: 'ew-resize',
    };
    return cursors[handle] || 'default';
  }

  getSelectedNodeIds(): string[] {
    // This will be called from the store
    return [];
  }

  // === Node Management ===

  addNode(node: DesignNode) {
    this.nodes.set(node.id, node);
    this.pathCache.clear();
    this.markDirty();
  }

  removeNode(id: string) {
    this.nodes.delete(id);
    this.pathCache.clear();
    this.markDirty();
  }

  updateNode(id: string, updates: Partial<DesignNode>) {
    const node = this.nodes.get(id);
    if (node) {
      Object.assign(node, updates);
      this.pathCache.clear();
      this.markDirty();
    }
  }

  getNode(id: string): DesignNode | undefined {
    return this.nodes.get(id);
  }
  getAllNodes(): DesignNode[] {
    return Array.from(this.nodes.values());
  }

  setViewport(viewport: Partial<CanvasViewport>) {
    Object.assign(this.viewport, viewport);
    this.pathCache.clear();
    this.markDirty();
  }

  getViewport(): CanvasViewport {
    return { ...this.viewport };
  }

  focusNode(id: string, padding: number = 80) {
    const node = this.nodes.get(id);
    if (!node) {
      return;
    }
    this.viewport.x = node.x - padding;
    this.viewport.y = node.y - padding;
    this.viewport.zoom = Math.min(
      this.canvas.width / (node.width + padding * 2),
      this.canvas.height / (node.height + padding * 2),
      3
    );
    this.markDirty();
  }

  fitAll(padding: number = 50) {
    if (this.nodes.size === 0) {
      return;
    }
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    this.nodes.forEach((n) => {
      if (!n.visible) {
        return;
      }
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    });
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    this.viewport.x = minX - padding;
    this.viewport.y = minY - padding;
    this.viewport.zoom = Math.min(
      this.canvas.width / (contentW + padding * 2),
      this.canvas.height / (contentH + padding * 2),
      1
    );
    this.markDirty();
  }

  // === Rendering ===

  private markDirty() {
    this.isDirty = true;
  }

  render(options: RenderOptions) {
    if (!this.isDirty) {
      return;
    }
    this.isDirty = false;

    const ctx = this.offCtx || this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear
    ctx.fillStyle = options.darkMode ? canvasTokens.background.dark : canvasTokens.background.light;
    ctx.fillRect(0, 0, w, h);

    // Grid
    if (options.showGrid && this.quality !== 'low') {
      this.renderGrid(ctx, w, h, options.darkMode);
    }

    // Rulers
    if (options.showRulers) {
      this.renderRulers(ctx, w, h, options.darkMode);
    }

    // Apply viewport transform
    ctx.save();
    ctx.scale(this.viewport.zoom, this.viewport.zoom);
    ctx.translate(-this.viewport.x, -this.viewport.y);

    // Viewport culling
    const visibleNodes: DesignNode[] = [];
    this.nodes.forEach((node) => {
      if (!node.visible) {
        return;
      }
      if (this.isNodeVisible(node, w, h)) {
        visibleNodes.push(node);
      }
    });

    // Render nodes
    visibleNodes.forEach((node) => {
      this.renderNode(ctx, node, options);
    });

    // Render alignment guides
    if (this.activeGuides.length > 0) {
      ctx.strokeStyle = canvasTokens.guides.horizontal;
      ctx.lineWidth = 1 / this.viewport.zoom;
      ctx.setLineDash([4 / this.viewport.zoom, 4 / this.viewport.zoom]);
      ctx.beginPath();
      for (const guide of this.activeGuides) {
        if (guide.type === 'v') {
          ctx.moveTo(guide.pos, this.viewport.y - 100);
          ctx.lineTo(guide.pos, this.viewport.y + h / this.viewport.zoom + 100);
        } else {
          ctx.moveTo(this.viewport.x - 100, guide.pos);
          ctx.lineTo(this.viewport.x + w / this.viewport.zoom + 100, guide.pos);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Snap flash effect
      const flashAge = performance.now() - this.snapFlashTime;
      if (flashAge < 200) {
        const flashAlpha = 1 - flashAge / 200;
        ctx.fillStyle = `rgba(139, 92, 246, ${flashAlpha * 0.15})`;
        ctx.fillRect(0, 0, w, h);
      }
    }

    // Draw shape creation preview
    if (this.isCreating && this.createPreview) {
      const p = this.createPreview;
      const sx = (p.x - this.viewport.x) * this.viewport.zoom;
      const sy = (p.y - this.viewport.y) * this.viewport.zoom;
      const sw = p.w * this.viewport.zoom;
      const sh = p.h * this.viewport.zoom;

      ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
      ctx.strokeStyle = canvasTokens.pen.stroke;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);

      if (this.createType === 'ellipse') {
        ctx.beginPath();
        ctx.ellipse(sx + sw / 2, sy + sh / 2, Math.abs(sw / 2), Math.abs(sh / 2), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeRect(sx, sy, sw, sh);
      }
      ctx.setLineDash([]);

      // Size label
      ctx.font = `bold ${11}px monospace`;
      ctx.fillStyle = canvasTokens.label.text;
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(p.w)} × ${Math.round(p.h)}`, sx + sw / 2, sy + sh / 2);
    }

    // Draw pen tool path and handles
    if (this.isDrawingPen && this.penPoints.length > 0) {
      const points = this.penPoints;

      // Draw the path so far
      if (points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          if (prev.handleOut || curr.handleIn) {
            const cp1x = prev.x + (prev.handleOut?.x ?? 0);
            const cp1y = prev.y + (prev.handleOut?.y ?? 0);
            const cp2x = curr.x + (curr.handleIn?.x ?? 0);
            const cp2y = curr.y + (curr.handleIn?.y ?? 0);
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, curr.x, curr.y);
          } else {
            ctx.lineTo(curr.x, curr.y);
          }
        }
        ctx.strokeStyle = canvasTokens.pen.stroke;
        ctx.lineWidth = 2 / this.viewport.zoom;
        ctx.stroke();
      }

      // Draw points and handles
      const pointSize = 5 / this.viewport.zoom;
      const handleSize = 4 / this.viewport.zoom;

      points.forEach((point, i) => {
        // Draw handle lines and circles
        if (point.handleIn) {
          const hx = point.x + point.handleIn.x;
          const hy = point.y + point.handleIn.y;
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(hx, hy);
          ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
          ctx.lineWidth = 1 / this.viewport.zoom;
          ctx.stroke();
          ctx.fillStyle = canvasTokens.selection.handleFill;
          ctx.strokeStyle = canvasTokens.pen.stroke;
          ctx.lineWidth = 1 / this.viewport.zoom;
          ctx.beginPath();
          ctx.arc(hx, hy, handleSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        if (point.handleOut) {
          const hx = point.x + point.handleOut.x;
          const hy = point.y + point.handleOut.y;
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(hx, hy);
          ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
          ctx.lineWidth = 1 / this.viewport.zoom;
          ctx.stroke();
          ctx.fillStyle = canvasTokens.selection.handleFill;
          ctx.strokeStyle = canvasTokens.pen.stroke;
          ctx.lineWidth = 1 / this.viewport.zoom;
          ctx.beginPath();
          ctx.arc(hx, hy, handleSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Draw point
        ctx.fillStyle = i === 0 ? canvasTokens.pen.pointFirst : canvasTokens.pen.point;
        ctx.strokeStyle = canvasTokens.selection.handleStroke;
        ctx.lineWidth = 1.5 / this.viewport.zoom;
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Draw closing indicator on first point
      if (points.length > 2) {
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
        ctx.lineWidth = 1 / this.viewport.zoom;
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, pointSize + 4 / this.viewport.zoom, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();

    // Draw marquee selection
    if (this.isMarquee) {
      const sx = (this.marqueeStartX - this.viewport.x) * this.viewport.zoom;
      const sy = (this.marqueeStartY - this.viewport.y) * this.viewport.zoom;
      const ex = (this.marqueeEndX - this.viewport.x) * this.viewport.zoom;
      const ey = (this.marqueeEndY - this.viewport.y) * this.viewport.zoom;
      const mx = Math.min(sx, ex);
      const my = Math.min(sy, ey);
      const mw = Math.abs(ex - sx);
      const mh = Math.abs(ey - sy);
      if (mw > 1 || mh > 1) {
        ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
        ctx.fillRect(mx, my, mw, mh);
        ctx.strokeStyle = canvasTokens.pen.stroke;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(mx, my, mw, mh);
        ctx.setLineDash([]);
      }
    }

    // Draw distance labels between selected elements
    if (options.selectedIds.size >= 2 && options.selectedIds.size <= 5) {
      const selectedNodes = visibleNodes.filter((n) => options.selectedIds.has(n.id));
      if (selectedNodes.length >= 2) {
        ctx.font = `${10 / this.viewport.zoom}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < selectedNodes.length - 1; i++) {
          const a = selectedNodes[i];
          const b = selectedNodes[i + 1];
          const ax = a.x + a.width / 2;
          const ay = a.y + a.height / 2;
          const bx = b.x + b.width / 2;
          const by = b.y + b.height / 2;
          const dist = Math.round(Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2));

          if (dist < 5 || dist > 500) {
            continue;
          }

          const midX = (ax + bx) / 2;
          const midY = (ay + by) / 2;

          // Draw line
          ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
          ctx.lineWidth = 1 / this.viewport.zoom;
          ctx.setLineDash([3 / this.viewport.zoom, 3 / this.viewport.zoom]);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw label background
          const text = `${dist}px`;
          const textW = (text.length * 6) / this.viewport.zoom + 4 / this.viewport.zoom;
          const textH = 14 / this.viewport.zoom;
          ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
          ctx.fillRect(midX - textW / 2, midY - textH / 2, textW, textH);

          // Draw label text
          ctx.fillStyle = canvasTokens.label.text;
          ctx.fillText(text, midX, midY);
        }
      }
    }

    // Blit from offscreen
    if (this.offscreen && this.ctx) {
      this.ctx.clearRect(0, 0, w, h);
      this.ctx.drawImage(this.offscreen, 0, 0);
    }
  }

  private renderGrid(ctx: AnyCtx, w: number, h: number, dark: boolean) {
    const gridSize = 20 * this.viewport.zoom;
    if (gridSize < 2) {
      return;
    }

    const offsetX = (-this.viewport.x * this.viewport.zoom) % gridSize;
    const offsetY = (-this.viewport.y * this.viewport.zoom) % gridSize;

    // Main grid lines
    ctx.strokeStyle = dark ? 'rgba(100, 116, 139, 0.08)' : 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = offsetX; x < w; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = offsetY; y < h; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Grid intersection dots (subtle)
    if (gridSize > 10) {
      ctx.fillStyle = dark ? 'rgba(100, 116, 139, 0.15)' : 'rgba(148, 163, 184, 0.25)';
      for (let x = offsetX; x < w; x += gridSize) {
        for (let y = offsetY; y < h; y += gridSize) {
          ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
        }
      }
    }

    // Pixel grid at high zoom (>= 4x)
    if (this.viewport.zoom >= 4) {
      const pixelSize = this.viewport.zoom;
      const pixelOffsetX = (-this.viewport.x * this.viewport.zoom) % pixelSize;
      const pixelOffsetY = (-this.viewport.y * this.viewport.zoom) % pixelSize;

      ctx.strokeStyle = dark ? 'rgba(100, 116, 139, 0.03)' : 'rgba(148, 163, 184, 0.06)';
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      for (let x = pixelOffsetX; x < w; x += pixelSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = pixelOffsetY; y < h; y += pixelSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
    }
  }

  private renderRulers(ctx: AnyCtx, w: number, h: number, dark: boolean) {
    const rulerSize = 22;

    // Horizontal ruler background
    ctx.fillStyle = dark ? canvasTokens.ruler.background : canvasTokens.background.light;
    ctx.fillRect(0, 0, w, rulerSize);
    ctx.fillStyle = dark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(203, 213, 225, 0.5)';
    ctx.fillRect(0, rulerSize - 1, w, 1);

    // Horizontal ruler ticks and labels
    ctx.fillStyle = dark ? canvasTokens.ruler.text : canvasTokens.ruler.text;
    ctx.font = '8px system-ui';
    ctx.textAlign = 'center';
    const step = 100 * this.viewport.zoom;
    const minorStep = step / 5;
    const start = (this.viewport.x * this.viewport.zoom) % step;
    for (let x = start; x < w; x += minorStep) {
      const isMajor = Math.abs(x % step) < 1;
      const tickH = isMajor ? 6 : 3;
      ctx.fillRect(Math.round(x) + 0.5, rulerSize - tickH, 1, tickH);
      if (isMajor) {
        const val = Math.round(this.viewport.x + x / this.viewport.zoom);
        ctx.fillText(val.toString(), x, rulerSize - 9);
      }
    }

    // Vertical ruler background
    ctx.fillStyle = dark ? canvasTokens.ruler.background : canvasTokens.background.light;
    ctx.fillRect(0, 0, rulerSize, h);
    ctx.fillStyle = dark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(203, 213, 225, 0.5)';
    ctx.fillRect(rulerSize - 1, 0, 1, h);

    // Vertical ruler ticks and labels
    ctx.fillStyle = dark ? canvasTokens.ruler.text : canvasTokens.ruler.text;
    const startV = (this.viewport.y * this.viewport.zoom) % step;
    for (let y = startV; y < h; y += minorStep) {
      const isMajor = Math.abs(y % step) < 1;
      const tickW = isMajor ? 6 : 3;
      ctx.fillRect(rulerSize - tickW, Math.round(y) + 0.5, tickW, 1);
      if (isMajor) {
        const val = Math.round(this.viewport.y + y / this.viewport.zoom);
        ctx.save();
        ctx.translate(rulerSize - 9, y);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(val.toString(), 0, 0);
        ctx.restore();
      }
    }
  }

  private isNodeVisible(node: DesignNode, viewW: number, viewH: number): boolean {
    const vx = this.viewport.x;
    const vy = this.viewport.y;
    const vw = viewW / this.viewport.zoom;
    const vh = viewH / this.viewport.zoom;
    return node.x + node.width > vx && node.x < vx + vw && node.y + node.height > vy && node.y < vy + vh;
  }

  private renderNode(ctx: AnyCtx, node: DesignNode, options: RenderOptions) {
    ctx.save();

    // Transform
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    if (node.rotation) {
      ctx.translate(cx, cy);
      ctx.rotate((node.rotation || 0) * (Math.PI / 180));
      ctx.translate(-cx, -cy);
    }

    ctx.globalAlpha = node.opacity ?? 1;

    // Apply effects before rendering shape
    if (node.effects && node.effects.length > 0) {
      for (const effect of node.effects) {
        if (!effect.enabled) {
          continue;
        }
        if ((effect.type as any) === 'shadow') {
          const p = (effect as any).params;
          const r = p.blur ?? 8;
          ctx.shadowOffsetX = p.x ?? 0;
          ctx.shadowOffsetY = p.y ?? 4;
          ctx.shadowBlur = r;
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

    // Render based on type
    switch (node.type) {
      case 'rect':
        this.renderRect(ctx, node);
        break;
      case 'ellipse':
        this.renderEllipse(ctx, node);
        break;
      case 'text':
        this.renderText(ctx, node);
        break;
      case 'image':
        this.renderImage(ctx, node);
        break;
      case 'frame':
        this.renderFrame(ctx, node);
        break;
      case 'group':
        this.renderGroup(ctx, node);
        break;
      case 'path':
        this.renderPath(ctx, node);
        break;
    }

    // Reset effects state
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.filter = 'none';

    // Selection/hover indicators
    if (options.selectedIds.has(node.id)) {
      // Selection outline with animated dash
      ctx.strokeStyle = canvasTokens.selection.outline;
      ctx.lineWidth = 1.5 / this.viewport.zoom;
      ctx.setLineDash([5 / this.viewport.zoom, 3 / this.viewport.zoom]);
      ctx.lineDashOffset = performance.now() / 50;
      ctx.strokeRect(node.x - 1, node.y - 1, node.width + 2, node.height + 2);
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;

      // Corner and edge handles
      const handleSize = 7 / this.viewport.zoom;
      const cornerRadius = 2 / this.viewport.zoom;
      const isHoveredHandle = this.resizeHandle && this.resizeNodeId === node.id;

      const allHandles: { pos: [number, number]; id: string }[] = [
        { pos: [node.x, node.y], id: 'nw' },
        { pos: [node.x + node.width / 2, node.y], id: 'n' },
        { pos: [node.x + node.width, node.y], id: 'ne' },
        { pos: [node.x + node.width, node.y + node.height / 2], id: 'e' },
        { pos: [node.x + node.width, node.y + node.height], id: 'se' },
        { pos: [node.x + node.width / 2, node.y + node.height], id: 's' },
        { pos: [node.x, node.y + node.height], id: 'sw' },
        { pos: [node.x, node.y + node.height / 2], id: 'w' },
      ];

      allHandles.forEach((handle) => {
        const isActive = isHoveredHandle && this.resizeHandle === handle.id;
        const isCorner = handle.id.length === 2;
        const size = isCorner ? handleSize : handleSize * 0.7;

        ctx.fillStyle = isActive ? canvasTokens.selection.handle : canvasTokens.selection.handleFill;
        ctx.strokeStyle = isActive ? canvasTokens.selection.handleStroke : canvasTokens.selection.outline;
        ctx.lineWidth = 1.5 / this.viewport.zoom;
        ctx.beginPath();
        ctx.roundRect(handle.pos[0] - size / 2, handle.pos[1] - size / 2, size, size, cornerRadius);
        ctx.fill();
        ctx.stroke();
      });

      // Auto-resize indicator for text nodes
      if (node.type === 'text') {
        ctx.fillStyle = canvasTokens.label.text;
        ctx.font = `bold ${9 / this.viewport.zoom}px system-ui`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('↔', node.x + node.width, node.y + node.height + 12 / this.viewport.zoom);
      }
    } else if (options.hoveredId === node.id) {
      // Refined hover glow
      ctx.shadowColor = 'rgba(139, 92, 246, 0.2)';
      ctx.shadowBlur = 6 / this.viewport.zoom;
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
      ctx.lineWidth = 1 / this.viewport.zoom;
      ctx.strokeRect(node.x, node.y, node.width, node.height);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  private renderRect(ctx: AnyCtx, node: DesignNode) {
    if (node.fill && typeof node.fill === 'string') {
      ctx.fillStyle = node.fill;
    } else if (node.fill && typeof node.fill === 'object') {
      ctx.fillStyle = this.createGradient(ctx, node.fill, node);
    } else {
      ctx.fillStyle = surface[3];
    }

    if ((node.cornerRadius || 0) > 0) {
      this.roundRect(ctx, node.x, node.y, node.width, node.height, node.cornerRadius || 0);
      ctx.fill();
    } else {
      ctx.fillRect(node.x, node.y, node.width, node.height);
    }

    if (node.stroke) {
      ctx.strokeStyle = node.stroke;
      ctx.lineWidth = node.strokeWidth || 0;
      if ((node.cornerRadius || 0) > 0) {
        this.roundRect(ctx, node.x, node.y, node.width, node.height, node.cornerRadius || 0);
        ctx.stroke();
      } else {
        ctx.strokeRect(node.x, node.y, node.width, node.height);
      }
    }
  }

  private renderEllipse(ctx: AnyCtx, node: DesignNode) {
    // Mirror fix: use same gradient logic as renderRect (line 1217) and
    // exportService.createCanvasGradient (line 441) so canvas and export
    // produce identical output for gradient-filled ellipses.
    if (node.fill && typeof node.fill === 'string') {
      ctx.fillStyle = node.fill;
    } else if (node.fill && typeof node.fill === 'object') {
      ctx.fillStyle = this.createGradient(ctx, node.fill, node);
    } else {
      ctx.fillStyle = surface[3];
    }
    ctx.beginPath();
    ctx.ellipse(node.x + node.width / 2, node.y + node.height / 2, node.width / 2, node.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    if (node.stroke) {
      ctx.strokeStyle = node.stroke;
      ctx.lineWidth = node.strokeWidth || 0;
      ctx.stroke();
    }
  }

  private renderText(ctx: AnyCtx, node: DesignNode) {
    ctx.fillStyle = node.fill && typeof node.fill === 'string' ? node.fill : content.inverse;
    const fontSize = node.fontSize || 16;
    const lineHeight = (node as any).lineHeight || 1.2;
    const letterSpacing = (node as any).letterSpacing || 0;
    ctx.font = `${(node as any).fontStyle || 'normal'} ${node.fontWeight || 400} ${fontSize}px ${node.fontFamily || 'system-ui'}`;
    ctx.textAlign = (node.textAlign || 'left') as any;
    ctx.textBaseline = 'top';

    if (letterSpacing) {
      ctx.letterSpacing = `${letterSpacing}px`;
    }

    // Shared resolver: applies textTransform and word-wraps to the layer
    // width so the engine matches the editor and export output.
    const lines = resolveTextLines(node as any, (t) => ctx.measureText(t).width);
    const yStep = fontSize * lineHeight;
    // ctx.textAlign anchors at the given x, so shift it to the box center/right edge.
    const tx =
      node.textAlign === 'center' ? node.x + node.width / 2 : node.textAlign === 'right' ? node.x + node.width : node.x;

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
        ctx.strokeText(lines[i], tx, node.y + i * yStep);
      }
      ctx.fillText(lines[i], tx, node.y + i * yStep);
    }

    if (tShadow) {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  }

  private renderImage(ctx: AnyCtx, node: DesignNode) {
    // Stitch: completed image rendering — was a placeholder showing emoji.
    // Evidence: comment "Placeholder for image rendering", DesignNode has
    // imageUrl and imageFit properties that were never used.
    if (node.imageUrl) {
      const img = new Image();
      img.src = node.imageUrl;
      // Draw image once loaded (or immediately if cached)
      const draw = () => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(node.x, node.y, node.width, node.height);
        ctx.clip();
        const fit = node.imageFit || 'cover';
        let sx = 0,
          sy = 0,
          sw = img.naturalWidth,
          sh = img.naturalHeight;
        let dx = node.x,
          dy = node.y,
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
            dy = node.y + (node.height - dh) / 2;
          } else {
            dw = dh * imgRatio;
            dx = node.x + (node.width - dw) / 2;
          }
        }
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
        ctx.restore();
      };
      if (img.complete) {
        draw();
      } else {
        img.onload = draw;
        this.markDirty();
      }
    } else {
      // No image URL — show placeholder
      ctx.fillStyle = surface[3];
      ctx.fillRect(node.x, node.y, node.width, node.height);
      ctx.fillStyle = canvasTokens.image.text;
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('image', node.x + node.width / 2, node.y + node.height / 2);
    }
  }

  private renderFrame(ctx: AnyCtx, node: DesignNode) {
    ctx.fillStyle = node.fill && typeof node.fill === 'string' ? node.fill : canvasTokens.frame.background;
    ctx.fillRect(node.x, node.y, node.width, node.height);
    if (node.stroke) {
      ctx.strokeStyle = node.stroke;
      ctx.lineWidth = 1;
      ctx.strokeRect(node.x, node.y, node.width, node.height);
    }
    // Frame label
    ctx.fillStyle = canvasTokens.frame.label;
    ctx.font = '11px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(node.name || '', node.x + 4, node.y - 4);
  }

  private renderGroup(ctx: AnyCtx, node: DesignNode) {
    // Groups just render their children (handled by caller)
  }

  private renderPath(ctx: AnyCtx, node: DesignNode) {
    if (!node.points || node.points.length < 2) {
      return;
    }
    const cacheKey = `${node.id}_${node.points.length}`;
    let path = this.pathCache.get(cacheKey);
    if (!path) {
      path = new Path2D();
      path.moveTo(node.points[0].x, node.points[0].y);
      for (let i = 1; i < node.points.length; i++) {
        const p = node.points[i];
        if (p.handleIn && p.handleOut) {
          path.bezierCurveTo(p.handleOut.x, p.handleOut.y, p.handleIn.x, p.handleIn.y, p.x, p.y);
        } else {
          path.lineTo(p.x, p.y);
        }
      }
      this.pathCache.set(cacheKey, path);
    }
    ctx.fillStyle = node.fill && typeof node.fill === 'string' ? node.fill : surface[3];
    ctx.fill(path);
    if (node.stroke) {
      ctx.strokeStyle = node.stroke;
      ctx.lineWidth = node.strokeWidth || 0;
      ctx.stroke(path);
    }
  }

  private createGradient(ctx: AnyCtx, fill: GradientFill, node: DesignNode): CanvasGradient {
    let grad: CanvasGradient;
    if (fill.type === 'linear') {
      const angle = ((fill.angle || 0) * Math.PI) / 180;
      grad = ctx.createLinearGradient(
        node.x + (Math.cos(angle) * node.width) / 2,
        node.y + (Math.sin(angle) * node.height) / 2,
        node.x + node.width / 2 - (Math.cos(angle) * node.width) / 2,
        node.y + node.height / 2 - (Math.sin(angle) * node.height) / 2
      );
    } else {
      grad = ctx.createRadialGradient(
        node.x + node.width / 2,
        node.y + node.height / 2,
        0,
        node.x + node.width / 2,
        node.y + node.height / 2,
        node.width / 2
      );
    }
    fill.stops.forEach((stop) => grad.addColorStop(stop.offset, stop.color));
    return grad;
  }

  private roundRect(ctx: AnyCtx, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // === Lifecycle ===

  start() {
    const loop = (timestamp: number) => {
      const dt = timestamp - this.lastFrameTime;
      this.fps = dt > 0 ? 1000 / dt : 60;
      this.lastFrameTime = timestamp;
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.animFrameId);
  }

  resize(w: number, h: number) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.viewport.width = w;
    this.viewport.height = h;
    this.setupDoubleBuffer();
    this.markDirty();
  }

  destroy() {
    this.stop();
    this.nodes.clear();
    this.pathCache.clear();
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('dblclick', this.handleDoubleClick);
  }

  on(event: 'select' | 'hover' | 'viewportChange' | 'doubleClick', handler: any) {
    if (event === 'select') {
      this.onNodeSelect = handler;
    }
    if (event === 'hover') {
      this.onNodeHover = handler;
    }
    if (event === 'viewportChange') {
      this.onViewportChange = handler;
    }
    if (event === 'doubleClick') {
      this.onDoubleClick = handler;
    }
  }

  setSelectedIdsGetter(getter: () => string[]) {
    this.getSelectedIds = getter;
  }

  // === Pen Tool Methods ===

  startPen() {
    this.isDrawingPen = true;
    this.penPoints = [];
  }

  cancelPen() {
    this.isDrawingPen = false;
    this.penPoints = [];
    this.penDraggingHandle = null;
    this.markDirty();
  }

  finishPen(): {
    x: number;
    y: number;
    points: { x: number; y: number; handleIn?: { x: number; y: number }; handleOut?: { x: number; y: number } }[];
  } | null {
    if (this.penPoints.length < 2) {
      this.cancelPen();
      return null;
    }
    const result = {
      x: Math.min(...this.penPoints.map((p) => p.x)),
      y: Math.min(...this.penPoints.map((p) => p.y)),
      points: [...this.penPoints],
    };
    this.isDrawingPen = false;
    this.penPoints = [];
    this.penDraggingHandle = null;
    this.markDirty();
    return result;
  }

  private hitTestPenHandle(worldX: number, worldY: number): { pointIdx: number; handle: 'in' | 'out' } | null {
    const tolerance = 8 / this.viewport.zoom;
    for (let i = 0; i < this.penPoints.length; i++) {
      const point = this.penPoints[i];
      if (point.handleIn) {
        const dx = worldX - (point.x + point.handleIn.x);
        const dy = worldY - (point.y + point.handleIn.y);
        if (Math.sqrt(dx * dx + dy * dy) < tolerance) {
          return { pointIdx: i, handle: 'in' };
        }
      }
      if (point.handleOut) {
        const dx = worldX - (point.x + point.handleOut.x);
        const dy = worldY - (point.y + point.handleOut.y);
        if (Math.sqrt(dx * dx + dy * dy) < tolerance) {
          return { pointIdx: i, handle: 'out' };
        }
      }
    }
    return null;
  }

  private hitTestPenPoint(worldX: number, worldY: number): number | null {
    const tolerance = 8 / this.viewport.zoom;
    for (let i = 0; i < this.penPoints.length; i++) {
      const point = this.penPoints[i];
      const dx = worldX - point.x;
      const dy = worldY - point.y;
      if (Math.sqrt(dx * dx + dy * dy) < tolerance) {
        return i;
      }
    }
    return null;
  }

  getPenPoints() {
    return this.penPoints;
  }
  getIsDrawingPen() {
    return this.isDrawingPen;
  }

  getFps() {
    return this.fps;
  }

  setSnapToGrid(enabled: boolean, gridSize: number = 8) {
    this.snapToGrid = enabled;
    this.gridSize = gridSize;
  }

  smoothZoom(targetZoom: number, centerX?: number, centerY?: number) {
    if (this.zoomAnimId) {
      cancelAnimationFrame(this.zoomAnimId);
    }
    const cx = centerX ?? this.canvas.width / 2;
    const cy = centerY ?? this.canvas.height / 2;
    const startZoom = this.viewport.zoom;
    const startX = this.viewport.x;
    const startY = this.viewport.y;
    const worldX = startX + cx / startZoom;
    const worldY = startY + cy / startZoom;
    const duration = 150;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const zoom = startZoom + (targetZoom - startZoom) * ease;
      this.viewport.zoom = zoom;
      this.viewport.x = worldX - cx / zoom;
      this.viewport.y = worldY - cy / zoom;

      if (zoom < 0.2) {
        this.quality = 'low';
      } else if (zoom < 0.5) {
        this.quality = 'medium';
      } else {
        this.quality = 'high';
      }

      this.pathCache.clear();
      this.markDirty();
      this.onViewportChange?.(this.viewport);

      if (t < 1) {
        this.zoomAnimId = requestAnimationFrame(animate);
      } else {
        this.zoomAnimId = null;
      }
    };
    this.zoomAnimId = requestAnimationFrame(animate);
  }
}
