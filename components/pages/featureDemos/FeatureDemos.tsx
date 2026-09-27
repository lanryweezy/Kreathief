import React, { useState, useEffect } from 'react';
import { Icons } from '../../../constants';

interface FeatureDemoProps {
  onLaunchEditor: (tool?: string) => void;
}

// ============================================================================
// 1. MAGIC ERASER DEMO
// ============================================================================
export const EraserDemo: React.FC<FeatureDemoProps> = ({ onLaunchEditor }) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [selectedScene, setSelectedScene] = useState<number>(0);
  const [showMaskPulse, setShowMaskPulse] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const scenes = [
    {
      id: 'travel',
      name: 'Travel Crowd',
      before: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      after: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
      maskPosition: { top: '48%', left: '42%', width: '130px', height: '130px' },
      label: 'Crowd of tourists removed',
    },
    {
      id: 'portrait',
      name: 'Street Photobomb',
      before: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
      after: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
      maskPosition: { top: '35%', left: '68%', width: '100px', height: '120px' },
      label: 'Photobomber removed seamlessly',
    },
    {
      id: 'product',
      name: 'Watermark & Scratch',
      before: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
      after: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
      maskPosition: { top: '55%', left: '25%', width: '140px', height: '80px' },
      label: 'Dust, scratches & timestamp erased',
    },
  ];

  const current = scenes[selectedScene];

  const handleSimulateErase = () => {
    setIsScanning(true);
    setSliderPos(15);
    setTimeout(() => {
      setSliderPos(95);
      setIsScanning(false);
    }, 900);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-dark-3/80 p-3 rounded-xl border border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mr-1">Preset:</span>
          {scenes.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedScene(idx);
                setSliderPos(50);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedScene === idx
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMaskPulse(!showMaskPulse)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
              showMaskPulse
                ? 'border-red-500/40 text-red-300 bg-red-500/10'
                : 'border-white/10 text-gray-400 bg-white/5'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Brush Mask</span>
          </button>

          <button
            onClick={handleSimulateErase}
            disabled={isScanning}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Icons.Wand className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'AI Inpainting...' : 'Auto-Erase'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Slider Canvas */}
      <div className="relative h-80 sm:h-[420px] rounded-xl overflow-hidden select-none bg-surface-dark-3 border border-white/10 shadow-inner group">
        {/* Clean / Inpainted Layer (After) */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${current.after})` }}
        >
          <div className="absolute top-4 right-4 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-1.5 rounded-lg font-bold backdrop-blur-md flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>AI Generative Fill (Clean)</span>
          </div>
        </div>

        {/* Original / Masked Layer (Before) clipped by slider */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${current.before})`,
              width: '100%',
              minWidth: '700px',
            }}
          >
            {/* Simulated Brush Stroke Mask */}
            {showMaskPulse && (
              <div
                className="absolute rounded-full bg-red-500/35 border-2 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.6)] backdrop-blur-[1px] flex items-center justify-center animate-pulse"
                style={{
                  top: current.maskPosition.top,
                  left: current.maskPosition.left,
                  width: current.maskPosition.width,
                  height: current.maskPosition.height,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <span className="text-[10px] font-black uppercase tracking-wider text-white bg-red-600/90 px-2 py-0.5 rounded shadow">
                  Erase Mask
                </span>
              </div>
            )}

            <div className="absolute top-4 left-4 bg-red-950/90 border border-red-500/40 text-red-300 text-xs px-3 py-1.5 rounded-lg font-bold backdrop-blur-md flex items-center gap-1.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>Original (With Clutter)</span>
            </div>
          </div>
        </div>

        {/* Scanning beam effect when Erase is triggered */}
        {isScanning && (
          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-brand-400 to-transparent shadow-[0_0_15px_#a855f7] animate-bounce" />
          </div>
        )}

        {/* Split Slider Bar Handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(255,255,255,0.8)] z-20 flex items-center justify-center pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="w-9 h-9 rounded-full bg-surface-dark-1 border-2 border-white shadow-2xl flex items-center justify-center text-xs text-white font-black">
            ↔
          </div>
        </div>

        {/* Hidden drag range input */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          aria-label="Eraser before-after comparison slider"
        />

        {/* Bottom Status Pill */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-surface-dark-1/80 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-xs text-gray-300 flex items-center gap-2 pointer-events-none">
          <Icons.Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>{current.label}</span>
          <span className="text-gray-500">•</span>
          <span className="text-brand-300 font-mono text-[11px]">Drag slider to compare</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. BACKGROUND REMOVER DEMO
// ============================================================================
export const BgRemoveDemo: React.FC<FeatureDemoProps> = ({ onLaunchEditor }) => {
  const [selectedSubject, setSelectedSubject] = useState<'model' | 'sneaker' | 'plant'>('model');
  const [bgType, setBgType] = useState<string>('transparent');
  const [zoomEdge, setZoomEdge] = useState<boolean>(false);

  const subjects = {
    model: {
      cutout: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      title: 'Fashion Portrait',
      detail: 'Intricate flyaway hair strands & soft edge feathers',
    },
    sneaker: {
      cutout: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      title: 'eCommerce Sneaker',
      detail: 'Ultra-crisp synthetic sole contours & lace eyelets',
    },
    plant: {
      cutout: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80',
      title: 'Botanical Plant',
      detail: 'Complex organic leaf serrations & transparency',
    },
  };

  const currentSubject = subjects[selectedSubject];

  const backgrounds = [
    { id: 'transparent', name: 'Transparent (PNG)', style: 'bg-checkerboard' },
    { id: 'white', name: 'Studio White', style: 'bg-white' },
    { id: 'dark', name: 'Slate Matte', style: 'bg-slate-900' },
    { id: 'sunset', name: 'Sunset Glow', style: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600' },
    { id: 'cyber', name: 'Cyber Neon', style: 'bg-gradient-to-br from-emerald-600 via-teal-700 to-blue-900' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-dark-3/80 p-3 rounded-xl border border-white/5">
        {/* Subject Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mr-1">Subject:</span>
          {(['model', 'sneaker', 'plant'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedSubject(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${
                selectedSubject === key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Edge Zoom & Open Canvas */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomEdge(!zoomEdge)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
              zoomEdge
                ? 'border-brand-500 text-brand-300 bg-brand-500/10'
                : 'border-white/10 text-gray-400 bg-white/5'
            }`}
          >
            <Icons.Eye className="w-3.5 h-3.5" />
            <span>{zoomEdge ? 'Exit 2.5x Zoom' : 'Inspect Edge (2.5x)'}</span>
          </button>

          <button
            onClick={() => onLaunchEditor('rmbg')}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all flex items-center gap-1.5"
          >
            <Icons.Download className="w-3.5 h-3.5" />
            <span>Cutout PNG</span>
          </button>
        </div>
      </div>

      {/* Interactive Canvas Viewport */}
      <div className="relative h-80 sm:h-[420px] rounded-xl overflow-hidden border border-white/10 shadow-inner flex flex-col justify-between p-4">
        {/* Dynamic Background Layer */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            bgType === 'transparent'
              ? 'bg-[linear-gradient(45deg,#242429_25%,transparent_25%),linear-gradient(-45deg,#242429_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#242429_75%),linear-gradient(-45deg,transparent_75%,#242429_75%)] bg-[size:24px_24px] bg-[#1a1a1f]'
              : backgrounds.find((b) => b.id === bgType)?.style
          }`}
        />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="bg-surface-dark-1/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-lg text-xs font-semibold text-gray-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Zero-Halo Matting</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400 text-[11px]">{currentSubject.detail}</span>
          </div>

          {zoomEdge && (
            <div className="bg-brand-950/90 border border-brand-500/40 text-brand-300 text-xs px-2.5 py-1 rounded-md font-bold">
              Sub-Pixel 2.5x Inspection
            </div>
          )}
        </div>

        {/* Subject Cutout Image with Zoom and Contact Shadow */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-4">
          <div
            className={`relative transition-all duration-300 ${
              zoomEdge ? 'scale-[2.2] translate-y-6' : 'scale-100'
            }`}
          >
            {/* Soft Contact Floor Shadow */}
            <div
              className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-6 bg-black/40 rounded-full blur-md transition-opacity duration-300 ${
                bgType === 'transparent' ? 'opacity-0' : 'opacity-80'
              }`}
            />
            <img
              src={currentSubject.cutout}
              alt={currentSubject.title}
              className="max-h-60 sm:max-h-72 object-contain rounded-2xl drop-shadow-2xl select-none pointer-events-none"
              style={{
                filter: bgType === 'transparent' ? 'drop-shadow(0 15px 25px rgba(0,0,0,0.5))' : 'none',
              }}
            />
          </div>
        </div>

        {/* Backdrop Switcher Bar (Bottom) */}
        <div className="relative z-10 flex items-center justify-center gap-2 bg-surface-dark-1/90 backdrop-blur-md border border-white/10 p-2 rounded-xl max-w-fit mx-auto shadow-2xl">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2">
            Backdrop:
          </span>
          {backgrounds.map((bg) => (
            <button
              key={bg.id}
              onClick={() => setBgType(bg.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                bgType === bg.id
                  ? 'bg-brand-600 text-white shadow-md ring-2 ring-brand-400/50'
                  : 'bg-white/5 text-gray-300 hover:bg-white/15'
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full border border-white/20 ${
                  bg.id === 'white' ? 'bg-white' : bg.id === 'dark' ? 'bg-slate-900' : 'bg-brand-400'
                }`}
              />
              <span>{bg.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. 3D MOCKUP GENERATOR DEMO
// ============================================================================
export const MockupDemo: React.FC<FeatureDemoProps> = ({ onLaunchEditor }) => {
  const [selectedProduct, setSelectedProduct] = useState<'tshirt' | 'hoodie' | 'mug' | 'phone'>('tshirt');
  const [selectedArt, setSelectedArt] = useState<number>(0);
  const [fabricColor, setFabricColor] = useState<string>('#18181b');
  const [displacementAmount, setDisplacementAmount] = useState<number>(65);

  const products = {
    tshirt: {
      name: 'Heavyweight Tee',
      img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      artScale: 'w-32 sm:w-40 top-[38%] left-[49%]',
    },
    hoodie: {
      name: 'Streetwear Hoodie',
      img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80',
      artScale: 'w-28 sm:w-36 top-[40%] left-[50%]',
    },
    mug: {
      name: 'Ceramic Mug',
      img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      artScale: 'w-24 sm:w-28 top-[52%] left-[48%]',
    },
    phone: {
      name: 'iPhone 16 Pro',
      img: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80',
      artScale: 'w-28 sm:w-32 top-[46%] left-[50%]',
    },
  };

  const artworks = [
    { id: 1, title: 'Acid Cyberpunk', badge: '🔥 Hot' },
    { id: 2, title: 'Tokyo Minimal Typo', badge: 'New' },
    { id: 3, title: 'Bauhaus Geometric', badge: 'Classic' },
  ];

  const colors = [
    { name: 'Onyx Black', hex: '#18181b' },
    { name: 'Vintage Bone', hex: '#f4ede4' },
    { name: 'Sage Green', hex: '#3d4d40' },
    { name: 'Cobalt Navy', hex: '#1e293b' },
    { name: 'Terracotta', hex: '#7c2d12' },
  ];

  const current = products[selectedProduct];

  return (
    <div className="flex flex-col gap-4">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-dark-3/80 p-3 rounded-xl border border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mr-1">Product:</span>
          {(['tshirt', 'hoodie', 'mug', 'phone'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedProduct(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${
                selectedProduct === key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {products[key].name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold mr-1">Garment Color:</span>
          <div className="flex items-center gap-1.5">
            {colors.map((c) => (
              <button
                key={c.hex}
                title={c.name}
                onClick={() => setFabricColor(c.hex)}
                className={`w-6 h-6 rounded-full border border-white/30 transition-all ${
                  fabricColor === c.hex ? 'scale-125 ring-2 ring-brand-400' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main 3D Stager Viewport */}
      <div className="relative h-80 sm:h-[420px] rounded-xl overflow-hidden bg-gradient-to-b from-surface-dark-3 to-surface-dark-1 border border-white/10 shadow-inner flex items-center justify-center">
        {/* Product Base Photo */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <img
            src={current.img}
            alt={current.name}
            className="max-h-full max-w-full object-contain filter contrast-105"
            style={{
              filter: `drop-shadow(0 20px 30px rgba(0,0,0,0.6))`,
            }}
          />

          {/* Color Tint Overlay Filter */}
          <div
            className="absolute inset-0 mix-blend-color opacity-70 pointer-events-none"
            style={{ backgroundColor: fabricColor }}
          />

          {/* Simulated Mapped Artwork with Luma Wrinkle Displacement */}
          <div
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${current.artScale} transition-all duration-300 pointer-events-none select-none`}
            style={{
              mixBlendMode: 'multiply',
              filter: `contrast(${100 + displacementAmount / 4}%) drop-shadow(0 ${
                displacementAmount / 20
              }px 4px rgba(0,0,0,0.4))`,
            }}
          >
            {selectedArt === 0 && (
              <div className="bg-gradient-to-tr from-brand-600 via-pink-500 to-amber-400 p-4 rounded-xl text-center shadow-lg border border-white/20 transform rotate-[-2deg]">
                <div className="text-[10px] font-black tracking-widest text-black/80 uppercase">
                  Kreathief Dept.
                </div>
                <div className="text-sm font-black text-white uppercase tracking-tighter">
                  CYBER DISRUPT
                </div>
                <div className="text-[8px] font-mono text-white/90">TOKYO • LONDON • NYC</div>
              </div>
            )}

            {selectedArt === 1 && (
              <div className="border-2 border-black p-3 bg-white/90 rounded-none text-center shadow-md transform rotate-1">
                <div className="text-[12px] font-black uppercase text-black tracking-widest">
                  TOKYO 2026
                </div>
                <div className="text-[9px] font-semibold text-gray-800">
                  STUDIO ARCHIVE • NO. 402
                </div>
              </div>
            )}

            {selectedArt === 2 && (
              <div className="bg-amber-400 text-black p-3 rounded-full w-28 h-28 mx-auto flex flex-col items-center justify-center border-2 border-black shadow-md">
                <div className="w-6 h-6 rounded-full bg-red-600 mb-1" />
                <div className="text-[10px] font-black tracking-tighter">BAUHAUS 1919</div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Artwork & Physics Toolbar */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-surface-dark-1/90 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-xl shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Artwork:
            </span>
            {artworks.map((art, idx) => (
              <button
                key={art.id}
                onClick={() => setSelectedArt(idx)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  selectedArt === idx
                    ? 'bg-brand-600 text-white shadow'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <span>{art.title}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[11px] text-gray-400 font-mono">Displacement:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={displacementAmount}
                onChange={(e) => setDisplacementAmount(Number(e.target.value))}
                className="w-20 accent-brand-500 cursor-pointer"
              />
              <span className="text-[11px] text-brand-300 font-mono">{displacementAmount}%</span>
            </div>

            <button
              onClick={() => onLaunchEditor('mockup')}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow flex items-center gap-1.5"
            >
              <span>Stage Your Design</span>
              <Icons.ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. VECTORIZER / SVG CONVERTER DEMO
// ============================================================================
export const VectorizerDemo: React.FC<FeatureDemoProps> = ({ onLaunchEditor }) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [colorsCount, setColorsCount] = useState<number>(4);
  const [showNodes, setShowNodes] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" fill="#7C3AED" stroke="#C084FC" stroke-width="3"/>
  <path d="M 30,50 L 50,30 L 70,50 L 50,70 Z" fill="#F43F5E"/>
  <polygon points="50,20 60,40 40,40" fill="#FBBF24"/>
</svg>`;

  const handleCopySvg = () => {
    navigator.clipboard.writeText(sampleSvg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-dark-3/80 p-3 rounded-xl border border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mr-1">Palette:</span>
          {[2, 4, 8, 16].map((num) => (
            <button
              key={num}
              onClick={() => setColorsCount(num)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                colorsCount === num
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {num} Colors
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNodes(!showNodes)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
              showNodes
                ? 'border-brand-500 text-brand-300 bg-brand-500/10'
                : 'border-white/10 text-gray-400 bg-white/5'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>{showNodes ? 'Anchor Points ON' : 'Show Bezier Nodes'}</span>
          </button>

          <button
            onClick={handleCopySvg}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-surface-dark-2 hover:bg-surface-dark-1 border border-white/15 text-gray-200 hover:text-white shadow transition-all flex items-center gap-1.5"
          >
            {copied ? <Icons.Check className="w-3.5 h-3.5 text-emerald-400" /> : <Icons.Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'SVG Copied!' : 'Copy Clean SVG'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Inspector Canvas */}
      <div className="relative h-80 sm:h-[420px] rounded-xl overflow-hidden select-none bg-surface-dark-3 border border-white/10 shadow-inner group">
        {/* Right Half: Clean Mathematical Bezier Vector */}
        <div className="absolute inset-0 bg-[#0c0d14] flex items-center justify-center p-8">
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* SVG Crisp Vector Graphics */}
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full drop-shadow-[0_10px_30px_rgba(124,58,237,0.4)]"
            >
              {/* Outer Geometric Shape */}
              <circle cx="100" cy="100" r="85" fill="#6d28d9" stroke="#a78bfa" strokeWidth="4" />
              {/* Diamond Inner Shield */}
              <polygon points="100,30 170,100 100,170 30,100" fill="#db2777" opacity="0.9" />
              {/* Inner Star / Polygon */}
              <polygon points="100,55 115,85 145,100 115,115 100,145 85,115 55,100 85,85" fill="#fbbf24" />
              <circle cx="100" cy="100" r="14" fill="#ffffff" />
            </svg>

            {/* Simulated Interactive Bezier Anchor Nodes Overlay */}
            {showNodes && (
              <div className="absolute inset-0 pointer-events-none">
                {[
                  { x: 100, y: 15 },
                  { x: 185, y: 100 },
                  { x: 100, y: 185 },
                  { x: 15, y: 100 },
                  { x: 100, y: 30 },
                  { x: 170, y: 100 },
                  { x: 100, y: 170 },
                  { x: 30, y: 100 },
                ].map((pt, i) => (
                  <div
                    key={i}
                    className="absolute w-2.5 h-2.5 bg-cyan-400 border border-black shadow-[0_0_8px_#22d3ee] rounded-xs -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${(pt.x / 200) * 100}%`, top: `${(pt.y / 200) * 100}%` }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="absolute top-4 right-4 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-1.5 rounded-lg font-bold backdrop-blur-md flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Infinitely Scalable SVG (Curves)</span>
          </div>
        </div>

        {/* Left Half: Pixelated Low-Res Raster (Clipped by slider) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <div
            className="absolute inset-0 bg-[#0c0d14] flex items-center justify-center p-8"
            style={{ minWidth: '700px' }}
          >
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Pixelated Simulated Bitmap */}
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  imageRendering: 'pixelated',
                  filter: 'blur(3px) contrast(200%)',
                }}
              >
                <div className="w-48 h-48 rounded-full bg-purple-700 border-8 border-purple-400 flex items-center justify-center">
                  <div className="w-28 h-28 bg-pink-600 rotate-45 flex items-center justify-center">
                    <div className="w-12 h-12 bg-amber-400" />
                  </div>
                </div>
              </div>

              {/* Pixel Grid Overlay Texture */}
              <div
                className="absolute inset-0 pointer-events-none opacity-40 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:10px_10px]"
              />
            </div>

            <div className="absolute top-4 left-4 bg-red-950/90 border border-red-500/40 text-red-300 text-xs px-3 py-1.5 rounded-lg font-bold backdrop-blur-md flex items-center gap-1.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>Pixelated Bitmap (72 DPI PNG)</span>
            </div>
          </div>
        </div>

        {/* Split Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize shadow-2xl z-20 flex items-center justify-center pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="w-9 h-9 rounded-full bg-surface-dark-1 border-2 border-white shadow-2xl flex items-center justify-center text-xs text-white font-black">
            ↔
          </div>
        </div>

        {/* Slider Input */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          aria-label="Raster vs SVG comparison slider"
        />

        {/* Bottom Vector Metrics Bar */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-surface-dark-1/90 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-xs text-gray-300 flex items-center gap-3 pointer-events-none">
          <span className="text-cyan-400 font-mono font-bold">142 Bezier Points</span>
          <span className="text-gray-500">•</span>
          <span className="text-emerald-400 font-mono font-bold">4.2 KB Clean SVG</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-400 text-[11px]">Lossless Scalability</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 5. SMART RESIZE DEMO
// ============================================================================
export const SmartResizeDemo: React.FC<FeatureDemoProps> = ({ onLaunchEditor }) => {
  const [selectedRatio, setSelectedRatio] = useState<'1:1' | '9:16' | '16:9' | '4:5'>('1:1');
  const [isMatrixView, setIsMatrixView] = useState<boolean>(false);

  const formats = [
    { id: '1:1', name: 'Instagram Post', dims: '1080 × 1080', aspect: 'aspect-square max-w-[280px] sm:max-w-[320px]' },
    { id: '9:16', name: 'Story / Reel / TikTok', dims: '1080 × 1920', aspect: 'aspect-[9/16] max-w-[190px] sm:max-w-[220px]' },
    { id: '16:9', name: 'YouTube / Banner', dims: '1920 × 1080', aspect: 'aspect-[16/9] max-w-[360px] sm:max-w-[440px]' },
    { id: '4:5', name: 'Instagram Portrait', dims: '1080 × 1350', aspect: 'aspect-[4/5] max-w-[240px] sm:max-w-[270px]' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-dark-3/80 p-3 rounded-xl border border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mr-1">Target Format:</span>
          {formats.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setSelectedRatio(f.id as any);
                setIsMatrixView(false);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedRatio === f.id && !isMatrixView
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {f.id} ({f.name.split(' ')[0]})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMatrixView(!isMatrixView)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
              isMatrixView
                ? 'border-brand-500 text-brand-300 bg-brand-500/10'
                : 'border-white/10 text-gray-400 bg-white/5'
            }`}
          >
            <Icons.Grid className="w-3.5 h-3.5" />
            <span>{isMatrixView ? 'Focused View' : 'Multi-Artboard Matrix'}</span>
          </button>

          <button
            onClick={() => onLaunchEditor('resize')}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-brand-600 hover:bg-brand-500 text-white shadow flex items-center gap-1.5"
          >
            <span>Batch Auto-Resize</span>
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Responsive Canvas Viewport */}
      <div className="relative min-h-[380px] sm:min-h-[440px] rounded-xl overflow-hidden bg-surface-dark-3/60 border border-white/10 p-6 flex items-center justify-center">
        {/* Background Grid Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(#33333e_1px,transparent_1px)] bg-[size:16px_16px] opacity-40 pointer-events-none" />

        {/* Single Focused Dynamic Responsive Artboard */}
        {!isMatrixView && (
          <div
            className={`relative w-full ${
              formats.find((f) => f.id === selectedRatio)?.aspect
            } bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-white/20 rounded-2xl shadow-2xl p-5 flex flex-col justify-between overflow-hidden transition-all duration-500 ease-out`}
          >
            {/* Top Bar / Category Tag */}
            <div className="flex items-center justify-between z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-300 bg-brand-500/20 px-2 py-0.5 rounded border border-brand-500/30">
                Summer Festival 2026
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                {formats.find((f) => f.id === selectedRatio)?.dims}
              </span>
            </div>

            {/* Central Visual & Headline (Adapts Optical Sizing) */}
            <div className="my-auto z-10 flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-white shadow-lg">
                <Icons.Sparkles className="w-5 h-5" />
              </div>
              <h4
                className={`font-black text-white leading-tight tracking-tight ${
                  selectedRatio === '9:16'
                    ? 'text-2xl'
                    : selectedRatio === '16:9'
                    ? 'text-xl'
                    : 'text-2xl sm:text-3xl'
                }`}
              >
                FUTURE SOUNDS LIVE
              </h4>
              <p className="text-gray-300 text-xs line-clamp-2 max-w-xs">
                Featuring 40+ international visual artists and electronic composers.
              </p>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between z-10 pt-2 border-t border-white/10">
              <div className="text-[11px] font-bold text-gray-400">JUNE 18-21</div>
              <div className="px-3 py-1 bg-white text-black font-extrabold text-[11px] rounded-lg shadow">
                Get Tickets
              </div>
            </div>

            {/* Subtle Gradient Glow in Corner */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-500/30 rounded-full blur-2xl pointer-events-none" />
          </div>
        )}

        {/* Multi-Artboard Matrix View (All 4 formats simultaneously) */}
        {isMatrixView && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl z-10">
            {formats.map((f) => (
              <div
                key={f.id}
                className="bg-surface-dark-2/90 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-between text-center shadow-lg hover:border-brand-500/50 transition-all group"
              >
                <div className="text-xs font-bold text-gray-300 mb-2">{f.name}</div>
                <div
                  className={`w-full ${f.aspect} bg-gradient-to-br from-indigo-900 to-purple-950 rounded-lg border border-white/15 p-2 flex flex-col justify-between text-left`}
                >
                  <span className="text-[8px] font-bold text-brand-300">SUMMER 2026</span>
                  <div className="text-[10px] font-black text-white leading-none">FUTURE SOUNDS</div>
                  <div className="text-[7px] text-gray-400">JUNE 18-21</div>
                </div>
                <div className="text-[10px] font-mono text-gray-400 mt-2">{f.dims}</div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Feature Badges */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-surface-dark-1/90 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-xs text-gray-300 flex items-center gap-3 pointer-events-none">
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <Icons.CheckCircle className="w-3.5 h-3.5" />
            <span>Safe Zones Preserved</span>
          </span>
          <span className="text-gray-500">•</span>
          <span className="text-brand-300">Optical Font Auto-Scale</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-400">Zero Aspect Stretching</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 6. DESIGN STYLES PRESETS DEMO
// ============================================================================
export const DesignStylesDemo: React.FC<FeatureDemoProps> = ({ onLaunchEditor }) => {
  const [selectedStyle, setSelectedStyle] = useState<string>('bauhaus');

  const styles = [
    {
      id: 'bauhaus',
      name: 'Bauhaus',
      year: '1919 Weimar',
      img: '/styles/bauhaus.jpg',
      palette: ['#E63946', '#F1FAEE', '#A8DADC', '#457B9D', '#1D3557'],
      headline: 'FORM FOLLOWS FUNCTION',
      sub: 'Geometric balance, primary color primaries, and asymmetric typography.',
      accent: 'border-l-4 border-red-600 font-sans',
    },
    {
      id: 'memphis',
      name: 'Memphis',
      year: '1981 Milan',
      img: '/styles/memphis.jpg',
      palette: ['#FF70A6', '#FF9770', '#FFD670', '#E9FF70', '#70D6FF'],
      headline: 'CHAOTIC POST-MODERN JOY',
      sub: 'Whimsical squiggles, vibrant pastel clashing, and bold pop geometry.',
      accent: 'border-dashed border-2 border-yellow-400 font-sans',
    },
    {
      id: 'cyberpunk',
      name: 'Cyber Y2K',
      year: '2000s Tokyo',
      img: '/styles/cybercore.jpg',
      palette: ['#00F5D4', '#7B2CBF', '#F72585', '#3A0CA3', '#4CC9F0'],
      headline: 'NEO-TOKYO GLITCH TECH',
      sub: 'High-contrast cyan/magenta glow, cybernetic scanlines, and digital grunge.',
      accent: 'border border-cyan-400 shadow-[0_0_15px_#00f5d4] font-mono',
    },
    {
      id: 'swiss',
      name: 'Swiss Style',
      year: '1950s Zurich',
      img: '/styles/brutalism.jpg',
      palette: ['#000000', '#FFFFFF', '#FF2A00', '#808080'],
      headline: 'OBJECTIVE INTERNATIONAL GRID',
      sub: 'Extreme typographical hierarchy, strict modular grids, and neutral precision.',
      accent: 'border-t-8 border-red-600 font-sans tracking-tighter',
    },
    {
      id: 'acid',
      name: 'Acid Rave',
      year: '1990s Berlin',
      img: '/styles/acid_streetwear.jpg',
      palette: ['#39FF14', '#000000', '#FF007F', '#FFFF00'],
      headline: 'RAW DISTORTED FREQUENCY',
      sub: 'Distorted typography, barbed wire motifs, and radioactive neons.',
      accent: 'border-2 border-lime-400 rotate-[-1deg]',
    },
  ];

  const current = styles.find((s) => s.id === selectedStyle) || styles[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Style Preset Selector Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-dark-3/80 p-3 rounded-xl border border-white/5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mr-1">Movements:</span>
          {styles.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStyle(s.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                selectedStyle === s.id
                  ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-400/40'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{s.name}</span>
              <span className="text-[10px] opacity-70">({s.year.split(' ')[0]})</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => onLaunchEditor('styles')}
          className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow flex items-center gap-1.5 shrink-0"
        >
          <span>Use in Canvas</span>
          <Icons.ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Style Showcase Split Artboard */}
      <div className="relative min-h-[380px] sm:min-h-[440px] rounded-xl overflow-hidden bg-surface-dark-3 border border-white/10 grid grid-cols-1 md:grid-cols-2 shadow-2xl">
        {/* Left: Authentic Movement Reference Image */}
        <div className="relative h-48 md:h-full overflow-hidden bg-black">
          <img
            src={current.img}
            alt={current.name}
            className="w-full h-full object-cover filter contrast-110 transition-all duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:hidden" />
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md border border-white/20 px-3 py-1 rounded-lg text-xs font-bold text-white">
            {current.name} Movement ({current.year})
          </div>
        </div>

        {/* Right: Live Adapted Creative Composition */}
        <div className="p-6 sm:p-8 flex flex-col justify-between bg-surface-dark-2 relative overflow-hidden">
          {/* Movement Palette Swatches */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Harmonized Palette
              </span>
              <span className="text-xs font-mono text-brand-300">5 Curated Swatches</span>
            </div>
            <div className="flex items-center gap-2 mb-6">
              {current.palette.map((hex, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full h-8 rounded-lg border border-white/20 shadow-sm transition-transform hover:scale-105 cursor-pointer"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                  <span className="text-[10px] font-mono text-gray-400">{hex}</span>
                </div>
              ))}
            </div>

            {/* Poster Demonstration */}
            <div className={`p-5 rounded-xl bg-surface-dark-3/90 transition-all duration-300 ${current.accent}`}>
              <h3 className="text-lg sm:text-xl font-black mb-2 leading-tight tracking-tight text-white">
                {current.headline}
              </h3>
              <p className="text-gray-300 text-xs leading-relaxed">
                {current.sub}
              </p>
            </div>
          </div>

          {/* Bottom Art Direction Meta */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Icons.Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Full font pairing & grain textures included</span>
            </div>

            <button
              onClick={() => onLaunchEditor('styles')}
              className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
            >
              <span>Explore 60+ Movements</span>
              <Icons.ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
