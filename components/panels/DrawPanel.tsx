import React, { useState, useRef } from 'react';
import { Icons } from '../../constants';
import { BrushType } from '../../types';
import { useStore } from '../../store/useStore';
import { AbrParser } from '../../utils/abrParser';
import { v4 as uuidv4 } from 'uuid';

interface DrawPanelProps {
  brushColor: string;
  setBrushColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  isDrawing: boolean;
  setIsDrawing: (is: boolean) => void;
  brushOpacity: number;
  setBrushOpacity: (opacity: number) => void;
  brushType: BrushType;
  setBrushType: (type: BrushType) => void;
  brushSmoothing?: number;
  setBrushSmoothing?: (smoothing: number) => void;
  brushJitter?: number;
  setBrushJitter?: (jitter: number) => void;
  onFinishDrawing: () => void;
}

// FIX: Add CSS animations for brush previews
const BRUSH_PREVIEW_ANIMATIONS: Record<string, React.CSSProperties> = {
  [BrushType.WATERCOLOR]: {
    animation: 'brushPulse 2s ease-in-out infinite',
  },
  [BrushType.OIL]: {
    animation: 'brushSkew 1.5s ease-in-out infinite alternate',
  },
  [BrushType.SPLATTER]: {
    animation: 'brushFloat 3s ease-in-out infinite',
  },
  [BrushType.TEXTURE]: {
    animation: 'brushPulse 2.5s ease-in-out infinite',
  },
};

const BRUSH_PREVIEWS: Record<string, React.ReactNode> = {
  [BrushType.BASIC]: (
    <path d="M5 25 Q 50 5 95 25" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
  ),
  [BrushType.CALLIGRAPHY]: (
    <path d="M5 25 Q 50 5 95 25" stroke="currentColor" strokeWidth="4" fill="none" transform="skewX(-20)" />
  ),
  [BrushType.OIL]: (
    <path
      d="M5 25 Q 50 5 95 25"
      stroke="currentColor"
      strokeWidth="6"
      strokeDasharray="1 1"
      fill="none"
      filter="url(#oilFilter)"
    />
  ),
  [BrushType.CRAYON]: (
    <path d="M5 25 Q 50 5 95 25" stroke="currentColor" strokeWidth="4" strokeDasharray="0.5 2" fill="none" />
  ),
  [BrushType.PENCIL]: <path d="M5 25 Q 50 5 95 25" stroke="currentColor" strokeWidth="1" fill="none" />,
  [BrushType.WATERCOLOR]: (
    <path
      d="M5 25 Q 50 5 95 25"
      stroke="currentColor"
      strokeWidth="8"
      strokeOpacity="0.5"
      fill="none"
      filter="url(#watercolorFilter)"
    />
  ),
  [BrushType.VECTOR_PENCIL]: (
    <path d="M5 25 L 30 15 L 60 30 L 95 25" stroke="currentColor" strokeWidth="2" fill="none" />
  ),
  [BrushType.SPLATTER]: (
    <g>
      <circle cx="20" cy="20" r="4" fill="currentColor" />
      <circle cx="50" cy="30" r="2" fill="currentColor" />
      <circle cx="80" cy="15" r="3" fill="currentColor" />
      <circle cx="40" cy="10" r="1.5" fill="currentColor" />
      <circle cx="70" cy="40" r="2.5" fill="currentColor" />
    </g>
  ),
  [BrushType.TEXTURE]: (
    <rect x="0" y="0" width="100" height="50" fill="currentColor" fillOpacity="0.2" filter="url(#oilFilter)" />
  ),
};

export const DrawPanel: React.FC<DrawPanelProps> = ({
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  isDrawing,
  setIsDrawing,
  brushOpacity,
  setBrushOpacity,
  brushType,
  setBrushType,
  onFinishDrawing,
}) => {
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const customBrushes = useStore((state) => state.customBrushes) || [];
  const addCustomBrushes = useStore((state) => state.addCustomBrushes);
  const selectedCustomBrushId = useStore((state) => state.selectedCustomBrushId);
  const setSelectedCustomBrushId = useStore((state) => state.setSelectedCustomBrushId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use store for smoothing and jitter
  const smoothing = useStore((state) => state.brushSmoothing);
  const setSmoothing = useStore((state) => state.setBrushSmoothing);
  const jitter = useStore((state) => state.brushJitter);
  const setJitter = useStore((state) => state.setBrushJitter);

  const colors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00',
    '#ff00ff', '#00ffff', '#7d2ae8', '#00c4cc', '#ff9900', '#ff66b2',
  ];

  const handleColorChange = (color: string) => {
    setBrushColor(color);
    if (!recentColors.includes(color)) {
      setRecentColors((prev) => [color, ...prev].slice(0, 8));
    }
  };

  const handleAbrImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {return;}

    try {
      const buffer = await file.arrayBuffer();
      const parser = new AbrParser(buffer);
      const brushes = parser.parse();
      
      const newBrushes = brushes.map(b => ({
        ...b,
        id: uuidv4()
      }));

      addCustomBrushes(newBrushes);
      useStore.getState().addToast?.(`Imported ${newBrushes.length} brushes`, 'success');
    } catch (err) {
      console.error(err);
      useStore.getState().addToast?.('Failed to parse ABR file', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto custom-scrollbar pb-10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Icons.Brush className="w-5 h-5 text-[#7d2ae8]" />
          Creative Drawing
        </h3>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-lg transition-all"
          title="Import ABR Brushes"
        >
          <Icons.Plus className="w-4 h-4" />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".abr" 
          className="hidden" 
          onChange={handleAbrImport} 
        />
      </div>

      {/* Drawing Status Card */}
      <div className="mb-6 p-4 bg-[#252627] rounded-lg border border-gray-700 relative overflow-hidden">
        <div
          className={`absolute top-0 right-0 p-2 rounded-bl-lg text-[10px] font-bold ${isDrawing ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}
        >
          {isDrawing ? 'ACTIVE' : 'INACTIVE'}
        </div>
        <p className="text-[11px] text-gray-400 leading-tight mb-4 pr-10">
          Activating drawing mode locks other layers. Click &quot;Done&quot; to finalize.
        </p>
        <div className="flex gap-2">
          {!isDrawing ? (
            <button
              onClick={() => setIsDrawing(true)}
              className="flex-1 bg-[#7d2ae8] hover:bg-[#6b23c5] text-white text-xs font-bold py-3 rounded-lg transition-all hover:scale-[1.02] shadow-lg shadow-purple-900/20"
            >
              Start Drawing
            </button>
          ) : (
            <button
              onClick={() => {
                setIsDrawing(false);
                onFinishDrawing();
              }}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-3 rounded-lg transition-all hover:scale-[1.02] shadow-lg shadow-green-900/20"
            >
              Done & Add Layer
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes brushPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        @keyframes brushSkew {
          0% { transform: skewX(0deg); }
          100% { transform: skewX(-10deg); }
        }
        @keyframes brushFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>

      {/* Custom Brushes */}
      {customBrushes.length > 0 && (
        <div className="mb-6">
          <label className="text-xs font-bold text-gray-400 mb-3 block uppercase tracking-wider">Imported Brushes</label>
          <div className="grid grid-cols-4 gap-2">
            {customBrushes.map((brush) => (
              <button
                key={brush.id}
                onClick={() => {
                  setBrushType(BrushType.CUSTOM);
                  setSelectedCustomBrushId(brush.id);
                  setIsDrawing(true);
                }}
                className={`aspect-square rounded-lg border flex items-center justify-center p-1 transition-all ${
                  selectedCustomBrushId === brush.id
                    ? 'bg-orange-500/20 border-orange-500 ring-1 ring-orange-500'
                    : 'bg-[#252627] border-gray-700 text-gray-500 hover:border-gray-600'
                }`}
                title={brush.name}
              >
                {brush.tipData ? (
                  <img src={brush.tipData} className="w-full h-full object-contain invert grayscale brightness-200" alt="" />
                ) : (
                  <Icons.Brush className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Brush Types with Previews */}
      <div className="mb-6">
        <label className="text-xs font-bold text-gray-400 mb-3 block uppercase tracking-wider">Creative Brushes</label>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {[
            { id: BrushType.BASIC, name: 'Basic' },
            { id: BrushType.CALLIGRAPHY, name: 'Calligraphy' },
            { id: BrushType.OIL, name: 'Oil Brush' },
            { id: BrushType.CRAYON, name: 'Crayon' },
            { id: BrushType.PENCIL, name: 'Pencil' },
            { id: BrushType.WATERCOLOR, name: 'Watercolor' },
            { id: BrushType.SPLATTER, name: 'Splatter' },
            { id: BrushType.TEXTURE, name: 'Texture' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setBrushType(type.id);
                setSelectedCustomBrushId(null);
                setIsDrawing(true);
              }}
              className={`relative h-14 p-2 rounded-lg border transition-all overflow-hidden flex flex-col justify-end items-start ${brushType === type.id && !selectedCustomBrushId ? 'bg-[#7d2ae8]/20 border-[#7d2ae8] text-white ring-1 ring-[#7d2ae8]' : 'bg-[#252627] border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-[#2a2b2c]'}`}
            >
              <svg
                className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none"
                viewBox="0 0 100 50"
                preserveAspectRatio="none"
                style={BRUSH_PREVIEW_ANIMATIONS[type.id]}
              >
                <defs>
                  <filter id="oilFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="3" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
                  </filter>
                  <filter id="watercolorFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="5" />
                    <feGaussianBlur stdDeviation="2" />
                  </filter>
                </defs>
                {BRUSH_PREVIEWS[type.id]}
              </svg>
              <span className="text-[10px] font-bold relative z-10">{type.name}</span>
            </button>
          ))}
        </div>

        <label className="text-xs font-bold text-gray-400 mb-3 block uppercase tracking-wider">Vector Tools</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: BrushType.VECTOR_PENCIL, name: 'Vector Pen', icon: Icons.Pen },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setBrushType(type.id);
                setSelectedCustomBrushId(null);
                setIsDrawing(true);
              }}
              className={`relative h-14 p-2 rounded-lg border transition-all overflow-hidden flex flex-col justify-end items-start ${brushType === type.id && !selectedCustomBrushId ? 'bg-[#7d2ae8]/20 border-[#7d2ae8] text-white ring-1 ring-[#7d2ae8]' : 'bg-[#252627] border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-[#2a2b2c]'}`}
            >
              <svg
                className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none"
                viewBox="0 0 100 50"
                preserveAspectRatio="none"
                style={BRUSH_PREVIEW_ANIMATIONS[type.id]}
              >
                {BRUSH_PREVIEWS[type.id]}
              </svg>
              <div className="flex items-center gap-1.5 relative z-10">
                <type.icon className="w-3 h-3 text-[#7d2ae8]" />
                <span className="text-[10px] font-bold">{type.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* Colors */}
        <div>
          <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">Color</label>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg border-2 border-gray-600 overflow-hidden relative group cursor-pointer hover:border-white transition-colors">
              <input
                type="color"
                value={brushColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-full h-full" style={{ backgroundColor: brushColor }} />
              <Icons.Plus className="absolute inset-0 m-auto w-4 h-4 text-white opacity-0 group-hover:opacity-100 pointer-events-none drop-shadow-md" />
            </div>
            <div className="flex-1 overflow-x-auto custom-scrollbar pb-1">
              <div className="flex gap-2">
                {recentColors.map((c, i) => (
                  <button
                    key={`recent-${i}`}
                    onClick={() => setBrushColor(c)}
                    className="w-8 h-8 rounded-full border border-gray-700 shrink-0 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleColorChange(c)}
                    className={`w-8 h-8 rounded-full border transition-transform hover:scale-110 shrink-0 ${brushColor === c ? 'border-white ring-2 ring-white/20' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sliders */}
        <div className="bg-[#1e1e1e] p-3 rounded-lg border border-gray-800 space-y-4">
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Brush Size</label>
              <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 rounded">{brushSize}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Opacity</label>
              <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 rounded">
                {Math.round(brushOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.01"
              value={brushOpacity}
              onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
            />
          </div>
        </div>

        {/* Details & Stabilization */}
        <div className="bg-[#1e1e1e] p-3 rounded-lg border border-gray-800 space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase block border-b border-gray-700 pb-2">
            Stroke Settings
          </label>

          <div>
            <div className="flex justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <Icons.Activity className="w-3 h-3 text-blue-400" />
                <label className="text-[10px] font-bold text-gray-400">Stabilizer</label>
              </div>
              <span className="text-[10px] text-gray-500">{smoothing}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={smoothing}
              onChange={(e) => setSmoothing(parseInt(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <Icons.Zap className="w-3 h-3 text-orange-400" />
                <label className="text-[10px] font-bold text-gray-400">Jitter</label>
              </div>
              <span className="text-[10px] text-gray-500">{jitter}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={jitter}
              onChange={(e) => setJitter(parseInt(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default DrawPanel;
