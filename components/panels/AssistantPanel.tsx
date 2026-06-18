import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../Button';
import { useStore } from '../../store/useStore';
import { VariantCard } from '../agent/VariantCard';

import { Icons as AgentIcons } from '../../constants';

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
  } = useStore();

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
  };

  const renderStatus = () => {
    const steps = [
      { id: 'creative', label: 'Layout Generator', sub: 'Ideating Layouts', icon: AgentIcons.Sparkles },
      { id: 'critic', label: 'Design Reviewer', sub: 'Optimizing Spacing', icon: AgentIcons.Search },
      { id: 'performance', label: 'Performance Check', sub: 'Performance Scoring', icon: AgentIcons.Zap },
    ];

    return (
      <div className="space-y-6 py-4">
        <div className="space-y-4">
          {steps.map((step, i) => {
            const isActive = agentStatus === step.id;
            const isDone =
              (['critic', 'performance', 'done'].includes(agentStatus) && i === 0) ||
              (['performance', 'done'].includes(agentStatus) && i === 1) ||
              (agentStatus === 'done' && i === 2);

            return (
              <div key={step.id} className="relative group">
                <div
                  className={`flex items-center gap-4 transition-all duration-500 ${isActive ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xl relative ${isActive ? 'bg-[#7d2ae8] text-white animate-pulse' : isDone ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-gray-500'}`}
                  >
                    {isDone ? <AgentIcons.Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl border-2 border-[#7d2ae8] animate-ping opacity-20" />
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
    <div className="flex flex-col h-full bg-[#13161a] border-l border-white/5 shadow-[-20px_0_40px_rgba(0,0,0,0.4)] z-[110]">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-[#1e1e1e]/50 backdrop-blur-xl flex items-center justify-between">
        <h3 className="font-black text-white flex items-center gap-3 uppercase tracking-[0.2em] text-xs">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7d2ae8] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <AgentIcons.Zap className="w-5 h-5 text-white" />
          </div>
          Agentic AI
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
        {agentStatus === 'idle' && (
          <div className="space-y-6 pt-12 text-center">
            <div className="w-20 h-20 bg-purple-500/10 rounded-3xl mx-auto flex items-center justify-center border border-purple-500/20">
              {isRefining ? (
                <AgentIcons.Zap className="w-10 h-10 text-purple-500 animate-pulse" />
              ) : (
                <AgentIcons.Sparkles className="w-10 h-10 text-purple-500 animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                {isRefining ? 'Refinement Mode' : 'Multi-Agent System'}
              </h2>
              <p className="text-gray-400 text-xs mt-2 font-medium max-w-[200px] mx-auto leading-relaxed">
                {isRefining
                  ? `Optimizing ${selectedLayerIds.length} selected layer${selectedLayerIds.length > 1 ? 's' : ''} while respecting your existing design context.`
                  : 'Describe your vision. My agents will design, critique, and optimize 3 unique variants for you.'}
              </p>
            </div>
          </div>
        )}

        {(agentStatus === 'creative' || agentStatus === 'critic' || agentStatus === 'performance') && (
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
      <div className="p-4 border-t border-white/5 bg-[#1e1e1e]/80 backdrop-blur-xl">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 shadow-inner focus-within:border-purple-500/50 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={agentStatus !== 'idle' && agentStatus !== 'done' && agentStatus !== 'error'}
            placeholder={
              isRefining
                ? "How should we improve these layers? (e.g. 'Make it minimalist', 'Align better')"
                : 'e.g. Generate a dark-themed fintech poster with bold typography...'
            }
            className="w-full bg-transparent border-none text-xs text-white placeholder:text-gray-600 focus:outline-none resize-none h-20 custom-scrollbar font-bold leading-relaxed"
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
            <div className="flex gap-2">
              {['Minimal', 'Cyberpunk', 'Corporate'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setInput((prev) => `${prev} ${tag} style`)}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[9px] font-bold text-gray-500 hover:text-gray-300 uppercase transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
            <button
              onClick={handleStartWorkflow}
              disabled={!input.trim() || (agentStatus !== 'idle' && agentStatus !== 'done' && agentStatus !== 'error')}
              className="w-10 h-10 bg-gradient-to-br from-[#7d2ae8] to-[#a855f7] rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30 disabled:opacity-30 disabled:grayscale hover:scale-105 transition-transform group"
            >
              <AgentIcons.ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
        <p className="text-[8px] text-center text-gray-600 mt-3 font-black uppercase tracking-widest">
          Powered by Multi-Agent Creative Engine
        </p>
      </div>
    </div>
  );
};

export default AssistantPanel;
