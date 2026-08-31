import React, { useState } from 'react';
import { Icons } from '../../constants';
import { Button } from '../Button';
import { PanelHeader } from './PanelHeader';

export const VideoAgentPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cinematic' | 'avatar'>('cinematic');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoResult, setVideoResult] = useState<string | null>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setVideoResult(null);
    // Simulate generation delay
    setTimeout(() => {
      setIsGenerating(false);
      // Dummy generated state
      setVideoResult('https://cdn.pixabay.com/video/2021/08/04/83864-584742461_tiny.mp4');
    }, 4000);
  };

  return (
    <div className="flex flex-col h-full bg-surface-dark-3 text-white z-[110]">
      <PanelHeader title="Magic Video" icon={<Icons.Play className="w-4 h-4 text-brand-400" />} />

      {/* Tabs */}
      <div className="flex border-b border-white/5 p-2 gap-2">
        <button
          onClick={() => setActiveTab('cinematic')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'cinematic' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <Icons.Play className="w-3.5 h-3.5" />
          Cinematic
        </button>
        <button
          onClick={() => setActiveTab('avatar')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'avatar' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <Icons.User className="w-3.5 h-3.5" />
          Marketing Avatar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {activeTab === 'cinematic' ? (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Cinematic Generator (Text-to-Video)
              </label>
              <div className="relative group p-1 bg-surface-dark-2 rounded-xl border border-white/10 focus-within:border-brand-500 transition-colors shadow-inner">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g. A hyper-realistic drone shot over Lagos at sunset, cyberpunk aesthetics, 4k 60fps..."
                  className="w-full h-24 bg-transparent resize-none p-3 text-xs text-white placeholder-gray-600 focus:outline-none custom-scrollbar"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Camera Motion</label>
              <div className="grid grid-cols-3 gap-2">
                {['Pan Right', 'Zoom In', 'Tilt Up'].map((motion) => (
                  <button
                    key={motion}
                    className="py-1.5 px-2 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-300 hover:bg-white/10 hover:text-white font-medium transition-colors"
                  >
                    {motion}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Model Engine</label>
              <select className="w-full bg-surface-dark-2 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500">
                <option value="runway">Runway Gen-3 Alpha</option>
                <option value="luma">Luma Dream Machine</option>
                <option value="kling">Kling AI 3.0</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Avatar Generator (Script-to-Video)
              </label>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[1, 2, 3, 4].map((id) => (
                  <div key={id} className="aspect-square bg-white/5 rounded-xl border border-white/10 hover:border-brand-500 cursor-pointer overflow-hidden group relative">
                    <img src={`https://i.pravatar.cc/150?img=${id * 10}`} alt={`Avatar ${id}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                  </div>
                ))}
              </div>

              <div className="relative group p-1 bg-surface-dark-2 rounded-xl border border-white/10 focus-within:border-brand-500 transition-colors shadow-inner">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Paste your script or a product URL here to generate an automated UGC-style presenter ad..."
                  className="w-full h-32 bg-transparent resize-none p-3 text-xs text-white placeholder-gray-600 focus:outline-none custom-scrollbar"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Voice & Tone</label>
              <div className="grid grid-cols-2 gap-2">
                <select className="w-full bg-surface-dark-2 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500">
                  <option>English (Nigerian)</option>
                  <option>English (US)</option>
                  <option>French (African)</option>
                </select>
                <select className="w-full bg-surface-dark-2 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500">
                  <option>Professional</option>
                  <option>Excited & Hype</option>
                  <option>Educational</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Generate Action */}
        <div className="pt-4 border-t border-white/5">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            variant="primary"
            className="w-full py-3 bg-brand-600 hover:bg-[#6b23c5] disabled:opacity-50 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Icons.RefreshCw className="w-4 h-4 animate-spin" />
                Rendering Video...
              </span>
            ) : (
              'Generate Magic Video'
            )}
          </Button>
        </div>

        {/* Result Area */}
        {videoResult && (
          <div className="mt-6 space-y-2 animate-in fade-in slide-in-from-bottom-2">
            <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Icons.Check className="w-3 h-3" />
              Generation Complete
            </label>
            <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-video relative group">
              <video src={videoResult} autoPlay loop muted controls className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="secondary" className="bg-black/60 text-white hover:bg-brand-500 border-none backdrop-blur-md">
                  <Icons.Plus className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="secondary" className="bg-black/60 text-white hover:bg-brand-500 border-none backdrop-blur-md">
                  <Icons.Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <p className="text-[9px] text-gray-500 text-center font-medium">Click '+' to add this video to your canvas as a Media Layer.</p>
          </div>
        )}
      </div>
    </div>
  );
};
