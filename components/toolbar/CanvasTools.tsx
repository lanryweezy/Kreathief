import React from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { IconButton, Divider } from './ToolbarShared';
import { CANVAS_EFFECT_PRESETS } from './ToolbarConstants';
import { CanvasSizePicker } from '../CanvasSizePicker';
import { ColorPicker } from '../ColorPicker';

interface CanvasToolsProps {
  onToggleDesignSuggestions?: () => void;
  onToggleSmartContent?: () => void;
  onToggleQualityScore?: () => void;
  documentColors?: string[];
}

export const CanvasTools = React.memo(
  ({ onToggleDesignSuggestions, onToggleSmartContent, onToggleQualityScore, documentColors }: CanvasToolsProps) => {
    const canvasBackgroundColor = useStore((state) => state.canvasBackgroundColor);
    const setCanvasBackgroundColor = useStore((state) => state.setCanvasBackgroundColor);
    const canvasFilters = useStore((state) => state.canvasFilters);
    const setCanvasFilters = useStore((state) => state.setCanvasFilters);
    const canvasSize = useStore((state) => state.canvasSize);
    const setCanvasSize = useStore((state) => state.setCanvasSize);
    const isPenMode = useStore((state) => state.isPenMode);
    const setPenMode = useStore((state) => state.setPenMode);

    return (
      <div className="flex items-center gap-3 flex-nowrap overflow-x-auto no-scrollbar py-1">
        <IconButton onClick={() => setPenMode(!isPenMode)} active={isPenMode} title="Pen Tool (P)">
          <Icons.Pen className="w-4 h-4" />
        </IconButton>
        <Divider />

        <CanvasSizePicker currentSize={canvasSize} onSizeChange={setCanvasSize} />
        <ColorPicker
          value={canvasBackgroundColor}
          onChange={(color) => {
            setCanvasBackgroundColor(color);
          }}
          documentColors={documentColors}
        />
        <Divider />

        <IconButton onClick={onToggleDesignSuggestions} title="Design Suggestions">
          <Icons.Magic className="w-4 h-4 text-[#00c4cc]" />
        </IconButton>
        <IconButton onClick={onToggleSmartContent} title="Smart Text">
          <Icons.Bot className="w-4 h-4 text-[#a855f7]" />
        </IconButton>
        <IconButton onClick={onToggleQualityScore} title="Check Quality">
          <Icons.Check className="w-4 h-4 text-emerald-400" />
        </IconButton>
        <Divider />

        <div className="flex items-center gap-4 px-1">
          {[
            { icon: Icons.Sun, val: canvasFilters.brightness, key: 'brightness', max: 200, title: 'Brightness' },
            { icon: Icons.Contrast, val: canvasFilters.contrast, key: 'contrast', max: 200, title: 'Contrast' },
            { icon: Icons.Droplet, val: canvasFilters.saturation, key: 'saturation', max: 200, title: 'Saturation' },
          ].map((item: any) => (
            <div key={item.key} className="flex items-center gap-2 group" title={item.title}>
              <item.icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
              <label className="sr-only" htmlFor={`filter-${item.key}`}>
                {item.title}
              </label>
              <input
                id={`filter-${item.key}`}
                key={item.key}
                type="range"
                min="0"
                max={item.max}
                aria-label={item.title}
                value={(canvasFilters as any)[item.key] || 0}
                onChange={(e) => setCanvasFilters({ ...canvasFilters, [item.key]: parseInt(e.target.value) })}
                className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8] hover:bg-white/20 transition-colors"
              />
            </div>
          ))}
        </div>
        <Divider />

        <div className="flex items-center gap-2">
          {CANVAS_EFFECT_PRESETS.map((preset) => (
            <button
              key={preset.name}
              title={preset.description}
              onClick={() => {
                setCanvasFilters({ ...canvasFilters, ...preset.filters });
              }}
              className="group relative w-10 h-8 rounded-lg overflow-hidden border border-white/10 hover:border-[#7d2ae8] transition-all bg-[#0e1318]"
            >
              <div
                className={`absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity ${
                  preset.name === 'Vintage'
                    ? 'bg-amber-900/50'
                    : preset.name === 'Noir'
                      ? 'bg-gray-900'
                      : preset.name === 'Vivid'
                        ? 'bg-gradient-to-tr from-purple-500 to-blue-500'
                        : 'bg-gray-800'
                }`}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[7px] font-black uppercase text-white tracking-widest drop-shadow-md">
                  {preset.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }
);

CanvasTools.displayName = 'CanvasTools';
