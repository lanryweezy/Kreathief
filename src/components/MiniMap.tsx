import React, { useRef, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKreathiefStore } from '../store/useStore';
import { canvas as canvasTokens, surface, content } from '../lib/tokens';

export const MiniMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // ⚡ Bolt Optimization: Use useShallow to prevent unnecessary re-renders and costly canvas redraws when unrelated store state changes.
  const { nodes, zoom, panX, panY, darkMode } = useKreathiefStore(
    useShallow((state) => ({
      nodes: state.nodes,
      zoom: state.zoom,
      panX: state.panX,
      panY: state.panY,
      darkMode: state.darkMode,
    }))
  );
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Find bounds of all nodes
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    nodes.forEach((n) => {
      if (!n.visible) return;
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    });

    if (nodes.size === 0) {
      minX = 0;
      minY = 0;
      maxX = 1000;
      maxY = 1000;
    }

    const padding = 50;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const scale = Math.min(w / contentW, h / contentH);

    // Clear
    ctx.fillStyle = darkMode ? canvasTokens.ruler.background : surface[2];
    ctx.fillRect(0, 0, w, h);

    // Draw nodes
    nodes.forEach((n) => {
      if (!n.visible) return;
      const x = (n.x - minX + padding) * scale;
      const y = (n.y - minY + padding) * scale;
      const nw = n.width * scale;
      const nh = n.height * scale;
      const fill = typeof n.fill === 'string' ? n.fill : darkMode ? content.muted : content.tertiary;
      ctx.fillStyle = fill;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(x, y, Math.max(nw, 1), Math.max(nh, 1));
      ctx.globalAlpha = 1;
    });

    // Draw viewport indicator
    const vpX = (-panX - minX + padding) * scale;
    const vpY = (-panY - minY + padding) * scale;
    const vpW = (window.innerWidth / zoom) * scale;
    const vpH = (window.innerHeight / zoom) * scale;

    ctx.strokeStyle = canvasTokens.selection.outline;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vpX, vpY, vpW, vpH);
    ctx.fillStyle = 'rgba(139, 92, 246, 0.08)';
    ctx.fillRect(vpX, vpY, vpW, vpH);
  }, [nodes, zoom, panX, panY, darkMode]);

  if (!visible) return null;

  return (
    <div className="absolute bottom-4 right-4 z-10 animate-fade-in">
      <div className="bg-neutral-900/90 backdrop-blur-sm border border-neutral-700 rounded-lg shadow-xl overflow-hidden">
        <canvas ref={canvasRef} width={160} height={100} className="block" />
        <button
          onClick={() => setVisible(false)}
          className="absolute top-1 right-1 text-[8px] text-neutral-500 hover:text-white px-1 rounded bg-neutral-800/50 focus:outline-none"
          aria-label="Hide minimap"
        >
          ×
        </button>
      </div>
    </div>
  );
};
