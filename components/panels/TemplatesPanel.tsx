
import React, { useMemo, useState } from 'react';
import { AppMode, AspectRatio, ShapeLayer } from '../../types';
import { Icons } from '../../constants';
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
  { name: 'Forest', colors: ['#f0fdf4', '#86efac', '#16a34a', '#14532d'] },
  { name: 'Luxury', colors: ['#0c0a09', '#1c1917', '#d6d3d1', '#e7e5e4'] },
  { name: 'Corporate', colors: ['#ffffff', '#f1f5f9', '#3b82f6', '#1e3a8a'] },
];

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  setPrompt,
  setAspectRatio,
  onSetMode,
  onApplyLayout,
  onApplyTemplate,
  onApplyTheme
}) => {
  const [category, setCategory] = useState('All');
  const [showReplaceWarning, setShowReplaceWarning] = useState(true);

  const activeCategoryLabel = DESIGN_CATEGORIES.find(c => c.id === category)?.label || 'All Designs';

  // Enhanced AI Prompts with more visual variety
  const aiTemplates = [
    { label: "Neon Cyberpunk", cat: "Futuristic", prompt: "A futuristic city street at night, heavy neon rain, cyberpunk aesthetic, pink and blue lighting", ratio: AspectRatio.PORTRAIT, color: "from-pink-500 to-purple-600" },
    { label: "Minimalist Bokeh", cat: "Abstract", prompt: "Soft focus abstract background, pastel gradients, floating spheres, minimalist 3d render", ratio: AspectRatio.SQUARE, color: "from-blue-200 to-white" },
    { label: "Vintage Travel", cat: "Retro", prompt: "A retro travel poster illustration of the Swiss Alps, grainy texture, muted colors, 1950s style", ratio: AspectRatio.PORTRAIT, color: "from-orange-400 to-yellow-200" },
    { label: "Product Studio", cat: "Minimal", prompt: "Professional product photography background, marble surface, soft window light, blurred botanical elements", ratio: AspectRatio.SQUARE, color: "from-gray-200 to-gray-400" },
    { label: "Dark Fantasy", cat: "Art", prompt: "An ancient forest with glowing mushrooms, mystical atmosphere, dark fantasy oil painting style", ratio: AspectRatio.LANDSCAPE, color: "from-green-900 to-black" },
    { label: "Tech Glitch", cat: "Futuristic", prompt: "Digital glitch art background, data stream, matrix code, distorted tech interface", ratio: AspectRatio.LANDSCAPE, color: "from-gray-900 to-green-500" },
  ];

  const grids = [
    {
      name: "2-Up Horizontal", icon: Icons.LayoutRow, shapes: [
        { type: 'rectangle', x: 20, y: 156, width: 226, height: 200, color: '#2a2a2a' },
        { type: 'rectangle', x: 266, y: 156, width: 226, height: 200, color: '#2a2a2a' }
      ]
    },
    {
      name: "3-Column", icon: Icons.LayoutCol, shapes: [
        { type: 'rectangle', x: 10, y: 56, width: 157, height: 400, color: '#2a2a2a' },
        { type: 'rectangle', x: 177, y: 56, width: 158, height: 400, color: '#333' },
        { type: 'rectangle', x: 345, y: 56, width: 157, height: 400, color: '#2a2a2a' }
      ]
    },
    {
      name: "Hero Split", icon: Icons.LayoutRow, shapes: [
        { type: 'rectangle', x: 0, y: 0, width: 512, height: 256, color: '#222' },
        { type: 'rectangle', x: 0, y: 256, width: 256, height: 256, color: '#333' },
        { type: 'rectangle', x: 256, y: 256, width: 256, height: 256, color: '#444' }
      ]
    },
    {
      name: "Grid 4", icon: Icons.Grid, shapes: [
        { type: 'rectangle', x: 20, y: 20, width: 226, height: 226, color: '#2a2a2a' },
        { type: 'rectangle', x: 266, y: 20, width: 226, height: 226, color: '#333' },
        { type: 'rectangle', x: 20, y: 266, width: 226, height: 226, color: '#333' },
        { type: 'rectangle', x: 266, y: 266, width: 226, height: 226, color: '#2a2a2a' }
      ]
    },
  ];

  const filteredAiTemplates = category === 'All' ? aiTemplates : aiTemplates.filter(t => t.cat === category || (category === 'Video' && t.ratio === AspectRatio.LANDSCAPE));

  const starterTemplates = useMemo(() => {
    if (category === 'All') return STARTER_TEMPLATES;
    return STARTER_TEMPLATES.filter(t => t.category === category);
  }, [category]);

  return (
    <div className="flex flex-col h-full bg-[#13161a]">
      {/* New Header with Categories */}
      <div className="p-4 border-b border-gray-700 bg-[#13161a] sticky top-0 z-10">
        {category === 'All' ? (
          <div className="mb-2">
            <h3 className="text-white font-bold mb-3">Browse Categories</h3>
            <div className="grid grid-cols-2 gap-2">
              {DESIGN_CATEGORIES.filter(c => c.id !== 'All').map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`relative h-16 rounded-lg overflow-hidden flex items-center justify-center group`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${c.color} opacity-80 group-hover:opacity-100 transition-opacity`}></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <c.icon className="w-5 h-5 text-white mb-1 drop-shadow-md" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wide drop-shadow-md">{c.label}</span>
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
          <input type="text" placeholder="Search templates..." className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-[#7d2ae8]" />
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
                <span className="text-[9px] text-gray-500 text-center truncate group-hover:text-gray-300">{theme.name}</span>
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
                onClick={() => onApplyLayout && onApplyLayout(g.shapes as any)}
                className="aspect-square bg-[#1e1e1e] border border-gray-700 rounded hover:border-[#00c4cc] flex flex-col items-center justify-center text-gray-500 hover:text-white transition-all hover:bg-[#252627] gap-1"
                title={g.name}
              >
                <g.icon className="w-5 h-5" />
                <span className="text-[8px] font-medium hidden sm:block">{g.name.split(' ')[0]}</span>
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
                    if (!onApplyTemplate) return;
                    const proceed = !showReplaceWarning || window.confirm("Apply template? This will replace your current canvas size, background, and layers.");
                    if (!proceed) return;
                    onApplyTemplate(tmpl.id, false);
                  }}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className="cursor-pointer group relative aspect-video rounded-lg overflow-hidden bg-[#1e1e1e] border border-gray-700 hover:border-[#7d2ae8] transition-all shadow-lg text-left select-none"
                >
                  {/* Simulation of template preview content based on category */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${tmpl.category === 'Social' ? 'from-purple-900 to-indigo-900' : 'from-slate-800 to-slate-900'} opacity-50`}></div>

                  <div className="absolute top-3 left-3 right-3 bottom-10">
                    {/* Mini mockup of content */}
                    <div className="w-2/3 h-4 bg-white/20 rounded mb-2"></div>
                    <div className="w-1/2 h-2 bg-white/10 rounded mb-4"></div>
                    <div className="absolute bottom-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-sm flex items-center justify-between border-t border-white/5">
                    <span className="font-semibold text-xs text-white truncate">{tmpl.name}</span>
                    <span className="text-[9px] text-gray-400">{tmpl.size.width}×{tmpl.size.height}</span>
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
          <label htmlFor="warn-replace" className="text-[11px] text-gray-400 cursor-pointer select-none">Confirm before replacing canvas</label>
        </div>

        {/* AI Templates */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">AI Design Starters</h4>
          <div className="grid grid-cols-2 gap-3 pb-10">
            {filteredAiTemplates.map((t, i) => (
              <div
                key={i}
                onClick={() => {
                  setPrompt(t.prompt);
                  setAspectRatio(t.ratio);
                  onSetMode(AppMode.GENERATE);
                }}
                className="cursor-pointer group relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 hover:ring-2 hover:ring-[#00c4cc] transition-all shadow-lg"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-80 group-hover:opacity-100 transition-opacity`}></div>
                <div className="absolute inset-0 p-3 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent">
                  <span className="text-[9px] font-bold text-white/70 uppercase tracking-wider mb-1">{t.cat}</span>
                  <span className="text-white font-bold text-sm leading-tight">{t.label}</span>
                  <div className="mt-2 flex items-center gap-1 text-[9px] text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icons.Magic className="w-3 h-3" />
                    <span>Generate</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesPanel;
