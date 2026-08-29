import React, { useEffect, useRef, useState } from 'react';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { PanelErrorBoundary } from './PanelErrorBoundary';

/**
 * Kiro — conversational design assistant (aiAssistantSlice + services/aiService).
 * Chat about the current design, run a full critique, and apply auto-fix suggestions.
 */
const KiroChatPanel: React.FC = () => {
  const {
    conversationHistory,
    isAnalyzing,
    currentCritique,
    sendMessage,
    analyzeCurrentDesign,
    clearConversation,
    applySuggestion,
    dismissSuggestion,
  } = useStore(
    useShallow((state) => ({
      conversationHistory: state.conversationHistory,
      isAnalyzing: state.isAnalyzing,
      currentCritique: state.currentCritique,
      sendMessage: state.sendMessage,
      analyzeCurrentDesign: state.analyzeCurrentDesign,
      clearConversation: state.clearConversation,
      applySuggestion: state.applySuggestion,
      dismissSuggestion: state.dismissSuggestion,
    }))
  );

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [conversationHistory, isAnalyzing]);

  const handleSend = () => {
    const message = input.trim();
    if (!message || isAnalyzing) {
      return;
    }
    setInput('');
    sendMessage(message);
  };

  return (
    <div className="flex flex-col h-[420px] bg-surface-dark-1">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {conversationHistory.length === 0 && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-10 h-10 rounded-2xl bg-brand-600/15 border border-brand-600/25 flex items-center justify-center mb-3">
              <Icons.Bot className="w-5 h-5 text-brand-400" />
            </div>
            <p className="text-xs font-bold text-white mb-1">Hi, I&apos;m Kiro</p>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Ask me anything about your design — colors, layout, typography — or run a full critique below.
            </p>
          </div>
        )}

        {conversationHistory.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-md'
                  : 'bg-white/5 border border-white/5 text-gray-300 rounded-bl-md'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isAnalyzing && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/5 px-3 py-2 rounded-2xl rounded-bl-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:120ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:240ms]" />
            </div>
          </div>
        )}

        {/* Critique suggestions with auto-fix actions */}
        {currentCritique && currentCritique.suggestions.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {currentCritique.suggestions.slice(0, 4).map((s: any) => (
              <div key={s.id} className="flex items-start gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-2">
                <Icons.Sparkles className="w-3 h-3 text-brand-400 mt-0.5 shrink-0" />
                <p className="flex-1 text-[10px] text-gray-400 leading-relaxed">{s.message || s.description}</p>
                <div className="flex items-center gap-1 shrink-0">
                  {s.autoFix && (
                    <button
                      onClick={() => applySuggestion(s.id)}
                      className="text-[9px] font-black uppercase tracking-wider text-brand-400 hover:text-white transition-colors"
                    >
                      Fix
                    </button>
                  )}
                  <button
                    onClick={() => dismissSuggestion(s.id)}
                    aria-label="Dismiss suggestion"
                    className="text-gray-600 hover:text-gray-300 transition-colors"
                  >
                    <Icons.X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1.5 px-3 pb-2 shrink-0">
        <button
          onClick={() => analyzeCurrentDesign()}
          disabled={isAnalyzing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-wider text-gray-400 hover:text-white hover:border-brand-600/40 transition-all disabled:opacity-40"
        >
          <Icons.Magic className="w-3 h-3" />
          Critique design
        </button>
        {conversationHistory.length > 0 && (
          <button
            onClick={clearConversation}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-wider text-gray-500 hover:text-white transition-all"
          >
            <Icons.Trash className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/5 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            maxLength={500}
            placeholder="Ask Kiro about your design..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white placeholder-gray-600 focus:border-brand-600/50 outline-none resize-none custom-scrollbar"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isAnalyzing}
            aria-label="Send message"
            className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center hover:bg-brand-500 transition-colors disabled:opacity-40 shrink-0"
          >
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function KiroChatPanelWrapped() {
  return (
    <PanelErrorBoundary panelName="Kiro Chat">
      <KiroChatPanel />
    </PanelErrorBoundary>
  );
}
