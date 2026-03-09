import React, { useEffect, useState, useCallback, useRef } from 'react';
import { VectorPath, VectorPoint } from '../../types';

interface PathEditorOverlayProps {
  path: VectorPath;
  zoom: number;
  onUpdate: (newPath: VectorPath, id?: string) => void;
  onSelectPoint: (indices: number[]) => void;
  selectedPointIndices: number[];
  layerX?: number;
  layerY?: number;
  onClose?: () => void;
}

type PointMode = 'corner' | 'smooth' | 'symmetric';
type EditorTool = 'select' | 'pen' | 'add' | 'remove';

export const PathEditorOverlay: React.FC<PathEditorOverlayProps> = ({
  path,
  zoom,
  onUpdate,
  onSelectPoint,
  selectedPointIndices,
  layerX: _layerX = 0,
  layerY: _layerY = 0,
  onClose,
}) => {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [penPreviewPoint, setPenPreviewPoint] = useState<{ x: number; y: number } | null>(null);
  const [isDrawingCurve, setIsDrawingCurve] = useState(false);
  const showToolbar = true;
  const svgRef = useRef<SVGSVGElement>(null);

  // Scale factor for crisp visuals at any zoom
  const s = 1 / zoom;
  const pointRadius = 5 * s;
  const handleRadius = 3.5 * s;
  const strokeW = 1.5 * s;
  const hitAreaSize = 12 * s;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeTool !== 'select') {
          setActiveTool('select');
          setPenPreviewPoint(null);
          return;
        }
        onClose?.();
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPointIndices.length > 0) {
        e.preventDefault();
        const newPoints = path.points.filter((_, i) => !selectedPointIndices.includes(i));
        if (newPoints.length >= 2) {
          onUpdate({ ...path, points: newPoints });
          onSelectPoint([]);
        }
      }
      // T to toggle smooth/corner
      if (e.key === 't' || e.key === 'T') {
        if (selectedPointIndices.length > 0) {
          const newPoints = [...path.points];
          selectedPointIndices.forEach((idx) => {
            const pt = newPoints[idx];
            if (!pt) return;
            const newType: PointMode = pt.type === 'smooth' ? 'corner' : 'smooth';
            newPoints[idx] = {
              ...pt,
              type: newType,
              ...(newType === 'corner' ? { handleIn: undefined, handleOut: undefined } : {}),
            };
          });
          onUpdate({ ...path, points: newPoints });
        }
      }
      // P to toggle pen tool
      if (e.key === 'p' || e.key === 'P') {
        setActiveTool((prev) => (prev === 'pen' ? 'select' : 'pen'));
        setPenPreviewPoint(null);
      }
      // A to toggle add point mode
      if (e.key === 'a' || e.key === 'A') {
        if (!e.ctrlKey && !e.metaKey) {
          setActiveTool((prev) => (prev === 'add' ? 'select' : 'add'));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [path, selectedPointIndices, onSelectPoint, onUpdate, onClose, activeTool]);



  // PEN TOOL: Click + drag to create curves
  const handlePenMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool !== 'pen') return;
      e.preventDefault();
      e.stopPropagation();

      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / zoom;
      const clickY = (e.clientY - rect.top) / zoom;

      const startX = e.clientX;
      const startY = e.clientY;

      const newPoint: VectorPoint = {
        id: `pt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        x: clickX,
        y: clickY,
        type: 'corner',
      };

      const newPoints = [...path.points, newPoint];
      const newIdx = newPoints.length - 1;
      onUpdate({ ...path, points: newPoints });
      onSelectPoint([newIdx]);
      setIsDrawingCurve(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = (moveEvent.clientX - startX) / zoom;
        const dy = (moveEvent.clientY - startY) / zoom;

        if (Math.abs(dx) > 2 * s || Math.abs(dy) > 2 * s) {

          // Create symmetric handles
          const updatedPoints = [...newPoints];
          updatedPoints[newIdx] = {
            ...updatedPoints[newIdx]!,
            type: 'smooth',
            handleOut: { x: dx, y: dy },
            handleIn: { x: -dx, y: -dy },
          };
          onUpdate({ ...path, points: updatedPoints });
        }
      };

      const handleMouseUp = () => {
        setIsDrawingCurve(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [activeTool, path, zoom, onUpdate, onSelectPoint, s]
  );

  // PEN TOOL: Close path by clicking first point
  const handlePenCloseClick = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool !== 'pen') return;
      e.preventDefault();
      e.stopPropagation();
      onUpdate({ ...path, isClosed: true });
      setActiveTool('select');
    },
    [activeTool, path, onUpdate]
  );

  // PEN TOOL: Preview line on mouse move
  const handlePenPreviewMove = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool !== 'pen' || path.points.length === 0) {
        setPenPreviewPoint(null);
        return;
      }
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      setPenPreviewPoint({
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
      });
    },
    [activeTool, path.points.length, zoom]
  );

  // REMOVE POINT TOOL: click to delete
  const handleRemovePointClick = useCallback(
    (e: React.MouseEvent, index: number) => {
      if (activeTool !== 'remove') return;
      e.preventDefault();
      e.stopPropagation();
      const newPoints = path.points.filter((_, i) => i !== index);
      if (newPoints.length >= 1) {
        onUpdate({ ...path, points: newPoints });
        onSelectPoint([]);
      }
    },
    [activeTool, path, onUpdate, onSelectPoint]
  );

  // ==================================
  // POINT DRAGGING
  // ==================================
  const handlePointMouseDown = useCallback(
    (e: React.MouseEvent, index: number) => {
      // In remove mode, handle differently
      if (activeTool === 'remove') {
        handleRemovePointClick(e, index);
        return;
      }
      // In pen mode, check if clicking first point to close path
      if (activeTool === 'pen' && index === 0 && path.points.length > 2) {
        handlePenCloseClick(e);
        return;
      }
      if (activeTool !== 'select') return;

      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);

      // Multi-select with shift
      if (e.shiftKey) {
        const newSel = selectedPointIndices.includes(index)
          ? selectedPointIndices.filter((i) => i !== index)
          : [...selectedPointIndices, index];
        onSelectPoint(newSel);
      } else if (!selectedPointIndices.includes(index)) {
        onSelectPoint([index]);
      }

      const pointsBefore = path.points.map((p) => ({ ...p }));
      const startX = e.clientX;
      const startY = e.clientY;
      const indicesToMove = selectedPointIndices.includes(index) ? selectedPointIndices : [index];

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = (moveEvent.clientX - startX) / zoom;
        const dy = (moveEvent.clientY - startY) / zoom;
        const newPoints = path.points.map((p, i) => {
          if (indicesToMove.includes(i)) {
            const orig = pointsBefore[i]!;
            return { ...p, x: orig.x + dx, y: orig.y + dy };
          }
          return p;
        });
        onUpdate({ ...path, points: newPoints });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [path, zoom, selectedPointIndices, onSelectPoint, onUpdate, activeTool, handleRemovePointClick, handlePenCloseClick]
  );

  // ==================================
  // HANDLE DRAGGING (Bezier curves)
  // ==================================
  const handleHandleMouseDown = useCallback(
    (e: React.MouseEvent, pointIndex: number, handleType: 'in' | 'out') => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);

      const startX = e.clientX;
      const startY = e.clientY;
      const point = path.points[pointIndex]!;
      const origHandle =
        handleType === 'in' ? point.handleIn : point.handleOut;
      const origX = origHandle?.x ?? 0;
      const origY = origHandle?.y ?? 0;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = (moveEvent.clientX - startX) / zoom;
        const dy = (moveEvent.clientY - startY) / zoom;
        const newHandle = { x: origX + dx, y: origY + dy };

        const newPoints = [...path.points];
        const pt = { ...newPoints[pointIndex]! };

        if (handleType === 'in') {
          pt.handleIn = newHandle;
          // For symmetric points, mirror the out handle
          if (pt.type === 'symmetric') {
            pt.handleOut = { x: -newHandle.x, y: -newHandle.y };
          } else if (pt.type === 'smooth' && pt.handleOut) {
            const dist = Math.sqrt(pt.handleOut.x ** 2 + pt.handleOut.y ** 2);
            const len = Math.sqrt(newHandle.x ** 2 + newHandle.y ** 2);
            if (len > 0) {
              pt.handleOut = {
                x: (-newHandle.x / len) * dist,
                y: (-newHandle.y / len) * dist,
              };
            }
          }
        } else {
          pt.handleOut = newHandle;
          if (pt.type === 'symmetric') {
            pt.handleIn = { x: -newHandle.x, y: -newHandle.y };
          } else if (pt.type === 'smooth' && pt.handleIn) {
            const dist = Math.sqrt(pt.handleIn.x ** 2 + pt.handleIn.y ** 2);
            const len = Math.sqrt(newHandle.x ** 2 + newHandle.y ** 2);
            if (len > 0) {
              pt.handleIn = {
                x: (-newHandle.x / len) * dist,
                y: (-newHandle.y / len) * dist,
              };
            }
          }
        }

        newPoints[pointIndex] = pt;
        onUpdate({ ...path, points: newPoints });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [path, zoom, onUpdate]
  );

  // ==================================
  // DOUBLE-CLICK to toggle point type
  // ==================================
  const handlePointDoubleClick = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      const pt = path.points[index]!;
      const newType: PointMode =
        pt.type === 'corner' ? 'smooth' : pt.type === 'smooth' ? 'symmetric' : 'corner';

      const newPoints = [...path.points];
      const newPt = { ...pt, type: newType };

      if (newType === 'corner') {
        newPt.handleIn = undefined;
        newPt.handleOut = undefined;
      } else if ((newType === 'smooth' || newType === 'symmetric') && !pt.handleIn && !pt.handleOut) {
        // Auto-generate handles
        const prev = path.points[(index - 1 + path.points.length) % path.points.length]!;
        const next = path.points[(index + 1) % path.points.length]!;
        const dx = (next.x - prev.x) * 0.25;
        const dy = (next.y - prev.y) * 0.25;
        newPt.handleIn = { x: -dx, y: -dy };
        newPt.handleOut = { x: dx, y: dy };
      }

      newPoints[index] = newPt;
      onUpdate({ ...path, points: newPoints });
    },
    [path, onUpdate]
  );

  // ==================================
  // CLICK ON PATH SEGMENT to insert point
  // ==================================
  const handlePathClick = useCallback(
    (e: React.MouseEvent, segIndex: number) => {
      if (isDragging || activeTool === 'pen') return;
      e.preventDefault();
      e.stopPropagation();

      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / zoom;
      const clickY = (e.clientY - rect.top) / zoom;

      const newPoint: VectorPoint = {
        id: `pt_${Date.now()}`,
        x: clickX,
        y: clickY,
        type: 'corner',
      };

      const newPoints = [...path.points];
      newPoints.splice(segIndex + 1, 0, newPoint);
      onUpdate({ ...path, points: newPoints });
      onSelectPoint([segIndex + 1]);
    },
    [path, zoom, onUpdate, onSelectPoint, isDragging, activeTool]
  );

  // ==================================
  // TOOLBAR ACTIONS
  // ==================================
  const setPointType = useCallback(
    (type: PointMode) => {
      if (selectedPointIndices.length === 0) return;
      const newPoints = [...path.points];
      selectedPointIndices.forEach((idx) => {
        const pt = newPoints[idx];
        if (!pt) return;
        const newPt: VectorPoint = { ...pt, type };

        if (type === 'corner') {
          newPt.handleIn = undefined;
          newPt.handleOut = undefined;
        } else if (!pt.handleIn && !pt.handleOut) {
          const prev = path.points[(idx - 1 + path.points.length) % path.points.length]!;
          const next = path.points[(idx + 1) % path.points.length]!;
          const dx = (next.x - prev.x) * 0.25;
          const dy = (next.y - prev.y) * 0.25;
          newPt.handleIn = { x: -dx, y: -dy };
          newPt.handleOut = { x: dx, y: dy };
        }

        newPoints[idx] = newPt;
      });
      onUpdate({ ...path, points: newPoints });
    },
    [path, selectedPointIndices, onUpdate]
  );

  const deleteSelectedPoints = useCallback(() => {
    if (selectedPointIndices.length === 0) return;
    const newPoints = path.points.filter((_, i) => !selectedPointIndices.includes(i));
    if (newPoints.length >= 2) {
      onUpdate({ ...path, points: newPoints });
      onSelectPoint([]);
    }
  }, [path, selectedPointIndices, onUpdate, onSelectPoint]);

  const toggleClosed = useCallback(() => {
    onUpdate({ ...path, isClosed: !path.isClosed });
  }, [path, onUpdate]);

  // Reverse path direction
  const reversePath = useCallback(() => {
    const reversed = [...path.points].reverse().map((pt) => ({
      ...pt,
      handleIn: pt.handleOut ? { x: pt.handleOut.x, y: pt.handleOut.y } : undefined,
      handleOut: pt.handleIn ? { x: pt.handleIn.x, y: pt.handleIn.y } : undefined,
    }));
    onUpdate({ ...path, points: reversed });
    onSelectPoint([]);
  }, [path, onUpdate, onSelectPoint]);

  // ==================================
  // BUILD SVG PATH STRING
  // ==================================
  const buildPathD = () => {
    if (path.points.length < 2) return '';
    let d = '';
    const pts = path.points;

    for (let i = 0; i < pts.length; i++) {
      const pt = pts[i]!;
      if (i === 0) {
        d += `M ${pt.x} ${pt.y}`;
      } else {
        const prev = pts[i - 1]!;
        const cp1x = prev.x + (prev.handleOut?.x ?? 0);
        const cp1y = prev.y + (prev.handleOut?.y ?? 0);
        const cp2x = pt.x + (pt.handleIn?.x ?? 0);
        const cp2y = pt.y + (pt.handleIn?.y ?? 0);

        if (prev.handleOut || pt.handleIn) {
          d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x} ${pt.y}`;
        } else {
          d += ` L ${pt.x} ${pt.y}`;
        }
      }
    }

    if (path.isClosed && pts.length > 2) {
      const last = pts[pts.length - 1]!;
      const first = pts[0]!;
      const cp1x = last.x + (last.handleOut?.x ?? 0);
      const cp1y = last.y + (last.handleOut?.y ?? 0);
      const cp2x = first.x + (first.handleIn?.x ?? 0);
      const cp2y = first.y + (first.handleIn?.y ?? 0);

      if (last.handleOut || first.handleIn) {
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${first.x} ${first.y}`;
      }
      d += ' Z';
    }
    return d;
  };

  const pathD = buildPathD();

  // Get the cursor style based on active tool
  const getCursorStyle = (): string => {
    switch (activeTool) {
      case 'pen':
        return 'crosshair';
      case 'add':
        return 'copy';
      case 'remove':
        return 'not-allowed';
      default:
        return 'default';
    }
  };

  return (
    <>
      {/* Full-screen click-away layer */}
      <div
        className="absolute inset-0 z-[90]"
        style={{ cursor: getCursorStyle() }}
        onMouseDown={(e) => {
          if ((e.target as Element).closest('.path-editor-overlay')) return;
          if (activeTool === 'pen') {
            handlePenMouseDown(e);
            return;
          }
          onClose?.();
        }}
        onMouseMove={activeTool === 'pen' ? handlePenPreviewMove : undefined}
      />

      <svg
        ref={svgRef}
        className="absolute inset-0 z-[95] pointer-events-none path-editor-overlay"
        style={{ width: '100%', height: '100%', overflow: 'visible', cursor: getCursorStyle() }}
      >
        <defs>
          <linearGradient id="handleGrad" x1="0%" y1="0%" x2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="penPreviewGrad" x1="0%" y1="0%" x2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
          </linearGradient>
          <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation={2 * s} result="blur" />
            <feFlood floodColor="#a855f7" floodOpacity="0.6" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="penGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation={3 * s} result="blur" />
            <feFlood floodColor="#22d3ee" floodOpacity="0.7" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* The actual path outline */}
        <path
          d={pathD}
          fill="none"
          stroke="#a855f7"
          strokeWidth={strokeW}
          strokeDasharray={`${4 * s} ${3 * s}`}
          opacity={0.6}
          style={{ pointerEvents: 'none' }}
        />

        {/* Pen tool: Preview line from last point to cursor */}
        {activeTool === 'pen' && penPreviewPoint && path.points.length > 0 && !isDrawingCurve && (
          <>
            <line
              x1={path.points[path.points.length - 1]!.x}
              y1={path.points[path.points.length - 1]!.y}
              x2={penPreviewPoint.x}
              y2={penPreviewPoint.y}
              stroke="url(#penPreviewGrad)"
              strokeWidth={strokeW}
              strokeDasharray={`${3 * s} ${3 * s}`}
              opacity={0.6}
              style={{ pointerEvents: 'none' }}
            />
            {/* Preview cursor dot */}
            <circle
              cx={penPreviewPoint.x}
              cy={penPreviewPoint.y}
              r={pointRadius * 0.7}
              fill="#22d3ee"
              opacity={0.5}
              filter="url(#penGlow)"
              style={{ pointerEvents: 'none' }}
            >
              <animate attributeName="r" values={`${pointRadius * 0.5};${pointRadius * 0.9};${pointRadius * 0.5}`} dur="1.5s" repeatCount="indefinite" />
            </circle>
            {/* Close indicator near first point */}
            {path.points.length > 2 && !path.isClosed && (() => {
              const first = path.points[0]!;
              const dist = Math.sqrt(
                (penPreviewPoint.x - first.x) ** 2 + (penPreviewPoint.y - first.y) ** 2
              );
              if (dist < 15 * s) {
                return (
                  <circle
                    cx={first.x}
                    cy={first.y}
                    r={pointRadius * 2.2}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth={strokeW * 2}
                    opacity={0.8}
                    style={{ pointerEvents: 'none' }}
                  >
                    <animate attributeName="r" values={`${pointRadius * 1.8};${pointRadius * 2.5};${pointRadius * 1.8}`} dur="0.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.3;0.8" dur="0.8s" repeatCount="indefinite" />
                  </circle>
                );
              }
              return null;
            })()}
          </>
        )}

        {/* Invisible hit targets for path segments */}
        {path.points.map((pt, i) => {
          if (i === 0) return null;
          const prev = path.points[i - 1]!;
          const cp1x = prev.x + (prev.handleOut?.x ?? 0);
          const cp1y = prev.y + (prev.handleOut?.y ?? 0);
          const cp2x = pt.x + (pt.handleIn?.x ?? 0);
          const cp2y = pt.y + (pt.handleIn?.y ?? 0);

          const segD =
            prev.handleOut || pt.handleIn
              ? `M ${prev.x} ${prev.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x} ${pt.y}`
              : `M ${prev.x} ${prev.y} L ${pt.x} ${pt.y}`;

          return (
            <g key={`seg-${i}`}>
              {/* Hover highlight */}
              {hoveredSegment === i && (
                <path
                  d={segD}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth={3 * s}
                  opacity={0.4}
                  style={{ pointerEvents: 'none' }}
                />
              )}
              {/* Hit area */}
              <path
                d={segD}
                fill="none"
                stroke="transparent"
                strokeWidth={hitAreaSize}
                style={{ pointerEvents: activeTool === 'select' || activeTool === 'add' ? 'stroke' : 'none', cursor: 'copy' }}
                onMouseEnter={() => setHoveredSegment(i)}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={(e) => handlePathClick(e, i - 1)}
              />
              {/* Midpoint indicator on hover */}
              {hoveredSegment === i && (
                <circle
                  cx={(prev.x + pt.x) / 2}
                  cy={(prev.y + pt.y) / 2}
                  r={handleRadius}
                  fill="#a855f7"
                  stroke="white"
                  strokeWidth={s}
                  opacity={0.8}
                  style={{ pointerEvents: 'none' }}
                />
              )}
            </g>
          );
        })}

        {/* Handle stems and handle dots */}
        {path.points.map((pt, i) => {
          const isSelected = selectedPointIndices.includes(i);
          const isHovered = hoveredPointIndex === i;
          if (!isSelected && !isHovered) return null;

          return (
            <g key={`handles-${i}`}>
              {pt.handleIn && (
                <>
                  <line
                    x1={pt.x}
                    y1={pt.y}
                    x2={pt.x + pt.handleIn.x}
                    y2={pt.y + pt.handleIn.y}
                    stroke="url(#handleGrad)"
                    strokeWidth={s}
                    opacity={0.7}
                    style={{ pointerEvents: 'none' }}
                  />
                  <circle
                    cx={pt.x + pt.handleIn.x}
                    cy={pt.y + pt.handleIn.y}
                    r={handleRadius}
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth={s}
                    style={{ pointerEvents: 'all', cursor: 'grab' }}
                    onMouseDown={(e) => handleHandleMouseDown(e, i, 'in')}
                  />
                </>
              )}
              {pt.handleOut && (
                <>
                  <line
                    x1={pt.x}
                    y1={pt.y}
                    x2={pt.x + pt.handleOut.x}
                    y2={pt.y + pt.handleOut.y}
                    stroke="url(#handleGrad)"
                    strokeWidth={s}
                    opacity={0.7}
                    style={{ pointerEvents: 'none' }}
                  />
                  <circle
                    cx={pt.x + pt.handleOut.x}
                    cy={pt.y + pt.handleOut.y}
                    r={handleRadius}
                    fill="#a855f7"
                    stroke="white"
                    strokeWidth={s}
                    style={{ pointerEvents: 'all', cursor: 'grab' }}
                    onMouseDown={(e) => handleHandleMouseDown(e, i, 'out')}
                  />
                </>
              )}
            </g>
          );
        })}

        {/* Anchor points */}
        {path.points.map((pt, i) => {
          const isSelected = selectedPointIndices.includes(i);
          const isHovered = hoveredPointIndex === i;
          const isCorner = pt.type === 'corner' || !pt.type;
          const isFirstInPen = activeTool === 'pen' && i === 0 && path.points.length > 2 && !path.isClosed;

          return (
            <g key={`pt-${i}`}>
              {/* Glow ring for selected */}
              {isSelected && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={pointRadius * 1.8}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth={s * 0.5}
                  opacity={0.4}
                  style={{ pointerEvents: 'none' }}
                >
                  <animate attributeName="r" values={`${pointRadius * 1.6};${pointRadius * 2.0};${pointRadius * 1.6}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Close-path ring for pen tool */}
              {isFirstInPen && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={pointRadius * 2}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth={strokeW}
                  strokeDasharray={`${2 * s} ${2 * s}`}
                  opacity={0.5}
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* Main point shape */}
              {isCorner ? (
                <rect
                  x={pt.x - pointRadius * 0.8}
                  y={pt.y - pointRadius * 0.8}
                  width={pointRadius * 1.6}
                  height={pointRadius * 1.6}
                  rx={s}
                  fill={isSelected ? '#a855f7' : isHovered ? '#c084fc' : '#1e1e2e'}
                  stroke={isSelected ? 'white' : activeTool === 'remove' ? '#ef4444' : '#a855f7'}
                  strokeWidth={strokeW}
                  filter={isSelected ? 'url(#pointGlow)' : undefined}
                  style={{
                    pointerEvents: 'all',
                    cursor: activeTool === 'remove' ? 'not-allowed' : activeTool === 'pen' && i === 0 ? 'pointer' : 'pointer',
                  }}
                  onMouseDown={(e) => handlePointMouseDown(e, i)}
                  onDoubleClick={(e) => handlePointDoubleClick(e, i)}
                  onMouseEnter={() => setHoveredPointIndex(i)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                />
              ) : (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={pointRadius}
                  fill={isSelected ? '#a855f7' : isHovered ? '#c084fc' : '#1e1e2e'}
                  stroke={isSelected ? 'white' : activeTool === 'remove' ? '#ef4444' : '#a855f7'}
                  strokeWidth={strokeW}
                  filter={isSelected ? 'url(#pointGlow)' : undefined}
                  style={{
                    pointerEvents: 'all',
                    cursor: activeTool === 'remove' ? 'not-allowed' : 'pointer',
                  }}
                  onMouseDown={(e) => handlePointMouseDown(e, i)}
                  onDoubleClick={(e) => handlePointDoubleClick(e, i)}
                  onMouseEnter={() => setHoveredPointIndex(i)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                />
              )}

              {/* Point index label for selected */}
              {isSelected && (
                <text
                  x={pt.x}
                  y={pt.y - pointRadius * 2.5}
                  textAnchor="middle"
                  fontSize={9 * s}
                  fill="#c084fc"
                  fontFamily="Inter, sans-serif"
                  fontWeight={600}
                  style={{ pointerEvents: 'none' }}
                >
                  {i}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Mini Toolbar */}
      {showToolbar && (
        <div
          className="absolute z-[100] path-editor-overlay"
          style={{
            left: `calc(50% - 200px)`,
            bottom: '24px',
            pointerEvents: 'auto',
          }}
        >
          <div
            className="flex items-center gap-1 px-3 py-2 rounded-xl"
            style={{
              background: 'rgba(14, 19, 24, 0.92)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(168,85,247,0.1) inset',
            }}
          >
            {/* Tool Mode Buttons */}
            <ToolbarBtn
              icon="◆"
              label="Select (V)"
              active={activeTool === 'select'}
              onClick={() => {
                setActiveTool('select');
                setPenPreviewPoint(null);
              }}
            />
            <ToolbarBtn
              icon="✏"
              label="Pen Tool (P)"
              active={activeTool === 'pen'}
              onClick={() => {
                setActiveTool(activeTool === 'pen' ? 'select' : 'pen');
                setPenPreviewPoint(null);
              }}
              accent={activeTool === 'pen'}
            />
            <ToolbarBtn
              icon="⊖"
              label="Remove Point"
              active={activeTool === 'remove'}
              onClick={() => setActiveTool(activeTool === 'remove' ? 'select' : 'remove')}
              danger={activeTool === 'remove'}
            />

            <div className="w-px h-5 bg-gray-700 mx-1" />

            {/* Point Type Buttons */}
            <ToolbarBtn
              icon="◇"
              label="Corner"
              active={selectedPointIndices.length > 0 && selectedPointIndices.every(
                (i) => path.points[i]?.type === 'corner' || !path.points[i]?.type
              )}
              onClick={() => setPointType('corner')}
            />
            <ToolbarBtn
              icon="◉"
              label="Smooth"
              active={selectedPointIndices.length > 0 && selectedPointIndices.every((i) => path.points[i]?.type === 'smooth')}
              onClick={() => setPointType('smooth')}
            />
            <ToolbarBtn
              icon="◎"
              label="Symmetric"
              active={selectedPointIndices.length > 0 && selectedPointIndices.every((i) => path.points[i]?.type === 'symmetric')}
              onClick={() => setPointType('symmetric')}
            />

            <div className="w-px h-5 bg-gray-700 mx-1" />

            {/* Path Actions */}
            <ToolbarBtn
              icon={path.isClosed ? '⬡' : '⬠'}
              label={path.isClosed ? 'Open Path' : 'Close Path'}
              active={path.isClosed}
              onClick={toggleClosed}
            />
            <ToolbarBtn
              icon="⇄"
              label="Reverse"
              onClick={reversePath}
            />

            <div className="w-px h-5 bg-gray-700 mx-1" />

            {/* Delete */}
            <ToolbarBtn
              icon="✕"
              label="Delete Points"
              onClick={deleteSelectedPoints}
              disabled={selectedPointIndices.length === 0}
              danger
            />

            {/* Done */}
            <ToolbarBtn icon="✓" label="Done" onClick={() => onClose?.()} accent />

            {/* Info badge */}
            <div
              className="ml-1 px-2 py-0.5 rounded-md text-[8px] font-bold"
              style={{
                background: activeTool === 'pen' ? 'rgba(34,211,238,0.15)' : 'rgba(168,85,247,0.1)',
                color: activeTool === 'pen' ? '#22d3ee' : '#9ca3af',
              }}
            >
              {path.points.length} pts
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ==================================
// Mini Toolbar Button
// ==================================
interface ToolbarBtnProps {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
  accent?: boolean;
}

const ToolbarBtn: React.FC<ToolbarBtnProps> = ({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
  danger = false,
  accent = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className="relative group"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '14px',
      fontWeight: 600,
      transition: 'all 0.15s ease',
      background: accent
        ? 'linear-gradient(135deg, #a855f7, #6366f1)'
        : active
          ? 'rgba(168, 85, 247, 0.25)'
          : danger && active
            ? 'rgba(239, 68, 68, 0.2)'
            : 'transparent',
      color: disabled
        ? '#555'
        : danger
          ? '#ef4444'
          : accent
            ? 'white'
            : active
              ? '#c084fc'
              : '#9ca3af',
      opacity: disabled ? 0.4 : 1,
    }}
    onMouseEnter={(e) => {
      if (!disabled) {
        (e.target as HTMLElement).style.background = accent
          ? 'linear-gradient(135deg, #b973f8, #818cf8)'
          : danger
            ? 'rgba(239, 68, 68, 0.15)'
            : 'rgba(168, 85, 247, 0.15)';
      }
    }}
    onMouseLeave={(e) => {
      (e.target as HTMLElement).style.background = accent
        ? 'linear-gradient(135deg, #a855f7, #6366f1)'
        : active
          ? 'rgba(168, 85, 247, 0.25)'
          : 'transparent';
    }}
  >
    {icon}
    {/* Tooltip */}
    <span
      className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
      style={{ background: '#1a1a2e', border: '1px solid #333', fontSize: '10px' }}
    >
      {label}
    </span>
  </button>
);

export default PathEditorOverlay;
