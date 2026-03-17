import React, { useMemo, useState } from 'react';
import { AppMode, AspectRatio, ShapeLayer } from '../../types';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { analyticsService } from '../../services/analyticsService';
import { STARTER_TEMPLATES } from '../../data/templates';

interface TemplatesPanelProps {
  setPrompt: (s: string) => void;
  setAspectRatio: (a: AspectRatio) => void;
  onSetMode: (m: AppMode) => void;
  onApplyLayout?: (shapes: Partial<ShapeLayer>[]) => void;
  onApplyTemplate?: (templateId: string, confirmReplace?: boolean) => void;
  onApplyTheme?: (colors: string[]) => void;
}

const DESIGN_CATEGORIES = [
  { id: 'All', label: 'All Designs', icon: Icons.Grid, color: 'from-gray-700 to-gray-900' },
  { id: 'Social', label: 'Social Media', icon: Icons.Image, color: 'from-pink-500 to-rose-600' },
  { id: 'Business', label: 'Business', icon: Icons.Briefcase, color: 'from-blue-600 to-indigo-700' },
  { id: 'Video', label: 'Video & Thumbnails', icon: Icons.Monitor, color: 'from-red-500 to-orange-600' },
  { id: 'Personal', label: 'Personal', icon: Icons.User, color: 'from-green-500 to-emerald-600' },
];

const THEMES = [
  { name: 'Midnight', colors: ['#0f172a', '#1e293b', '#38bdf8', '#f8fafc'] },
  { name: 'Neon', colors: ['#09090b', '#27272a', '#d946ef', '#22d3ee'] },
  { name: 'Sunset', colors: ['#fff7ed', '#fed7aa', '#f97316', '#431407'] },
  { name: 'Solarized', colors: ['#002b36', '#073642', '#268bd2', '#859900'] },
  { name: 'Nordic', colors: ['#2e3440', '#3b4252', '#88c0d0', '#eceff4'] },
  { name: 'Amethyst', colors: ['#1a1a2e', '#16213e', '#7d2ae8', '#e94560'] },
  { name: 'Luxury', colors: ['#0c0a09', '#1c1917', '#d6d3d1', '#e7e5e4'] },
  { name: 'Corporate', colors: ['#ffffff', '#f1f5f9', '#3b82f6', '#1e3a8a'] },
];

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  setPrompt: _setPrompt,
  setAspectRatio: _setAspectRatio,
  onSetMode: _onSetMode,
  onApplyLayout,
  onApplyTemplate,
  onApplyTheme,
}) => {
  const [category, setCategory] = useState('All');
  const [showReplaceWarning, setShowReplaceWarning] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const favoriteTemplates = useStore((state) => state.favoriteTemplates);
  const toggleFavoriteTemplate = useStore((state) => state.toggleFavoriteTemplate);

  const activeCategoryLabel = DESIGN_CATEGORIES.find((c) => c.id === category)?.label || 'All Designs';

  const grids = [
    {
      name: '2-Up Horizontal',
      icon: Icons.LayoutRow,
      shapes: [
        { type: 'rectangle', x: 20, y: 156, width: 226, height: 200, color: '#2a2a2a' },
        { type: 'rectangle', x: 266, y: 156, width: 226, height: 200, color: '#2a2a2a' },
      ],
    },
    {
      name: '3-Column',
      icon: Icons.LayoutCol,
      shapes: [
        { type: 'rectangle', x: 10, y: 56, width: 157, height: 400, color: '#2a2a2a' },
        { type: 'rectangle', x: 177, y: 56, width: 158, height: 400, color: '#333' },
        { type: 'rectangle', x: 345, y: 56, width: 157, height: 400, color: '#2a2a2a' },
      ],
    },
    {
      name: 'Hero Split',
      icon: Icons.LayoutRow,
      shapes: [
        { type: 'rectangle', x: 0, y: 0, width: 512, height: 256, color: '#222' },
        { type: 'rectangle', x: 0, y: 256, width: 256, height: 256, color: '#333' },
        { type: 'rectangle', x: 256, y: 256, width: 256, height: 256, color: '#444' },
      ],
    },
    {
      name: 'Grid 4',
      icon: Icons.Grid,
      shapes: [
        { type: 'rectangle', x: 20, y: 20, width: 226, height: 226, color: '#2a2a2a' },
        { type: 'rectangle', x: 266, y: 20, width: 226, height: 226, color: '#333' },
        { type: 'rectangle', x: 20, y: 266, width: 226, height: 226, color: '#333' },
        { type: 'rectangle', x: 266, y: 266, width: 226, height: 226, color: '#2a2a2a' },
      ],
    },
    { name: 'Golden Vertical', icon: Icons.LayoutCol, layout: 'golden_v' },
    { name: 'Golden Horizontal', icon: Icons.LayoutRow, layout: 'golden_h' },
    { name: 'Golden Grid', icon: Icons.Grid, layout: 'golden_grid' },
  ];

  const starterTemplates = useMemo(() => {
    let filtered = STARTER_TEMPLATES;
    if (category !== 'All') {
      filtered = filtered.filter((t) => t.category === category);
    }
    if (showFavoritesOnly) {
      filtered = filtered.filter((t) => favoriteTemplates.includes(t.id));
    }
    return filtered;
  }, [category, showFavoritesOnly, favoriteTemplates]);

  return (
    <div className="flex flex-col h-full bg-[#13161a]">
      {/* New Header with Categories */}
      <div className="p-4 border-b border-gray-700 bg-[#13161a] sticky top-0 z-10">
        {category === 'All' ? (
          <div className="mb-2">
            <h3 className="text-white font-bold mb-3">Browse Categories</h3>
            <div className="grid grid-cols-2 gap-2">
              {DESIGN_CATEGORIES.filter((c) => c.id !== 'All').map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`relative h-16 rounded-lg overflow-hidden flex items-center justify-center group`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${c.color} opacity-80 group-hover:opacity-100 transition-opacity`}
                  ></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <c.icon className="w-5 h-5 text-white mb-1 drop-shadow-md" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wide drop-shadow-md">
                      {c.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setCategory('All')}
              className="p-1 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white"
            >
              <Icons.ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-white">{activeCategoryLabel}</span>
          </div>
        )}

        <div className="relative mt-2">
          <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-[#7d2ae8]"
          />
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border w-full justify-center ${
              showFavoritesOnly 
                ? 'bg-red-500/10 border-red-500/50 text-red-400' 
                : 'bg-[#1e1e1e] border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            <Icons.Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            Favorites Only
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
        {/* Themes Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase">Color Themes</h4>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {THEMES.map((theme, i) => (
              <button
                key={i}
                onClick={() => onApplyTheme && onApplyTheme(theme.colors)}
                className="flex-shrink-0 group flex flex-col gap-1 w-12"
                title={theme.name}
              >
                <div className="h-12 w-12 rounded-full overflow-hidden border border-gray-700 group-hover:border-white transition-colors relative flex flex-wrap">
                  {theme.colors.map((c, ci) => (
                    <div key={ci} style={{ backgroundColor: c }} className="w-1/2 h-1/2"></div>
                  ))}
                </div>
                <span className="text-[9px] text-gray-500 text-center truncate group-hover:text-gray-300">
                  {theme.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Layouts Section */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Quick Layouts</h4>
          <div className="grid grid-cols-4 gap-2">
            {grids.map((g, i) => (
              <button
                key={i}
                onClick={() => {
                  if (g.layout) {
                    onApplyLayout && (onApplyLayout as any)(g.layout);
                  } else {
                    onApplyLayout && onApplyLayout(g.shapes as any);
                  }
                }}
                className="aspect-square bg-[#1e1e1e] border border-gray-700 rounded hover:border-[#00c4cc] flex flex-col items-center justify-center text-gray-500 hover:text-white transition-all hover:bg-[#252627] gap-1"
                title={g.name}
              >
                <g.icon className="w-5 h-5" />
                <span className="text-[8px] font-medium hidden sm:block truncate w-full text-center px-1">
                  {g.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Starter Templates */}
        {starterTemplates.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Professional Templates</h4>
            <div className="grid grid-cols-1 gap-4">
              {starterTemplates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    if (!onApplyTemplate) {
                      return;
                    }
                    const proceed =
                      !showReplaceWarning ||
                      window.confirm(
                        'Apply template? This will replace your current canvas size, background, and layers.'
                      );
                    if (!proceed) {
                      return;
                    }
                    onApplyTemplate(tmpl.id, showReplaceWarning);
                    analyticsService.trackTemplateApply(tmpl.id, tmpl.name);
                  }}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className="cursor-pointer group relative aspect-video rounded-lg overflow-hidden bg-[#1e1e1e] border border-gray-700 hover:border-[#7d2ae8] transition-all shadow-lg text-left select-none"
                >
                  {/* Mini SVG preview — renders template layers as scaled colored blocks */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ backgroundColor: tmpl.state.canvasBackgroundColor || '#1a1a2e' }}
                  >
                    <svg
                      viewBox={`0 0 ${tmpl.size.width} ${tmpl.size.height}`}
                      preserveAspectRatio="xMidYMid slice"
                      className="w-full h-full"
                      style={{ opacity: 0.9 }}
                    >
                      {(tmpl.state.artboards?.[0]?.layers || []).slice(0, 12).map((layer: any, li: number) => {
                        if (layer.type === 'image') {
                          return (
                            <rect
                              key={li}
                              x={layer.x}
                              y={layer.y}
                              width={layer.width}
                              height={layer.height}
                              fill="#ffffff22"
                              rx={4}
                            />
                          );
                        }
                        if (layer.type === 'text') {
                          return (
                            <rect
                              key={li}
                              x={layer.x}
                              y={layer.y}
                              width={Math.min(layer.width || 200, tmpl.size.width * 0.7)}
                              height={layer.fontSize ? layer.fontSize * 1.2 : 20}
                              fill={layer.color || '#ffffff'}
                              opacity={0.85}
                              rx={2}
                            />
                          );
                        }
                        if (layer.type === 'circle') {
                          return (
                            <ellipse
                              key={li}
                              cx={layer.x + layer.width / 2}
                              cy={layer.y + (layer.height || layer.width) / 2}
                              rx={layer.width / 2}
                              ry={(layer.height || layer.width) / 2}
                              fill={layer.color || '#7d2ae8'}
                              opacity={layer.opacity ?? 0.9}
                            />
                          );
                        }
                        return (
                          <rect
                            key={li}
                            x={layer.x}
                            y={layer.y}
                            width={layer.width}
                            height={layer.height || layer.width}
                            fill={layer.color || '#7d2ae8'}
                            opacity={layer.opacity ?? 0.9}
                            rx={layer.cornerRadius || 0}
                          />
                        );
                      })}
                    </svg>
                  </div>

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-5px] group-hover:translate-y-0 duration-300 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteTemplate(tmpl.id);
                      }}
                      className="p-1.5 bg-black/60 hover:bg-black text-red-500 rounded-lg backdrop-blur-md transition-all shadow-lg"
                    >
                      <Icons.Heart className={`w-3 h-3 ${favoriteTemplates.includes(tmpl.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-sm flex items-center justify-between border-t border-white/5">
                    <span className="font-semibold text-xs text-white truncate">{tmpl.name}</span>
                    <span className="text-[9px] text-gray-400">
                      {tmpl.size.width}×{tmpl.size.height}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-2 p-2 bg-[#1e1e1e] rounded border border-gray-700">
          <input
            id="warn-replace"
            type="checkbox"
            checked={showReplaceWarning}
            onChange={(e) => setShowReplaceWarning(e.target.checked)}
            className="accent-[#7d2ae8]"
          />
          <label htmlFor="warn-replace" className="text-[11px] text-gray-400 cursor-pointer select-none">
            Confirm before replacing canvas
          </label>
        </div>
      </div>
    </div>
  );
};

export default TemplatesPanel;
