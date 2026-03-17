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
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action, secondaryAction }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center h-full w-full max-w-lg mx-auto animate-fade-in">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full animate-pulse-slow"></div>
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#1e1e1e] to-[#13161a] border border-white/10 flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 group">
          <Icon className="w-10 h-10 text-[#00c4cc] group-hover:scale-110 transition-transform duration-300" />
        </div>
      </div>
      
      <h3 className="text-2xl font-black text-white mb-3 tracking-tight">
        {title}
      </h3>
      <p className="text-gray-400 mb-10 text-sm leading-relaxed max-w-xs">
        {description}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        {action && (
          <button
            onClick={action.onClick}
            className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-[#00c4cc] hover:text-white transition-all shadow-lg hover:shadow-[#00c4cc]/40 active:scale-95 whitespace-nowrap"
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
    </div>
  );
};
