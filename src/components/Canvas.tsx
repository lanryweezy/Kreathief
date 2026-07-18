import React, { useRef, useEffect, useState, useCallback } from 'react';
import { KreathiefCanvas, RenderOptions } from '../lib/canvasEngine';
import { useKreathiefStore } from '../store/useStore';
import { CanvasContextMenu } from './ContextMenu';
import { canvas as canvasTokens, content } from '../lib/tokens';
import './CanvasRipple.css';

interface EditTextState {
  nodeId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  fill: string;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<KreathiefCanvas | null>(null);
  const [editingText, setEditingText] = useState<EditTextState | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rippleIdRef = useRef(0);
  const { nodes, selectedIds, hoveredId, darkMode, showGrid, showRulers, zoom, panX, panY, selectNode, setHovered, setZoom, setPan, updateNode, activeTool, addRecentColor, addToast, setTool } = useKreathiefStore();

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new KreathiefCanvas(canvasRef.current);
    engineRef.current = engine;
    (window as any).__kreathiefEngine = engine;

    engine.on('select', (ids: string[]) => {
      if (editingText) commitTextEdit();
      selectNode(ids);
    });
    engine.on('hover', (id: string | null) => setHovered(id));
    engine.on('viewportChange', (v: { zoom: number; x: number; y: number }) => { setZoom(v.zoom); setPan(v.x, v.y); });
    engine.on('doubleClick', (id: string) => {
      const node = useKreathiefStore.getState().nodes.get(id);
      if (node && node.type === 'text') {
        startTextEdit(node);
      }
    });
    engine.setSelectedIdsGetter(() => Array.from(useKreathiefStore.getState().selectedIds));

    const resize = () => {
      const parent = canvasRef.current?.parentElement;
      if (parent) engine.resize(parent.clientWidth, parent.clientHeight);
    };
    resize();
    window.addEventListener('resize', resize);

    // Listen for shape creation events
    const handleCreate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const { addNode, addToast } = useKreathiefStore.getState();
      const id = `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const node = {
        id,
        type: detail.type === 'ellipse' ? 'ellipse' as const : 'rect' as const,
        name: `${detail.type} ${id.slice(-4)}`,
        x: detail.x,
        y: detail.y,
        width: detail.width,
        height: detail.height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        blendMode: 'normal' as const,
        fill: content.primary,
        stroke: null,
        strokeWidth: 0,
        cornerRadius: 0,
        effects: [],
        children: [],
        parentId: null,
      };
      addNode(node);
      addToast('success', `Created ${detail.type}`);
    };
    canvasRef.current?.addEventListener('kreathief:create', handleCreate);

    return () => {
      engine.destroy();
      (window as any).__kreathiefEngine = null;
      window.removeEventListener('resize', resize);
      canvasRef.current?.removeEventListener('kreathief:create', handleCreate);
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.getAllNodes().forEach(n => {
      if (!nodes.has(n.id)) engine.removeNode(n.id);
    });
    nodes.forEach((node, id) => {
      if (!engine.getNode(id)) engine.addNode(node);
      else engine.updateNode(id, node);
    });
  }, [nodes]);

  useEffect(() => {
    engineRef.current?.setViewport({ zoom, x: panX, y: panY });
  }, [zoom, panX, panY]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    let rafId: number;
    const renderLoop = () => {
      const options: RenderOptions = {
        showGrid, showRulers, showBounds: true,
        selectedIds, hoveredId, darkMode,
      };
      engine.render(options);
      rafId = requestAnimationFrame(renderLoop);
    };
    rafId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(rafId);
  }, [nodes, selectedIds, hoveredId, darkMode, showGrid, showRulers]);

  const startTextEdit = (node: any) => {
    const vp = engineRef.current?.getViewport();
    if (!vp) return;
    setEditingText({
      nodeId: node.id,
      x: (node.x - vp.x) * vp.zoom,
      y: (node.y - vp.y) * vp.zoom,
      width: node.width * vp.zoom,
      height: Math.max(node.height * vp.zoom, 24),
      text: node.text || '',
      fontSize: node.fontSize || 16,
      fontFamily: node.fontFamily || 'system-ui',
      fontWeight: node.fontWeight || 400,
      fill: typeof node.fill === 'string' ? node.fill : content.inverse,
    });
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const commitTextEdit = () => {
    if (!editingText) return;
    updateNode(editingText.nodeId, { text: editingText.text });
    setEditingText(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Hit test to select the node under cursor
    const vp = engineRef.current?.getViewport();
    if (vp) {
      const worldX = vp.x + e.nativeEvent.offsetX / vp.zoom;
      const worldY = vp.y + e.nativeEvent.offsetY / vp.zoom;
      const engine = engineRef.current;
      if (engine) {
        let topNode: any = null;
        engine.getAllNodes().forEach(n => {
          if (!n.visible || n.locked) return;
          if (worldX >= n.x && worldX <= n.x + n.width && worldY >= n.y && worldY <= n.y + n.height) {
            topNode = n;
          }
        });
        if (topNode) selectNode([topNode.id]);
      }
    }
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const addRipple = useCallback((x: number, y: number) => {
    const id = rippleIdRef.current++;
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 400);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Add ripple effect on every click
    addRipple(e.nativeEvent.offsetX - 20, e.nativeEvent.offsetY - 20);

    if (activeTool !== 'eyedropper') return;
    const vp = engineRef.current?.getViewport();
    if (!vp) return;
    const worldX = vp.x + e.nativeEvent.offsetX / vp.zoom;
    const worldY = vp.y + e.nativeEvent.offsetY / vp.zoom;

    const engine = engineRef.current;
    if (!engine) return;

    let topNode: any = null;
    engine.getAllNodes().forEach(n => {
      if (!n.visible) return;
      if (worldX >= n.x && worldX <= n.x + n.width && worldY >= n.y && worldY <= n.y + n.height) {
        topNode = n;
      }
    });

    if (topNode) {
      const color = typeof topNode.fill === 'string' ? topNode.fill : null;
      if (color) {
        addRecentColor(color);
        addToast('success', `Picked color ${color}`);
      } else {
        addToast('info', 'Node has no solid fill color');
      }
    } else {
      // Pick from canvas background
      const bgColor = darkMode ? canvasTokens.background.dark : canvasTokens.background.light;
      addRecentColor(bgColor);
      addToast('info', `Picked background ${bgColor}`);
    }
    setTool('select');
  };

  const cursorClass = activeTool === 'eyedropper'
    ? 'cursor-crosshair'
    : activeTool === 'hand'
      ? 'cursor-grab'
      : activeTool === 'text'
        ? 'cursor-text'
        : 'cursor-default';

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className={`w-full h-full block transition-cursor ${cursorClass}`}
        style={{ transition: 'cursor 0.15s ease' }}
        onContextMenu={handleContextMenu}
        onClick={handleCanvasClick}
      />
      {/* Ripple effects */}
      {ripples.map(r => (
        <div
          key={r.id}
          className="canvas-ripple"
          style={{ left: r.x, top: r.y }}
        />
      ))}
      {editingText && (
        <textarea
          ref={textareaRef}
          value={editingText.text}
          onChange={(e) => setEditingText(prev => prev ? { ...prev, text: e.target.value } : null)}
          onBlur={commitTextEdit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setEditingText(null); }
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitTextEdit(); }
          }}
          className="absolute bg-transparent border-2 border-neutral-500 rounded outline-none resize-none text-neutral-900 p-1 overflow-hidden"
          style={{
            left: editingText.x - 2,
            top: editingText.y - 2,
            width: editingText.width + 4,
            minHeight: editingText.height + 4,
            fontSize: editingText.fontSize * zoom,
            fontFamily: editingText.fontFamily,
            fontWeight: editingText.fontWeight,
            lineHeight: 1.2,
            color: editingText.fill,
          }}
          aria-label="Edit text"
        />
      )}
      {contextMenu && (
        <CanvasContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} />
      )}
    </div>
  );
};
