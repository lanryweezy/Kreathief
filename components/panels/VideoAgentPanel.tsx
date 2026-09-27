import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { Button } from '../Button';
import { PanelHeader } from './PanelHeader';

const CAMERA_MOTIONS = [
  { id: 'pan-right', label: 'Pan Right', icon: <Icons.ArrowRight className="w-3 h-3" /> },
  { id: 'pan-left', label: 'Pan Left', icon: <Icons.ArrowLeft className="w-3 h-3" /> },
  { id: 'zoom-in', label: 'Zoom In', icon: <Icons.ZoomIn className="w-3 h-3" /> },
  { id: 'zoom-out', label: 'Zoom Out', icon: <Icons.ZoomOut className="w-3 h-3" /> },
  { id: 'tilt-up', label: 'Tilt Up', icon: <Icons.ArrowUp className="w-3 h-3" /> },
  { id: 'orbit-360', label: 'Orbit 360', icon: <Icons.RefreshCw className="w-3 h-3" /> },
];

const VIDEO_MODELS = [
  { id: 'jev-auto', name: 'Jev AI Auto-Route', tag: 'Fastest', description: 'Automatically routes to the best model based on prompt.' },
  { id: 'runway-gen3', name: 'Runway Gen-3 Alpha', tag: 'Cinematic', description: 'High-fidelity cinematic generation.' },
  { id: 'luma-dream', name: 'Luma Dream Machine', tag: 'Creative', description: 'Fast and imaginative video synthesis.' },
  { id: 'kling-v3', name: 'Kling AI 3.0', tag: 'Realistic', description: 'Photorealistic character and motion generation.' }
];

export const VideoAgentPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cinematic' | 'avatar'>('cinematic');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [activeMotion, setActiveMotion] = useState<string>('pan-right');
  const [activeModel, setActiveModel] = useState<string>('jev-auto');

  // Wire into the Universal Router: pick up intent from Dashboard/Assistant
  const currentStoreTab = useStore((state) => state.activeTab);
  const globalIntent = useStore((state) => state.agentIntent);
  
  useEffect(() => {
    if (currentStoreTab === 'VIDEO_AGENT' && globalIntent && globalIntent !== prompt) {
      setPrompt(globalIntent);
    }
  }, [currentStoreTab, globalIntent]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setVideoResult(null);
    setTimeout(() => {
      setIsGenerating(false);
      setVideoResult('https://cdn.pixabay.com/video/2021/08/04/83864-584742461_tiny.mp4');
    }, 4500);
  };

  return (
    <div className="flex flex-col h-full bg-surface-dark-3 text-white z-[110]">
      <PanelHeader title="Magic Video AI" icon={<Icons.Video className="w-4 h-4 text-brand-400" />} />

      {/* Tabs */}
      <div className="flex border-b border-white/5 p-2 gap-2">
        <button
          onClick={() => setActiveTab('cinematic')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 ${
            activeTab === 'cinematic' ? 'bg-gradient-to-r from-brand-600/20 to-purple-600/20 text-brand-300 border border-brand-500/30' : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Icons.Film className="w-3.5 h-3.5" />
          Cinematic
        </button>
        <button
          onClick={() => setActiveTab('avatar')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 ${
            activeTab === 'avatar' ? 'bg-gradient-to-r from-brand-600/20 to-purple-600/20 text-brand-300 border border-brand-500/30' : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Icons.UserCircle className="w-3.5 h-3.5" />
          UGC Avatar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {activeTab === 'cinematic' ? (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
            
            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-400 uppercase tracking-widest flex items-center gap-1">
                <Icons.Sparkles className="w-3 h-3" />
                Prompt Directives
              </label>
              <div className="relative group p-1 bg-surface-dark-4 rounded-xl border border-white/10 focus-within:border-brand-500 transition-colors shadow-inner">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g. A hyper-realistic drone shot over Lagos at sunset, cyberpunk aesthetics, 4k 60fps..."
                  className="w-full h-24 bg-transparent resize-none p-2 text-xs text-white placeholder-gray-600 focus:outline-none custom-scrollbar"
                />
              </div>
            </div>

            {/* Camera Motion Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Camera Motion</label>
              <div className="grid grid-cols-3 gap-2">
                {CAMERA_MOTIONS.map((motion) => (
                  <button
                    key={motion.id}
                    onClick={() => setActiveMotion(motion.id)}
                    className={`py-2 px-2 flex flex-col items-center gap-1.5 border rounded-lg text-[10px] font-medium transition-all ${
                      activeMotion === motion.id 
                        ? 'bg-brand-600/20 border-brand-500 text-white shadow-[0_0_10px_rgba(125,42,232,0.3)]' 
                        : 'bg-surface-dark-2 border-white/5 text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {motion.icon}
                    {motion.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Model Engine Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Intelligence Engine</label>
              <div className="space-y-2">
                {VIDEO_MODELS.map((model) => (
                  <div 
                    key={model.id}
                    onClick={() => setActiveModel(model.id)}
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                      activeModel === model.id 
                        ? 'bg-brand-900/30 border-brand-500' 
                        : 'bg-surface-dark-2 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        {model.id === 'jev-auto' && <Icons.Zap className="w-3.5 h-3.5 text-brand-400" />}
                        {model.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/10 text-gray-300 uppercase tracking-wider font-bold">
                        {model.tag}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">{model.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-in fade-in slide-in-from-left-2 duration-300">
            {/* Avatar Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <Icons.Users className="w-3 h-3" />
                Select Presenter
              </label>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[1, 2, 3, 4].map((id) => (
                  <div key={id} className="aspect-square bg-surface-dark-4 rounded-xl border border-white/10 hover:border-brand-500 cursor-pointer overflow-hidden group relative shadow-md">
                    <img src={`https://i.pravatar.cc/150?img=${id * 10}`} alt={`Avatar ${id}`} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-[9px] font-bold text-white">Select</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Script Input */}
              <div className="relative group p-1 bg-surface-dark-4 rounded-xl border border-white/10 focus-within:border-brand-500 transition-colors shadow-inner">
                <div className="flex items-start gap-2">
                  <button 
                    className="mt-2 ml-2 p-2 bg-white/5 hover:bg-brand-500/20 rounded-xl text-gray-400 hover:text-brand-400 border border-white/5 hover:border-brand-500/50 transition-all shrink-0 group"
                    title="Upload Script or Audio Reference"
                  >
                    <Icons.Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </button>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Paste your product script here to generate a lip-synced UGC presenter ad..."
                    className="w-full h-28 bg-transparent resize-none py-2 pr-2 text-xs text-white placeholder-gray-600 focus:outline-none custom-scrollbar"
                  />
                </div>
              </div>
            </div>

            {/* Voice & Tone Configuration */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Voice Synthesis</label>
              <div className="grid grid-cols-1 gap-2">
                <div className="relative">
                  <Icons.Mic className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <select className="w-full appearance-none bg-surface-dark-2 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-xs text-white outline-none focus:border-brand-500 transition-colors">
                    <option value="en-NG-expressive">Nigerian (Expressive)</option>
                    <option value="en-GH-creator">Ghanaian (Creator)</option>
                    <option value="en-KE-smooth">Kenyan (Smooth)</option>
                    <option value="en-US-hype">US (Viral Hype)</option>
                    <option value="en-GB-editorial">British (Editorial)</option>
                    <option value="fr-AF-modern">French (Pan-African)</option>
                  </select>
                </div>
                <div className="relative">
                  <Icons.Activity className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <select className="w-full appearance-none bg-surface-dark-2 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-xs text-white outline-none focus:border-brand-500 transition-colors">
                    <option value="enthusiastic">Enthusiastic UGC</option>
                    <option value="authoritative">Corporate & Tech</option>
                    <option value="chill">Chill Storyteller</option>
                    <option value="urgency">High-Conversion Sale</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate Action */}
        <div className="pt-4 border-t border-white/5 sticky bottom-0 bg-surface-dark-3 pb-2 z-10">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            variant="primary"
            className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 disabled:opacity-50 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-purple-500/25 rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Icons.RefreshCw className="w-4 h-4 animate-spin text-white" />
                Synthesizing Magic Video...
              </span>
            ) : (
              <>
                <Icons.Wand2 className="w-4 h-4 text-white" />
                Generate {activeTab === 'cinematic' ? 'Cinematic' : 'Avatar'} Video
              </>
            )}
          </Button>
        </div>

        {/* Result Area */}
        {videoResult && (
          <div className="mt-2 space-y-3 p-4 bg-surface-dark-4 border border-brand-500/30 rounded-2xl animate-in fade-in slide-in-from-bottom-4 shadow-[0_0_20px_rgba(125,42,232,0.15)]">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-brand-400 uppercase tracking-widest flex items-center gap-1.5">
                <Icons.CheckCircle2 className="w-3.5 h-3.5" />
                Ready to Import
              </label>
              <span className="text-[9px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">1080p MP4</span>
            </div>
            
            <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-video relative group shadow-2xl">
              <video src={videoResult} autoPlay loop muted controls className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                <Button size="icon" variant="primary" className="bg-brand-600 hover:bg-brand-500 text-white rounded-full w-10 h-10 shadow-xl shadow-brand-500/50" title="Add to Canvas">
                  <Icons.Plus className="w-5 h-5" />
                </Button>
                <Button size="icon" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-none rounded-full w-10 h-10 backdrop-blur-md" title="Download Source">
                  <Icons.Download className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
