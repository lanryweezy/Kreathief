import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../../constants';
import { log } from '../../utils/log';

interface MockupModalProps {
  designImage: string;
  onClose: () => void;
}

export const MockupModal: React.FC<MockupModalProps> = ({ designImage, onClose }) => {
  const [activeMockup, setActiveMockup] = useState<'tshirt' | 'hoodie' | 'iphone' | 'macbook' | 'poster' | 'tote'>(
    'tshirt'
  );
  const [isMounted, setIsMounted] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [bgError, setBgError] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [overlayPos, setOverlayPos] = useState({ x: 0, y: 0 });
  const [overlayScale, setOverlayScale] = useState(1);
  const [surfaceDepth, setSurfaceDepth] = useState(0.8);
  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const [environment, setEnvironment] = useState<'studio' | 'sunset' | 'industrial' | 'soft'>('studio');
  const [useDisplacement, setUseDisplacement] = useState(true);
  const [perspectiveWarp, setPerspectiveWarp] = useState({ rotateX: 0, rotateY: 0 });
  const [customBg, setCustomBg] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const mockups = {
    tshirt: {
      id: 'tshirt',
      name: 'Premium T-Shirt',
      category: 'APPAREL',
      icon: Icons.Layout,
      bg: `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=95`,
      exportBg: `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=100`,
      aspectRatio: 'aspect-[3/4]',
      overlayStyle: {
        top: '30%',
        left: '28%',
        width: '45%',
        mixBlendMode: 'multiply',
        opacity: 0.9,
        transform: undefined,
      },
    },
    hoodie: {
      id: 'hoodie',
      name: 'Heavyweight Hoodie',
      category: 'APPAREL',
      icon: Icons.Layout,
      bg: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      exportBg:
        'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=100',
      aspectRatio: 'aspect-[3/4]',
      overlayStyle: {
        top: '35%',
        left: '32%',
        width: '36%',
        mixBlendMode: 'multiply',
        opacity: 0.85,
        transform: undefined,
      },
    },
    iphone: {
      id: 'iphone',
      name: 'iPhone 16 Pro',
      category: 'TECH',
      icon: Icons.Monitor,
      bg: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      exportBg:
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=100',
      aspectRatio: 'aspect-[9/16]',
      overlayStyle: { top: '12%', left: '15%', width: '70%', mixBlendMode: 'normal', opacity: 1, borderRadius: '40px' },
      hasReflections: true,
    },
    macbook: {
      id: 'macbook',
      name: 'MacBook Air M3',
      category: 'TECH',
      icon: Icons.Monitor,
      bg: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      exportBg:
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=100',
      aspectRatio: 'aspect-[16/10]',
      overlayStyle: { top: '14%', left: '18%', width: '64%', mixBlendMode: 'normal', opacity: 1 },
      hasReflections: true,
    },
    poster: {
      id: 'poster',
      name: 'A4 Matte Poster',
      category: 'PRINT',
      icon: Icons.Image,
      bg: `https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85`,
      exportBg: `https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=100`,
      aspectRatio: 'aspect-[2/3]',
      overlayStyle: {
        top: '15%',
        left: '27%',
        width: '46%',
        transform: 'rotate(-2deg)',
        mixBlendMode: 'multiply',
        opacity: 1,
      },
    },
    tote: {
      id: 'tote',
      name: 'Canvas Tote Bag',
      category: 'ACCESSORIES',
      icon: Icons.Box,
      bg: `https://images.unsplash.com/photo-1597484662317-c9253e609141?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85`,
      exportBg: `https://images.unsplash.com/photo-1597484662317-c9253e609141?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=100`,
      aspectRatio: 'aspect-square',
      overlayStyle: {
        top: '45%',
        left: '35%',
        width: '30%',
        mixBlendMode: 'multiply',
        opacity: 0.85,
        transform: undefined,
      },
    },
  };

  const current = mockups[activeMockup];

  useEffect(() => {
    setBgLoaded(false);
    setBgError(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setOverlayPos({ x: 0, y: 0 });
    setOverlayScale(1);
    setSurfaceDepth(current.overlayStyle.opacity || 0.8);
  }, [activeMockup, current.overlayStyle.opacity]);

  useEffect(() => {
    setIsMounted(true);
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  const handleClose = () => {
    setIsMounted(false);
    setTimeout(onClose, 300);
  };

  const envFilters = {
    studio: 'brightness(1) contrast(1)',
    sunset: 'brightness(0.85) contrast(1.1) sepia(0.3) hue-rotate(-15deg)',
    industrial: 'brightness(0.9) contrast(1.2) saturate(0.5) hue-rotate(180deg)',
    soft: 'brightness(1.05) contrast(0.9) saturate(0.8) blur(0.5px)',
  };

  const handleExport = async (action: 'download' | 'copy') => {
    setIsExporting(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No 2D context');
      }

      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.src = (current as any).exportBg || current.bg;
      await new Promise((resolve, reject) => {
        bgImg.onload = resolve;
        bgImg.onerror = () => reject(new Error('Image failed to load'));
      });

      canvas.width = bgImg.naturalWidth;
      canvas.height = bgImg.naturalHeight;

      // Apply env filter to canvas
      ctx.filter = envFilters[environment];
      ctx.drawImage(bgImg, 0, 0);

      if (designImage) {
        const designImg = new Image();
        designImg.crossOrigin = 'anonymous';
        designImg.src = designImage;
        await new Promise((resolve, reject) => {
          designImg.onload = resolve;
          designImg.onerror = () => reject(new Error('Image failed to load'));
        });

        const baseTop = (parseFloat(current.overlayStyle.top) / 100) * canvas.height;
        const baseLeft = (parseFloat(current.overlayStyle.left) / 100) * canvas.width;
        const baseWidth = (parseFloat(current.overlayStyle.width) / 100) * canvas.width;

        const width = baseWidth * overlayScale;
        const height = width * (designImg.naturalHeight / designImg.naturalWidth);
        // Use same offset calculation as preview: overlayPos is pixel offset from drag
        // Convert to canvas coordinates using the same ratio as the preview container
        const previewContainer = document.getElementById('mockup-preview');
        const containerWidth = previewContainer?.clientWidth || canvas.width;
        const containerHeight = previewContainer?.clientHeight || canvas.height;
        const left = baseLeft + (overlayPos.x / containerWidth) * canvas.width;
        const top = baseTop + (overlayPos.y / containerHeight) * canvas.height;

        ctx.save();
        ctx.globalCompositeOperation = current.overlayStyle.mixBlendMode === 'multiply' ? 'multiply' : 'source-over';
        ctx.globalAlpha = surfaceDepth;

        // Simplified warp for export (rotate only for now)
        if ((current.overlayStyle as any).transform) {
          const transformStr = (current.overlayStyle as any).transform as string;
          const match = transformStr.match(/rotate\(([-\d.]+)deg\)/);
          if (match) {
            const angle = (parseFloat(match[1]) * Math.PI) / 180;
            ctx.translate(left + width / 2, top + height / 2);
            ctx.rotate(angle);
            ctx.drawImage(designImg, -width / 2, -height / 2, width, height);
          } else {
            ctx.drawImage(designImg, left, top, width, height);
          }
        } else {
          ctx.drawImage(designImg, left, top, width, height);
        }

        ctx.restore();
      }

      if (action === 'download') {
        const link = document.createElement('a');
        link.download = `mockup-${current.id}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        showToast('Downloaded successfully!');
      } else {
        canvas.toBlob(async (blob) => {
          if (blob) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            showToast('Copied to clipboard!');
          }
        }, 'image/png');
      }
    } catch (err) {
      log.error('[MockupModal] Export failed', err);
      showToast('Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && zoom > 1) {
      setPan((p) => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
    } else if (isDraggingOverlay) {
      const bounds = e.currentTarget.getBoundingClientRect();
      setOverlayPos((prev) => ({
        x: prev.x + (e.movementX / bounds.width) * 100,
        y: prev.y + (e.movementY / bounds.height) * 100,
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setIsDraggingOverlay(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 transition-all duration-300 ${isMounted ? 'backdrop-blur-sm opacity-100' : 'backdrop-blur-none opacity-0'}`}
      onMouseDown={handleClose}
    >
      <div
        className={`bg-[#1a1a1c] border border-white/10 rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] ${isFullscreen ? 'w-full h-full rounded-none' : 'w-[1100px] max-w-[calc(100vw-2rem)] h-[800px] max-h-[calc(100vh-2rem)]'} flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMounted ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#1f1f23]/50 backdrop-blur-xl z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
              <Icons.Mockup className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-black text-white tracking-tight uppercase text-sm">Mockup Studio Pro</h3>
          </div>
          <button
            aria-label="Close modal"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            title="Close"
          >
            <Icons.X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>

        {/* Local Toast Notification */}
        {toastMsg && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[110]">
            <div className="bg-purple-600 text-white px-6 py-2 rounded-full shadow-2xl text-[10px] font-black uppercase tracking-widest border border-white/20">
              {toastMsg}
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Controls */}
          {!isFullscreen && (
            <div
              ref={containerRef}
              className="w-64 bg-[#141417] border-r border-white/5 p-6 flex flex-col gap-1 overflow-y-auto custom-scrollbar outline-none"
              tabIndex={0}
            >
              <div className="flex-1">
                {Object.entries({
                  APPAREL: ['tshirt', 'hoodie'],
                  TECH: ['iphone', 'macbook'],
                  PRINT: ['poster'],
                  ACCESSORIES: ['tote'],
                }).map(([category, itemKeys]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 mt-1 px-2">
                      {category}
                    </div>
                    <div className="flex flex-col gap-1">
                      {itemKeys.map((key) => {
                        const item = (mockups as any)[key];
                        const isActive = activeMockup === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setActiveMockup(key as any)}
                            className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black transition-all duration-300 outline-none ${isActive ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'text-gray-500 hover:bg-white/5 hover:text-white border border-transparent'}`}
                          >
                            <item.icon
                              className={`w-3.5 h-3.5 transition-all ${isActive ? 'scale-110 opacity-100' : 'opacity-50 group-hover:opacity-100 group-hover:scale-110'}`}
                            />
                            <span className="truncate uppercase tracking-widest">{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Environment Toggles */}
              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 px-2">
                  Environment
                </div>
                <div className="grid grid-cols-2 gap-2 px-1">
                  {(['studio', 'sunset', 'industrial', 'soft'] as const).map((env) => (
                    <button
                      key={env}
                      onClick={() => setEnvironment(env)}
                      className={`py-2 rounded-xl text-[9px] font-black uppercase transition-all border ${environment === env ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-gray-600 hover:text-gray-400'}`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              {/* Displacement Toggle */}
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tactile Warp</span>
                  <button
                    onClick={() => setUseDisplacement(!useDisplacement)}
                    className={`w-10 h-5 rounded-full transition-all relative ${useDisplacement ? 'bg-purple-600' : 'bg-gray-800'}`}
                  >
                    <div
                      className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${useDisplacement ? 'left-6' : 'left-1'}`}
                    />
                  </button>
                </div>
              </div>

              {/* Surface Controls */}
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-4 px-2">
                  <span className="text-[10px] font-black text-white tracking-widest uppercase">Material Depth</span>
                  <span className="text-[10px] font-mono text-purple-400">{Math.round(surfaceDepth * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.01"
                  aria-label="Material Depth"
                  value={surfaceDepth}
                  onChange={(e) => setSurfaceDepth(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Perspective Warp */}
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-4 px-2">
                  <span className="text-[10px] font-black text-white tracking-widest uppercase">Perspective Warp</span>
                </div>
                <div className="space-y-3 px-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 w-8">X°</span>
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      step="1"
                      aria-label="Perspective Warp X"
                      value={perspectiveWarp.rotateX}
                      onChange={(e) => setPerspectiveWarp({ ...perspectiveWarp, rotateX: parseInt(e.target.value) })}
                      className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <span className="text-[10px] font-mono text-gray-500 w-8 text-right">
                      {perspectiveWarp.rotateX}°
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 w-8">Y°</span>
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      step="1"
                      aria-label="Perspective Warp Y"
                      value={perspectiveWarp.rotateY}
                      onChange={(e) => setPerspectiveWarp({ ...perspectiveWarp, rotateY: parseInt(e.target.value) })}
                      className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <span className="text-[10px] font-mono text-gray-500 w-8 text-right">
                      {perspectiveWarp.rotateY}°
                    </span>
                  </div>
                  {(perspectiveWarp.rotateX !== 0 || perspectiveWarp.rotateY !== 0) && (
                    <button
                      onClick={() => setPerspectiveWarp({ rotateX: 0, rotateY: 0 })}
                      className="text-[10px] text-gray-500 hover:text-white transition-colors"
                    >
                      Reset perspective
                    </button>
                  )}
                </div>
              </div>

              {/* Custom Background Upload */}
              <div className="mt-6 pt-6 border-t border-white/5">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2 block mb-3">
                  Custom Background
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setCustomBg(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <div className="flex gap-2 px-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Icons.Upload className="w-3.5 h-3.5" />
                    Upload
                  </button>
                  {customBg && (
                    <button
                      onClick={() => setCustomBg(null)}
                      className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 hover:text-red-400 transition-all"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Preview Area */}
          <div className="flex-1 bg-[#0e1318] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
            {/* Header Actions */}
            <div className="absolute top-6 right-6 z-20 flex gap-3">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="w-10 h-10 flex items-center justify-center bg-[#1f1f23]/80 backdrop-blur-md hover:bg-white/10 text-white rounded-xl shadow-xl border border-white/5 transition-all"
              >
                {isFullscreen ? <Icons.Minimize className="w-5 h-5" /> : <Icons.Maximize className="w-5 h-5" />}
              </button>
              <button
                onClick={() => handleExport('download')}
                disabled={isExporting}
                className="px-6 h-10 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl disabled:opacity-50 min-w-[160px] justify-center"
              >
                {isExporting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Icons.Download className="w-3.5 h-3.5" /> Download HD
                  </>
                )}
              </button>
            </div>

            <div className="w-full h-full flex items-center justify-center">
              <div
                id="mockup-preview"
                className={`relative shadow-2xl rounded-lg overflow-hidden bg-gray-900 transition-transform duration-300 ${zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'}`}
                style={{
                  height: '100%',
                  maxHeight: '100%',
                  maxWidth: '100%',
                  aspectRatio: current.id === 'poster' ? '2/3' : current.id === 'tshirt' ? '3/4' : '1/1',
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                <div
                  style={{
                    transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                    transformOrigin: 'center',
                    width: '100%',
                    height: '100%',
                  }}
                >
                  {!bgLoaded && <div className="absolute inset-0 bg-gray-800 animate-pulse" />}

                  <img
                    src={customBg || current.bg}
                    className={`w-full h-full object-cover transition-opacity duration-700 ${bgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    style={{ filter: envFilters[environment] }}
                    onLoad={() => setBgLoaded(true)}
                    onError={() => setBgError(true)}
                    alt="Mockup Background"
                    draggable={false}
                  />

                  {/* Error State Overlay */}
                  {bgError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-50 text-white">
                      <Icons.AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                      <span className="font-black uppercase text-xs">Creation Error</span>
                    </div>
                  )}

                  {/* Design Overlay */}
                  {bgLoaded && designImage && (
                    <div
                      className={`absolute cursor-move group/overlay ${isDraggingOverlay ? 'ring-2 ring-purple-500' : ''}`}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setIsDraggingOverlay(true);
                        e.currentTarget.setPointerCapture(e.pointerId);
                      }}
                      style={{
                        top: `calc(${current.overlayStyle.top} + ${overlayPos.y}%)`,
                        left: `calc(${current.overlayStyle.left} + ${overlayPos.x}%)`,
                        width: `calc(${current.overlayStyle.width} * ${overlayScale})`,
                        transform: `${(current.overlayStyle as any).transform || ''} perspective(800px) rotateX(${perspectiveWarp.rotateX}deg) rotateY(${perspectiveWarp.rotateY}deg)`,
                        mixBlendMode: current.overlayStyle.mixBlendMode as any,
                        opacity: surfaceDepth,
                        filter: `${environment === 'sunset' ? 'sepia(0.1) brightness(0.95)' : ''} ${useDisplacement ? 'contrast(1.05)' : ''}`,
                      }}
                    >
                      {/* Displacement Map Simulation */}
                      {useDisplacement && current.category === 'APPAREL' && (
                        <div
                          className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay"
                          style={{
                            backgroundImage: `url(${current.bg})`,
                            backgroundSize: 'cover',
                            filter: 'contrast(3) grayscale(1) invert(1)',
                          }}
                        />
                      )}

                      <img
                        src={designImage}
                        className="w-full h-auto pointer-events-none"
                        alt="Your Design"
                        draggable={false}
                      />

                      {/* Reflections for Tech */}
                      {(current as any).hasReflections && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-white/5 to-transparent pointer-events-none mix-blend-screen" />
                      )}

                      {/* Scale Handle */}
                      <div
                        className="absolute -bottom-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg cursor-nwse-resize opacity-0 group-hover/overlay:opacity-100 transition-opacity"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          const startX = e.clientX;
                          const startScale = overlayScale;
                          const onMove = (mv: PointerEvent) => {
                            const delta = (mv.clientX - startX) / 100;
                            setOverlayScale(Math.max(0.2, Math.min(3, startScale + delta)));
                          };
                          const onUp = () => {
                            window.removeEventListener('pointermove', onMove);
                            window.removeEventListener('pointerup', onUp);
                          };
                          window.addEventListener('pointermove', onMove);
                          window.addEventListener('pointerup', onUp);
                        }}
                      >
                        <div className="w-2 h-2 bg-black rounded-sm" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 right-8 text-[10px] text-gray-600 font-bold uppercase tracking-widest italic opacity-50">
              Tactile Engine v2.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
