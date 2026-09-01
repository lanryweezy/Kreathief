import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { StaticLayerRenderer } from '../StaticLayerRenderer';
import { computeSmartAnimatePairs } from '../../utils/motion/smartAnimate';
import { Icons } from '../../constants';

export const PresentationModal: React.FC = () => {
  const show = useStore((s) => s.showPresentation);
  const setShow = useStore((s) => s.setShowPresentation);
  const artboards = useStore((s) => s.artboards);
  const activeId = useStore((s) => s.activeArtboardId);
  const setActiveArtboardId = useStore((s) => s.setActiveArtboardId);

  const [smartAnimateEnabled, setSmartAnimateEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const playTimerRef = useRef<any>(null);

  const startIndex = useMemo(
    () =>
      Math.max(
        0,
        (artboards || []).findIndex((a: any) => a.id === activeId)
      ),
    [artboards, activeId]
  );
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  const ab = artboards[index] || artboards[0];
  const prevAb = index > 0 ? artboards[index - 1] : null;

  const scale = useMemo(() => {
    if (!ab) {
      return 1;
    }
    const vw = Math.min(window.innerWidth, 1280) - 160;
    const vh = Math.min(window.innerHeight, 800) - 200;
    const sx = vw / Math.max(1, ab.width || 1080);
    const sy = vh / Math.max(1, ab.height || 1080);
    return Math.min(sx, sy);
  }, [ab]);

  const onClose = useCallback(() => {
    setIsPlaying(false);
    setShow(false);
  }, [setShow]);

  const goToNext = useCallback(() => {
    setIndex((i) => {
      const next = i >= artboards.length - 1 ? 0 : i + 1;
      setActiveArtboardId(artboards[next]?.id);
      return next;
    });
  }, [artboards, setActiveArtboardId]);

  const goToPrev = useCallback(() => {
    setIndex((i) => {
      const prev = Math.max(0, i - 1);
      setActiveArtboardId(artboards[prev]?.id);
      return prev;
    });
  }, [artboards, setActiveArtboardId]);

  // Auto-play loop
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(goToNext, 3500);
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
      }
    };
  }, [isPlaying, goToNext]);

  // Trigger transition effect on slide change
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 500);
    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    if (!show) {
      return;
    }
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'ArrowRight' || e.key === ' ') {
        goToNext();
      }
      if (e.key === 'ArrowLeft') {
        goToPrev();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [show, onClose, goToNext, goToPrev]);

  if (!show || !ab) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-black/95 text-white flex flex-col select-none" onClick={onClose}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-surface-dark-2/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono bg-white/10 px-2.5 py-1 rounded-full text-gray-300">
            {index + 1} / {artboards.length}
          </span>
          <span className="text-sm font-bold text-white">{ab.name || `Artboard ${index + 1}`}</span>
          <span className="text-xs text-gray-400 font-mono">
            {ab.width} × {ab.height}
          </span>
        </div>

        {/* Presentation Controls */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSmartAnimateEnabled(!smartAnimateEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
              smartAnimateEnabled
                ? 'bg-brand-600/20 text-brand-400 border-brand-500/50'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
            }`}
          >
            <Icons.Zap className="w-3.5 h-3.5" />
            Smart Animate {smartAnimateEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-brand-600 hover:bg-brand-500 text-white'
            }`}
          >
            {isPlaying ? <Icons.Pause className="w-3.5 h-3.5" /> : <Icons.Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pause' : 'Autoplay'}
          </button>

          <button
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-2"
            aria-label="Close"
            onClick={onClose}
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Canvas Slide Viewport */}
      <div
        className="flex-1 flex items-center justify-center p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#0f1216] rounded-2xl p-6 border border-white/10 shadow-2xl relative">
          <div
            style={{ width: (ab.width || 1080) * scale, height: (ab.height || 1080) * scale }}
            className={`overflow-hidden transition-opacity duration-300 ${
              isTransitioning && smartAnimateEnabled ? 'animate-fadeIn' : ''
            }`}
          >
            <StaticLayerRenderer layers={ab.layers} scale={scale} width={ab.width || 1080} height={ab.height || 1080} />
          </div>
        </div>
      </div>

      {/* Bottom Nav arrows & slide preview dots */}
      <div
        className="flex items-center justify-between px-8 py-4 border-t border-white/10 bg-surface-dark-2/60"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all font-bold text-xs flex items-center gap-2"
          aria-label="Previous slide"
          onClick={goToPrev}
        >
          <Icons.ArrowLeft className="w-4 h-4" /> Previous
        </button>

        <div className="flex items-center gap-1.5">
          {artboards.map((art, idx) => (
            <button
              key={art.id || idx}
              onClick={() => {
                setIndex(idx);
                setActiveArtboardId(art.id);
              }}
              className={`h-2 rounded-full transition-all ${
                index === idx ? 'w-6 bg-brand-500' : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
              title={art.name || `Slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          className="px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all font-bold text-xs flex items-center gap-2"
          aria-label="Next slide"
          onClick={goToNext}
        >
          Next <Icons.ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
