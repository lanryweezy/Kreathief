import { useState, useCallback, useRef, useEffect } from 'react';
import { Layer, Artboard } from '../../types';

interface UseCanvasSelectionProps {
  artboards: Artboard[];
  onSelectLayer: (id: string | null) => void;
  setSelectedLayerIds: (ids: string[]) => void;
  zoom: number;
  panOffset: { x: number; y: number };
  viewportRef: React.RefObject<HTMLDivElement>;
}


export const useCanvasSelection = ({
  artboards,
  onSelectLayer,
  setSelectedLayerIds,
  zoom,
  panOffset,
  viewportRef,
}: UseCanvasSelectionProps) => {

  const [selectionBox, setSelectionBox] = useState<{ start: { x: number; y: number }; end: { x: number; y: number }; isShift: boolean } | null>(null);
  const selectionBoxRef = useRef(selectionBox);
  
  const zoomRef = useRef(zoom);
  const panOffsetRef = useRef(panOffset);
  const artboardsRef = useRef(artboards);

  useEffect(() => {
    selectionBoxRef.current = selectionBox;
    zoomRef.current = zoom;
    panOffsetRef.current = panOffset;
    artboardsRef.current = artboards;
  }, [selectionBox, zoom, panOffset, artboards]);


  const startSelection = useCallback((e: React.MouseEvent) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left - panOffsetRef.current.x) / zoomRef.current;
      const y = (e.clientY - rect.top - panOffsetRef.current.y) / zoomRef.current;
      setSelectionBox({ 
        start: { x, y }, 
        end: { x, y },
        isShift: e.shiftKey
      });
    }
  }, [viewportRef]);

  const updateSelection = useCallback((e: MouseEvent) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left - panOffsetRef.current.x) / zoomRef.current;
      const y = (e.clientY - rect.top - panOffsetRef.current.y) / zoomRef.current;
      setSelectionBox((prev) => prev ? { ...prev, end: { x, y } } : null);
    }
  }, [viewportRef]);

  const finalizeSelection = useCallback((selectedLayerIds: string[]) => {
    const currentSelectionBox = selectionBoxRef.current;
    if (currentSelectionBox) {
      const x1 = Math.min(currentSelectionBox.start.x, currentSelectionBox.end.x);
      const y1 = Math.min(currentSelectionBox.start.y, currentSelectionBox.end.y);
      const x2 = Math.max(currentSelectionBox.start.x, currentSelectionBox.end.x);
      const y2 = Math.max(currentSelectionBox.start.y, currentSelectionBox.end.y);

      const isDrag = Math.abs(currentSelectionBox.start.x - currentSelectionBox.end.x) > 2 ||
                     Math.abs(currentSelectionBox.start.y - currentSelectionBox.end.y) > 2;

      if (!isDrag) {
        onSelectLayer(null);
        setSelectionBox(null);
        return;
      }

      const layersInBox: string[] = [];
      
      artboardsRef.current.forEach((artboard) => {
        artboard.layers.forEach((l) => {
          if (l.locked || l.visible === false) {return;}
          
          const lw = (l as any).width || 0;
          const lh = (l as any).height || 0;
          const gx = l.x + artboard.x;
          const gy = l.y + artboard.y;

          if (
            gx < x2 &&
            gx + lw > x1 &&
            gy < y2 &&
            gy + lh > y1
          ) {
            layersInBox.push(l.id);
          }
        });
      });

      if (layersInBox.length > 0) {
        if (currentSelectionBox.isShift) {
          // Add to current selection
          setSelectedLayerIds(Array.from(new Set([...selectedLayerIds, ...layersInBox])));
        } else {
          // Replace selection
          setSelectedLayerIds(layersInBox);
        }

      } else if (!currentSelectionBox.isShift) {
        onSelectLayer(null);
      }
      
      setSelectionBox(null);
    }
  }, [onSelectLayer, setSelectedLayerIds]);

  return {
    selectionBox,
    setSelectionBox,
    startSelection,
    updateSelection,
    finalizeSelection,
    selectionBoxRef
  };
};

