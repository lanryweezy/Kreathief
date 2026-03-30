import React from 'react';

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
  // Optional onboarding cards shown beneath the main action
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
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center h-full w-full max-w-xl mx-auto animate-fade-in">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-[#7d2ae8]/20 blur-[60px] rounded-full animate-pulse-slow" />
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1e1e1e] to-[#13161a] border border-white/10 flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 group">
          <Icon className="w-9 h-9 text-[#7d2ae8] group-hover:scale-110 group-hover:text-[#a855f7] transition-all duration-300" />
        </div>
      </div>

      <h3 className="text-xl font-black text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-gray-500 mb-8 text-sm leading-relaxed max-w-xs">{description}</p>

      {/* Primary / Secondary Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mb-10">
        {action && (
          <button
            onClick={action.onClick}
            className="px-8 py-3 bg-gradient-to-r from-[#7d2ae8] to-[#a855f7] text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95 whitespace-nowrap"
          >
            {action.label}
          </button>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="px-8 py-3 bg-[#252627] text-gray-400 font-black uppercase tracking-widest text-[10px] rounded-xl border border-gray-700 hover:border-gray-500 hover:text-white transition-all active:scale-95 whitespace-nowrap"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>

      {/* Onboarding Hint Cards */}
      {onboardingCards && onboardingCards.length > 0 && (
        <div className="w-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">How to get started</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-left">
            {onboardingCards.map((card, i) => (
              <button
                key={i}
                onClick={card.onClick}
                className="group p-3 bg-[#1e1e1e]/60 border border-white/5 rounded-xl hover:border-[#7d2ae8]/30 hover:bg-[#7d2ae8]/5 transition-all text-left"
              >
                <div className="text-xl mb-2 group-hover:scale-110 transition-transform duration-200 w-fit">
                  {card.emoji}
                </div>
                <div className="text-xs font-bold text-gray-300 group-hover:text-white mb-1">
                  {card.title}
                </div>
                <div className="text-[10px] text-gray-600 leading-tight">
                  {card.description}
                </div>
                {card.shortcut && (
                  <div className="mt-2">
                    <kbd className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-[9px] text-gray-500 font-mono">
                      {card.shortcut}
                    </kbd>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
