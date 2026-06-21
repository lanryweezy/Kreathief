import React, { createContext, useContext } from 'react';
import { ResizeHandle } from '../../types';

export interface CanvasContextValue {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  getEffectiveLayer: (layer: any) => any;
  onLayerRef: (id: string, el: HTMLDivElement | null) => void;
  handleMouseDownLayer: (e: React.MouseEvent, layer: any) => void;
  handleResizeStart: (e: React.MouseEvent, layer: any, handle: ResizeHandle) => void;
  handleRotateStart: (e: React.MouseEvent, layer: any) => void;
  handleContextMenu: (e: React.MouseEvent, layerId: string) => void;
  handleTextDoubleClick: (e: React.MouseEvent, layer: any) => void;
  handleDropShape: (e: React.DragEvent, layerId: string) => void;
  onDoubleClickLayer?: (layer: any) => void;
  editingTextId: string | null;
  textEditRef: React.RefObject<HTMLDivElement>;
  finishEditingText: () => void;
  editingPathId: string | null;
  onUpdatePath?: (id: string, updates: any) => void;
  previewAnimation?: any;
  isInteracting: boolean;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

export const CanvasProvider = CanvasContext.Provider;

export function useCanvasContext() {
  const ctx = useContext(CanvasContext);
  if (!ctx) {
    throw new Error('useCanvasContext must be used within a CanvasProvider');
  }
  return ctx;
}

// Optional version that returns null if not in provider (for components that may or may not be in canvas)
export function useOptionalCanvasContext() {
  return useContext(CanvasContext);
}
