import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { StaticLayerRenderer } from '../StaticLayerRenderer';

export const PresentationModal: React.FC = () => {
  const show = useStore((s) => s.showPresentation);
  const setShow = useStore((s) => s.setShowPresentation);
  const artboards = useStore((s) => s.artboards);
  const activeId = useStore((s) => s.activeArtboardId);
  const setActiveArtboardId = useStore((s) => s.setActiveArtboardId);

  const startIndex = useMemo(() => Math.max(0, (artboards || []).findIndex((a: any) => a.id === activeId)), [artboards, activeId]);
  const [index, setIndex] = useState(startIndex);

  useEffect(() => { setIndex(startIndex); }, [startIndex]);

  const ab = artboards[index] || artboards[0];
  const scale = useMemo(() => {
    if (!ab) return 1;
    const vw = Math.min(window.innerWidth, 1280) - 160;
    const vh = Math.min(window.innerHeight, 800) - 200;
    const sx = vw / Math.max(1, ab.width || 1080);
    const sy = vh / Math.max(1, ab.height || 1080);
    return Math.min(sx, sy);
  }, [ab]);

  const onClose = useCallback(() => setShow(false), [setShow]);

  useEffect(() => {
    if (!show) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min((artboards.length - 1), i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [show, onClose, artboards.length]);

  if (!show || !ab) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/95 text-white flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="text-sm">{index + 1} / {artboards.length}</div>
        <div className="font-bold">{ab.name} — {ab.width} × {ab.height}</div>
        <button className="text-gray-400 hover:text-white" aria-label="Close" onClick={onClose}>×</button>
      </div>
      <div className="flex-1 flex items-center justify-center p-6" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#0f1216] rounded-xl p-6 border border-white/10">
          <div style={{ width: (ab.width || 1080) * scale, height: (ab.height || 1080) * scale }} className="overflow-hidden">
            <StaticLayerRenderer layers={ab.layers} scale={scale} />
          </div>
        </div>
      </div>
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <button className="px-3 py-2 bg-white/10 rounded hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setIndex((i) => Math.max(0, i - 1)); setActiveArtboardId(artboards[Math.max(0, index - 1)]?.id); }}>←</button>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <button className="px-3 py-2 bg-white/10 rounded hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setIndex((i) => Math.min(artboards.length - 1, i + 1)); setActiveArtboardId(artboards[Math.min(artboards.length - 1, index + 1)]?.id); }}>→</button>
      </div>
    </div>
  );
};

