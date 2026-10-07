import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../Button';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { VariantCard } from '../agent/VariantCard';
import { ClarificationCard } from '../agent/ClarificationCard';

import { Icons as AgentIcons } from '../../constants';
import { PanelErrorBoundary } from './PanelErrorBoundary';
import {
  GRAPHIC_DESIGN_STYLE_LIST,
  GraphicDesignStyleId,
  GraphicDesignStyleCategory,
  GRAPHIC_DESIGN_STYLES,
} from '../../services/graphicDesignStyles';

interface AssistantPanelProps {
  getCanvasSnapshot?: () => Promise<string>;
  onStartDesign?: (prompt: string) => void;
  onClose?: () => void;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({ onClose }) => {
  const {
    agentStatus,
    agentVariants,
    agentError,
    agentIntent,
    thinkingLog,
    runAgenticWorkflow,
    runAgenticRefine,
    applyAgentVariant,
    resetAgentState,
    selectedLayerIds, styleReference, setStyleReference, clearStyleReference,
    
    // AI Assistant (Chat/Critique) state
    conversationHistory,
    isAnalyzing,
    currentCritique,
    enhancedCritique,
    sendMessage,
    analyzeCurrentDesign,
    analyzeDesignEnhanced,
    clearConversation,
    applySuggestion,
    dismissSuggestion,
    artboards,
    activeArtboardId,
    runMotionDirector,
    answerClarification,
  } = useStore(
    useShallow((state) => ({
      agentStatus: state.agentStatus,
      agentVariants: state.agentVariants,
      agentError: state.agentError,
      agentIntent: state.agentIntent,
      thinkingLog: state.thinkingLog,
      runAgenticWorkflow: state.runAgenticWorkflow,
      runAgenticRefine: state.runAgenticRefine,
      runMotionDirector: state.runMotionDirector,
      applyAgentVariant: state.applyAgentVariant,
      resetAgentState: state.resetAgentState,
      selectedLayerIds: state.selectedLayerIds,
      styleReference: state.styleReference,
      setStyleReference: state.setStyleReference,
      clearStyleReference: state.clearStyleReference,
      answerClarification: state.answerClarification,
      
      conversationHistory: state.conversationHistory,
      isAnalyzing: state.isAnalyzing,
      currentCritique: state.currentCritique,
      enhancedCritique: state.enhancedCritique,
      sendMessage: state.sendMessage,
      analyzeCurrentDesign: state.analyzeCurrentDesign,
      analyzeDesignEnhanced: state.analyzeDesignEnhanced,
      clearConversation: state.clearConversation,
      applySuggestion: state.applySuggestion,
      dismissSuggestion: state.dismissSuggestion,
      artboards: state.artboards,
      activeArtboardId: state.activeArtboardId,
    }))
  );

  const activeArtboard = artboards.find((a: any) => a.id === activeArtboardId);
  const hasLayers = activeArtboard && activeArtboard.layers.length > 0;
  const isRefining = selectedLayerIds && selectedLayerIds.length > 0;

  const [input, setInput] = useState(agentIntent || '');
  const [selectedStyleId, setSelectedStyleId] = useState<GraphicDesignStyleId | null>(null);
  const [activeCategory, setActiveCategory] = useState<GraphicDesignStyleCategory | 'all'>('trends2026');
  const scrollRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReferenceUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      await setStyleReference(dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (agentStatus === 'done' && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [agentStatus]);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thinkingLog]);

  const handleStartWorkflow = () => {
    if (!input.trim()) {
      return;
    }
    // While clarifying, the composer answers the agent naturally instead of
    // starting a new run — natural-language answers beat forced forms.
    if (agentStatus === 'clarifying') {
      answerClarification(null, input.trim());
      setInput('');
      return;
    }

    const finalPrompt = selectedStyleId
      ? `${input} style: ${selectedStyleId} movement`
      : input;
    if (isRefining) {
      runAgenticRefine(finalPrompt, selectedLayerIds);
    } else {
      runAgenticWorkflow(finalPrompt);
    }
    setInput('');
  };

  const handleSendChat = () => {
    const message = input.trim();
    if (!message || isAnalyzing) return;
    sendMessage(message);
    setInput('');
  };

  const renderStatus = () => {
    // Compact pipeline readout: one line + progress segments. The old
    // six-row animated staircase said the same thing with 6× the pixels.
    const STAGES: Array<{ id: string; label: string }> = [
      { id: 'strategy', label: 'Researching brief' },
      { id: 'creative', label: 'Art-directing layouts' },
      { id: 'searching', label: 'Sourcing assets' },
      { id: 'rendering', label: 'Compositing layers' },
      { id: 'critic', label: 'Visual critics reviewing' },
      { id: 'performance', label: 'Scoring impact' },
    ];
    const idx = STAGES.findIndex((s) => s.id === agentStatus);
    const current = STAGES[idx];

    return (
      <div className="space-y-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            {current ? current.label : 'Working…'}
          </span>
          {idx >= 0 && (
            <span className="text-[9px] font-mono text-gray-500">{idx + 1}/{STAGES.length}</span>
          )}
        </div>
        <div className="flex gap-1">
          {STAGES.map((s, i) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                i < idx ? 'bg-emerald-500/70' : i === idx ? 'bg-brand-500 animate-pulse' : 'bg-white/5'
              }`}
            />
          ))}
        </div>

        {/* Premium Logic Trace */}
        <div className="relative rounded-2xl overflow-hidden bg-[#0A0A0A] border border-white/10 shadow-2xl group mt-4">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 via-transparent to-purple-800/10 opacity-50" />
          
          <div className="px-4 py-2 border-b border-white/5 bg-black/60 flex items-center justify-between z-10 relative">
            <span className="text-[9px] font-medium text-gray-400 flex items-center gap-1.5 uppercase tracking-widest">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Neural Trace
            </span>
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
            </div>
          </div>

          <div className="p-4 space-y-2.5 max-h-[160px] overflow-y-auto custom-scrollbar relative z-10 font-mono text-[10px]">
            {(thinkingLog || []).slice(-12).map((event: any, i: number, arr: any[]) => (
              <div key={event.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
                <span className="text-gray-600 shrink-0 select-none hidden sm:block">
                  {new Date().toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' })}
                </span>
                <div>
                  <span className={`uppercase tracking-tighter mr-2 ${i === arr.length - 1 ? 'text-brand-400 font-bold' : 'text-gray-500'}`}>
                    [{event.agent}]
                  </span>
                  <span className={i === arr.length - 1 ? 'text-white' : 'text-gray-400'}>
                    {event.message}
                  </span>
                </div>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-surface-dark-3 border-l border-white/5 shadow-[-20px_0_40px_rgba(0,0,0,0.4)] z-[110]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-surface-dark-3 flex items-center justify-between">
        <h3 className="font-medium text-white flex items-center gap-2 text-sm tracking-wide">
          Agent
        </h3>
        <div className="flex items-center gap-4">
          {agentStatus !== 'idle' && (
            <button
              onClick={resetAgentState}
              className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
            >
              Reset
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors"
              aria-label="Close Agent Panel"
            >
              <AgentIcons.X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Splash screen if nothing is active */}
        {agentStatus === 'idle' && conversationHistory.length === 0 && !isAnalyzing && (
          <div className="space-y-6 pt-6 text-center">


            {/* Magic Tools Hub (Unified UI) */}
            <div className="pt-2 text-left space-y-3">
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest block px-1">
                Magic Tools
              </span>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => document.dispatchEvent(new CustomEvent('open-magic-image'))}
                  className="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-purple-500/30 p-3 rounded-2xl flex flex-col items-center gap-2 transition-all duration-300 overflow-hidden backdrop-blur-md"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <AgentIcons.Image className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                  <div className="flex flex-col items-center z-10">
                    <span className="text-[10px] font-medium text-gray-200 mt-1">Image</span>
                    <span className="text-[8px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Generate & Edit</span>
                  </div>
                </button>
                <button
                  onClick={() => document.dispatchEvent(new CustomEvent('open-text-agent'))}
                  className="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-purple-500/30 p-3 rounded-2xl flex flex-col items-center gap-2 transition-all duration-300 overflow-hidden backdrop-blur-md"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <AgentIcons.Wand className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform duration-300" />
                  <div className="flex flex-col items-center z-10">
                    <span className="text-[10px] font-medium text-gray-200 mt-1">Writer</span>
                    <span className="text-[8px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Brand Copy</span>
                  </div>
                </button>
                <button
                  onClick={() => document.dispatchEvent(new CustomEvent('open-video-agent'))}
                  className="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-purple-500/30 p-3 rounded-2xl flex flex-col items-center gap-2 transition-all duration-300 overflow-hidden backdrop-blur-md"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <AgentIcons.Play className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                  <div className="flex flex-col items-center z-10">
                    <span className="text-[10px] font-medium text-gray-200 mt-1">Video</span>
                    <span className="text-[8px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Animate</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Quick Inspiration Pills */}
            <div className="pt-2 text-left space-y-2">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block px-1 mt-4">
                Campaign Generators
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  {
                    label: '✨ Tech Summit Launch Poster',
                    prompt: 'Futuristic African AI Summit poster in Lagos, deep violet with electric cyan nodes, gigantic bold headline and 3 feature cards',
                  },
                  {
                    label: '🎵 Afrobeats Concert Story',
                    prompt: 'High-energy Afrobeats live concert Instagram story, bold typography, warm neon orange highlights, ticket CTA',
                  },
                  {
                    label: '💎 Luxury Real Estate Listing',
                    prompt: 'Minimalist editorial real estate flyer for luxury duplex in Abuja, price badge, clean feature list, schedule viewing CTA',
                  },
                  {
                    label: '💼 SaaS Product Feature Banner',
                    prompt: 'Clean modern Stripe-style feature announcement banner, 60/40 layout, dark mode, high-contrast register button',
                  },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(preset.prompt)}
                    className="text-left px-3 py-2 bg-white/5 hover:bg-brand-500/15 border border-white/5 hover:border-brand-500/30 rounded-xl transition-all group"
                  >
                    <span className="text-[10px] font-bold text-gray-300 group-hover:text-brand-300 block">
                      {preset.label}
                    </span>
                    <span className="text-[9px] text-gray-500 line-clamp-1 mt-0.5">
                      {preset.prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Global Style Transfer Pills */}
            {hasLayers && !isRefining && (
              <div className="pt-4 text-left space-y-2 border-t border-white/5 mt-4">
                <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block px-1">
                  Visual Style Transfer
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Brutalist', prompt: 'Redesign with a Brutalist aesthetic: raw edges, bold typography, high contrast, neo-grotesque fonts.' },
                    { label: 'Swiss Minimalist', prompt: 'Redesign with a Swiss Minimalist aesthetic: strict grid, ample negative space, clean sans-serif typography, restrained palette.' },
                    { label: 'Cyberpunk', prompt: 'Redesign with a Neon Cyberpunk style: dark mode, glowing neon accents, futuristic glitch effects, tech typography.' },
                    { label: 'Editorial', prompt: 'Redesign with an Elegant Editorial style: refined serif fonts, muted warm tones, sophisticated magazine layout, classic hierarchy.' },
                  ].map((style, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        runAgenticRefine(style.prompt, activeArtboard.layers.map((l: any) => l.id));
                      }}
                      className="text-left px-2 py-1.5 bg-brand-500/10 hover:bg-brand-500/25 border border-brand-500/20 hover:border-brand-500/40 rounded-xl transition-all group flex flex-col justify-center"
                    >
                      <span className="text-[10px] font-bold text-gray-300 group-hover:text-white block text-center w-full">
                        {style.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Motion Director AI Pills */}
            {hasLayers && !isRefining && (
              <div className="pt-4 text-left space-y-2 border-t border-white/5 mt-4">
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block px-1">
                  Magic Animate ✨
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Staggered Pop', prompt: 'Staggered pop and bounce animations for a playful entry.' },
                    { label: 'Cinematic Reveal', prompt: 'Slow cinematic fade-ins and subtle zooms.' },
                    { label: 'Aggressive Glitch', prompt: 'Fast, sharp slide-ins with chaotic delays.' },
                    { label: 'Smooth Slide', prompt: 'Elegant directional slides from the bottom and sides.' },
                  ].map((style, idx) => (
                    <button
                      key={idx}
                      onClick={() => runMotionDirector(style.prompt)}
                      className="text-left px-2 py-1.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 hover:border-amber-500/40 rounded-xl transition-all group flex flex-col justify-center"
                    >
                      <span className="text-[10px] font-bold text-amber-300 group-hover:text-amber-200 block text-center w-full">
                        {style.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clarification round — the agent asks before it guesses */}
        {agentStatus === 'clarifying' && <ClarificationCard />}

        {/* Quick Surgical Refinement Chips */}
        {isRefining && (
          <div className="bg-gradient-to-br from-brand-900/20 to-transparent border border-brand-500/20 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 mb-3">
              <AgentIcons.Wand className="w-4 h-4 text-brand-400" />
              <span className="text-[10px] font-medium text-brand-300 uppercase tracking-widest">
                Quick Adjustments
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'Make headline 20% larger',
                'Increase contrast & add scrim',
                'Make colors more vibrant',
                'Switch to clean dark mode',
                'Add frosted glass container',
                'Make it look like a die-cut sticker',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => runAgenticRefine(chip, selectedLayerIds)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-brand-500/20 border border-white/5 hover:border-brand-500/40 rounded-full text-[10px] font-medium text-gray-300 hover:text-white transition-all transform hover:-translate-y-0.5"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat History - Premium Feed Format */}
        {conversationHistory.length > 0 && (
          <div className="space-y-6 pt-2">
            {conversationHistory.map((msg) => (
              <div key={msg.id} className="flex gap-4 items-start animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10'
                    : 'bg-gradient-to-br from-brand-600 to-brand-400 border border-brand-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                }`}>
                  {msg.role === 'user' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  ) : (
                    <AgentIcons.Sparkles className="w-4 h-4 text-white" />
                  )}
                </div>
                
                {/* Message Content */}
                <div className="flex-1 min-w-0 mt-0.5">
                  <div className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-2 uppercase tracking-widest">
                    {msg.role === 'user' ? 'You' : 'Agent'}
                  </div>
                  <div className="text-[12px] text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Analyzing/Loading State */}
            {isAnalyzing && (
              <div className="flex gap-4 items-start animate-in fade-in duration-300">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600/50 to-brand-400/50 border border-brand-500/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <AgentIcons.Sparkles className="w-4 h-4 text-brand-300 animate-pulse" />
                </div>
                <div className="flex-1 mt-3">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Premium Critique Suggestions */}
        {currentCritique && currentCritique.suggestions.length > 0 && (
          <div className="mt-6 border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
            <div className="px-4 py-3 border-b border-white/5 bg-black/20 flex items-center gap-2">
               <AgentIcons.Check className="w-4 h-4 text-emerald-400" />
               <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Intelligent Suggestions</h4>
            </div>
            <div className="p-2 space-y-1">
              {currentCritique.suggestions.slice(0, 4).map((s: any) => (
                <div
                  key={s.id}
                  className="group flex items-start gap-3 rounded-xl p-3 hover:bg-white/5 transition-all duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400 mt-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  <p className="flex-1 text-[11px] text-gray-300 leading-relaxed font-medium">{s.message || s.description}</p>
                  <div className="flex items-center gap-2 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                    {s.autoFix && (
                      <button
                        onClick={() => applySuggestion(s.id)}
                        className="px-3 py-1.5 bg-brand-500 hover:bg-brand-400 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all transform hover:scale-105"
                      >
                        Auto-Fix
                      </button>
                    )}
                    <button
                      onClick={() => dismissSuggestion(s.id)}
                      aria-label="Dismiss suggestion"
                      className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <AgentIcons.X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Critique Results */}
        {enhancedCritique && (
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">12-Dimension Analysis</h4>
              <span className={`text-lg font-black ${
                enhancedCritique.overallScore >= 80 ? 'text-green-400' :
                enhancedCritique.overallScore >= 60 ? 'text-yellow-400' :
                enhancedCritique.overallScore >= 40 ? 'text-orange-400' : 'text-red-400'
              }`}>
                {enhancedCritique.letterGrade}
              </span>
            </div>

            {/* Quick wins */}
            {enhancedCritique.quickWins.length > 0 && (
              <div className="p-2.5 rounded-lg bg-green-500/5 border border-green-500/20">
                <p className="text-[9px] font-bold text-green-400 mb-1.5 uppercase tracking-wider">Quick Wins</p>
                {enhancedCritique.quickWins.map((w, i) => (
                  <p key={i} className="text-[10px] text-gray-300 leading-tight mb-1">→ {w}</p>
                ))}
              </div>
            )}

            {/* Critical issues */}
            {enhancedCritique.criticalIssues.length > 0 && (
              <div className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
                <p className="text-[9px] font-bold text-red-400 mb-1.5 uppercase tracking-wider">Critical Issues</p>
                {enhancedCritique.criticalIssues.map((issue, i) => (
                  <p key={i} className="text-[10px] text-gray-300 leading-tight mb-1">! {issue}</p>
                ))}
              </div>
            )}

            {/* Dimension scores (compact) */}
            <div className="grid grid-cols-2 gap-1.5">
              {enhancedCritique.dimensions.map(dim => (
                <div key={dim.id} className="flex items-center gap-1.5">
                  <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden shrink-0">
                    <div
                      className={`h-full rounded-full ${dim.score >= 80 ? 'bg-green-500' : dim.score >= 60 ? 'bg-yellow-500' : dim.score >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-gray-500 truncate">{dim.name}</span>
                  <span className="text-[8px] font-bold text-gray-400 ml-auto">{dim.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workflow Status */}
        {(agentStatus === 'strategy' || agentStatus === 'creative' || agentStatus === 'searching' || agentStatus === 'rendering' || agentStatus === 'critic' || agentStatus === 'performance') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-purple-400 uppercase">Orchestration in progress</span>
            </div>
            {renderStatus()}
          </div>
        )}

        {agentStatus === 'done' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Curation Complete</h3>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-black rounded border border-emerald-500/20">
                {agentVariants.length} {agentVariants.length === 1 ? 'DIRECTION' : 'DIRECTIONS'}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6 pb-8" ref={scrollRef}>
              {agentVariants.map((v) => (
                <VariantCard key={v.id} variant={v} onApply={applyAgentVariant} />
              ))}
            </div>
          </div>
        )}

        {agentStatus === 'error' && (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl mx-auto flex items-center justify-center">
              <span className="text-red-500 font-bold text-xl">!</span>
            </div>
            <p className="text-xs text-red-400 font-bold uppercase">{agentError || 'Neural Link Severed'}</p>
            <Button onClick={handleStartWorkflow} className="w-full bg-red-500 text-white">
              Retry Loop
            </Button>
          </div>
        )}
      </div>

      {/* Input Tray */}
      <div className="p-4 border-t border-white/5 bg-surface-dark-3/80 backdrop-blur-xl space-y-3">
        {/* Pre-populated Prompt Chips */}
        {agentStatus === 'idle' && !input && (
          <div className="flex gap-2 mb-1 overflow-x-auto no-scrollbar pb-1">
            <button onClick={() => setInput('A 5-slide pitch deck for Nova Africa AI')} className="shrink-0 px-3 py-1.5 bg-white/5 hover:bg-purple-500/20 border border-white/10 rounded-full text-[10px] text-gray-300 hover:text-purple-300 transition-colors">✨ 5-Slide Pitch Deck</button>
            <button onClick={() => setInput('A minimalist Instagram Ad Campaign for a sneaker drop')} className="shrink-0 px-3 py-1.5 bg-white/5 hover:bg-purple-500/20 border border-white/10 rounded-full text-[10px] text-gray-300 hover:text-purple-300 transition-colors">✨ Instagram Ad Campaign</button>
            <button onClick={() => setInput('A cinematic event flyer for a Tech Summit')} className="shrink-0 px-3 py-1.5 bg-white/5 hover:bg-purple-500/20 border border-white/10 rounded-full text-[10px] text-gray-300 hover:text-purple-300 transition-colors">✨ Tech Summit Flyer</button>
          </div>
        )}

        {/* Style Selector Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>🎨</span> Graphic Styles & 2026 Trends
            </span>
            {selectedStyleId && (
              <button
                onClick={() => setSelectedStyleId(null)}
                className="text-[9px] font-bold text-gray-400 hover:text-red-400 transition-colors uppercase tracking-wider flex items-center gap-1"
              >
                <span>✕</span> Clear Style
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1 text-[10px] font-bold">
            {[
              { id: 'trends2026', label: '🔥 2026 Trends' },
              { id: 'movements', label: '🏛️ Movements' },
              { id: 'retroSubculture', label: '📼 Retro' },
              { id: 'minimalDigital', label: '🌿 Minimal' },
              { id: 'all', label: 'All (25)' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                  activeCategory === cat.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Horizontal Chips Bar */}
          <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1.5 pt-0.5">
            {GRAPHIC_DESIGN_STYLE_LIST.filter(
              (s) => activeCategory === 'all' || s.category === activeCategory
            ).map((style) => {
              const isSelected = selectedStyleId === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyleId(isSelected ? null : style.id)}
                  title={`${style.name} (${style.era}): ${style.tagline}`}
                  className={`px-2.5 py-1.5 rounded-xl shrink-0 flex items-center gap-2 border text-[10px] font-bold transition-all ${
                    isSelected
                      ? 'bg-brand-600/30 border-brand-400 text-white shadow-md shadow-brand-500/20 scale-[1.02]'
                      : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <span className="text-xs">{style.icon}</span>
                  <span>{style.name}</span>
                  <span
                    className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: style.palette.primary }}
                  />
                </button>
              );
            })}
          </div>

          {/* Selected Style Indicator Pill */}
          {selectedStyleId && (() => {
            const activeMeta = GRAPHIC_DESIGN_STYLES[selectedStyleId];
            if (!activeMeta) return null;
            return (
              <div className="flex items-center justify-between px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-lg text-[10px]">
                <span className="text-brand-300 font-bold truncate">
                  Locked: <span className="text-white">{activeMeta.icon} {activeMeta.name}</span> — <span className="text-gray-400 font-normal">{activeMeta.badge}</span>
                </span>
                <span className="text-[9px] font-mono text-brand-400 uppercase tracking-widest pl-2 shrink-0">
                  {activeMeta.era}
                </span>
              </div>
            );
          })()}
        </div>
        <div className="relative group p-1 bg-surface-dark-2 rounded-xl border border-white/10 shadow-2xl overflow-hidden focus-within:border-brand-500 transition-colors">
          
          {styleReference && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-black/40 rounded-lg mx-2 mt-2">
              <img src={styleReference.image} alt="Reference" className="w-8 h-8 rounded-md object-cover border border-white/10" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-white truncate">{styleReference.name || 'Visual Reference'}</div>
                <div className="text-[9px] text-brand-400">Remix Mode Active</div>
              </div>
              <button onClick={clearStyleReference} className="p-1 text-gray-500 hover:text-white rounded-full hover:bg-white/10">
                <AgentIcons.Close className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex items-start gap-2">
            <button 
              className="mt-2 ml-2 p-2 bg-white/5 hover:bg-brand-500/20 rounded-xl text-gray-400 hover:text-brand-400 border border-white/5 hover:border-brand-500/50 transition-all shrink-0 group"
              title="Add Context or Brand Assets"
            >
              {/* Replaced Plus with Paperclip SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:scale-110 transition-transform"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleStartWorkflow();
                }
              }}
              placeholder={
                agentStatus === 'clarifying'
                  ? 'Type your answer, or tap an option above…'
                  : "Describe what you want to create (e.g. 'A 5-slide pitch deck for Nova Africa AI')..."
              }
              className="w-full h-24 bg-transparent resize-none py-3 pr-3 text-sm text-white placeholder-gray-500 focus:outline-none custom-scrollbar"
              disabled={agentStatus !== 'idle' && agentStatus !== 'done' && agentStatus !== 'clarifying' && agentStatus !== 'error'}
            />
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 px-1 pb-1">
            <div className="flex gap-2">
              <button
                onClick={() => analyzeDesignEnhanced()}
                disabled={isAnalyzing}
                className="px-4 py-1.5 flex items-center gap-1.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-[10px] font-medium text-gray-300 hover:text-white transition-colors disabled:opacity-40"
              >
                <AgentIcons.Check className="w-3 h-3" />
                Critique
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSendChat}
                disabled={!input.trim() || isAnalyzing}
                aria-label="Send Chat Message"
                className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-medium text-gray-300 hover:text-white transition-colors disabled:opacity-30 disabled:grayscale flex items-center gap-1.5"
              >
                Chat
              </button>
              <button
                onClick={handleStartWorkflow}
                disabled={!input.trim() || (agentStatus !== 'idle' && agentStatus !== 'done' && agentStatus !== 'error' && agentStatus !== 'clarifying')}
                aria-label={agentStatus === 'clarifying' ? 'Answer the agent' : 'Start AI Design Workflow'}
                className="px-4 py-1.5 bg-brand-500 hover:bg-brand-400 rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] font-bold text-[10px] gap-1.5 transition-all disabled:opacity-30 disabled:grayscale"
              >
                Generate
                <AgentIcons.Sparkles className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AssistantPanelWrapped(props: React.ComponentProps<typeof AssistantPanel>) {
  return (
    <PanelErrorBoundary panelName="Assistant">
      <AssistantPanel {...props} />
    </PanelErrorBoundary>
  );
}
