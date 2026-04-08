import React from 'react';
import { AgentVariant } from '../../services/multiAgentService';
import { StaticLayerRenderer } from '../StaticLayerRenderer';
import { Button } from '../Button';

interface VariantCardProps {
  variant: AgentVariant;
  onApply: (id: string) => void;
}

export const VariantCard: React.FC<VariantCardProps> = ({ variant, onApply }) => {
  return (
    <div className="flex flex-col bg-[#1e1e1e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all hover:border-purple-500/50 group">
      {/* Mini Preview Container */}
      <div className="relative aspect-square bg-white w-full overflow-hidden">
        <div className="absolute inset-0">
           <StaticLayerRenderer layers={variant.layers} scale={0.25} />
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
        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-widest">{variant.themeIdea}</h4>
          <p className="text-gray-400 text-[10px] mt-1 line-clamp-2 italic">“{variant.performanceReasoning}”</p>
        </div>

        {/* Critic Feedback */}
        {variant.criticFeedback && variant.criticFeedback.length > 0 && (
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] font-black text-purple-400 uppercase tracking-tighter">Critic Agent Audit</span>
            </div>
            <ul className="space-y-1">
              {variant.criticFeedback.slice(0, 2).map((fb: string, i: number) => (
                <li key={i} className="text-[9px] text-gray-300 flex gap-2">
                  <span className="text-purple-500 opacity-50">•</span>
                  {fb}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button 
          variant="primary" 
          className="w-full bg-[#7d2ae8] hover:bg-[#6b23c5] text-[10px] font-black uppercase"
          onClick={() => onApply(variant.id)}
        >
          Inject Design
        </Button>
      </div>
    </div>
  );
};
