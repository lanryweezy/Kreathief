import React, { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Wand2, Clock, Grid, Box, Layers, Palette, Sparkles, PenTool, Camera, Clapperboard } from 'lucide-react';
import { useKreathiefStore } from '../store/useStore';

const AI_STYLE_PRESETS = [
  { name: 'Pixel Art', icon: <Grid size={12} />, prompt: 'pixel art, 16-bit style, retro game sprite' },
  { name: 'Flat Design', icon: <Box size={12} />, prompt: 'flat design, minimal, clean shapes, vector style' },
  { name: '3D Render', icon: <Layers size={12} />, prompt: '3D render, isometric, smooth lighting, soft shadows' },
  { name: 'Watercolor', icon: <Palette size={12} />, prompt: 'watercolor painting, soft edges, artistic, organic' },
  {
    name: 'Neon Glow',
    icon: <Sparkles size={12} />,
    prompt: 'neon glowing, cyberpunk, dark background, vibrant colors',
  },
  { name: 'Sketch', icon: <PenTool size={12} />, prompt: 'pencil sketch, hand-drawn, rough lines, white background' },
  {
    name: 'Photorealistic',
    icon: <Camera size={12} />,
    prompt: 'photorealistic, high detail, 8k, professional photography',
  },
  { name: 'Cartoon', icon: <Clapperboard size={12} />, prompt: 'cartoon style, bold outlines, bright colors, playful' },
];

export const AIPanel: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const { addToast } = useKreathiefStore(
    useShallow((state) => ({ addToast: state.addToast }))
  );
  const [history, setHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('kreathief_ai_history') || '[]');
    } catch {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);

  const addToHistory = (p: string) => {
    const updated = [p, ...history.filter((h) => h !== p)].slice(0, 20);
    setHistory(updated);
    localStorage.setItem('kreathief_ai_history', JSON.stringify(updated));
  };

  const handleGenerate = () => {
    if (prompt.trim()) {
      addToHistory(prompt.trim());
      addToast('info', `Generating: ${prompt.slice(0, 40)}...`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Prompt input */}
      <div>
        <h3 className="text-xs font-bold text-neutral-400 mb-2">AI Design Assistant</h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleGenerate();
            }
          }}
          placeholder="Describe what you want to create..."
          className="w-full px-3 py-2 text-xs bg-neutral-800 rounded-lg border border-neutral-600 text-white outline-none resize-none h-20 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          aria-label="AI prompt"
        />
        <div className="flex gap-1 mt-2">
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim()}
            className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 rounded-lg text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label="Generate AI design (Ctrl+Enter)"
          >
            <Wand2 size={14} />
            Generate
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-2 rounded-lg text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 ${showHistory ? 'bg-neutral-700 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
            aria-label="Toggle prompt history"
            aria-pressed={showHistory}
          >
            <Clock size={14} />
          </button>
        </div>
      </div>

      {/* Prompt History */}
      {showHistory && history.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Recent Prompts</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => setPrompt(h)}
                className="w-full text-left px-2 py-1 text-xs text-neutral-400 bg-neutral-800/30 hover:bg-neutral-800 rounded transition-colors truncate focus:outline-none focus:ring-1 focus:ring-neutral-500"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Style Presets */}
      <div>
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Style Presets</h3>
        <div className="grid grid-cols-2 gap-1">
          {AI_STYLE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setPrompt((prev) => (prev ? `${prev}, ${preset.prompt}` : preset.prompt))}
              className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-300 bg-neutral-800/50 hover:bg-neutral-800 rounded-lg transition-colors text-left focus:outline-none focus:ring-1 focus:ring-neutral-500"
              aria-label={`Add ${preset.name} style`}
            >
              <span>{preset.icon}</span>
              <span className="truncate">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
