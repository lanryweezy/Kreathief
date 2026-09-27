import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { VectorPath, ShapeLayer } from '../../types';
import { VectorUtils } from '../../utils/vectorUtils';
import { generateLayerId } from '../../utils/layers/layerUtils';
import { PathEditorOverlay } from '../VectorEditor/PathEditorOverlay';

interface VectorDrawingOverlayProps {
  isDrawing: boolean;
  brushType: string;
  brushColor: string;
  zoom: number;
  panOffset: { x: number; y: number };
  onClosePenMode?: () => void;
}

export const VectorDrawingOverlay: React.FC<VectorDrawingOverlayProps> = ({
  isDrawing,
  brushType,
  brushColor,
  zoom,
  panOffset,
  onClosePenMode
}) => {
  const [activeVectorPath, setActiveVectorPath] = useState<VectorPath | null>(null);
  const [selectedVectorPointIndices, setSelectedVectorPointIndices] = useState<number[]>([]);

  useEffect(() => {
    if (isDrawing && brushType === 'vector_pencil') {
      if (!activeVectorPath) {
        setActiveVectorPath({
          points: [],
          isClosed: false,
        });
      }
    } else if (!isDrawing) {
      if (activeVectorPath && activeVectorPath.points.length > 1) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        activeVectorPath.points.forEach((p) => {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        });

        if (minX !== Infinity) {
          const width = Math.max(1, maxX - minX);
          const height = Math.max(1, maxY - minY);
          const shiftedPoints = activeVectorPath.points.map((p) => ({
            ...p,
            x: p.x - minX,
            y: p.y - minY,
          }));

          const committedPath = { points: shiftedPoints, isClosed: activeVectorPath.isClosed };
          const newLayer: ShapeLayer = {
            id: generateLayerId('path'),
            type: 'path',
            name: 'Vector Path',
            x: minX,
            y: minY,
            width,
            height,
            rotation: 0,
            opacity: 1,
            locked: false,
            visible: true,
            color: brushColor,
            cornerRadius: 0,
            viewBox: `0 0 ${width} ${height}`,
            vectorPath: committedPath,
            pathData: VectorUtils.serializePath(committedPath),
            filters: {
              brightness: 100,
              contrast: 100,
              saturation: 100,
              grayscale: 0,
              sepia: 0,
              blur: 0,
              hueRotate: 0,
              vignette: 0,
              opacity: 1,
            },
            blendMode: 'normal',
            skewX: 0,
            skewY: 0,
            perspective: 0,
            rotateX: 0,
            rotateY: 0,
          };
          useStore.getState().addLayer(newLayer);
        }
      }
      setActiveVectorPath(null);
    }
  }, [isDrawing, brushType, activeVectorPath, brushColor]);

  const handleUpdateVectorPath = (pathData: any) => {
    setActiveVectorPath(pathData);
  };

  const handleClose = () => {
    useStore.getState().setPenMode(false);
    if (onClosePenMode) onClosePenMode();
  };

  if (!(isDrawing && brushType === 'vector_pencil' && activeVectorPath)) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-modal pointer-events-none"
      style={{
        transform: `translate(var(--pan-x, ${panOffset.x}px), var(--pan-y, ${panOffset.y}px)) scale(var(--zoom, ${zoom}))`,
        transformOrigin: '0 0',
      }}
    >
      <PathEditorOverlay
        path={activeVectorPath}
        zoom={zoom}
        onUpdate={handleUpdateVectorPath}
        onSelectPoint={setSelectedVectorPointIndices}
        selectedPointIndices={selectedVectorPointIndices}
        onClose={handleClose}
      />
    </div>
  );
};
