import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../Button';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { VariantCard } from '../agent/VariantCard';

import { Icons as AgentIcons } from '../../constants';
import { PanelErrorBoundary } from './PanelErrorBoundary';

interface AssistantPanelProps {
  getCanvasSnapshot: () => Promise<string>;
  onStartDesign?: (prompt: string) => void;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = () => {
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
    selectedLayerIds,
    
    // AI Assistant (Chat/Critique) state
    conversationHistory,
    isAnalyzing,
    currentCritique,
    sendMessage,
    analyzeCurrentDesign,
    clearConversation,
    applySuggestion,
    dismissSuggestion,
    artboards,
    activeArtboardId,
    runMotionDirector,
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
      
      conversationHistory: state.conversationHistory,
      isAnalyzing: state.isAnalyzing,
      currentCritique: state.currentCritique,
      sendMessage: state.sendMessage,
      analyzeCurrentDesign: state.analyzeCurrentDesign,
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

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
    if (isRefining) {
      runAgenticRefine(input, selectedLayerIds);
    } else {
      runAgenticWorkflow(input);
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
    const steps = [
      { id: 'strategy', label: 'Strategy Agent', sub: 'Researching Brief', icon: AgentIcons.Bot },
      { id: 'creative', label: 'Ideation Engine', sub: 'Ideating Layouts', icon: AgentIcons.Sparkles },
      { id: 'searching', label: 'Asset Fetching', sub: 'Sourcing Graphics', icon: AgentIcons.Search },
      { id: 'rendering', label: 'Compositing', sub: 'Building Vectors', icon: AgentIcons.Image },
      { id: 'critic', label: 'Design Critic', sub: 'Optimizing Contrast', icon: AgentIcons.Bot },
      { id: 'performance', label: 'Performance', sub: 'Scoring Impact', icon: AgentIcons.Zap },
    ];

    return (
      <div className="space-y-6 py-4">
        <div className="space-y-4">
          {steps.map((step, i) => {
            const stepOrder = steps.map(s => s.id);
            const currentIndex = stepOrder.indexOf(agentStatus as any);
            const isActive = agentStatus === step.id;
            const isDone = agentStatus === 'done' || (currentIndex > -1 && currentIndex > i);

            return (
              <div key={step.id} className="relative group">
                <div
                  className={`flex items-center gap-4 transition-all duration-500 ${isActive ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xl relative ${isActive ? 'bg-brand-600 text-white animate-pulse' : isDone ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-gray-500'}`}
                  >
                    {isDone ? <AgentIcons.Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl border-2 border-brand-600 animate-ping opacity-20" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4
                      className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-gray-400'}`}
                    >
                      {step.label}
                    </h4>
                    <p className="text-[9px] text-gray-500 font-medium">
                      {isActive ? step.sub : isDone ? 'Task Completed' : 'Pending Queue'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Thinking Log */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3 max-h-[200px] overflow-y-auto no-scrollbar shadow-inner">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Logic Trace</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-purple-500 animate-pulse" />
              <div className="w-1 h-1 rounded-full bg-purple-500 animate-pulse delay-75" />
            </div>
          </div>
          <div className="space-y-2">
            {thinkingLog.map((event: any) => (
              <div key={event.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="w-1 bg-purple-500/30 rounded-full shrink-0" />
                <div>
                  <span className="text-[8px] font-black text-purple-400 uppercase tracking-tighter block mb-0.5">
                    {event.agent}
                  </span>
                  <p className="text-[10px] text-gray-300 font-medium leading-relaxed">{event.message}</p>
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
      <div className="p-6 border-b border-white/5 bg-surface-dark-3/50 backdrop-blur-xl flex items-center justify-between">
        <h3 className="font-black text-white flex items-center gap-3 uppercase tracking-[0.2em] text-xs">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <AgentIcons.Sparkles className="w-5 h-5 text-white" />
          </div>
          Agent
        </h3>
        {agentStatus !== 'idle' && (
          <button
            onClick={resetAgentState}
            className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
          >
            Reset
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Splash screen if nothing is active */}
        {agentStatus === 'idle' && conversationHistory.length === 0 && !isAnalyzing && (
          <div className="space-y-6 pt-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-600 to-purple-800 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-purple-900/40">
              <AgentIcons.Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Agent
              </h2>
              <p className="text-gray-400 text-[11px] mt-1.5 font-medium max-w-[240px] mx-auto leading-relaxed">
                Describe your vision. The AI will generate a complete, multi-slide campaign instantly.
              </p>
            </div>

            {/* Magic Tools Hub (Unified UI) */}
            <div className="pt-4 text-left space-y-2">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block px-1">
                Magic Tools
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => document.dispatchEvent(new CustomEvent('open-magic-image'))}
                  className="bg-surface-dark-4 hover:bg-surface-dark-2 border border-white/5 p-3 rounded-xl flex flex-col items-center gap-2 transition-colors"
                >
                  <AgentIcons.Image className="w-5 h-5 text-blue-400" />
                  <span className="text-[9px] font-bold text-gray-300 uppercase">Magic Image</span>
                </button>
                <button
                  onClick={() => document.dispatchEvent(new CustomEvent('open-text-agent'))}
                  className="bg-surface-dark-4 hover:bg-surface-dark-2 border border-white/5 p-3 rounded-xl flex flex-col items-center gap-2 transition-colors"
                >
                  <AgentIcons.Wand className="w-5 h-5 text-orange-400" />
                  <span className="text-[9px] font-bold text-gray-300 uppercase">Brand Writer</span>
                </button>
                <button
                  onClick={() => document.dispatchEvent(new CustomEvent('open-video-agent'))}
                  className="bg-surface-dark-4 hover:bg-surface-dark-2 border border-white/5 p-3 rounded-xl flex flex-col items-center gap-2 transition-colors relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <AgentIcons.Play className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold text-gray-300 uppercase">Magic Video</span>
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
                        setInput(style.prompt);
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
                      onClick={() => {
                        setInput(style.prompt);
                        runMotionDirector(style.prompt);
                      }}
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

        {/* Quick Surgical Refinement Chips (when layers are selected or canvas is active) */}
        {isRefining && (
          <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-3 space-y-2">
            <span className="text-[9px] font-black text-brand-400 uppercase tracking-widest block">
              Quick Layer Adjustments
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Make headline 20% larger',
                'Increase contrast & add scrim',
                'Make colors more vibrant',
                'Switch to clean dark mode',
                'Add frosted glass card container',
                'Make it look like a die-cut sticker',
                'Add a glowing drop shadow',
                'Add a solid outline stroke',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(chip);
                    runAgenticRefine(chip, selectedLayerIds);
                  }}
                  className="px-2 py-1 bg-white/5 hover:bg-brand-500/25 border border-white/10 rounded-lg text-[9px] font-bold text-gray-300 hover:text-white transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat History */}
        {conversationHistory.length > 0 && (
          <div className="space-y-4">
            {conversationHistory.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-[11px] leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-sm'
                      : 'bg-white/5 border border-white/5 text-gray-300 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {isAnalyzing && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:120ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:240ms]" />
            </div>
          </div>
        )}

        {/* Critique Suggestions */}
        {currentCritique && currentCritique.suggestions.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Design Suggestions</h4>
            {currentCritique.suggestions.slice(0, 4).map((s: any) => (
              <div
                key={s.id}
                className="flex items-start gap-3 bg-white/5 border border-white/5 rounded-xl p-3 shadow-sm"
              >
                <AgentIcons.Sparkles className="w-3.5 h-3.5 text-brand-400 mt-0.5 shrink-0" />
                <p className="flex-1 text-[11px] text-gray-300 leading-relaxed">{s.message || s.description}</p>
                <div className="flex items-center gap-2 shrink-0">
                  {s.autoFix && (
                    <button
                      onClick={() => applySuggestion(s.id)}
                      className="px-2 py-1 bg-brand-600/20 text-brand-400 rounded hover:bg-brand-600 hover:text-white text-[9px] font-black uppercase tracking-wider transition-all"
                    >
                      Fix
                    </button>
                  )}
                  <button
                    onClick={() => dismissSuggestion(s.id)}
                    aria-label="Dismiss suggestion"
                    className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <AgentIcons.X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Workflow Status */}
        {(agentStatus === 'strategy' || agentStatus === 'creative' || agentStatus === 'searching' || agentStatus === 'rendering' || agentStatus === 'critic' || agentStatus === 'performance') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-purple-400 uppercase">Orchestration in progress</span>
              <span className="text-[10px] font-mono text-gray-500">v0.1.0-alpha</span>
            </div>
            {renderStatus()}
          </div>
        )}

        {agentStatus === 'done' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Curation Complete</h3>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-black rounded border border-emerald-500/20">
                3 VARIANTS
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
      <div className="p-4 border-t border-white/5 bg-surface-dark-3/80 backdrop-blur-xl">
        <div className="relative group p-1 bg-surface-dark-2 rounded-xl border border-white/10 shadow-2xl overflow-hidden focus-within:border-brand-500 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleStartWorkflow();
              }
            }}
            placeholder="Describe what you want to create (e.g. 'A 5-slide pitch deck for Nova Africa AI')..."
            className="w-full h-24 bg-transparent resize-none p-3 text-xs text-white placeholder-gray-500 focus:outline-none custom-scrollbar"
            disabled={agentStatus !== 'idle' && agentStatus !== 'done'}
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
            <div className="flex gap-2">
              <button
                onClick={() => analyzeCurrentDesign()}
                disabled={isAnalyzing}
                className="px-2.5 py-1.5 flex items-center gap-1.5 bg-white/5 hover:bg-brand-500/20 rounded-lg text-[9px] font-black text-gray-400 hover:text-brand-400 uppercase tracking-widest transition-colors disabled:opacity-40"
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
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-white transition-colors disabled:opacity-30 disabled:grayscale flex items-center gap-1.5"
              >
                Chat
              </button>
              <button
                onClick={handleStartWorkflow}
                disabled={!input.trim() || (agentStatus !== 'idle' && agentStatus !== 'done' && agentStatus !== 'error')}
                aria-label="Start AI Design Workflow"
                className="px-3 py-1.5 bg-gradient-to-br from-brand-600 to-brand-400 rounded-lg flex items-center justify-center text-white shadow-lg shadow-purple-500/30 disabled:opacity-30 disabled:grayscale hover:scale-105 transition-transform group text-[10px] font-bold gap-1.5"
              >
                Generate
                <AgentIcons.Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </div>
        </div>
        <p className="text-[8px] text-center text-gray-600 mt-3 font-black uppercase tracking-widest">
          Powered by Multi-Agent Creative Engine
        </p>
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
