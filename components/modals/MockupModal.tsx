import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../../constants';
import { log } from '../../utils/log';

interface MockupModalProps {
  designImage: string;
  onClose: () => void;
}

export const MockupModal: React.FC<MockupModalProps> = ({ designImage, onClose }) => {
  const [activeMockup, setActiveMockup] = useState<'tshirt' | 'poster' | 'tote'>('tshirt');
  const [isMounted, setIsMounted] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [bgError, setBgError] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
      name: 'Premium Cotton T-Shirt',
      category: 'APPAREL',
      icon: Icons.Layout,
      bg: `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=${window.devicePixelRatio > 1 ? 1600 : 800}&q=80`,
      aspectRatio: 'aspect-[3/4]',
      overlayStyle: { top: '30%', left: '28%', width: '45%', mixBlendMode: 'multiply', opacity: 0.9, transform: undefined }
    },
    poster: {
      id: 'poster',
      name: 'A4 Matte Poster',
      category: 'PRINT',
      icon: Icons.Image,
      bg: `https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=${window.devicePixelRatio > 1 ? 1600 : 800}&q=80`,
      aspectRatio: 'aspect-[2/3]',
      overlayStyle: { top: '15%', left: '27%', width: '46%', transform: 'rotate(-2deg)', mixBlendMode: 'multiply', opacity: 1 }
    },
    tote: {
      id: 'tote',
      name: 'Canvas Tote Bag',
      category: 'ACCESSORIES',
      icon: Icons.Box,
      bg: `https://images.unsplash.com/photo-1597484662317-c9253e609141?ixlib=rb-4.0.3&auto=format&fit=crop&w=${window.devicePixelRatio > 1 ? 1600 : 800}&q=80`,
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
      bgImg.src = current.bg;
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

        const top = (parseFloat(current.overlayStyle.top) / 100) * canvas.height;
        const left = (parseFloat(current.overlayStyle.left) / 100) * canvas.width;
        const width = (parseFloat(current.overlayStyle.width) / 100) * canvas.width;
        const height = width * (designImg.naturalHeight / designImg.naturalWidth);

        ctx.save();
        ctx.globalCompositeOperation = current.overlayStyle.mixBlendMode === 'multiply' ? 'multiply' : 'source-over';
        ctx.globalAlpha = current.overlayStyle.opacity || 1;

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
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 transition-all duration-300 ${isMounted ? 'backdrop-blur-sm opacity-100' : 'backdrop-blur-none opacity-0'}`} 
      onMouseDown={handleClose}
    >
      <div 
        className={`bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl ${isFullscreen ? 'w-full h-full rounded-none' : 'w-[1000px] max-w-[calc(100vw-2rem)] h-[750px] max-h-[calc(100vh-2rem)]'} flex flex-col overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMounted ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        onMouseDown={e => e.stopPropagation()}
        style={{ willChange: 'transform, opacity, width, height' }}
      >
        <div className="h-14 border-b border-gray-700 flex items-center justify-between px-6 bg-[#252627] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] z-10 shrink-0">
           <div className="flex items-center gap-2">
              <Icons.Mockup className="w-5 h-5 text-[#7d2ae8]" />
              <h3 className="font-bold text-white">Mockup Studio</h3>
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
                className="w-56 bg-[#13161a] border-r border-gray-700 p-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar outline-none"
                onKeyDown={handleKeyDown}
                tabIndex={0}
             >
                {Object.entries({
                  'APPAREL': ['tshirt'],
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
                            className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#7d2ae8] focus-visible:ring-offset-1 focus-visible:ring-offset-[#13161a] ${isActive ? 'bg-[#7d2ae8]/15 text-[#7d2ae8] border-l-[3px] border-[#7d2ae8]' : 'text-gray-400 hover:bg-[#252627] hover:text-white hover:translate-x-1 border-l-[3px] border-transparent'}`}
                          >
                            <Icon className={`w-4 h-4 transition-opacity ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} /> 
                            <span className="truncate">{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
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
              <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="w-8 h-8 flex items-center justify-center bg-[#252627] hover:bg-gray-700 text-white rounded-md transition-colors shadow-lg border border-gray-700"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Icons.Minimize className="w-4 h-4" /> : <Icons.Maximize className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleExport('copy')}
                  disabled={isExporting}
                  className="px-3 py-1.5 bg-[#252627] hover:bg-gray-700 text-white rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg border border-gray-700 disabled:opacity-50"
                  title="Copy to Clipboard"
                >
                  <Icons.Copy className="w-3.5 h-3.5" /> Copy
                </button>
                <button
                  onClick={() => handleExport('download')}
                  disabled={isExporting}
                  className="px-4 py-1.5 bg-[#7d2ae8] hover:bg-[#6c24c9] text-white rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-[#7d2ae8]/20 disabled:opacity-50 min-w-[140px] justify-center"
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
                       <img 
                          src={designImage} 
                          className="absolute object-contain pointer-events-none drop-shadow-sm blur-[0px]"
                          style={{
                            ...current.overlayStyle,
                            WebkitSupports: 'mix-blend-mode: multiply'
                          } as any}
                          alt="Your Design"
                          draggable={false}
                       />
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