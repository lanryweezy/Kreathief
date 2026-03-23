import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../../constants';
import { log } from '../../utils/log';

interface MockupModalProps {
  designImage: string;
  onClose: () => void;
}

export const MockupModal: React.FC<MockupModalProps> = ({ designImage, onClose }) => {
  const [activeMockup, setActiveMockup] = useState<'tshirt' | 'hoodie' | 'iphone' | 'macbook' | 'poster' | 'tote'>('tshirt');
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
  const [shadowDepth, setShadowDepth] = useState(0.5);
  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    setBgLoaded(false);
    setBgError(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setOverlayPos({ x: 0, y: 0 });
    setOverlayScale(1);
    setSurfaceDepth(current.overlayStyle.opacity || 0.8);
  }, [activeMockup]);

  useEffect(() => {
    setIsMounted(true);
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  const handleClose = () => {
    setIsMounted(false);
    setTimeout(onClose, 300); // Wait for exit animation
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
      overlayStyle: { top: '30%', left: '28%', width: '45%', mixBlendMode: 'multiply', opacity: 0.9, transform: undefined }
    },
    hoodie: {
      id: 'hoodie',
      name: 'Heavyweight Hoodie',
      category: 'APPAREL',
      icon: Icons.Layout,
      bg: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      exportBg: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=100',
      aspectRatio: 'aspect-[3/4]',
      overlayStyle: { top: '35%', left: '32%', width: '36%', mixBlendMode: 'multiply', opacity: 0.85, transform: undefined }
    },
    iphone: {
      id: 'iphone',
      name: 'iPhone 16 Pro',
      category: 'TECH',
      icon: Icons.Smartphone,
      bg: 'https://images.unsplash.com/photo-1603899122634-f086ca5f5ddd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      exportBg: 'https://images.unsplash.com/photo-1603899122634-f086ca5f5ddd?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=100',
      aspectRatio: 'aspect-[9/16]',
      overlayStyle: { top: '11.5%', left: '14.5%', width: '71%', mixBlendMode: 'normal', opacity: 1, borderRadius: '48px' },
      hasReflections: true
    },
    macbook: {
      id: 'macbook',
      name: 'MacBook Air M3',
      category: 'TECH',
      icon: Icons.Monitor,
      bg: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
      exportBg: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=100',
      aspectRatio: 'aspect-[16/10]',
      overlayStyle: { top: '10.5%', left: '16.5%', width: '67%', mixBlendMode: 'normal', opacity: 1, borderRadius: '4px' },
      hasReflections: true
    },
    poster: {
      id: 'poster',
      name: 'A4 Matte Poster',
      category: 'PRINT',
      icon: Icons.Image,
      bg: `https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85`,
      exportBg: `https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=100`,
      aspectRatio: 'aspect-[2/3]',
      overlayStyle: { top: '15%', left: '27%', width: '46%', transform: 'rotate(-2deg)', mixBlendMode: 'multiply', opacity: 1 }
    },
    tote: {
      id: 'tote',
      name: 'Canvas Tote Bag',
      category: 'ACCESSORIES',
      icon: Icons.Box,
      bg: `https://images.unsplash.com/photo-1597484662317-c9253e609141?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85`,
      exportBg: `https://images.unsplash.com/photo-1597484662317-c9253e609141?ixlib=rb-4.0.3&auto=format&fit=crop&w=4000&q=100`,
      aspectRatio: 'aspect-square',
      overlayStyle: { top: '45%', left: '35%', width: '30%', mixBlendMode: 'multiply', opacity: 0.85, transform: undefined }
    }
  };

  const current = mockups[activeMockup];

  const prefetch = (key: keyof typeof mockups) => {
    const img = new Image();
    img.src = mockups[key].bg;
  };

  const handleExport = async (action: 'download' | 'copy') => {
    setIsExporting(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {throw new Error('No 2D context');}

      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.src = (current as any).exportBg || current.bg;
      await new Promise((resolve) => {
        bgImg.onload = resolve;
      });

      canvas.width = bgImg.naturalWidth;
      canvas.height = bgImg.naturalHeight;

      ctx.drawImage(bgImg, 0, 0);

      if (designImage) {
        const designImg = new Image();
        designImg.crossOrigin = 'anonymous';
        designImg.src = designImage;
        await new Promise((resolve) => {
          designImg.onload = resolve;
        });

        const baseTop = (parseFloat(current.overlayStyle.top) / 100) * canvas.height;
        const baseLeft = (parseFloat(current.overlayStyle.left) / 100) * canvas.width;
        const baseWidth = (parseFloat(current.overlayStyle.width) / 100) * canvas.width;

        const width = baseWidth * overlayScale;
        const height = width * (designImg.naturalHeight / designImg.naturalWidth);
        const left = baseLeft + (overlayPos.x / 100) * canvas.width;
        const top = baseTop + (overlayPos.y / 100) * canvas.height;

        ctx.save();

        // Draw Shadow first if applicable (Apparel)
        if (current.category === 'APPAREL') {
          ctx.save();
          ctx.globalAlpha = shadowDepth * 0.4;
          ctx.filter = 'blur(10px)';
          ctx.drawImage(designImg, left + 5, top + 5, width, height);
          ctx.restore();
        }

        ctx.globalCompositeOperation = current.overlayStyle.mixBlendMode === 'multiply' ? 'multiply' : 'source-over';
        ctx.globalAlpha = surfaceDepth;

        if (current.overlayStyle.transform) {
          const match = current.overlayStyle.transform.match(/rotate\(([-\d.]+)deg\)/);
          if (match) {
            const angle = (parseFloat(match[1]) * Math.PI) / 180;
            ctx.translate(left + width / 2, top + height / 2);
            ctx.rotate(angle);
            ctx.drawImage(designImg, -width / 2, -height / 2, width, height);
          } else {
            ctx.drawImage(designImg, left, top, width, height);
          }
        } else {
          if ((current.overlayStyle as any).borderRadius) {
             const r = parseFloat((current.overlayStyle as any).borderRadius);
             ctx.beginPath();
             ctx.roundRect(left, top, width, height, (r / 100) * width);
             ctx.clip();
          }
          ctx.drawImage(designImg, left, top, width, height);
        }

        // Apply reflections to export
        if (current.hasReflections) {
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = 0.15;
          const grad = ctx.createLinearGradient(left, top, left + width, top + height);
          grad.addColorStop(0, 'rgba(255,255,255,0.8)');
          grad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
          grad.addColorStop(1, 'rgba(255,255,255,0.6)');
          ctx.fillStyle = grad;
          ctx.fillRect(left, top, width, height);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // Esc-Key Propagation Halting
    const keys = Object.keys(mockups) as Array<keyof typeof mockups>;
    const idx = keys.indexOf(activeMockup);
    if (e.key === 'ArrowDown' && idx < keys.length - 1) {setActiveMockup(keys[idx + 1]);}
    if (e.key === 'ArrowUp' && idx > 0) {setActiveMockup(keys[idx - 1]);}
    if (e.key === 'Escape') {
      if (isFullscreen) {setIsFullscreen(false);}
      else {handleClose();}
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || isFullscreen) {
      e.preventDefault();
      setZoom((z) => Math.max(1, Math.min(4, z - e.deltaY * 0.01)));
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
       setOverlayPos(prev => ({
         x: prev.x + (e.movementX / bounds.width) * 100,
         y: prev.y + (e.movementY / bounds.height) * 100
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
        onMouseDown={e => e.stopPropagation()}
        style={{ willChange: 'transform, opacity, width, height' }}
      >
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#1f1f23]/50 backdrop-blur-xl z-10 shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                <Icons.Mockup className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-black text-white tracking-tight uppercase text-sm">Mockup Studio</h3>
           </div>
           <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors" title="Close">
              <Icons.X className="w-4 h-4" />
           </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
           {/* Sidebar Controls */}
           {!isFullscreen && (
             <div 
                ref={containerRef}
                className="w-64 bg-[#141417] border-r border-white/5 p-6 flex flex-col gap-1 overflow-y-auto custom-scrollbar outline-none"
                onKeyDown={handleKeyDown}
                tabIndex={0}
             >
                <div className="flex-1">
                  {Object.entries({
                    'APPAREL': ['tshirt', 'hoodie'],
                    'TECH': ['iphone', 'macbook'],
                    'PRINT': ['poster'],
                    'ACCESSORIES': ['tote']
                  }).map(([category, itemKeys]) => (
                    <div key={category} className="mb-4 last:mb-0">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 mt-1 px-2">{category}</div>
                      <div className="flex flex-col gap-1">
                        {itemKeys.map((key) => {
                          const item = mockups[key as keyof typeof mockups];
                          const Icon = item.icon;
                          const isActive = activeMockup === key;
                          return (
                            <button
                              key={key}
                              onMouseEnter={() => prefetch(key as keyof typeof mockups)}
                              onClick={() => setActiveMockup(key as any)}
                              className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black transition-all duration-300 outline-none ${isActive ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'text-gray-500 hover:bg-white/5 hover:text-white border border-transparent'}`}
                            >
                              <Icon className={`w-3.5 h-3.5 transition-all ${isActive ? 'scale-110 opacity-100' : 'opacity-50 group-hover:opacity-100 group-hover:scale-110'}`} />
                              <span className="truncate uppercase tracking-widest">{item.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Surface Controls */}
                <div className="mt-8 pt-6 border-t border-white/5">
                   <div className="flex items-center justify-between mb-4 px-2">
                      <span className="text-[10px] font-black text-white tracking-widest uppercase">Surface Depth</span>
                      <span className="text-[10px] font-mono text-purple-400">{Math.round(surfaceDepth * 100)}%</span>
                   </div>
                   <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.01"
                      value={surfaceDepth}
                      onChange={(e) => setSurfaceDepth(parseFloat(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                   />
                   <div className="flex justify-between mt-2 px-1">
                      <span className="text-[8px] text-gray-600 font-bold uppercase">Soft</span>
                      <span className="text-[8px] text-gray-600 font-bold uppercase">Opaque</span>
                   </div>
                </div>

                {current.category === 'APPAREL' && (
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <span className="text-[10px] font-black text-white tracking-widest uppercase">Shadow Depth</span>
                        <span className="text-[10px] font-mono text-purple-400">{Math.round(shadowDepth * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={shadowDepth}
                        onChange={(e) => setShadowDepth(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                )}
             </div>
           )}

           {/* Preview Area */}
           <div 
             className="flex-1 bg-[#0e1318] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden"
             style={{
               backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.02) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.02) 75%)`,
               backgroundSize: '20px 20px',
               backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
             }}
           >
              {/* Header Actions for Export within Preview */}
              <div className="absolute top-6 right-6 z-20 flex gap-3">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="w-10 h-10 flex items-center justify-center bg-[#1f1f23]/80 backdrop-blur-md hover:bg-white/10 text-white rounded-xl transition-all shadow-xl border border-white/5 active:scale-95"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Icons.Minimize className="w-5 h-5" /> : <Icons.Maximize className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => handleExport('copy')}
                  disabled={isExporting}
                  className="px-4 h-10 bg-[#1f1f23]/80 backdrop-blur-md hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl border border-white/5 disabled:opacity-50 active:scale-95"
                  title="Copy to Clipboard"
                >
                  <Icons.Copy className="w-4 h-4" /> Copy
                </button>
                <button
                  onClick={() => handleExport('download')}
                  disabled={isExporting}
                  className="px-6 h-10 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.3)] disabled:opacity-50 min-w-[160px] justify-center active:scale-95"
                >
                  {isExporting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Icons.Download className="w-3.5 h-3.5" /> Download HD</>
                  )}
                </button>
              </div>

              {/* Toast */}
              {toastMsg && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#252627] text-white px-4 py-2 rounded-full text-xs font-bold shadow-2xl border border-gray-700 animate-slide-up z-50 flex items-center gap-2">
                  <Icons.Check className="w-3.5 h-3.5 text-green-400" /> {toastMsg}
                </div>
              )}

              <div className="w-full h-full flex items-center justify-center">
                <div 
                  className={`relative shadow-2xl rounded-lg overflow-hidden bg-gray-900 group/preview transition-transform duration-300 ${zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'}`}
                  style={{
                    height: '100%',
                    maxHeight: '100%',
                    maxWidth: '100%',
                    aspectRatio: current.id === 'poster' ? '2/3' : current.id === 'tshirt' ? '3/4' : '1/1'
                  }}
                  onDoubleClick={() => {
                  if (zoom > 1) {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  } else {
                    setZoom(2);
                  }
                }}
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                 <div style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: 'center', width: '100%', height: '100%', transition: isDragging ? 'none' : 'transform 0.2s ease-out' }}>
                   {/* Skeleton & Error */}
                   {!bgLoaded && !bgError && <div className="absolute inset-0 bg-gray-800 animate-pulse" />}
                   {bgError && <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center text-gray-500 text-xs">Failed to load mockup<br/>(Network Error)</div>}
                   
                   <img 
                      key={current.id}
                      src={current.bg} 
                      className={`w-full h-full object-cover transition-opacity duration-300 ${bgLoaded ? 'opacity-100' : 'opacity-0'}`} 
                      onLoad={() => setBgLoaded(true)}
                      onError={() => setBgError(true)}
                      style={{ imageRendering: 'high-quality' as any }}
                      alt="Mockup Background" 
                      draggable={false}
                   />

                   {/* Design Overlay */}
                   {bgLoaded && (
                     designImage ? (
                       <div
                         className={`absolute cursor-move group/overlay ${isDraggingOverlay ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent' : 'hover:ring-1 hover:ring-white/30'}`}
                         onPointerDown={(e) => {
                           e.stopPropagation();
                           setIsDraggingOverlay(true);
                           e.currentTarget.setPointerCapture(e.pointerId);
                         }}
                         style={{
                           top: `calc(${current.overlayStyle.top} + ${overlayPos.y}%)`,
                           left: `calc(${current.overlayStyle.left} + ${overlayPos.x}%)`,
                           width: `calc(${current.overlayStyle.width} * ${overlayScale})`,
                           transform: current.overlayStyle.transform,
                           mixBlendMode: current.overlayStyle.mixBlendMode as any,
                           opacity: surfaceDepth
                         }}
                       >
                         <img
                            src={designImage}
                            className="w-full h-auto pointer-events-none drop-shadow-sm"
                            alt="Your Design"
                            draggable={false}
                         />

                         {(current as any).hasReflections && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-white/5 to-white/10 pointer-events-none" />
                         )}
                         {/* Edge Glow for realism */}
                         {(current as any).hasReflections && (
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/20 pointer-events-none rounded-[inherit]" />
                         )}
                         {/* Scale Handles */}
                         <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg cursor-nwse-resize opacity-0 group-hover/overlay:opacity-100 transition-opacity"
                           onPointerDown={(e) => {
                             e.stopPropagation();
                             const startX = e.clientX;
                             const startScale = overlayScale;
                             const onMove = (moveEvent: PointerEvent) => {
                               const delta = (moveEvent.clientX - startX) / 100;
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
                           <div className="w-2.5 h-2.5 bg-black rounded-[2px]" />
                         </div>
                       </div>
                     ) : (
                       <div 
                          className="absolute border-2 border-dashed border-gray-500/50 rounded-lg flex flex-col items-center justify-center text-gray-500/50 text-xs text-center font-bold tracking-widest uppercase bg-black/20 pointer-events-none"
                          style={current.overlayStyle as any}
                       >
                         No Design
                       </div>
                     )
                   )}
                 </div>
              </div>
              </div>

              <div className="absolute bottom-2 right-4 text-[10px] text-gray-600 font-medium">
                 Mockup rendering is an approximation. Colors may vary in print.
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};