import React from 'react';
import { AgentVariant } from '../../services/multiAgentService';
import { StaticLayerRenderer } from '../StaticLayerRenderer';
import { Button } from '../Button';
import { Icons as AgentIcons } from '../../constants';

interface VariantCardProps {
  variant: AgentVariant;
  onApply: (id: string) => void;
}

export const VariantCard: React.FC<VariantCardProps> = ({ variant, onApply }) => {
  const [showLogic, setShowLogic] = React.useState(false);

  return (
    <div className="flex flex-col bg-surface-dark-3 border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all hover:border-purple-500/50 group">
      {/* Mini Preview Container */}
      <div className="relative aspect-square bg-white w-full overflow-hidden cursor-zoom-in group/preview">
        <div className="absolute inset-0">
          <StaticLayerRenderer layers={variant.layers} scale={0.25} />
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/10 border-white/20 text-white font-black uppercase text-[8px] tracking-widest"
          >
            Preview Design
          </Button>
        </div>

        {/* Performance Badge */}
        {variant.performanceScore !== undefined && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-black/80 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black text-white">{variant.performanceScore}% EFFECTIVE</span>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest truncate">{variant.themeIdea}</h4>
            <p className="text-gray-400 text-[10px] mt-1 line-clamp-2 leading-relaxed">
              “{variant.performanceReasoning}”
            </p>
          </div>
          <button
            onClick={() => setShowLogic(!showLogic)}
            className={`p-1.5 rounded-lg border transition-all ${showLogic ? 'bg-purple-500 text-white border-purple-400' : 'bg-white/5 text-gray-500 border-white/5 hover:text-white hover:bg-white/10'}`}
            title="View Logic Trace"
          >
            <AgentIcons.Search className="w-3 h-3" />
          </button>
        </div>

        {/* Expandable Logic Trace */}
        {showLogic && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Critic Feedback */}
            {variant.criticFeedback && variant.criticFeedback.length > 0 && (
              <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <AgentIcons.Bot className="w-3 h-3 text-purple-400" />
                  <span className="text-[8px] font-black text-purple-400 uppercase tracking-[0.1em]">
                    Critic Audit Log
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {variant.criticFeedback.map((fb: string, i: number) => (
                    <li key={i} className="text-[9px] text-gray-400 flex gap-2 leading-tight">
                      <span className="text-purple-500/40 font-bold">{i + 1}.</span>
                      {fb}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-center">
                <span className="block text-[8px] font-black text-gray-500 uppercase mb-0.5">Readability</span>
                <span className="text-xs font-bold text-white">
                  {(variant.performanceScore || 0) > 80 ? 'High' : 'Optimal'}
                </span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-center">
                <span className="block text-[8px] font-black text-gray-500 uppercase mb-0.5">Hierarchy</span>
                <span className="text-xs font-bold text-white">Balanced</span>
              </div>
            </div>
          </div>
        )}

        <Button
          variant="primary"
          className="w-full bg-brand-600 hover:bg-[#6b23c5] text-[10px] font-black uppercase py-2.5 shadow-lg shadow-purple-500/20 active:scale-95 transition-transform"
          onClick={() => onApply(variant.id)}
        >
          Apply This Variant
        </Button>
      </div>
    </div>
  );
};
