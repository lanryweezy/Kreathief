import React, { useState, useCallback, useRef } from 'react';
import { TextLayer } from '../../types';
import { useStore } from '../../store/useStore';

interface TextWarpControlsProps {
  layer: TextLayer;
  zoom?: number;
}

export const TextWarpControls: React.FC<TextWarpControlsProps> = ({ layer, zoom = 1 }) => {
  const updateLayer = useStore((state) => state.updateLayer);
  const saveToHistory = useStore((state) => state.saveToHistory);

  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const startDragRef = useRef<{ startX: number; startY: number; startCurve: number; startRotateX: number; startRotateY: number }>({
    startX: 0,
    startY: 0,
    startCurve: 0,
    startRotateX: 0,
    startRotateY: 0,
  });

  const width = layer.width || 300;
  const fontSize = typeof layer.fontSize === 'number' ? layer.fontSize : 40;
  const height = Math.max(120, fontSize * 2.5);
  const baseBaselineY = Math.max(60, fontSize * 1.25);
  const currentCurve = layer.curve ?? 45;

  // ─── Bézier Handle Drag Handlers ───────────────────────────────────────────

  const handleBezierPointerDown = useCallback(
    (e: React.PointerEvent, handleId: string) => {
      e.stopPropagation();
      try {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {}
      saveToHistory?.();

      startDragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startCurve: currentCurve,
        startRotateX: layer.warpParams?.rotateX || 0,
        startRotateY: layer.warpParams?.rotateY || 0,
      };
      setActiveHandle(handleId);
    },
    [currentCurve, layer.warpParams, saveToHistory]
  );

  const handleBezierPointerMove = useCallback(
    (e: React.PointerEvent, handleId: string) => {
      if (activeHandle !== handleId) {return;}
      e.stopPropagation();

      const dy = (e.clientY - startDragRef.current.startY) / zoom;
      const dx = (e.clientX - startDragRef.current.startX) / zoom;

      if (handleId === 'arc_cp') {
        // Dragging upward increases arc curve, dragging down flattens/inverts
        const curveDelta = -dy * 0.55;
        const nextCurve = Math.round(Math.max(-100, Math.min(100, startDragRef.current.startCurve + curveDelta)));
        updateLayer(layer.id, { curve: nextCurve });
      } else if (handleId === 'wave_cp1') {
        const curveDelta = -dy * 0.7;
        const nextCurve = Math.round(Math.max(-100, Math.min(100, startDragRef.current.startCurve + curveDelta)));
        updateLayer(layer.id, { curve: nextCurve });
      } else if (handleId === '3d_gizmo') {
        const nextRotateY = Math.round(Math.max(-60, Math.min(60, startDragRef.current.startRotateY + dx * 0.5)));
        const nextRotateX = Math.round(Math.max(-60, Math.min(60, startDragRef.current.startRotateX - dy * 0.5)));
        updateLayer(layer.id, {
          warpParams: {
            rotateX: nextRotateX,
            rotateY: nextRotateY,
            perspective: layer.warpParams?.perspective || 800,
            depth3d: layer.warpParams?.depth3d ?? 12,
            is3dExtrusion: layer.warpParams?.is3dExtrusion ?? true,
          },
        });
      }
    },
    [activeHandle, layer.id, layer.warpParams, updateLayer, zoom]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (activeHandle) {
        try {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {}
        setActiveHandle(null);
      }
    },
    [activeHandle]
  );

  const isArc = layer.warpStyle === 'arc' || layer.warpStyle === 'rise';
  const isWave = layer.warpStyle === 'wave' || layer.warpStyle === 'flag';
  const is3D =
    layer.warpStyle === 'perspective' ||
    layer.warpStyle === 'bulge' ||
    layer.warpStyle === 'squeeze' ||
    layer.warpParams?.is3dExtrusion ||
    layer.isWarpEditing;

  // Arc control points
  const p0 = { x: 10, y: baseBaselineY };
  const p2 = { x: width - 10, y: baseBaselineY };
  const arcCp = { x: width / 2, y: baseBaselineY - currentCurve * 1.8 };

  // Wave control points
  const waveCp1 = { x: width / 4, y: baseBaselineY - currentCurve * 1.2 };
  const waveMid = { x: width / 2, y: baseBaselineY };
  const waveCp2 = { x: (3 * width) / 4, y: baseBaselineY + currentCurve * 1.2 };

  return (
    <div className="absolute inset-0 pointer-events-none z-[60]" style={{ width, height }}>
      {/* ─── Bézier Curve Controls (Arc / Wave) ────────────────────────────── */}
      {(isArc || isWave) && (
        <svg
          className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
          viewBox={`0 0 ${width} ${height}`}
        >
          {isArc && (
            <>
              {/* Tangent guide rail lines */}
              <line
                x1={p0.x}
                y1={p0.y}
                x2={arcCp.x}
                y2={arcCp.y}
                stroke="#00f0ff"
                strokeWidth={1.5 / zoom}
                strokeDasharray="3 3"
                opacity={0.7}
              />
              <line
                x1={p2.x}
                y1={p2.y}
                x2={arcCp.x}
                y2={arcCp.y}
                stroke="#00f0ff"
                strokeWidth={1.5 / zoom}
                strokeDasharray="3 3"
                opacity={0.7}
              />

              {/* Anchor Point 0 (Start) */}
              <circle cx={p0.x} cy={p0.y} r={4 / zoom} fill="#00f0ff" stroke="#090a0f" strokeWidth={1.5 / zoom} />
              {/* Anchor Point 2 (End) */}
              <circle cx={p2.x} cy={p2.y} r={4 / zoom} fill="#00f0ff" stroke="#090a0f" strokeWidth={1.5 / zoom} />
            </>
          )}

          {isWave && (
            <>
              {/* Wave tangent guide lines */}
              <line
                x1={p0.x}
                y1={p0.y}
                x2={waveCp1.x}
                y2={waveCp1.y}
                stroke="#a855f7"
                strokeWidth={1.5 / zoom}
                strokeDasharray="3 3"
                opacity={0.7}
              />
              <line
                x1={waveMid.x}
                y1={waveMid.y}
                x2={waveCp2.x}
                y2={waveCp2.y}
                stroke="#a855f7"
                strokeWidth={1.5 / zoom}
                strokeDasharray="3 3"
                opacity={0.7}
              />

              {/* Anchors */}
              <circle cx={p0.x} cy={p0.y} r={4 / zoom} fill="#a855f7" stroke="#090a0f" strokeWidth={1.5 / zoom} />
              <circle cx={waveMid.x} cy={waveMid.y} r={4 / zoom} fill="#a855f7" stroke="#090a0f" strokeWidth={1.5 / zoom} />
              <circle cx={p2.x} cy={p2.y} r={4 / zoom} fill="#a855f7" stroke="#090a0f" strokeWidth={1.5 / zoom} />
            </>
          )}
        </svg>
      )}

      {/* ─── Interactive Draggable Diamond Bézier Handle (Arc) ─────────────── */}
      {isArc && (
        <div
          data-testid="bezier-handle-arc"
          onPointerDown={(e) => handleBezierPointerDown(e, 'arc_cp')}
          onPointerMove={(e) => handleBezierPointerMove(e, 'arc_cp')}
          onPointerUp={handlePointerUp}
          style={{
            transform: `translate(${arcCp.x}px, ${arcCp.y}px) translate(-50%, -50%)`,
          }}
          className="absolute pointer-events-auto cursor-ns-resize group z-50"
        >
          <div
            className={`w-4 h-4 rotate-45 bg-[#00f0ff] border-2 border-[#090a0f] rounded-sm shadow-[0_0_12px_rgba(0,240,255,0.8)] transition-transform duration-100 ${
              activeHandle === 'arc_cp' ? 'scale-125 bg-white' : 'hover:scale-125'
            }`}
          />
          {/* Live Pill Tooltip */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#090a0f]/90 border border-[#00f0ff]/40 rounded text-[9px] font-mono text-[#00f0ff] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
            Bézier Arc: {currentCurve > 0 ? `+${currentCurve}` : currentCurve}°
          </div>
        </div>
      )}

      {/* ─── Interactive Draggable Diamond Bézier Handle (Wave) ────────────── */}
      {isWave && (
        <div
          data-testid="bezier-handle-wave"
          onPointerDown={(e) => handleBezierPointerDown(e, 'wave_cp1')}
          onPointerMove={(e) => handleBezierPointerMove(e, 'wave_cp1')}
          onPointerUp={handlePointerUp}
          style={{
            transform: `translate(${waveCp1.x}px, ${waveCp1.y}px) translate(-50%, -50%)`,
          }}
          className="absolute pointer-events-auto cursor-ns-resize group z-50"
        >
          <div
            className={`w-4 h-4 rotate-45 bg-[#c084fc] border-2 border-[#090a0f] rounded-sm shadow-[0_0_12px_rgba(192,132,252,0.8)] transition-transform duration-100 ${
              activeHandle === 'wave_cp1' ? 'scale-125 bg-white' : 'hover:scale-125'
            }`}
          />
          <div className="absolute top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#090a0f]/90 border border-[#c084fc]/40 rounded text-[9px] font-mono text-[#c084fc] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
            Wave Amplitude: {currentCurve}px
          </div>
        </div>
      )}

      {/* ─── Interactive 3D Typography Orbit Gizmo ─────────────────────────── */}
      {is3D && (
        <div
          data-testid="3d-orbit-gizmo"
          onPointerDown={(e) => handleBezierPointerDown(e, '3d_gizmo')}
          onPointerMove={(e) => handleBezierPointerMove(e, '3d_gizmo')}
          onPointerUp={handlePointerUp}
          style={{
            top: -24,
            right: -24,
          }}
          className="absolute pointer-events-auto cursor-move group z-50 flex flex-col items-center"
        >
          <div
            className={`w-8 h-8 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] border-2 border-white shadow-[0_0_16px_rgba(124,58,237,0.7)] flex items-center justify-center text-white text-[10px] font-bold transition-transform duration-150 ${
              activeHandle === '3d_gizmo' ? 'scale-125 shadow-[0_0_24px_rgba(0,240,255,0.9)]' : 'hover:scale-110'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 3v18M3 12h18M5 5l14 14M5 19L19 5" opacity="0.6" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
          </div>

          {/* 3D Coordinate Pill */}
          <div className="mt-1 px-2 py-0.5 bg-[#090a0f]/90 border border-[#7c3aed]/50 rounded text-[8px] font-mono text-[#a78bfa] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
            3D Orbit: X:{layer.warpParams?.rotateX || 0}° Y:{layer.warpParams?.rotateY || 0}°
          </div>
        </div>
      )}
    </div>
  );
};
