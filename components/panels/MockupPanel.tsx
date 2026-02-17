
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Icons } from '../../constants';
import { dynamicMockupsService } from '../../services/dynamicMockupsService';

import { useStore } from '../../store/useStore';
import { v4 as uuidv4 } from 'uuid';

interface MockupPanelProps {
  onExportForMockup: () => Promise<string>;
}

interface MockupPlacement {
  top: number;
  left: number;
  width: number; // percentage width relative to bg
  rotate: number; // degrees
  skewX: number;
  skewY: number;
  opacity: number;
  blendMode: 'multiply' | 'screen' | 'overlay' | 'source-over' | 'soft-light';
}

interface MockupDef {
  id: string;
  name: string;
  category: string;
  bg: string;
  defaultPlacement: MockupPlacement;
}

const MOCKUP_CATEGORIES = ['All', 'Apparel', 'Digital', 'Print', 'Packaging', 'Outdoor'];

// Helper to create default placement
const defPlace = (top = 30, left = 30, width = 40, rotate = 0, skewX = 0, skewY = 0, opacity = 0.9, blendMode: MockupPlacement['blendMode'] = 'multiply'): MockupPlacement => ({
  top, left, width, rotate, skewX, skewY, opacity, blendMode
});

export const MockupPanel: React.FC<MockupPanelProps> = ({ onExportForMockup }) => {
  const addLayer = useStore(state => state.addLayer);
  const canvasSize = useStore(state => state.canvasSize);

  const onAddToCanvas = (src: string) => {
    addLayer({
      id: uuidv4(),
      type: 'image',
      name: 'Mockup Layer',
      src,
      x: canvasSize.width / 2 - 250,
      y: canvasSize.height / 2 - 250,
      width: 500,
      height: 500,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      flipX: false,
      flipY: false,
      blendMode: 'normal',
      filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0, sepia: 0, hueRotate: 0, vignette: 0, opacity: 1 },
      skewX: 0,
      skewY: 0
    });
  };
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeMockupId, setActiveMockupId] = useState<string>('tshirt_flat');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLive, setIsLive] = useState(false); // Auto-update toggle
  const [proRenderUrl, setProRenderUrl] = useState<string | null>(null);
  const [isProGenerating, setIsProGenerating] = useState(false);

  // Current placement state (initialized from mockup default)
  const [placement, setPlacement] = useState<MockupPlacement>(defPlace());

  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const mockups: MockupDef[] = [
    // Apparel
    { id: 'tshirt_flat', name: 'T-Shirt Flat', category: 'Apparel', bg: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80', defaultPlacement: defPlace(25, 28, 45) },
    { id: 'hoodie', name: 'Hoodie', category: 'Apparel', bg: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80', defaultPlacement: defPlace(25, 30, 40) },
    { id: 'model_tshirt', name: 'Model T-Shirt', category: 'Apparel', bg: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80', defaultPlacement: defPlace(30, 32, 35) },
    { id: 'totebag', name: 'Tote Bag', category: 'Apparel', bg: 'https://images.unsplash.com/photo-1597484662317-c9253e609141?auto=format&fit=crop&w=600&q=80', defaultPlacement: defPlace(45, 35, 30) },
    { id: 'minimal_tshirt', name: 'Minimal White T-Shirt', category: 'Apparel', bg: '/New folder/man-wearing-minimal-white-t-shirt.jpg', defaultPlacement: defPlace(30, 32, 35) },
    { id: 'grunge_apparel', name: 'Grunge Black Top', category: 'Apparel', bg: '/New folder/teenage-girl-black-top-flannel-shirt-youth-apparel-grunge-fashion-shoot.jpg', defaultPlacement: defPlace(25, 30, 40) },

    // Digital
    { id: 'macbook', name: 'MacBook', category: 'Digital', bg: 'https://images.unsplash.com/photo-1517336712603-d2d0f0464686?auto=format&fit=crop&w=600&q=80', defaultPlacement: defPlace(18, 22, 56, 0, 0, 0, 0.95, 'source-over') },
    { id: 'iphone', name: 'iPhone', category: 'Digital', bg: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=600&q=80', defaultPlacement: defPlace(20, 38, 25, 0, 0, 0, 0.95, 'source-over') },
    { id: 'ipad', name: 'iPad Pro', category: 'Digital', bg: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80', defaultPlacement: defPlace(15, 25, 50, 0, 0, 0, 0.95, 'source-over') },

    // Print
    { id: 'poster_frame', name: 'Poster Frame', category: 'Print', bg: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?auto=format&fit=crop&w=600&q=80', defaultPlacement: defPlace(15, 27, 46, -2, 0, 0, 0.9, 'multiply') },
    { id: 'business_card', name: 'Business Cards', category: 'Print', bg: 'https://images.unsplash.com/photo-1589330694653-ded6df53f6ee?auto=format&fit=crop&w=600&q=80', defaultPlacement: defPlace(35, 25, 50, -15, 10, 0, 0.9, 'multiply') },
    { id: 'magazine', name: 'Magazine', category: 'Print', bg: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80', defaultPlacement: defPlace(20, 30, 40, 5, 0, 0, 0.9, 'multiply') },

    // Packaging
    { id: 'coffee_bag', name: 'Coffee Bag', category: 'Packaging', bg: 'https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?auto=format&fit=crop&w=600&q=80', defaultPlacement: defPlace(30, 35, 30, 0, 0, 5, 0.9, 'multiply') },
    { id: 'box', name: 'Mailer Box', category: 'Packaging', bg: 'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&w=600&q=80', defaultPlacement: defPlace(25, 25, 50, 0, 0, 0, 0.9, 'multiply') },
    { id: 'cosmetic', name: 'Bottle', category: 'Packaging', bg: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80', defaultPlacement: defPlace(40, 45, 10, 0, 0, 0, 0.8, 'multiply') },

    // Outdoor
    { id: 'billboard', name: 'Billboard', category: 'Outdoor', bg: 'https://images.unsplash.com/photo-1542662565-7e4b66b5adaa?auto=format&fit=crop&w=600&q=80', defaultPlacement: defPlace(10, 25, 50) },
    { id: 'sign', name: 'Wall Sign', category: 'Outdoor', bg: 'https://images.unsplash.com/photo-1514454529242-9e467756334d?auto=format&fit=crop&w=600&q=80', defaultPlacement: defPlace(20, 30, 40) }
  ];

  const currentMockup = useMemo(() => mockups.find(m => m.id === activeMockupId) || mockups[0], [activeMockupId]);

  // When mockup changes, reset placement to default
  useEffect(() => {
    if (currentMockup) {
      setPlacement(currentMockup.defaultPlacement);
    }
  }, [currentMockup]);

  const filteredMockups = useMemo(() => {
    if (activeCategory === 'All') return mockups;
    return mockups.filter(m => m.category === activeCategory);
  }, [activeCategory]);

  // Capture design snapshot
  const captureDesign = async () => {
    try {
      const url = await onExportForMockup();
      setPreviewImage(url);
      return url;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // Initial load
  useEffect(() => {
    captureDesign();
    return () => stopLive();
  }, []);

  const stopLive = () => {
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (isLive) {
      captureDesign();
      liveIntervalRef.current = setInterval(captureDesign, 2000);
    } else {
      stopLive();
    }
    return () => stopLive();
  }, [isLive]);

  // Generate the composite image
  const generateComposite = async (): Promise<string | null> => {
    if (!previewImage) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Load Background
    const bgImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = currentMockup.bg;
    });

    canvas.width = bgImg.naturalWidth;
    canvas.height = bgImg.naturalHeight;
    ctx.drawImage(bgImg, 0, 0);

    // 2. Load Design
    const designImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = previewImage;
    });

    // 3. Draw Design with transformations
    ctx.save();
    const { top, left, width, rotate, skewX, skewY, opacity, blendMode } = placement;

    // Calculate pixel data
    const x = (left / 100) * canvas.width;
    const y = (top / 100) * canvas.height;
    const w = (width / 100) * canvas.width;
    // Maintain aspect ratio of design
    const aspect = designImg.width / designImg.height;
    const h = w / aspect;

    // Apply transformations centered on the image
    // Note: Canvas transforms are cumulative
    const centerX = x + w / 2;
    const centerY = y + h / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.transform(1, (skewY * Math.PI) / 180, (skewX * Math.PI) / 180, 1, 0, 0);
    ctx.translate(-centerX, -centerY);

    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = blendMode;

    ctx.drawImage(designImg, x, y, w, h);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  // Update preview when placement or source images change
  useEffect(() => {
    let active = true;
    const update = async () => {
      if (!previewImage) return;
      setIsGenerating(true);
      const url = await generateComposite();
      if (active && url) setGeneratedPreview(url);
      setIsGenerating(false);
    };
    // Debounce slightly for sliders
    const timer = setTimeout(update, 100);
    return () => { active = false; clearTimeout(timer); };
  }, [placement, previewImage, currentMockup]);

  const handleDownload = () => {
    if (generatedPreview) {
      const link = document.createElement('a');
      link.href = generatedPreview;
      link.download = `${currentMockup.name.toLowerCase().replace(/\s/g, '-')}-mockup.jpg`;
      link.click();
    }
  };

  const handleProRender = async () => {
    setIsProGenerating(true);
    setProRenderUrl(null);
    try {
      const designUrl = await captureDesign();
      if (!designUrl) throw new Error('Failed to capture design');

      const result = await dynamicMockupsService.generateMockup({
        mockupId: activeMockupId, // Ideally map to their template IDs
        designUrl: designUrl,
        placement: {
          top: placement.top,
          left: placement.left,
          width: placement.width,
          rotate: placement.rotate,
        }
      });

      if (result) {
        setProRenderUrl(result);
      }
    } catch (e) {
      console.error('Pro Render failed:', e);
    } finally {
      setIsProGenerating(false);
    }
  };

  const handleAddToCanvas = async () => {
    if (generatedPreview && onAddToCanvas) {
      onAddToCanvas(generatedPreview);
    }
  };

  const updatePlacement = (key: keyof MockupPlacement, val: any) => {
    setPlacement(p => ({ ...p, [key]: val }));
  };

  return (
    <div className="flex flex-col h-full bg-[#13161a]">
      {/* Category Tabs */}
      <div className="flex overflow-x-auto custom-scrollbar border-b border-gray-800 bg-[#0e1318]">
        {MOCKUP_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors ${activeCategory === cat ? 'text-[#7d2ae8] border-b-2 border-[#7d2ae8]' : 'text-gray-400 hover:text-white'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">

        {/* Helper Box */}
        <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
            <Icons.Magic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-200 mb-1">Smart Mockups</h4>
            <p className="text-[10px] text-blue-300/80 leading-relaxed">
              Automatically places your design onto high-quality product photos.
              Use the controls below to perfect the alignment.
            </p>
          </div>
        </div>

        {/* Categories Grid */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Select Mockup</h3>
          <div className="grid grid-cols-2 gap-3">
            {filteredMockups.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMockupId(m.id)}
                className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${activeMockupId === m.id ? 'border-[#7d2ae8] ring-2 ring-[#7d2ae8]/20' : 'border-gray-800 hover:border-gray-600'
                  }`}
              >
                <img src={m.bg} alt={m.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-2">
                  <span className="text-[10px] font-bold text-white shadow-sm">{m.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview & Controls */}
        <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-[#0e1318]">
            <span className="text-xs font-bold text-gray-300">Preview</span>
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border transition-all ${isLive ? 'bg-red-900/20 border-red-500/50 text-red-400 animate-pulse' : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-red-500' : 'bg-gray-500'}`} />
              {isLive ? 'LIVE SYNC' : 'SYNC OFF'}
            </button>
          </div>

          <div className="aspect-video relative bg-[#0e1318] flex items-center justify-center p-4">
            {isGenerating && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="animate-spin w-6 h-6 border-2 border-[#7d2ae8] border-t-transparent rounded-full" />
              </div>
            )}
            {generatedPreview ? (
              <img src={generatedPreview} className="max-w-full max-h-full object-contain shadow-2xl rounded" />
            ) : (
              <span className="text-gray-600 text-xs">Generating preview...</span>
            )}
          </div>

          {/* Adjustments */}
          <div className="p-4 space-y-4 bg-[#1a1d21]">
            {/* Position */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-400">Position (X / Y)</span>
                <span className="text-gray-500">{Math.round(placement.left)}%, {Math.round(placement.top)}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="range" min="0" max="100"
                  value={placement.left} onChange={e => updatePlacement('left', Number(e.target.value))}
                  className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                />
                <input
                  type="range" min="0" max="100"
                  value={placement.top} onChange={e => updatePlacement('top', Number(e.target.value))}
                  className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                />
              </div>
            </div>

            {/* Scale & Rotate */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-400">Scale / Rotate</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="range" min="10" max="150"
                  value={placement.width} onChange={e => updatePlacement('width', Number(e.target.value))}
                  className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                  title="Scale"
                />
                <input
                  type="range" min="-180" max="180"
                  value={placement.rotate} onChange={e => updatePlacement('rotate', Number(e.target.value))}
                  className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                  title="Rotate"
                />
              </div>
            </div>

            {/* Perspective (Skew) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-400">Perspective (Skew X / Y)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="range" min="-45" max="45"
                  value={placement.skewX || 0} onChange={e => updatePlacement('skewX', Number(e.target.value))}
                  className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                />
                <input
                  type="range" min="-45" max="45"
                  value={placement.skewY || 0} onChange={e => updatePlacement('skewY', Number(e.target.value))}
                  className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                />
              </div>
            </div>

            {/* Opacity & Blend */}
            <div className="space-y-3 pt-2 border-t border-gray-700/50">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-gray-400">Blend Mode</label>
                <select
                  value={placement.blendMode}
                  onChange={(e) => updatePlacement('blendMode', e.target.value)}
                  className="bg-black border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-[#7d2ae8]"
                >
                  <option value="source-over">Normal</option>
                  <option value="multiply">Multiply (Realistic)</option>
                  <option value="screen">Screen (Light)</option>
                  <option value="overlay">Overlay</option>
                  <option value="soft-light">Soft Light</option>
                </select>
              </div>
            </div>

            {proRenderUrl && (
              <div className="mt-4 p-2 bg-[#1e252e] rounded-lg border border-[#7d2ae8]/30 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#7d2ae8] font-bold">PRO RENDER RESULTS</span>
                  <button onClick={() => setProRenderUrl(null)} className="text-gray-500 hover:text-white"><Icons.X className="w-3 h-3" /></button>
                </div>
                <img src={proRenderUrl} className="w-full rounded shadow-lg" alt="Pro Mockup" />
                <a
                  href={proRenderUrl}
                  download="mockup_pro.png"
                  className="mt-2 w-full py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1"
                >
                  <Icons.Download className="w-3 h-3" /> Save Render
                </a>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-3 bg-[#0e1318] border-t border-gray-800 flex flex-col gap-2">
            <button
              onClick={handleDownload}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Icons.Download className="w-4 h-4" />
              Quick Download
            </button>
            <button
              onClick={handleProRender}
              disabled={isProGenerating}
              className={`w-full py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${isProGenerating
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#7d2ae8] to-[#00c4cc] hover:from-[#6c23ce] hover:to-[#00b0b8] text-white shadow-lg'
                }`}
            >
              {isProGenerating ? (
                <>
                  <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div>
                  Rendering...
                </>
              ) : (
                <>
                  <Icons.Zap className="w-4 h-4 text-yellow-300" />
                  Pro Render (Dynamic)
                </>
              )}
            </button>
          </div>
        </div>

        <button
          onClick={handleAddToCanvas}
          className="w-full py-2 bg-gray-800 text-gray-300 hover:text-white border border-gray-700 rounded text-xs font-bold transition-colors"
        >
          Add Mockup to Canvas
        </button>
      </div>
    </div>
  );
};
export default MockupPanel;
