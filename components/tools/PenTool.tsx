import React, { useState, useCallback, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { VectorPoint, VectorPath, PointType } from '../../types';
import { VectorUtils } from '../../utils/vectorUtils';
import { v4 as uuidv4 } from 'uuid';

interface PenToolProps {
  zoom: number;
  panOffset: { x: number; y: number };
  onPathComplete?: (path: VectorPath) => void;
}

export const PenTool: React.FC<PenToolProps> = ({ zoom, panOffset, onPathComplete }) => {
  const { isPenMode, setPenMode, selectedLayerIds, updateLayer, addShapeLayer, saveToHistory } = useStore();

  const [currentPath, setCurrentPath] = useState<VectorPath>({ points: [], isClosed: false });
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  const [draggingHandle, setDraggingHandle] = useState<{
    pointId: string;
    handle: 'in' | 'out';
  } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasSize = useStore((state) => state.canvasSize) || { width: 1080, height: 1080 };

  // Get the currently selected vector layer for editing
  const editingLayer = useStore((state) => {
    if (!selectedLayerIds || selectedLayerIds.length !== 1) return null;
    const artboard = state.artboards?.find((a: any) => a.id === state.activeArtboardId);
    const layer = artboard?.layers.find((l: any) => l.id === selectedLayerIds[0]);
    return layer && (layer.type === 'path' || (layer as any).vectorPath) ? layer : null;
  });

  // Load existing path if editing
  useEffect(() => {
    if (editingLayer && (editingLayer as any).vectorPath) {
      setCurrentPath((editingLayer as any).vectorPath);
    }
  }, [editingLayer]);

  const transformScreenToCanvas = useCallback(
    (x: number, y: number) => {
      return {
        x: (x - panOffset.x) / zoom,
        y: (y - panOffset.y) / zoom,
      };
    },
    [zoom, panOffset]
  );

  const transformCanvasToScreen = useCallback(
    (x: number, y: number) => {
      return {
        x: x * zoom + panOffset.x,
        y: y * zoom + panOffset.y,
      };
    },
    [zoom, panOffset]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isPenMode) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasCoord = transformScreenToCanvas(screenX, screenY);

      // Check if clicking near first point to close path
      if (currentPath.points.length > 2) {
        const firstPoint = currentPath.points[0];
        if (firstPoint) {
          const dist = Math.sqrt(Math.pow(canvasCoord.x - firstPoint.x, 2) + Math.pow(canvasCoord.y - firstPoint.y, 2));
          if (dist < 10 / zoom) {
            // Close the path
            const closedPath = { ...currentPath, isClosed: true };
            completePath(closedPath);
            return;
          }
        }
      }

      // Add new point
      const newPoint: VectorPoint = {
        id: uuidv4(),
        x: canvasCoord.x,
        y: canvasCoord.y,
        type: 'smooth',
      };

      setCurrentPath((prev) => ({
        ...prev,
        points: [...prev.points, newPoint],
      }));
      setIsDrawing(true);
    },
    [isPenMode, currentPath, zoom, transformScreenToCanvas]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPenMode || !isDrawing || currentPath.points.length === 0) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasCoord = transformScreenToCanvas(screenX, screenY);

      // Update handle for the last point
      const lastIndex = currentPath.points.length - 1;
      const lastPoint = currentPath.points[lastIndex];
      if (lastPoint) {
        const handleX = canvasCoord.x - lastPoint.x;
        const handleY = canvasCoord.y - lastPoint.y;

        const updatedPoints = [...currentPath.points];
        updatedPoints[lastIndex] = {
          ...lastPoint,
          handleOut: { x: handleX, y: handleY },
          handleIn: { x: -handleX, y: -handleY }, // Symmetric by default
        };

        setCurrentPath((prev) => ({
          ...prev,
          points: updatedPoints,
        }));
      }
    },
    [isPenMode, isDrawing, currentPath, transformScreenToCanvas]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const completePath = useCallback(
    (path: VectorPath) => {
      if (path.points.length < 2) return;

      saveToHistory();

      if (editingLayer) {
        // Update existing layer
        updateLayer(editingLayer.id, {
          vectorPath: path,
          pathData: VectorUtils.serializePath(path),
        });
      } else {
        // Create new path layer
        const pathData = VectorUtils.serializePath(path);
        addShapeLayer('path', {
          pathData,
          vectorPath: path,
          color: '#7d2ae8',
          stroke: {
            color: '#7d2ae8',
            width: 2,
          },
        });
      }

      // Reset
      setCurrentPath({ points: [], isClosed: false });
      setPenMode(false);

      if (onPathComplete) {
        onPathComplete(path);
      }
    },
    [editingLayer, updateLayer, addShapeLayer, saveToHistory, setPenMode, onPathComplete]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isPenMode) return;

      if (e.key === 'Escape') {
        // Cancel current path
        setCurrentPath({ points: [], isClosed: false });
        setPenMode(false);
      } else if (e.key === 'Enter') {
        // Complete path
        if (currentPath.points.length >= 2) {
          completePath(currentPath);
        }
      }
    },
    [isPenMode, currentPath, completePath, setPenMode]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handlePointTypeChange = useCallback(
    (pointId: string, newType: PointType) => {
      const updatedPoints = currentPath.points.map((pt) => {
        if (pt.id === pointId) {
          const newPoint = { ...pt, type: newType };
          if (newType === 'sharp') {
            // Remove handles for sharp points
            delete newPoint.handleIn;
            delete newPoint.handleOut;
          }
          return newPoint;
        }
        return pt;
      });

      setCurrentPath((prev) => ({
        ...prev,
        points: updatedPoints,
      }));

      if (editingLayer) {
        const newPath = { ...currentPath, points: updatedPoints };
        updateLayer(editingLayer.id, {
          vectorPath: newPath,
          pathData: VectorUtils.serializePath(newPath),
        });
      }
    },
    [currentPath, editingLayer, updateLayer]
  );

  const handleDeletePoint = useCallback(
    (pointId: string) => {
      const updatedPoints = currentPath.points.filter((pt) => pt.id !== pointId);

      if (updatedPoints.length < 2) {
        setCurrentPath({ points: [], isClosed: false });
        return;
      }

      const newPath = { ...currentPath, points: updatedPoints };
      setCurrentPath(newPath);

      if (editingLayer) {
        updateLayer(editingLayer.id, {
          vectorPath: newPath,
          pathData: VectorUtils.serializePath(newPath),
        });
      }
    },
    [currentPath, editingLayer, updateLayer]
  );

  if (!isPenMode) return null;

  return (
    <div
      className="absolute inset-0 z-30"
      style={{ cursor: 'crosshair' }}
      onClick={handleCanvasClick}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
    >
      <svg
        className="absolute inset-0 pointer-events-none"
        width={canvasSize.width}
        height={canvasSize.height}
        viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
      >
        {/* Render current path */}
        {currentPath.points.length > 0 && (
          <>
            {/* Path */}
            <path
              d={VectorUtils.serializePath(currentPath)}
              fill="none"
              stroke="#7d2ae8"
              strokeWidth={2 / zoom}
              strokeDasharray="5,5"
            />

            {/* Points */}
            {currentPath.points.map((point, index) => (
              <g key={point.id}>
                {/* Handles */}
                {point.handleOut && (
                  <>
                    <line
                      x1={point.x}
                      y1={point.y}
                      x2={point.x + point.handleOut.x}
                      y2={point.y + point.handleOut.y}
                      stroke="#7d2ae8"
                      strokeWidth={1 / zoom}
                    />
                    <circle
                      cx={point.x + point.handleOut.x}
                      cy={point.y + point.handleOut.y}
                      r={4 / zoom}
                      fill="#ffffff"
                      stroke="#7d2ae8"
                      strokeWidth={1 / zoom}
                      className="pointer-events-auto cursor-move"
                    />
                  </>
                )}
                {point.handleIn && (
                  <>
                    <line
                      x1={point.x}
                      y1={point.y}
                      x2={point.x + point.handleIn.x}
                      y2={point.y + point.handleIn.y}
                      stroke="#7d2ae8"
                      strokeWidth={1 / zoom}
                    />
                    <circle
                      cx={point.x + point.handleIn.x}
                      cy={point.y + point.handleIn.y}
                      r={4 / zoom}
                      fill="#ffffff"
                      stroke="#7d2ae8"
                      strokeWidth={1 / zoom}
                      className="pointer-events-auto cursor-move"
                    />
                  </>
                )}

                {/* Anchor Point */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={6 / zoom}
                  fill={index === 0 ? '#7d2ae8' : '#ffffff'}
                  stroke="#7d2ae8"
                  strokeWidth={2 / zoom}
                  className="pointer-events-auto cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(point.id)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* Point label on hover */}
                {hoveredPoint === point.id && (
                  <text
                    x={point.x + 10 / zoom}
                    y={point.y - 10 / zoom}
                    fontSize={12 / zoom}
                    fill="#ffffff"
                    stroke="#000000"
                    strokeWidth={0.5 / zoom}
                  >
                    {point.type}
                  </text>
                )}
              </g>
            ))}

            {/* Close path hint */}
            {currentPath.points.length > 2 && (
              <circle
                cx={currentPath.points[0]?.x}
                cy={currentPath.points[0]?.y}
                r={12 / zoom}
                fill="none"
                stroke="#7d2ae8"
                strokeWidth={2 / zoom}
                strokeDasharray="3,3"
                className="animate-pulse"
              />
            )}
          </>
        )}
      </svg>

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700 shadow-xl pointer-events-none">
        <div className="text-xs text-white space-y-1">
          <div>
            <strong>Click</strong> to add points • <strong>Click & Drag</strong> to create curves
          </div>
          <div>
            <strong>Click first point</strong> to close path • <strong>Enter</strong> to complete • <strong>Esc</strong>{' '}
            to cancel
          </div>
        </div>
      </div>

      {/* Point editing controls */}
      {hoveredPoint && (
        <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm p-3 rounded-lg border border-gray-700 shadow-xl pointer-events-auto">
          <div className="text-xs text-gray-300 mb-2">Point Type</div>
          <div className="flex gap-2">
            {(['sharp', 'smooth', 'symmetric'] as const).map((type) => (
              <button
                key={type}
                onClick={() => handlePointTypeChange(hoveredPoint, type)}
                className="px-2 py-1 bg-gray-800 hover:bg-purple-600 text-white text-xs rounded capitalize transition-colors"
              >
                {type}
              </button>
            ))}
          </div>
          <button
            onClick={() => handleDeletePoint(hoveredPoint)}
            className="w-full mt-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
          >
            Delete Point
          </button>
        </div>
      )}
    </div>
  );
};
