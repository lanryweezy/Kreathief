import React, { useState, useMemo, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { suggestSpatialActions, SpatialPin } from '../../services/spatialContextEngine';
import { Artboard } from '../../types';

interface SpatialPinOverlayProps {
  artboard: Artboard;
  zoom: number;
}

export const SpatialPinOverlay: React.FC<SpatialPinOverlayProps> = ({ artboard, zoom }) => {
  const spatialPin = useStore((state) => state.spatialPin);
  const clearSpatialPin = useStore((state) => state.clearSpatialPin);
  const sendMessage = useStore((state) => state.sendMessage);
  const isAnalyzing = useStore((state) => state.isAnalyzing);

  const [promptInput, setPromptInput] = useState('');

  const suggestions = useMemo(() => {
    if (!spatialPin || !artboard) return [];
    return suggestSpatialActions(spatialPin, artboard);
  }, [spatialPin, artboard]);

  const handleExecutePrompt = useCallback(async (customPrompt?: string) => {
    const textToRun = customPrompt || promptInput;
    if (!textToRun.trim() || isAnalyzing) return;
    setPromptInput('');
    await sendMessage(textToRun, spatialPin);
  }, [promptInput, isAnalyzing, sendMessage, spatialPin]);

  if (!spatialPin || spatialPin.artboardId !== artboard.id) {
    return null;
  }

  // Position coordinates relative to canvas
  const posX = (artboard.x ?? 0) + spatialPin.x;
  const posY = (artboard.y ?? 0) + spatialPin.y;

  return (
    <div
      className="absolute pointer-events-auto z-[9999]"
      style={{
        left: `${posX}px`,
        top: `${posY}px`,
        transform: 'translate(-50%, -100%)',
      }}
      // Strict Jules/Stitch isolation: stop canvas drag & selection events
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Visual glowing pin indicator */}
      <div className="relative flex flex-col items-center">
        {/* Pulsing radar effect */}
        <div className="absolute -bottom-1 w-6 h-6 rounded-full bg-cyan-500/30 animate-ping pointer-events-none" />
        <div className="absolute -bottom-1 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] pointer-events-none" />

        {/* Pin Body */}
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 text-white shadow-[0_4px_20px_rgba(79,70,229,0.5)] border border-white/30 cursor-pointer transform hover:scale-110 transition-transform">
          <Icons.Pin className="w-4 h-4 text-white drop-shadow-sm" />
        </div>

        {/* Pin stem */}
        <div className="w-0.5 h-3 bg-gradient-to-b from-cyan-400 to-transparent shadow-sm" />

        {/* Floating Context Pill / Popover */}
        <div
          className="absolute bottom-full mb-2 w-80 max-w-[90vw] bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-3.5 text-white animate-in fade-in zoom-in-95 duration-150"
          style={{ transformOrigin: 'bottom center' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-wide uppercase bg-gradient-to-r from-cyan-400 to-indigo-300 bg-clip-text text-transparent">
                Spatial Copilot
              </span>
            </div>
            <button
              onClick={() => clearSpatialPin()}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800/60 transition-colors"
              title="Close Spatial Pin (Esc)"
            >
              <Icons.X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Target Info */}
          <div className="mb-2.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40 text-[11px] text-slate-300 flex items-center justify-between">
            <div className="truncate flex items-center gap-1.5">
              <span className="text-cyan-400 font-medium">🎯 Target:</span>
              <span className="font-semibold text-white truncate max-w-[140px]">
                {spatialPin.targetLayerName || 'Canvas Space'}
              </span>
              {spatialPin.targetLayerType && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase tracking-wider font-mono">
                  {spatialPin.targetLayerType}
                </span>
              )}
            </div>
            <span className="text-slate-400 text-[10px] font-mono shrink-0">
              ({spatialPin.x}, {spatialPin.y})
            </span>
          </div>

          {/* Quick 1-Click Suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-2.5">
              <div className="text-[10px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <span>Instant Spatial Actions:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((sug) => (
                  <button
                    key={sug.id}
                    disabled={isAnalyzing}
                    onClick={() => handleExecutePrompt(sug.prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-indigo-600/30 text-slate-200 hover:text-cyan-200 border border-slate-700/60 hover:border-cyan-500/40 transition-all text-left flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Prompt Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecutePrompt();
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Ask Copilot at this exact point..."
              disabled={isAnalyzing}
              className="flex-1 bg-slate-950/80 border border-slate-700/70 focus:border-cyan-500 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
              autoFocus
            />
            <button
              type="submit"
              disabled={isAnalyzing || !promptInput.trim()}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-medium text-xs shadow-md disabled:opacity-40 transition-all flex items-center justify-center shrink-0"
            >
              {isAnalyzing ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Icons.Send className="w-3.5 h-3.5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
