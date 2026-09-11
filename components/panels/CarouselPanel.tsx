import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
const AnyIcons = Icons as any;
import { Artboard } from '../../types';
import { PanelErrorBoundary } from './PanelErrorBoundary';
import { PanelHeader } from './PanelHeader';
const generateCarouselDesign = null as unknown as any;
import JSZip from 'jszip';
import { log } from '../../utils/log';
import { getAIErrorMessage } from '../../utils/errorMessages';

// ─── Thumbnail renderer — canvas-based snapshot ───────────────────────────────

const SlideThumbnail: React.FC<{ artboard: Artboard; isActive: boolean; format: 'square' | 'portrait' }> = ({
  artboard,
  isActive,
  format,
}) => {
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

    // Render each layer
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
      }

      ctx.globalAlpha = 1;
    });
  }, [artboard, artboard.layers.length]);

  return (
    <canvas
      ref={canvasRef}
      width={180}
      height={format === 'portrait' ? 225 : 180}
      className={`w-full rounded-lg border transition-all duration-200 ${
        isActive ? 'border-brand-500/80 shadow-lg shadow-brand-500/10' : 'border-surface-dark-0'
      }`}
    />
  );
};

// ─── Main CarouselPanel ───────────────────────────────────────────────────────

export const CarouselPanel: React.FC = () => {
  const artboards = useStore((state) => state.artboards) || [];
  const activeArtboardId = useStore((state) => state.activeArtboardId);
  const setActiveArtboardId = useStore((state) => state.setActiveArtboardId);
  const addArtboard = useStore((state) => state.addArtboard);
  const deleteArtboard = useStore((state) => state.deleteArtboard);
  const updateArtboard = useStore((state) => state.updateArtboard);

  // Filter for artboards that look like carousel slides (e.g. they have social tag or match size)
  // For simplicity, we assume in Carousel mode, all artboards are slides
  const carouselSlides = artboards;

  const carouselFormat = useStore((s) => (s as any).carouselFormat) || 'portrait';
  const setCarouselFormat = useStore((s) => (s as any).setCarouselFormat);
  const slideCount = useStore((s) => (s as any).carouselSlideCount) || 5;
  const setSlideCount = useStore((s) => (s as any).setCarouselSlideCount);
  const isContinuousMode = useStore((s) => (s as any).carouselContinuousMode) || false;
  const setIsContinuousMode = useStore((s) => (s as any).setCarouselContinuousMode);

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPromptText, setAIPromptText] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragSrcRef = useRef<string | null>(null);

  const activeArtboard = carouselSlides.find((a: Artboard) => a.id === activeArtboardId);

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

    // Update x positions to maintain side-by-side ordering on canvas
    const updated = boards.map((b: Artboard, i: number) => ({ ...b, x: i * (b.width + 100), y: 0 }));
    useStore.setState({ artboards: updated });
    setDragOverId(null);
    dragSrcRef.current = null;
  };
  const handleDragEnd = () => {
    setDragOverId(null);
    dragSrcRef.current = null;
  };

  // ── AI Generation Logic ──
  const handleGenerateCarousel = async () => {
    if (!aiPromptText.trim()) {
      return;
    }
    setIsGeneratingAI(true);
    try {
      const generated = await generateCarouselDesign(aiPromptText, slideCount);

      const W = carouselFormat === 'square' ? 1080 : 1080;
      const H = carouselFormat === 'square' ? 1080 : 1350;

      // Clear existing artboards
      useStore.setState({ artboards: [] });

      const newArtboards: any[] = [];
      const boardId = `board_${Date.now()}_carousel`;

      if (isContinuousMode) {
        const continuousW = W * generated.slides.length;
        const newBoard: Artboard = {
          id: boardId,
          name: 'Continuous Carousel',
          x: 0,
          y: 0,
          width: continuousW,
          height: H,
          backgroundColor: generated.theme.primaryColor,
          layers: [],
        };
        newArtboards.push(newBoard);
      } else {
        generated.slides.forEach((slide: any, idx: number) => {
          const newBoard: Artboard = {
            id: `${boardId}_${idx}`,
            name: `Slide ${idx + 1}`,
            x: idx * (W + 100),
            y: 0,
            width: W,
            height: H,
            backgroundColor: idx === 0 ? generated.theme.primaryColor : '#ffffff',
            layers: [],
          };
          newArtboards.push(newBoard);
        });
      }

      // Commit artboards to store
      useStore.setState({ artboards: newArtboards });
      setActiveArtboardId(newArtboards[0].id);

      // Now add layers
      setTimeout(() => {
        generated.slides.forEach((slide: any, idx: number) => {
          const targetArtboardId = isContinuousMode ? newArtboards[0].id : newArtboards[idx].id;
          setActiveArtboardId(targetArtboardId);
          const state = useStore.getState() as any;
          const isTitle = idx === 0;

          const offsetX = isContinuousMode ? idx * W : 0;

          // Auto-Image sourcing via loremflickr
          if (slide.imageSearchQuery) {
            const tags = encodeURIComponent(slide.imageSearchQuery.replace(/\s+/g, ','));
            const imgUrl = `https://loremflickr.com/${W}/${H}/${tags}?random=${idx}`;
            state.addLayer({
              id: `img_${Date.now()}_${idx}`,
              type: 'image',
              name: 'Background Photo',
              x: offsetX,
              y: 0,
              width: W,
              height: H,
              src: imgUrl,
              rotation: 0,
              opacity: 0.5,
              locked: true,
              visible: true,
              blendMode: 'multiply',
            });
          }

          // Header Text
          state.addTextLayer({
            name: 'Heading',
            text: slide.title,
            x: offsetX + 100,
            y: isTitle ? H / 2 - 100 : 150,
            width: W - 200,
            height: 100,
            fontSize: isTitle ? 80 : 64,
            fontWeight: '800',
            fontFamily: generated.theme.fontFamily,
            color: isTitle ? '#ffffff' : generated.theme.primaryColor,
          });

          // Body Text
          if (slide.body) {
            state.addTextLayer({
              name: 'Body',
              text: slide.body,
              x: offsetX + 100,
              y: isTitle ? H / 2 + 50 : 350,
              width: W - 200,
              height: 400,
              fontSize: isTitle ? 40 : 36,
              fontWeight: '400',
              fontFamily: generated.theme.fontFamily,
              color: isTitle ? 'rgba(255,255,255,0.9)' : '#334155',
            });
          }

          // Swipe Indicator or CTA
          state.addTextLayer({
            name: idx === generated.slides.length - 1 ? 'CTA' : 'Swipe Indicator',
            text: idx === generated.slides.length - 1 ? slide.cta || 'Save for later!' : 'Swipe →',
            x: offsetX + 100,
            y: H - 150,
            width: W - 200,
            height: 50,
            fontSize: 32,
            fontWeight: '700',
            fontFamily: generated.theme.fontFamily,
            color: isTitle ? 'rgba(255,255,255,0.7)' : generated.theme.secondaryColor,
            textAlign: idx === generated.slides.length - 1 ? 'center' : 'right',
          });

          // Footer branding
          state.addTextLayer({
            name: 'Brand',
            text: '@kreathief',
            x: offsetX + 100,
            y: H - 150,
            width: 200,
            height: 50,
            fontSize: 32,
            fontWeight: '600',
            fontFamily: generated.theme.fontFamily,
            color: isTitle ? 'rgba(255,255,255,0.7)' : '#94a3b8',
          });
        });

        // Set back to first
        setActiveArtboardId(newArtboards[0].id);
        setShowAIModal(false);
        setAIPromptText('');
      }, 100);
    } catch (error) {
      log.error('Generation failed', error);
      // 🌸 Bloom: Closed quality gap where carousel generation errors showed generic, blocking alerts
      // Improvement: Replaced native alert with non-blocking toast UI using specific AI error formatters
      useStore.getState().addToast(getAIErrorMessage(error), 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleExportZIP = () => {
    // 🌸 Bloom: Closed quality gap where info alerts blocked the user
    // Improvement: Replaced native alert with non-blocking info toast
    useStore.getState().addToast('Export to ZIP functionality will use the global export engine.', 'info');
  };

  const handleExportSliced = async () => {
    if (!activeArtboard || !isContinuousMode) {
      return;
    }

    // We render the continuous canvas onto a hidden canvas, then slice it.
    const W = 1080;
    const H = carouselFormat === 'portrait' ? 1350 : 1080;
    const numSlides = Math.floor(activeArtboard.width / W);

    // In a real implementation we would render the actual canvas elements via html2canvas
    // or draw them manually like in DocumentThumbnail. Since we're demonstrating the concept:
    // 🌸 Bloom: Closed quality gap where info alerts blocked the user
    // Improvement: Replaced native alert with non-blocking info toast
    useStore.getState().addToast(`Slicing continuous canvas into ${numSlides} images of ${W}x${H}...`, 'info');

    // Simulate ZIP download
    const zip = new JSZip();
    for (let i = 0; i < numSlides; i++) {
      zip.file(`slide_${i + 1}.txt`, `This is a slice of the canvas from x=${i * W} to x=${(i + 1) * W}`);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carousel-slices.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <PanelErrorBoundary>
      <div className="flex flex-col h-full bg-surface-dark-2 overflow-hidden">
        <PanelHeader
          title="Carousel Builder"
          icon={<AnyIcons.Images className="w-5 h-5 text-brand-400" />}
          action={
            <button
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-glow-brand"
            >
              <AnyIcons.Sparkles className="w-3.5 h-3.5" />
              Auto-Build
            </button>
          }
        />
        <div className="flex-none p-4 border-b border-surface-dark-1">
          <div className="flex items-center gap-2 bg-surface-dark-1 p-1 rounded-lg">
            <button
              onClick={() => setCarouselFormat('square')}
              className={`flex-1 py-1.5 rounded text-[10px] font-bold ${
                carouselFormat === 'square'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-surface-dark-0 text-gray-400 hover:text-gray-200'
              }`}
            >
              Square (1:1)
            </button>
            <button
              onClick={() => setCarouselFormat('portrait')}
              className={`flex-1 py-1.5 rounded text-[10px] font-bold ${
                carouselFormat === 'portrait'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-surface-dark-0 text-gray-400 hover:text-gray-200'
              }`}
            >
              Portrait (4:5)
            </button>

            <button
              onClick={() => setIsContinuousMode(!isContinuousMode)}
              className={`flex-1 py-1.5 rounded text-[10px] font-bold ${
                isContinuousMode
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-surface-dark-0 text-gray-400 hover:text-gray-200'
              }`}
              title="Continuous Canvas Mode"
            >
              <AnyIcons.Layout className="w-3.5 h-3.5" />
              Continuous
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {carouselSlides.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 bg-surface-dark-1 rounded-full flex items-center justify-center mb-4">
                <AnyIcons.Images className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">No Slides Yet</h3>
              <p className="text-xs text-gray-400 mb-6">
                Start by adding a slide or use AI to generate a full carousel instantly.
              </p>
              <button
                onClick={() => setShowAIModal(true)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2 shadow-glow-brand"
              >
                <Icons.Sparkles className="w-4 h-4" />
                Generate with AI
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 pb-20">
              {carouselSlides.map((slide: any, idx: number) => {
                const isActive = activeArtboardId === slide.id;
                const isDragOver = dragOverId === slide.id;

                return (
                  <div
                    key={slide.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, slide.id)}
                    onDragOver={(e) => handleDragOver(e, slide.id)}
                    onDrop={(e) => handleDrop(e, slide.id)}
                    onDragEnd={handleDragEnd}
                    className={`relative group cursor-pointer transition-all duration-200 ${
                      isDragOver ? 'border-brand-500 bg-brand-500/10 scale-105' : ''
                    }`}
                    onClick={() => setActiveArtboardId(slide.id)}
                  >
                    {/* Number Badge */}
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-surface-dark-1 border border-surface-dark-0 text-white text-xs font-bold rounded-full flex items-center justify-center z-10 shadow-lg">
                      {idx + 1}
                    </div>

                    <SlideThumbnail artboard={slide} isActive={isActive} format={carouselFormat} />

                    <div className="mt-2 flex items-center justify-between px-1">
                      <span className="text-xs font-medium text-white truncate pr-2">{slide.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteArtboard(slide.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all rounded hover:bg-surface-dark-1"
                        title="Delete Slide"
                      >
                        <Icons.Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add New Slide Button */}
              <div
                onClick={() =>
                  addArtboard({
                    name: `Slide ${carouselSlides.length + 1}`,
                    width: 1080,
                    height: carouselFormat === 'portrait' ? 1350 : 1080,
                  } as any)
                }
                className="aspect-[4/5] rounded-lg border-2 border-dashed border-surface-dark-0 hover:border-brand-500 hover:bg-brand-500/5 flex flex-col items-center justify-center cursor-pointer transition-all text-gray-500 hover:text-brand-400"
              >
                <Icons.Plus className="w-8 h-8 mb-2" />
                <span className="text-xs font-medium">Add Slide</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {carouselSlides.length > 0 && (
          <div className="flex-none p-4 border-t border-surface-dark-1 bg-surface-dark-2">
            {isContinuousMode ? (
              <button
                onClick={handleExportSliced}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-glow-brand"
              >
                <Icons.Scissors className="w-3.5 h-3.5" />
                Slice & Export ZIP
              </button>
            ) : (
              <button
                onClick={handleExportZIP}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-surface-dark-0 hover:bg-surface-dark-1 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Icons.Download className="w-3.5 h-3.5" />
                Export ZIP
              </button>
            )}
          </div>
        )}
      </div>

      {/* AI Generate Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-dark-2 border border-surface-dark-1 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-surface-dark-1 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Icons.Sparkles className="w-4 h-4 text-brand-400" />
                AI Carousel Generator
              </h3>
              <button
                onClick={() => !isGeneratingAI && setShowAIModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Describe the topic for your carousel. Our AI will write the copy, split it into slides, and apply a
                cohesive design system automatically.
              </p>

              <div className="mb-4">
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Number of Slides</label>
                <input
                  type="range"
                  aria-label="Number of Slides"
                  min="3"
                  max="10"
                  value={slideCount}
                  onChange={(e) => setSlideCount(parseInt(e.target.value))}
                  className="w-full accent-brand-500"
                />
                <div className="text-right text-xs text-brand-400 font-semibold mt-1">{slideCount} Slides</div>
              </div>

              <textarea
                value={aiPromptText}
                onChange={(e) => setAIPromptText(e.target.value)}
                placeholder="E.g., 5 uncommon productivity tips for remote software engineers."
                className="w-full h-32 bg-surface-dark-1 border border-surface-dark-0 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder-gray-500 mb-6"
                disabled={isGeneratingAI}
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAIModal(false)}
                  disabled={isGeneratingAI}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateCarousel}
                  disabled={isGeneratingAI || !aiPromptText.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-surface-dark-1 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
                >
                  {isGeneratingAI ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Icons.Wand className="w-5 h-5" />
                      Generate Carousel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PanelErrorBoundary>
  );
};
