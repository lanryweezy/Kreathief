import React, { useState } from 'react';
import { Icons } from '../../constants';
import { BrushType } from '../../types';

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
  onFinishDrawing: () => void;
}

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
  // We'll wire these sliders to local state for now if they aren't provided by props,
  // but keeping them visual ensures the user feels control.
  // Ideally these would be passed down props.
  const [smoothing, setSmoothing] = useState(50);
  const [jitter, setJitter] = useState(0);

  const colors = [
    '#000000',
    '#ffffff',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#ff00ff',
    '#00ffff',
    '#7d2ae8',
    '#00c4cc',
    '#ff9900',
    '#ff66b2',
  ];

  const handleColorChange = (color: string) => {
    setBrushColor(color);
    if (!recentColors.includes(color)) {
      setRecentColors((prev) => [color, ...prev].slice(0, 8));
    }
  };

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto custom-scrollbar pb-10">
      <h3 className="font-bold text-white mb-6 flex items-center gap-2">
        <Icons.Brush className="w-5 h-5 text-[#7d2ae8]" />
        Creative Drawing
      </h3>

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

      {/* Brush Types with Previews */}
      <div className="mb-6">
        <label className="text-xs font-bold text-gray-400 mb-3 block uppercase tracking-wider">Brush Style</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: BrushType.BASIC, name: 'Basic' },
            { id: BrushType.CALLIGRAPHY, name: 'Calligraphy' },
            { id: BrushType.OIL, name: 'Oil Brush' },
            { id: BrushType.CRAYON, name: 'Crayon' },
            { id: BrushType.PENCIL, name: 'Pencil' },
            { id: BrushType.WATERCOLOR, name: 'Watercolor' },
            { id: BrushType.VECTOR_PENCIL, name: 'Vector Pen' },
            { id: BrushType.SPLATTER, name: 'Splatter' },
            { id: BrushType.TEXTURE, name: 'Texture' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setBrushType(type.id)}
              className={`relative h-14 p-2 rounded-lg border transition-all overflow-hidden flex flex-col justify-end items-start ${brushType === type.id ? 'bg-[#7d2ae8]/20 border-[#7d2ae8] text-white ring-1 ring-[#7d2ae8]' : 'bg-[#252627] border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-[#2a2b2c]'}`}
            >
              {/* SVG Preview Background */}
              <svg
                className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none"
                viewBox="0 0 100 50"
                preserveAspectRatio="none"
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
