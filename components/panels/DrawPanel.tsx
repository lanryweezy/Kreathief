import React from 'react';
import { Icons } from '../../constants';

interface DrawPanelProps {
  brushColor: string;
  setBrushColor: (c: string) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  isDrawing: boolean;
  setIsDrawing: (b: boolean) => void;
  brushOpacity: number;
  setBrushOpacity: (o: number) => void;
  onFinishDrawing: () => void;
}

export const DrawPanel: React.FC<DrawPanelProps> = ({
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  isDrawing,
  setIsDrawing,
  brushOpacity,
  setBrushOpacity,
  onFinishDrawing
}) => {
  
  const colors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
    '#ff00ff', '#00ffff', '#7d2ae8', '#00c4cc', '#ff9900', '#ff66b2'
  ];

  return (
    <div className="flex flex-col h-full p-4">
      <h3 className="font-bold text-white mb-6 flex items-center gap-2">
        <Icons.Brush className="w-5 h-5 text-[#7d2ae8]" />
        Creative Drawing
      </h3>

      <div className="mb-6 p-4 bg-[#252627] rounded-lg border border-gray-700">
         <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400">STATUS</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isDrawing ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                {isDrawing ? 'ACTIVE' : 'INACTIVE'}
            </span>
         </div>
         <p className="text-[11px] text-gray-500 leading-tight">
            Draw directly on the canvas. Click "Done" to save your drawing as a movable layer.
         </p>
         
         <div className="mt-4 flex gap-2">
            {!isDrawing ? (
                <button 
                    onClick={() => setIsDrawing(true)}
                    className="flex-1 bg-[#7d2ae8] hover:bg-[#6b23c5] text-white text-xs font-bold py-2 rounded transition-colors"
                >
                    Start Drawing
                </button>
            ) : (
                <button 
                    onClick={() => { setIsDrawing(false); onFinishDrawing(); }}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded transition-colors"
                >
                    Done
                </button>
            )}
         </div>
      </div>

      <div className="space-y-6">
         <div>
            <label className="text-xs font-bold text-gray-400 mb-3 block">Brush Color</label>
            <div className="grid grid-cols-6 gap-2 mb-3">
               {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setBrushColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${brushColor === c ? 'border-white ring-2 ring-white/20' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
               ))}
            </div>
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded border border-gray-600 overflow-hidden relative">
                  <input 
                    type="color" 
                    value={brushColor} 
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-full h-full" style={{ backgroundColor: brushColor }} />
               </div>
               <span className="text-xs text-gray-400 font-mono">{brushColor}</span>
            </div>
         </div>

         <div>
            <div className="flex justify-between mb-1">
                <label className="text-xs font-bold text-gray-400">Brush Size</label>
                <span className="text-xs text-gray-500">{brushSize}px</span>
            </div>
            <input 
                type="range" 
                min="1" 
                max="100" 
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
            />
            {/* Visual preview of size */}
            <div className="h-12 flex items-center justify-center mt-2 border border-dashed border-gray-800 rounded bg-[#1a1a1a]">
                <div 
                    className="rounded-full bg-white transition-all"
                    style={{ 
                        width: brushSize, 
                        height: brushSize, 
                        backgroundColor: brushColor,
                        opacity: brushOpacity 
                    }}
                />
            </div>
         </div>

         <div>
            <div className="flex justify-between mb-1">
                <label className="text-xs font-bold text-gray-400">Opacity</label>
                <span className="text-xs text-gray-500">{Math.round(brushOpacity * 100)}%</span>
            </div>
            <input 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.01"
                value={brushOpacity}
                onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
            />
         </div>
      </div>
    </div>
  );
};