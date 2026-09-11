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
  const [showResizeMenu, setShowResizeMenu] = React.useState(false);
  const resizeMenuRef = React.useRef<HTMLDivElement>(null);

  const RESIZE_FORMATS = [
    { name: 'Instagram Post', width: 1080, height: 1080 },
    { name: 'Story / Reel', width: 1080, height: 1920 },
    { name: 'YouTube Thumbnail', width: 1280, height: 720 },
    { name: 'Facebook Post', width: 1200, height: 630 },
    { name: 'X / Twitter Post', width: 1600, height: 900 },
    { name: 'Presentation', width: 1920, height: 1080 },
  ];

  React.useEffect(() => {
    if (!showResizeMenu) {
      return;
    }
    const handleClick = (e: MouseEvent) => {
      if (resizeMenuRef.current && !resizeMenuRef.current.contains(e.target as Node)) {
        setShowResizeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showResizeMenu]);

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

      {/* Magic Resize Button */}
      <div className="relative" ref={resizeMenuRef}>
        <button
          onClick={() => setShowResizeMenu(!showResizeMenu)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold transition-all ${
            showResizeMenu
              ? 'bg-brand-600 text-white shadow-lg'
              : 'bg-surface-dark-3 border border-gray-700 text-gray-300 hover:border-brand-600 hover:text-white'
          }`}
          title="Magic Resize — Adapt canvas/design to other formats"
        >
          <Icons.Maximize className="w-3.5 h-3.5 text-brand-400" />
          <span>Resize</span>
        </button>

        {showResizeMenu && (
          <div className="absolute top-full left-0 mt-2 w-60 bg-surface-dark-3 border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1.5 z-[200]">
            <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500">
              Magic Resize
            </div>
            {RESIZE_FORMATS.map((f) => (
              <button
                key={f.name}
                onClick={() => {
                  useStore.getState().magicResizeAll([f]);
                  setShowResizeMenu(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <span>{f.name}</span>
                <span className="text-[10px] text-gray-500 font-medium">
                  {f.width}×{f.height}
                </span>
              </button>
            ))}
            <div className="h-px bg-white/5 my-1" />
            <button
              onClick={() => {
                useStore.getState().magicResizeAll(RESIZE_FORMATS);
                setShowResizeMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-brand-400 hover:bg-brand-600/10 rounded-lg transition-colors"
            >
              <Icons.Grid className="w-3.5 h-3.5" />
              Resize for all formats
            </button>
          </div>
        )}
      </div>

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
