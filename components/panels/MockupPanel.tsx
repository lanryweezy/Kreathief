
import React, { useState } from 'react';
import { Icons } from '../../constants';
import { Button } from '../Button';

interface MockupPanelProps {
  onExportForMockup: () => Promise<string>;
  onAddToCanvas?: (src: string) => void;
}

interface MockupSettings {
  blendMode: 'multiply' | 'screen' | 'overlay' | 'normal' | 'soft-light';
  opacity: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface MockupDef {
  id: string;
  name: string;
  bg: string;
  // Placement percentages (0-100)
  placement: {
    top: number;
    left: number;
    width: number; // relative width
    rotate: number; // degrees
  };
}

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

export const MockupPanel: React.FC<MockupPanelProps> = ({ onExportForMockup, onAddToCanvas }) => {
  const [activeMockupId, setActiveMockupId] = useState<string>('tshirt');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [settings, setSettings] = useState<MockupSettings>({
    blendMode: 'multiply',
    opacity: 0.9,
    scale: 1,
    offsetX: 0,
    offsetY: 0
  });

  const mockups: MockupDef[] = [
    {
      id: 'tshirt',
      name: 'T-Shirt',
      bg: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      placement: { top: 30, left: 28, width: 45, rotate: 0 }
    },
    {
      id: 'poster',
      name: 'Poster Frame',
      bg: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      placement: { top: 15, left: 27, width: 46, rotate: -2 }
    },
    {
      id: 'tote',
      name: 'Tote Bag',
      bg: 'https://images.unsplash.com/photo-1597484662317-c9253e609141?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      placement: { top: 45, left: 35, width: 30, rotate: 0 }
    },
    {
      id: 'mug',
      name: 'Coffee Mug',
      bg: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      placement: { top: 35, left: 35, width: 30, rotate: 0 }
    },
    {
      id: 'phone',
      name: 'Phone Case',
      bg: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      placement: { top: 20, left: 38, width: 25, rotate: 0 }
    },
    {
      id: 'billboard',
      name: 'City Billboard',
      bg: 'https://images.unsplash.com/photo-1542662565-7e4b66b5adaa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      placement: { top: 10, left: 25, width: 50, rotate: 0 }
    }
  ];

  const currentMockup = mockups.find(m => m.id === activeMockupId) || mockups[0];

  const handleUpdatePreview = async () => {
    setIsGenerating(true);
    try {
      const dataUrl = await onExportForMockup();
      setPreviewImage(dataUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateComposite = async (): Promise<string> => {
      if (!previewImage) throw new Error("No design loaded");
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("No context");

      // Load background
      const bgImg = new Image();
      bgImg.crossOrigin = "anonymous";
      bgImg.src = currentMockup.bg;
      await new Promise((resolve, reject) => {
          bgImg.onload = resolve;
          bgImg.onerror = reject;
      });

      // Set canvas size to bg size (high res)
      canvas.width = bgImg.naturalWidth;
      canvas.height = bgImg.naturalHeight;

      // Draw background
      ctx.drawImage(bgImg, 0, 0);

      // Load design
      const designImg = new Image();
      designImg.src = previewImage;
      await new Promise((resolve, reject) => {
          designImg.onload = resolve;
          designImg.onerror = reject;
      });

      // Calculate placement
      const p = currentMockup.placement;
      const baseW = canvas.width * (p.width / 100);
      const aspect = designImg.width / designImg.height;
      const baseH = baseW / aspect;
      
      const baseX = canvas.width * (p.left / 100);
      const baseY = canvas.height * (p.top / 100);

      // Save context for transform
      ctx.save();
      
      // Move to center of placement area to rotate/scale properly
      const centerX = baseX + baseW / 2;
      const centerY = baseY + baseH / 2;
      
      ctx.translate(centerX, centerY);
      
      // Apply base rotation + user transforms
      ctx.rotate((p.rotate * Math.PI) / 180);
      
      // User scale
      ctx.scale(settings.scale, settings.scale);
      
      // User offset (relative to canvas size for consistency)
      // Multiplier 4 is arbitrary to make UI slider feel responsive on large canvas
      ctx.translate(settings.offsetX * 4, settings.offsetY * 4);

      // Apply effects
      ctx.globalAlpha = settings.opacity;
      ctx.globalCompositeOperation = settings.blendMode as GlobalCompositeOperation;

      // Draw centered
      ctx.drawImage(designImg, -baseW/2, -baseH/2, baseW, baseH);

      ctx.restore();
      
      return canvas.toDataURL('image/png', 0.9);
  };

  const handleDownload = async () => {
    if (!previewImage) return;
    setIsDownloading(true);
    
    try {
      const dataUrl = await generateComposite();
      const link = document.createElement('a');
      link.download = `mockup-${currentMockup.id}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Failed to create mockup download");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAddToCanvas = async () => {
    if (!previewImage || !onAddToCanvas) return;
    setIsDownloading(true);
    try {
        const dataUrl = await generateComposite();
        onAddToCanvas(dataUrl);
    } catch (e) {
        console.error(e);
        alert("Failed to add mockup to canvas");
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 bg-[#13161a]">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <Icons.Mockup className="w-5 h-5 text-[#7d2ae8]" />
        Mockup Studio
      </h3>

      {/* Preview Section */}
      <div className="mb-6 relative group">
         <div className="bg-[#1e1e1e] border border-gray-700 rounded-lg overflow-hidden relative shadow-lg">
            {/* The Background */}
            <div className="relative aspect-[3/4] w-full bg-black">
               <img src={currentMockup.bg} className="w-full h-full object-cover" alt="Product" />
               
               {/* The Design Overlay */}
               {previewImage && (
                  <div 
                    className="absolute origin-center transition-all duration-200 ease-out"
                    style={{
                       top: `${currentMockup.placement.top}%`,
                       left: `${currentMockup.placement.left}%`,
                       width: `${currentMockup.placement.width}%`,
                       // We can't set exact height in CSS easily without aspect ratio of image, 
                       // but standard img tag handles width auto-height
                       transform: `rotate(${currentMockup.placement.rotate}deg) translate(${settings.offsetX}px, ${settings.offsetY}px) scale(${settings.scale})`,
                       opacity: settings.opacity,
                       mixBlendMode: settings.blendMode as any
                    }}
                  >
                     <img src={previewImage} className="w-full h-auto block" alt="Design" />
                  </div>
               )}
               
               {/* Lighting/Texture Overlay (Fake fold/shadow) */}
               <div className="absolute inset-0 pointer-events-none mix-blend-multiply bg-gradient-to-tr from-black/20 via-transparent to-white/10 opacity-50"></div>
            </div>

            {/* Loading State */}
            {isGenerating && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                    <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mb-2"></div>
                    <span className="text-xs font-bold text-white">Rendering...</span>
                </div>
            )}
         </div>
         
         <div className="flex gap-2 mt-3 flex-wrap">
            <Button 
                onClick={handleUpdatePreview}
                className="w-full text-xs"
                disabled={isGenerating}
                variant="primary"
            >
                {previewImage ? "Refresh Source" : "Load Source"}
            </Button>
            <Button 
                onClick={handleAddToCanvas}
                className="flex-1 text-xs"
                disabled={!previewImage || isDownloading || isGenerating}
                variant="secondary"
            >
                Add to Canvas
            </Button>
            <Button 
                onClick={handleDownload}
                className="flex-1 text-xs"
                disabled={!previewImage || isDownloading || isGenerating}
                variant="secondary"
            >
                Download
            </Button>
         </div>
      </div>

      {/* Controls Section */}
      {previewImage && (
        <div className="mb-6 p-4 bg-[#1e1e1e] rounded-lg border border-gray-700 space-y-4">
           
           <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Blend Mode</label>
              <select 
                 value={settings.blendMode}
                 onChange={(e) => setSettings({...settings, blendMode: e.target.value as any})}
                 className="bg-[#252627] text-white text-xs border border-gray-600 rounded px-2 py-1 outline-none focus:border-[#7d2ae8]"
              >
                 <option value="multiply">Multiply</option>
                 <option value="screen">Screen</option>
                 <option value="overlay">Overlay</option>
                 <option value="normal">Normal</option>
                 <option value="soft-light">Soft Light</option>
              </select>
           </div>

           <div>
              <div className="flex justify-between mb-1">
                 <label className="text-[10px] font-bold text-gray-400 uppercase">Opacity</label>
                 <span className="text-[10px] text-gray-500">{Math.round(settings.opacity * 100)}%</span>
              </div>
              <input 
                 type="range" min="0.1" max="1" step="0.05"
                 value={settings.opacity}
                 onChange={(e) => setSettings({...settings, opacity: parseFloat(e.target.value)})}
                 className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
              />
           </div>

           <div>
              <div className="flex justify-between mb-1">
                 <label className="text-[10px] font-bold text-gray-400 uppercase">Scale</label>
                 <span className="text-[10px] text-gray-500">{Math.round(settings.scale * 100)}%</span>
              </div>
              <input 
                 type="range" min="0.1" max="2" step="0.05"
                 value={settings.scale}
                 onChange={(e) => setSettings({...settings, scale: parseFloat(e.target.value)})}
                 className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
              />
           </div>

           <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Position</label>
              <div className="grid grid-cols-3 gap-1">
                 <div />
                 <button onClick={() => setSettings(s => ({...s, offsetY: s.offsetY - 2}))} className="bg-[#252627] hover:bg-[#333] rounded p-1 flex justify-center"><Icons.ArrowUp className="w-3 h-3" /></button>
                 <div />
                 <button onClick={() => setSettings(s => ({...s, offsetX: s.offsetX - 2}))} className="bg-[#252627] hover:bg-[#333] rounded p-1 flex justify-center"><Icons.ArrowUp className="w-3 h-3 -rotate-90" /></button>
                 <button onClick={() => setSettings(s => ({...s, offsetX: 0, offsetY: 0}))} className="bg-[#252627] hover:bg-[#333] rounded p-1 text-[8px] font-bold text-center text-gray-400 hover:text-white">RST</button>
                 <button onClick={() => setSettings(s => ({...s, offsetX: s.offsetX + 2}))} className="bg-[#252627] hover:bg-[#333] rounded p-1 flex justify-center"><Icons.ArrowUp className="w-3 h-3 rotate-90" /></button>
                 <div />
                 <button onClick={() => setSettings(s => ({...s, offsetY: s.offsetY + 2}))} className="bg-[#252627] hover:bg-[#333] rounded p-1 flex justify-center"><Icons.ArrowDown className="w-3 h-3" /></button>
                 <div />
              </div>
           </div>

        </div>
      )}

      {/* Product Selection */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
         <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Products</h4>
         <div className="grid grid-cols-2 gap-3 pb-20">
            {mockups.map((item) => (
               <button
                  key={item.id}
                  onClick={() => { setActiveMockupId(item.id); }}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${activeMockupId === item.id ? 'border-[#7d2ae8] ring-2 ring-[#7d2ae8]/20' : 'border-gray-700 hover:border-gray-500'}`}
               >
                  <img src={item.bg} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-2">
                     <span className="text-xs font-bold text-white shadow-sm">{item.name}</span>
                  </div>
                  {activeMockupId === item.id && (
                     <div className="absolute top-2 right-2 bg-[#7d2ae8] rounded-full p-1 shadow-md">
                        <CheckIcon className="w-3 h-3 text-white" />
                     </div>
                  )}
               </button>
            ))}
         </div>
      </div>
    </div>
  );
};
