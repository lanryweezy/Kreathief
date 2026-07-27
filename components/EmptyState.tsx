import React from 'react';
import { motion } from 'framer-motion';

export interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  onboardingCards?: Array<{
    emoji: string;
    title: string;
    description: string;
    shortcut?: string;
    onClick?: () => void;
  }>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  onboardingCards,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center h-full w-full max-w-2xl mx-auto overflow-hidden">
      {/* Mesh Gradient Background - 2026 depth pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/5 blur-[120px] rounded-full motion-safe:animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-cyan-500/3 blur-[80px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] bg-purple-600/3 blur-[60px] rounded-full" />
      </div>

      {/* Floating Icon Stage */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="relative mb-10"
      >
        <div className="absolute inset-0 bg-brand-600/20 blur-[40px] rounded-full" />
        <div className="relative w-24 h-24 rounded-[32px] bg-gradient-to-br from-surface-dark-3 to-[#0a0a0c] border border-white/10 flex items-center justify-center shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-700 cursor-help group">
          <Icon className="w-10 h-10 text-brand-600 group-hover:scale-110 group-hover:text-white transition-all duration-500" />
        </div>
      </motion.div>

      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
        <h3 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase italic">{title}</h3>
        <p className="text-gray-500 mb-10 text-base leading-relaxed max-w-sm mx-auto font-medium">{description}</p>
      </motion.div>

      {/* Action Hub */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16 relative z-10"
      >
        {action && (
          <button
            onClick={action.onClick}
            className="px-10 py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl hover:bg-accent hover:text-white hover:shadow-[0_0_30px_rgba(0,196,204,0.3)] transition-all transform hover:-translate-y-1 active:translate-y-0.5 whitespace-nowrap"
          >
            {action.label}
          </button>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="px-10 py-4 bg-[#1a1d21] text-gray-400 font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl border border-white/5 hover:border-white/20 hover:text-white transition-all active:scale-95 whitespace-nowrap"
          >
            {secondaryAction.label}
          </button>
        )}
      </motion.div>

      {/* Artistic "First Step" Cards */}
      {onboardingCards && onboardingCards.length > 0 && (
        <div className="w-full relative px-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">Ignite Creativity</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {onboardingCards.map((card, idx) => (
              <motion.button
                key={card.title}
                initial={{ x: idx % 2 === 0 ? -20 : 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + idx * 0.1, type: 'spring' }}
                onClick={card.onClick}
                aria-label={`${card.title}. ${card.description}${card.shortcut ? `. Shortcut: ${card.shortcut}` : ''}`}
                className="group relative p-5 bg-surface-warm/40 border border-white/5 rounded-[24px] hover:border-brand-600/40 hover:bg-brand-600/5 transition-all overflow-hidden spring-press"
              >
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 group-hover:rotate-12 transition-all">
                  <div className="text-3xl grayscale group-hover:grayscale-0">{card.emoji}</div>
                </div>

                <div className="relative z-10">
                  <div className="text-xs font-black text-white uppercase tracking-wider mb-1.5 flex items-center gap-2">
                    {card.title}
                    <div className="w-1 h-1 rounded-full bg-brand-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium leading-relaxed group-hover:text-gray-400 pr-8">
                    {card.description}
                  </div>

                  {card.shortcut && (
                    <div className="mt-4 flex items-center justify-between">
                      <kbd className="px-2 py-1 bg-black/60 border border-white/10 rounded-lg text-[9px] text-gray-600 font-mono tracking-tighter group-hover:text-brand-600">
                        {card.shortcut}
                      </kbd>
                      <span className="text-[9px] font-black text-brand-600 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                        START ↗
                      </span>
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
