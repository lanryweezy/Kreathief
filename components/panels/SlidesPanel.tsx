import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { Artboard } from '../../types';
import { PanelErrorBoundary } from './PanelErrorBoundary';
import { PanelHeader } from './PanelHeader';

// ─── Types ───────────────────────────────────────────────────────────────────

type SlideView = 'grid' | 'list';

type SlideTransition = 'none' | 'fade' | 'slide' | 'zoom' | 'flip' | 'magic_move';

const TRANSITIONS: { key: SlideTransition; label: string; icon: string }[] = [
  { key: 'none', label: 'Cut', icon: '/' },
  { key: 'fade', label: 'Fade', icon: '~' },
  { key: 'slide', label: 'Slide', icon: '>' },
  { key: 'zoom', label: 'Zoom', icon: '+' },
  { key: 'flip', label: 'Flip', icon: '|' },
  { key: 'magic_move', label: 'Magic', icon: '✨' },
];

const SLIDE_LAYOUTS = [
  { id: 'title', label: 'Title Slide', desc: 'Large heading + subtitle centered' },
  { id: 'two-col', label: 'Two Column', desc: 'Left text, right image' },
  { id: 'quote', label: 'Big Quote', desc: 'Full-bleed quote block' },
  { id: 'image-full', label: 'Full Image', desc: 'Edge-to-edge image slide' },
  { id: 'blank', label: 'Blank', desc: 'Start with a clean artboard' },
];

// ─── Thumbnail renderer — canvas-based snapshot ───────────────────────────────

const SlideThumbnail: React.FC<{ artboard: Artboard; isActive: boolean }> = ({ artboard, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const W = canvas.width;
    const H = canvas.height;
    const scaleX = W / artboard.width;
    const scaleY = H / artboard.height;

    // Background
    ctx.fillStyle = artboard.backgroundColor || '#1e293b';
    ctx.fillRect(0, 0, W, H);

    // Render each layer as a simplified shape
    artboard.layers.forEach((layer: any) => {
      if (layer.visible === false) {
        return;
      }
      ctx.globalAlpha = layer.opacity ?? 1;

      const lx = (layer.x || 0) * scaleX;
      const ly = (layer.y || 0) * scaleY;
      const lw = (layer.width || 0) * scaleX;
      const lh = (layer.height || 0) * scaleY;

      if (layer.type === 'text') {
        ctx.fillStyle = layer.color || '#ffffff';
        const fontSize = Math.max(2, (layer.fontSize || 16) * Math.min(scaleX, scaleY));
        ctx.font = `${layer.fontWeight || '400'} ${fontSize}px ${layer.fontFamily || 'sans-serif'}`;
        ctx.textAlign = (layer.textAlign as CanvasTextAlign) || 'left';
        ctx.fillText(layer.text || '', lx, ly + fontSize, lw);
      } else if (['rectangle', 'circle', 'hexagon', 'diamond'].includes(layer.type)) {
        ctx.fillStyle = layer.color || '#334155';
        if (layer.type === 'circle') {
          ctx.beginPath();
          ctx.ellipse(lx + lw / 2, ly + lh / 2, lw / 2, lh / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.roundRect(lx, ly, lw, lh, (layer.cornerRadius || 0) * Math.min(scaleX, scaleY));
          ctx.fill();
        }
      } else if (layer.type === 'image' && layer.src) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, lx, ly, lw, lh);
        };
        img.src = layer.src;
      }

      ctx.globalAlpha = 1;
    });
  }, [artboard, artboard.layers.length]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={180}
      className={`w-full rounded-lg border transition-all duration-200 ${
        isActive ? 'border-brand-500/80 shadow-lg shadow-brand-500/10' : 'border-surface-dark-0'
      }`}
    />
  );
};

// ─── Main SlidesPanel ────────────────────────────────────────────────────────

export const SlidesPanel: React.FC = () => {
  const artboards = useStore((state) => state.artboards) || [];
  const activeArtboardId = useStore((state) => state.activeArtboardId);
  const setActiveArtboardId = useStore((state) => state.setActiveArtboardId);
  const addArtboard = useStore((state) => state.addArtboard);
  const deleteArtboard = useStore((state) => state.deleteArtboard);
  const duplicateArtboard = useStore((state: any) => state.duplicateArtboard);
  const updateArtboard = useStore((state) => state.updateArtboard);
  const view = useStore((s) => (s as any).presentationView) || 'grid';
  const setView = useStore((s) => (s as any).setPresentationView);
  const showPresenter = useStore((s) => (s as any).presentationShowPresenter) || false;
  const setShowPresenter = useStore((s) => (s as any).setPresentationShowPresenter);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragSrcRef = useRef<string | null>(null);

  const activeArtboard = artboards.find((a: Artboard) => a.id === activeArtboardId);
  const activeIndex = artboards.findIndex((a: Artboard) => a.id === activeArtboardId);

  // ── Rename helpers ──
  const handleRename = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };
  const saveRename = (id: string) => {
    if (editName.trim()) {
      updateArtboard(id, { name: editName.trim() });
    }
    setEditingId(null);
  };

  // ── Artboard metadata helpers ──
  const getSlide = (a: Artboard) => (a as any).storyNode || {};
  const updateSlide = (id: string, patch: object) => {
    const artboard = artboards.find((a: Artboard) => a.id === id);
    if (!artboard) {
      return;
    }
    const current = getSlide(artboard);
    updateArtboard(id, { storyNode: { ...current, id: artboard.id, connections: [], ...patch } });
  };

  // ── Drag-to-reorder ──
  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragSrcRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(id);
  };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const srcId = dragSrcRef.current;
    if (!srcId || srcId === targetId) {
      setDragOverId(null);
      return;
    }

    const boards = [...artboards];
    const srcIdx = boards.findIndex((a: Artboard) => a.id === srcId);
    const tgtIdx = boards.findIndex((a: Artboard) => a.id === targetId);
    const [removed] = boards.splice(srcIdx, 1);
    boards.splice(tgtIdx, 0, removed);

    // Write back via store — update x positions to maintain ordering
    const updated = boards.map((b: Artboard, i: number) => ({ ...b, x: i * (b.width + 100), y: 0 }));
    useStore.setState({ artboards: updated });
    setDragOverId(null);
    dragSrcRef.current = null;
  };
  const handleDragEnd = () => {
    setDragOverId(null);
    dragSrcRef.current = null;
  };

  // ── Add slide with layout ──
  const addWithLayout = (layoutId: string) => {
    const n = artboards.length + 1;
    switch (layoutId) {
      case 'title':
        addArtboard(`Slide ${n}`, 1920, 1080);
        break;
      case 'two-col':
        addArtboard(`Slide ${n}`, 1920, 1080);
        break;
      case 'quote':
        addArtboard(`Slide ${n}`, 1920, 1080);
        break;
      case 'image-full':
        addArtboard(`Slide ${n}`, 1920, 1080);
        break;
      default:
        addArtboard(`Slide ${n}`, 1920, 1080);
    }
    setShowLayoutPicker(false);
  };

  // ── Navigate slides ──
  const goTo = useCallback(
    (idx: number) => {
      const t = artboards[idx];
      if (t) {
        setActiveArtboardId(t.id);
      }
    },
    [artboards, setActiveArtboardId]
  );

  return (
    <PanelErrorBoundary>
      <div className="flex flex-col h-full bg-surface-dark-2 text-white overflow-hidden">
        <PanelHeader
          title="Presentation"
          icon={<Icons.Monitor className="w-5 h-5 text-brand-400" />}
          action={
            <div className="flex items-center gap-1">
              <button
                onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
                className="p-1.5 rounded-lg bg-surface-dark-0 hover:bg-surface-dark-1 text-gray-400 hover:text-white transition-colors"
                title={view === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
              >
                {view === 'grid' ? (
                  <Icons.LayoutGrid className="w-3.5 h-3.5" />
                ) : (
                  <Icons.Layers className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => setShowPresenter(true)}
                className="flex items-center gap-1 px-2 py-1 bg-brand-600 hover:bg-brand-700 text-[10px] font-bold rounded-lg transition-colors shadow-lg shadow-brand-900/20"
                title="Start Presentation (fullscreen)"
              >
                <Icons.Play className="w-3 h-3" />
                Present
              </button>
            </div>
          }
        />
        <div className="p-3 border-b border-surface-dark-0 shrink-0">
          {/* Quick nav strip */}
          <div className="flex gap-1.5 items-center">
            <button
              onClick={() => goTo(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="p-1 rounded bg-surface-dark-0 hover:bg-surface-dark-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Previous slide"
            >
              <Icons.ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex-1 bg-surface-dark-0 rounded-lg overflow-hidden h-1.5">
              <div
                className="h-full bg-brand-600 rounded-lg transition-all duration-300"
                style={{ width: artboards.length > 1 ? `${((activeIndex + 1) / artboards.length) * 100}%` : '100%' }}
              />
            </div>
            <button
              onClick={() => goTo(activeIndex + 1)}
              disabled={activeIndex >= artboards.length - 1}
              className="p-1 rounded bg-surface-dark-0 hover:bg-surface-dark-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Next slide"
            >
              <Icons.ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[9px] text-gray-500 font-mono min-w-[28px] text-right">
              {activeIndex + 1}/{artboards.length}
            </span>
          </div>
        </div>

        {/* ─── Active slide settings (transition, duration, notes) ─── */}
        {activeArtboard && (
          <div className="border-b border-surface-dark-0 px-3 py-2 shrink-0 space-y-2">
            {/* Transition row */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Transition</p>
              <div className="flex gap-1">
                {TRANSITIONS.map((t) => {
                  const current = getSlide(activeArtboard).transition || 'none';
                  return (
                    <button
                      key={t.key}
                      onClick={() => updateSlide(activeArtboardId!, { transition: t.key })}
                      className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-all ${
                        current === t.key
                          ? 'bg-brand-600 text-white shadow'
                          : 'bg-surface-dark-0 text-gray-400 hover:bg-surface-dark-1 hover:text-white'
                      }`}
                      title={t.label}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration + notes toggle */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-1.5">
                <Icons.Clock className="w-3 h-3 text-gray-500 shrink-0" />
                <input
                  type="number"
                  min={0}
                  max={300}
                  value={getSlide(activeArtboard).duration ?? 0}
                  onChange={(e) => updateSlide(activeArtboardId!, { duration: Number(e.target.value) })}
                  className="w-14 bg-surface-dark-0 border border-surface-dark-1 rounded px-1.5 py-1 text-[10px] text-white focus:outline-none focus:border-brand-500 text-center"
                  title="Auto-advance after N seconds (0 = manual)"
                />
                <span className="text-[9px] text-gray-500">sec</span>
              </div>
              <button
                onClick={() => setExpandedNotes((prev) => (prev === activeArtboardId ? null : activeArtboardId!))}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-semibold transition-all ${
                  expandedNotes === activeArtboardId
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    : 'bg-surface-dark-0 text-gray-400 hover:text-yellow-300'
                }`}
                title="Speaker notes"
              >
                <Icons.Edit className="w-3 h-3" />
                Notes
              </button>
            </div>

            {/* Speaker notes textarea */}
            {expandedNotes === activeArtboardId && (
              <textarea
                value={getSlide(activeArtboard).notes || ''}
                onChange={(e) => updateSlide(activeArtboardId!, { notes: e.target.value })}
                placeholder="Add speaker notes for this slide..."
                rows={3}
                className="w-full bg-surface-dark-0 border border-yellow-500/20 rounded-lg px-2.5 py-2 text-[10px] text-yellow-100 focus:outline-none focus:border-yellow-500/50 resize-none placeholder-gray-600 leading-relaxed"
              />
            )}
          </div>
        )}

        {/* ─── Slide list ─── */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* Layout picker inline */}
          {showLayoutPicker && (
            <div className="mb-3 p-3 rounded-xl border border-brand-500/30 bg-surface-dark-1/50 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Choose Layout</p>
              {SLIDE_LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => addWithLayout(layout.id)}
                  className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface-dark-0 text-left transition-colors group"
                >
                  <div className="w-8 h-5 rounded bg-surface-dark-0 border border-surface-dark-1 group-hover:border-brand-500/40 flex items-center justify-center text-[7px] text-gray-500 shrink-0 font-bold transition-colors">
                    {layout.id === 'blank' ? '+' : '▬'}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-white">{layout.label}</p>
                    <p className="text-[9px] text-gray-500">{layout.desc}</p>
                  </div>
                </button>
              ))}
              <button
                onClick={() => setShowLayoutPicker(false)}
                className="w-full text-center text-[9px] text-gray-500 hover:text-white pt-1 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Add slide button */}
          {!showLayoutPicker && (
            <button
              onClick={() => setShowLayoutPicker(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 mb-3 rounded-xl border border-dashed border-surface-dark-1 hover:border-brand-500/40 text-gray-500 hover:text-brand-300 text-xs font-semibold transition-all hover:bg-brand-600/5"
            >
              <Icons.Plus className="w-3.5 h-3.5" />
              Add Slide
            </button>
          )}

          {/* Grid view */}
          {view === 'grid' && (
            <div className="grid grid-cols-2 gap-2">
              {artboards.map((artboard: Artboard, index: number) => {
                const isActive = artboard.id === activeArtboardId;
                const slide = getSlide(artboard);
                const isDragOver = dragOverId === artboard.id;
                return (
                  <div
                    key={artboard.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, artboard.id)}
                    onDragOver={(e) => handleDragOver(e, artboard.id)}
                    onDrop={(e) => handleDrop(e, artboard.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setActiveArtboardId(artboard.id)}
                    className={`group relative rounded-xl border cursor-pointer transition-all duration-150 overflow-hidden ${
                      isActive
                        ? 'border-brand-500/80 ring-1 ring-brand-500/20 shadow-lg shadow-brand-900/20'
                        : isDragOver
                          ? 'border-brand-400/60 bg-brand-500/5 scale-[0.97]'
                          : 'border-surface-dark-1/50 hover:border-surface-dark-1'
                    }`}
                  >
                    {/* Slide number badge */}
                    <div
                      className={`absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border transition-all ${
                        isActive
                          ? 'bg-brand-600 border-brand-500 text-white shadow'
                          : 'bg-surface-dark-1 border-surface-dark-0 text-gray-400'
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Transition badge */}
                    {slide.transition && slide.transition !== 'none' && (
                      <div className="absolute top-1.5 right-1.5 z-10 px-1 py-0.5 rounded text-[7px] font-bold bg-black/40 text-gray-300 backdrop-blur-sm">
                        {slide.transition}
                      </div>
                    )}

                    {/* Canvas thumbnail */}
                    <div className="p-1.5">
                      <SlideThumbnail artboard={artboard} isActive={isActive} />
                    </div>

                    {/* Label row */}
                    <div className="px-2 pb-2 flex items-center justify-between">
                      {editingId === artboard.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => saveRename(artboard.id)}
                          onKeyDown={(e) => e.key === 'Enter' && saveRename(artboard.id)}
                          autoFocus
                          className="flex-1 bg-surface-dark-0 border border-brand-500/50 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span
                          className={`text-[10px] font-semibold truncate ${isActive ? 'text-brand-300' : 'text-gray-400'}`}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleRename(artboard.id, artboard.name);
                          }}
                          title="Double-click to rename"
                        >
                          {artboard.name || `Slide ${index + 1}`}
                        </span>
                      )}
                      {/* Duration dot */}
                      {slide.duration > 0 && (
                        <span className="text-[8px] text-gray-500 font-mono ml-1 shrink-0">{slide.duration}s</span>
                      )}
                    </div>

                    {/* Hover actions */}
                    <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-sm transition-all duration-150 rounded-xl">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateArtboard(artboard.id);
                        }}
                        className="p-1.5 rounded-lg bg-surface-dark-1/90 text-gray-300 hover:text-brand-300 hover:bg-surface-dark-2 transition-colors shadow"
                        title="Duplicate"
                      >
                        <Icons.Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(artboard.id, artboard.name);
                        }}
                        className="p-1.5 rounded-lg bg-surface-dark-1/90 text-gray-300 hover:text-white transition-colors shadow"
                        title="Rename"
                      >
                        <Icons.Edit className="w-3.5 h-3.5" />
                      </button>
                      {artboards.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteArtboard(artboard.id);
                          }}
                          className="p-1.5 rounded-lg bg-surface-dark-1/90 text-gray-300 hover:text-red-400 transition-colors shadow"
                          title="Delete"
                        >
                          <Icons.Trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Notes indicator */}
                    {slide.notes && (
                      <div
                        className="absolute bottom-7 right-1.5 w-1.5 h-1.5 rounded-full bg-yellow-400"
                        title="Has speaker notes"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* List view */}
          {view === 'list' && (
            <div className="space-y-1.5">
              {artboards.map((artboard: Artboard, index: number) => {
                const isActive = artboard.id === activeArtboardId;
                const slide = getSlide(artboard);
                const isDragOver = dragOverId === artboard.id;
                return (
                  <div
                    key={artboard.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, artboard.id)}
                    onDragOver={(e) => handleDragOver(e, artboard.id)}
                    onDrop={(e) => handleDrop(e, artboard.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setActiveArtboardId(artboard.id)}
                    className={`group flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                      isActive
                        ? 'bg-surface-dark-1/80 border-brand-500/70 ring-1 ring-brand-500/15'
                        : isDragOver
                          ? 'border-brand-400/40 bg-brand-500/5'
                          : 'bg-surface-dark-0/30 border-surface-dark-1/40 hover:bg-surface-dark-1/30'
                    }`}
                  >
                    {/* Number */}
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border transition-all ${
                        isActive
                          ? 'bg-brand-600 border-brand-500 text-white'
                          : 'bg-surface-dark-1 border-surface-dark-0 text-gray-500'
                      }`}
                    >
                      {index + 1}
                    </span>

                    {/* Mini thumbnail */}
                    <div className="w-16 h-9 shrink-0 rounded-md overflow-hidden border border-surface-dark-0">
                      <SlideThumbnail artboard={artboard} isActive={isActive} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {editingId === artboard.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => saveRename(artboard.id)}
                          onKeyDown={(e) => e.key === 'Enter' && saveRename(artboard.id)}
                          autoFocus
                          className="w-full bg-surface-dark-0 border border-brand-500/50 rounded px-2 py-0.5 text-xs focus:outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <p
                          className={`text-xs font-semibold truncate ${isActive ? 'text-brand-300' : 'text-gray-300'}`}
                        >
                          {artboard.name || `Slide ${index + 1}`}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-gray-500">{artboard.layers?.length || 0} layers</span>
                        {slide.transition && slide.transition !== 'none' && (
                          <span className="text-[8px] text-gray-600 capitalize">{slide.transition}</span>
                        )}
                        {slide.duration > 0 && (
                          <span className="text-[8px] text-gray-600 font-mono">{slide.duration}s</span>
                        )}
                        {slide.notes && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block"
                            title="Has speaker notes"
                          />
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateArtboard(artboard.id);
                        }}
                        className="p-1 rounded hover:bg-surface-dark-2 text-gray-400 hover:text-brand-300 transition-colors"
                        title="Duplicate"
                      >
                        <Icons.Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(artboard.id, artboard.name);
                        }}
                        className="p-1 rounded hover:bg-surface-dark-2 text-gray-400 hover:text-white transition-colors"
                        title="Rename"
                      >
                        <Icons.Edit className="w-3.5 h-3.5" />
                      </button>
                      {artboards.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteArtboard(artboard.id);
                          }}
                          className="p-1 rounded hover:bg-surface-dark-2 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Icons.Trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Footer actions ─── */}
        <div className="p-3 border-t border-surface-dark-0 shrink-0 flex items-center gap-2">
          <button
            onClick={() => setShowPresenter(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-brand-900/20"
          >
            <Icons.Play className="w-3.5 h-3.5" />
            Present Fullscreen
          </button>
          <button
            onClick={() => {
              const s = useStore.getState() as any;
              s.setShowExportModal?.(true);
            }}
            className="flex items-center gap-1 px-3 py-2 bg-surface-dark-0 hover:bg-surface-dark-1 text-gray-300 text-xs font-semibold rounded-xl transition-colors border border-surface-dark-1"
            title="Export as PDF / PPTX"
          >
            <Icons.Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Presenter modal */}
      {showPresenter && (
        <PresenterView
          artboards={artboards}
          activeIndex={activeIndex}
          onClose={() => setShowPresenter(false)}
          onSlideChange={(idx) => goTo(idx)}
          getSlide={getSlide}
        />
      )}
    </PanelErrorBoundary>
  );
};

// ─── Presenter View ───────────────────────────────────────────────────────────

interface PresenterViewProps {
  artboards: Artboard[];
  activeIndex: number;
  onClose: () => void;
  onSlideChange: (idx: number) => void;
  getSlide: (a: Artboard) => any;
}

const PresenterView: React.FC<PresenterViewProps> = ({
  artboards,
  activeIndex: initialIndex,
  onClose,
  onSlideChange,
  getSlide,
}) => {
  const [current, setCurrent] = useState(initialIndex);
  const [elapsed, setElapsed] = useState(0);
  const [showNotes, setShowNotes] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const slide = artboards[current];
  const meta = slide ? getSlide(slide) : {};
  const hasNotes = !!meta.notes;

  // Global timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Auto-advance
  useEffect(() => {
    if (autoRef.current) {
      clearTimeout(autoRef.current);
    }
    const dur = meta.duration;
    if (dur && dur > 0) {
      autoRef.current = setTimeout(() => {
        if (current < artboards.length - 1) {
          setCurrent((c) => c + 1);
        }
      }, dur * 1000);
    }
    return () => {
      if (autoRef.current) {
        clearTimeout(autoRef.current);
      }
    };
  }, [current, meta.duration]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrent((c) => Math.min(c + 1, artboards.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrent((c) => Math.max(c - 1, 0));
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'n' || e.key === 'N') {
        setShowNotes((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [artboards.length, onClose]);

  const popupRef = useRef<Window | null>(null);

  // Setup popup window
  useEffect(() => {
    // Open the external audience view
    popupRef.current = window.open(
      '/audience',
      'kreathief_audience',
      'menubar=no,toolbar=no,location=no,status=no,width=1280,height=720'
    );

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'AUDIENCE_READY') {
        syncToAudience();
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };
  }, []);

  const syncToAudience = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.postMessage(
        {
          type: 'SYNC_PRESENTATION',
          artboards,
          activeIndex: current,
        },
        '*'
      );
    }
  }, [artboards, current]);

  // Sync change to canvas and audience
  useEffect(() => {
    onSlideChange(current);
    syncToAudience();
  }, [current, syncToAudience]);

  // Render slide thumbnail on local control canvas (no animations needed here)
  useEffect(() => {
    if (!slide || !canvasRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const W = canvas.width;
    const H = canvas.height;
    const scaleX = W / slide.width;
    const scaleY = H / slide.height;

    ctx.fillStyle = slide.backgroundColor || '#1e293b';
    ctx.fillRect(0, 0, W, H);

    slide.layers.forEach((layer: any) => {
      if (layer.visible === false) {
        return;
      }
      ctx.globalAlpha = layer.opacity ?? 1;
      const lx = (layer.x || 0) * scaleX;
      const ly = (layer.y || 0) * scaleY;
      const lw = (layer.width || 0) * scaleX;
      const lh = (layer.height || 0) * scaleY;

      if (layer.type === 'text') {
        ctx.fillStyle = layer.color || '#ffffff';
        const fontSize = Math.max(4, (layer.fontSize || 16) * Math.min(scaleX, scaleY));
        ctx.font = `${layer.fontWeight || '400'} ${fontSize}px ${layer.fontFamily || 'sans-serif'}`;
        ctx.textAlign = (layer.textAlign as CanvasTextAlign) || 'left';
        ctx.fillText(layer.text || '', lx, ly + fontSize, lw);
      } else if (['rectangle', 'circle', 'hexagon', 'diamond'].includes(layer.type)) {
        ctx.fillStyle = layer.color || '#334155';
        if (layer.type === 'circle') {
          ctx.beginPath();
          ctx.ellipse(lx + lw / 2, ly + lh / 2, lw / 2, lh / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(lx, ly, lw, lh, (layer.cornerRadius || 0) * Math.min(scaleX, scaleY));
          } else {
            ctx.rect(lx, ly, lw, lh);
          }
          ctx.fill();
        }
      } else if (layer.type === 'image' && layer.src) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, lx, ly, lw, lh);
        };
        img.src = layer.src;
      }
      ctx.globalAlpha = 1;
    });
  }, [current, slide]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const progressPct = artboards.length > 1 ? ((current + 1) / artboards.length) * 100 : 100;

  return (
    <div className="fixed inset-0 z-[99999] bg-[#0d1117] flex flex-col select-none">
      {/* ── Header ── */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-3">
          <Icons.Monitor className="w-5 h-5 text-brand-400" />
          <div>
            <h1 className="text-white font-bold text-sm tracking-wide">Presenter Control Center</h1>
            <p className="text-[10px] text-gray-400">Audience view opened in external window</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface-dark-1 hover:bg-red-500/20 hover:text-red-400 text-xs text-gray-300 transition-colors"
        >
          <Icons.X className="w-4 h-4" />
          End Show
        </button>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-1 bg-white/5 shrink-0">
        <div className="h-full bg-brand-500 transition-all duration-700" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Column: Current Slide ── */}
        <div className="flex-1 flex flex-col border-r border-white/5">
          <div className="p-3 shrink-0 flex items-center justify-between border-b border-white/5 bg-white/5">
            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Current Slide</span>
            <span className="text-xs font-mono text-brand-300">
              {current + 1} / {artboards.length}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8 relative">
            <div className="relative shadow-2xl shadow-black ring-1 ring-white/10 rounded-lg overflow-hidden bg-black max-w-full max-h-full">
              <canvas
                ref={canvasRef}
                width={1920}
                height={1080}
                className="w-full h-full object-contain"
                style={{ aspectRatio: `${slide?.width || 1920}/${slide?.height || 1080}` }}
              />
            </div>

            {/* Nav Overlays */}
            <button
              onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 hover:bg-brand-500 flex items-center justify-center border border-white/10 transition-all backdrop-blur"
              title="Previous (←)"
            >
              <Icons.ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrent((c) => Math.min(c + 1, artboards.length - 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 hover:bg-brand-500 flex items-center justify-center border border-white/10 transition-all backdrop-blur"
              title="Next (→ or Space)"
            >
              <Icons.ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* ── Right Column: Next Slide & Notes ── */}
        <div className="w-[420px] flex flex-col bg-[#080b0f] border-l border-white/5 backdrop-blur-xl">
          {/* Next Slide Bento Card */}
          <div className="flex flex-col h-[32%] border-b border-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400">UP NEXT</span>
              {current < artboards.length - 1 && (
                <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                  Slide {current + 2}
                </span>
              )}
            </div>
            <div className="flex-1 flex items-center justify-center bg-black/40 rounded-xl border border-white/5 overflow-hidden p-2 group hover:border-brand-500/30 transition-all duration-300">
              {current < artboards.length - 1 ? (
                <div className="w-full h-full aspect-video rounded-lg overflow-hidden relative shadow-lg shadow-black/50">
                  <SlideThumbnail artboard={artboards[current + 1]} isActive={false} />
                </div>
              ) : (
                <div className="text-center py-6">
                  <Icons.Zap className="w-8 h-8 text-gray-600 mx-auto mb-2 animate-pulse" />
                  <p className="text-gray-500 text-xs font-semibold">End of Presentation</p>
                </div>
              )}
            </div>
          </div>

          {/* Speaker Notes Bento Card */}
          <div className="flex-1 flex flex-col p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping"></div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-yellow-500/90">
                  SPEAKER NOTES
                </span>
              </div>
              {hasNotes && (
                <span className="text-[9px] text-yellow-500/50 bg-yellow-500/5 border border-yellow-500/10 px-2 py-0.5 rounded-full font-semibold">
                  Active
                </span>
              )}
            </div>
            <div className="flex-1 bg-gradient-to-b from-[#12161f] to-[#0d1017] border border-yellow-500/10 rounded-2xl p-5 overflow-y-auto shadow-inner shadow-black/80 hover:border-yellow-500/25 transition-all duration-300">
              {hasNotes ? (
                <p className="text-[13px] text-yellow-100/90 leading-relaxed font-normal whitespace-pre-wrap font-sans">
                  {meta.notes}
                </p>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-600 py-10">
                  <Icons.Edit className="w-6 h-6 mb-2 text-gray-700" />
                  <p className="text-xs italic">No speaker notes provided for this slide.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom controls ── */}
      <div className="shrink-0 bg-black border-t border-white/5 flex items-center gap-4 px-6 py-4">
        {/* Timer */}
        <div className="flex items-center gap-2 text-xl font-mono text-brand-400 bg-brand-500/10 px-4 py-1.5 rounded border border-brand-500/20">
          <Icons.Clock className="w-5 h-5" />
          {formatTime(elapsed)}
        </div>

        {/* Slide picker strip */}
        <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar items-center px-4">
          {artboards.map((a: Artboard, i: number) => (
            <button
              key={a.id}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-10 h-6 rounded text-[10px] font-bold transition-all ${
                i === current
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Slide count */}
        <span className="text-sm text-gray-400 font-mono shrink-0">
          {current + 1} / {artboards.length}
        </span>

        {/* Auto-duration countdown */}
        {meta.duration > 0 && (
          <div className="flex items-center gap-1.5 text-sm font-bold text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded">
            <Icons.Clock className="w-4 h-4" />
            <span>Auto {meta.duration}s</span>
          </div>
        )}

        {/* Prev / Next */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
            disabled={current === 0}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"
          >
            <Icons.ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrent((c) => Math.min(c + 1, artboards.length - 1))}
            disabled={current >= artboards.length - 1}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"
          >
            <Icons.ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-semibold rounded-lg transition-colors"
          title="Exit presentation (Esc)"
        >
          <Icons.X className="w-3.5 h-3.5" />
          Exit
        </button>
      </div>
    </div>
  );
};

export default SlidesPanel;
