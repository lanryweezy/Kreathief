import React from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { NavTab, BrushType } from '../../types';
import { IconButton, Divider } from './ToolbarShared';
import { CANVAS_EFFECT_PRESETS } from './ToolbarConstants';
import { CanvasSizePicker } from '../CanvasSizePicker';
import { ColorPicker } from '../ColorPicker';

interface CanvasToolsProps {
  documentColors?: string[];
}

export const CanvasTools = React.memo(({ documentColors }: CanvasToolsProps) => {
  const canvasBackgroundColor = useStore((state) => state.canvasBackgroundColor);
  const setCanvasBackgroundColor = useStore((state) => state.setCanvasBackgroundColor);
  const canvasFilters = useStore((state) => state.canvasFilters);
  const setCanvasFilters = useStore((state) => state.setCanvasFilters);
  const canvasSize = useStore((state) => state.canvasSize);
  const setCanvasSize = useStore((state) => state.setCanvasSize);
  const isPenMode = useStore((state) => state.isPenMode);
  const setPenMode = useStore((state) => state.setPenMode);
  const brushType = useStore((state) => state.brushType);
  const setBrushType = useStore((state) => state.setBrushType);
  const setActiveTab = useStore((state) => state.setActiveTab);

  return (
    <div className="flex items-center gap-3 flex-nowrap overflow-x-auto no-scrollbar py-1">
      <IconButton
        onClick={() => {
          setPenMode(false);
          setActiveTab(NavTab.LAYERS);
        }}
        active={!isPenMode}
        title="Select / Move Tool (V) — Pick, move, and edit objects on canvas"
      >
        <Icons.MousePointer className="w-4 h-4" />
      </IconButton>

      <IconButton
        onClick={() => {
          if (!isPenMode || brushType === BrushType.VECTOR_PENCIL) {
            setPenMode(true);
            setBrushType(BrushType.BASIC);
            setActiveTab(NavTab.DRAW);
          } else {
            setPenMode(false);
          }
        }}
        active={isPenMode && brushType !== BrushType.VECTOR_PENCIL}
        title="Brush Tool (B) — Freehand brush painting"
      >
        <Icons.Brush className="w-4 h-4" />
      </IconButton>

      <IconButton
        onClick={() => {
          if (!isPenMode || brushType !== BrushType.VECTOR_PENCIL) {
            setPenMode(true);
            setBrushType(BrushType.VECTOR_PENCIL);
            setActiveTab(NavTab.DRAW);
          } else {
            setPenMode(false);
          }
        }}
        active={isPenMode && brushType === BrushType.VECTOR_PENCIL}
        title="Vector Pen (P) — Draw custom scalable vector paths"
      >
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
      <IconButton
        onClick={() => useStore.getState().shufflePalette?.()}
        title="1-Click Palette Shuffler — Randomize document colors harmoniously"
        className="ml-1 !bg-brand-500/20 hover:!bg-brand-500/40 text-brand-400"
      >
        <Icons.Shuffle className="w-4 h-4" />
      </IconButton>
      <Divider />

      <div className="flex items-center gap-4 px-1">
        {[
          {
            icon: Icons.Sun,
            val: canvasFilters.brightness,
            key: 'brightness',
            max: 200,
            title: 'Brightness (Double-click to reset)',
          },
          {
            icon: Icons.Contrast,
            val: canvasFilters.contrast,
            key: 'contrast',
            max: 200,
            title: 'Contrast (Double-click to reset)',
          },
          {
            icon: Icons.Droplet,
            val: canvasFilters.saturation,
            key: 'saturation',
            max: 200,
            title: 'Saturation (Double-click to reset)',
          },
        ].map((item: any) => (
          <div key={item.key} className="flex items-center gap-2 group" title={item.title}>
            <item.icon
              className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors cursor-pointer"
              onDoubleClick={() => setCanvasFilters({ ...canvasFilters, [item.key]: 100 })}
            />
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
              value={(canvasFilters as any)[item.key] ?? 100}
              onChange={(e) => setCanvasFilters({ ...canvasFilters, [item.key]: parseInt(e.target.value) })}
              className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-600 hover:bg-white/20 transition-colors"
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
            className="group relative w-10 h-8 rounded-lg overflow-hidden border border-white/10 hover:border-brand-600 transition-all bg-[#0e1318]"
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
});

CanvasTools.displayName = 'CanvasTools';
