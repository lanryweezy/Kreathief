
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
}

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  setPrompt,
  setAspectRatio,
  onSetMode,
  onApplyLayout,
  onApplyTemplate
}) => {
  const [category, setCategory] = useState('All');
  const [showReplaceWarning, setShowReplaceWarning] = useState(true);

  const templates = [
    { label: "Neon Cyberpunk", cat: "Futuristic", prompt: "A futuristic city street at night, heavy neon rain, cyberpunk aesthetic, pink and blue lighting", ratio: AspectRatio.PORTRAIT, color: "from-pink-500 to-purple-600" },
    { label: "Minimalist Bokeh", cat: "Abstract", prompt: "Soft focus abstract background, pastel gradients, floating spheres, minimalist 3d render", ratio: AspectRatio.SQUARE, color: "from-blue-200 to-white" },
    { label: "Vintage Travel", cat: "Retro", prompt: "A retro travel poster illustration of the Swiss Alps, grainy texture, muted colors, 1950s style", ratio: AspectRatio.PORTRAIT, color: "from-orange-400 to-yellow-200" },
    { label: "Product Studio", cat: "Minimal", prompt: "Professional product photography background, marble surface, soft window light, blurred botanical elements", ratio: AspectRatio.SQUARE, color: "from-gray-200 to-gray-400" },
    { label: "Dark Fantasy", cat: "Art", prompt: "An ancient forest with glowing mushrooms, mystical atmosphere, dark fantasy oil painting style", ratio: AspectRatio.LANDSCAPE, color: "from-green-900 to-black" },
    { label: "Tech Glitch", cat: "Futuristic", prompt: "Digital glitch art background, data stream, matrix code, distorted tech interface", ratio: AspectRatio.LANDSCAPE, color: "from-gray-900 to-green-500" },
  ];

  const grids = [
      { name: "2-Up", shapes: [
          { type: 'rectangle', x: 20, y: 156, width: 226, height: 200, color: '#2a2a2a' },
          { type: 'rectangle', x: 266, y: 156, width: 226, height: 200, color: '#2a2a2a' }
      ]},
      { name: "3-Column", shapes: [
          { type: 'rectangle', x: 10, y: 56, width: 157, height: 400, color: '#2a2a2a' },
          { type: 'rectangle', x: 177, y: 56, width: 158, height: 400, color: '#333' },
          { type: 'rectangle', x: 345, y: 56, width: 157, height: 400, color: '#2a2a2a' }
      ]},
      { name: "Grid 4", shapes: [
          { type: 'rectangle', x: 20, y: 20, width: 226, height: 226, color: '#2a2a2a' },
          { type: 'rectangle', x: 266, y: 20, width: 226, height: 226, color: '#333' },
          { type: 'rectangle', x: 20, y: 266, width: 226, height: 226, color: '#333' },
          { type: 'rectangle', x: 266, y: 266, width: 226, height: 226, color: '#2a2a2a' }
      ]},
      { name: "Hero Split", shapes: [
          { type: 'rectangle', x: 0, y: 0, width: 512, height: 256, color: '#222' },
          { type: 'rectangle', x: 0, y: 256, width: 256, height: 256, color: '#333' },
          { type: 'rectangle', x: 256, y: 256, width: 256, height: 256, color: '#444' }
      ]},
  ];

  const filteredTemplates = category === 'All' ? templates : templates.filter(t => t.cat === category);

  const starterTemplates = useMemo(() => {
    if (category === 'All') return STARTER_TEMPLATES;
    return STARTER_TEMPLATES.filter(t => t.category === category || t.category === 'Social' && category === 'Social');
  }, [category]);

  return (
    <div className="flex flex-col h-full bg-[#13161a]">
       <div className="p-4 border-b border-gray-700">
           <div className="relative mb-4">
              <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search templates" className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-[#7d2ae8]" />
           </div>
           
           <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {['All', 'Futuristic', 'Retro', 'Minimal', 'Abstract'].map(c => (
                 <button 
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${category === c ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'}`}
                 >
                    {c}
                 </button>
              ))}
           </div>
       </div>
       
       <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Layouts</h4>
          <div className="grid grid-cols-2 gap-3 mb-6">
             {grids.map((g, i) => (
                 <button 
                    key={i}
                    onClick={() => onApplyLayout && onApplyLayout(g.shapes as any)}
                    className="aspect-video bg-[#1e1e1e] border border-gray-700 rounded-lg hover:border-[#00c4cc] flex items-center justify-center text-xs text-gray-400 font-medium hover:text-white transition-all hover:bg-[#252627]"
                 >
                    {g.name}
                 </button>
             ))}
          </div>

          <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Starter Templates</h4>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {starterTemplates.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => {
                  if (!onApplyTemplate) return;
                  const proceed = !showReplaceWarning || window.confirm("Apply template? This will replace your current canvas size, background, and layers.");
                  if (!proceed) return;
                  onApplyTemplate(tmpl.id, false);
                }}
                className="cursor-pointer group relative aspect-[4/3] rounded-lg overflow-hidden bg-[#1e1e1e] border border-gray-700 hover:border-[#00c4cc] transition-all shadow-lg text-left"
              >
                <div className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-black/40 px-2 py-1 rounded-full">
                  {tmpl.category}
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-gray-300 bg-black/40 px-2 py-1 rounded">
                  <span className="font-semibold text-white truncate">{tmpl.name}</span>
                  <span className="text-gray-400">{tmpl.size.width}×{tmpl.size.height}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 to-slate-800/40"></div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-6">
            <input
              id="warn-replace"
              type="checkbox"
              checked={showReplaceWarning}
              onChange={(e) => setShowReplaceWarning(e.target.checked)}
              className="accent-[#7d2ae8]"
            />
            <label htmlFor="warn-replace" className="text-[11px] text-gray-400">Ask before replacing my current design</label>
          </div>

          <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">AI Starting Points</h4>
          <div className="grid grid-cols-2 gap-3 pb-10">
            {filteredTemplates.map((t, i) => (
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
                 </div>
              </div>
            ))}
          </div>
       </div>
    </div>
  );
};
