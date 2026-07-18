import { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '../../store/useStore';

export const useCanvasPanning = () => {
  const panOffset = useStore((state) => (state as any).panOffset) || { x: 0, y: 0 };
  const setPanOffset = useStore((state) => (state as any).setPanOffset);

  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const panOffsetRef = useRef(panOffset);
  const panStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  const startPanning = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const updatePanning = useCallback((e: MouseEvent) => {
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    const newOffset = {
      x: panOffsetRef.current.x + dx,
      y: panOffsetRef.current.y + dy,
    };

    panOffsetRef.current = newOffset;
    panStartRef.current = { x: e.clientX, y: e.clientY };

    // Directly mutate DOM to bypass React render loop (60fps performance)
    requestAnimationFrame(() => {
      const viewport = document.querySelector('.canvas-container') as HTMLElement;
      if (viewport) {
        viewport.style.setProperty('--pan-x', `${newOffset.x}px`);
        viewport.style.setProperty('--pan-y', `${newOffset.y}px`);
      }
    });
  }, []);

  const stopPanning = useCallback(() => {
    setIsPanning(false);
    // Commit the final state to Zustand to sync React components
    setPanOffset(panOffsetRef.current);

    // Clean up CSS variables so React state takes over seamlessly
    const viewport = document.querySelector('.canvas-container') as HTMLElement;
    if (viewport) {
      viewport.style.removeProperty('--pan-x');
      viewport.style.removeProperty('--pan-y');
    }
  }, [setPanOffset]);

  return {
    panOffset,
    setPanOffset,
    isPanning,
    setIsPanning,
    isSpacePressed,
    setIsSpacePressed,
    startPanning,
    updatePanning,
    stopPanning,
    panOffsetRef,
  };
};
