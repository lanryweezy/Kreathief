import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import type { DesignCritiqueResult, CritiqueDimension } from '../../services/designCritiqueEngine';

interface DesignCritiquePanelProps {
  result: DesignCritiqueResult | null;
  isLoading: boolean;
  onAnalyze: () => void;
  onClose?: () => void;
}

const DIMENSION_ICONS: Record<string, string> = {
  visual_hierarchy: '👁️',
  color_harmony: '🎨',
  typography: '🔤',
  whitespace: '⬜',
  composition: '⚖️',
  brand_consistency: '🏷️',
  emotional_impact: '💫',
  trend_alignment: '📈',
  commercial_viability: '💰',
  accessibility: '♿',
  technical_execution: '🔧',
  originality: '✨',
};

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-white">{score}</span>
      </div>
    </div>
  );
}

function DimensionBar({ dimension }: { dimension: CritiqueDimension }) {
  const color = dimension.score >= 80 ? 'bg-green-500' : dimension.score >= 60 ? 'bg-yellow-500' : dimension.score >= 40 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{DIMENSION_ICONS[dimension.id] || '📊'}</span>
          <span className="text-xs font-bold text-gray-300">{dimension.name}</span>
        </div>
        <span className={`text-xs font-black ${dimension.score >= 80 ? 'text-green-400' : dimension.score >= 60 ? 'text-yellow-400' : dimension.score >= 40 ? 'text-orange-400' : 'text-red-400'}`}>
          {dimension.score}
        </span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${dimension.score}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        />
      </div>
      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight group-hover:text-gray-400 transition-colors">
        {dimension.feedback}
      </p>
      {dimension.fixSuggestion && (
        <p className="text-[10px] text-brand-400 mt-0.5 leading-tight">
          Fix: {dimension.fixSuggestion}
        </p>
      )}
    </div>
  );
}

export const DesignCritiquePanel: React.FC<DesignCritiquePanelProps> = ({ result, isLoading, onAnalyze, onClose }) => {
  const gradeColor = result
    ? result.overallScore >= 80 ? 'text-green-400' : result.overallScore >= 60 ? 'text-yellow-400' : result.overallScore >= 40 ? 'text-orange-400' : 'text-red-400'
    : 'text-gray-400';

  return (
    <div className="flex flex-col h-full bg-surface-dark-1 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Icons.Sparkles className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-bold">Design Critique</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <Icons.X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {!result && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-600/10 flex items-center justify-center mb-4">
              <Icons.Sparkles className="w-8 h-8 text-brand-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Analyze Your Design</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-xs">
              Get professional feedback on 12 dimensions: hierarchy, color, typography, composition, and more.
            </p>
            <button
              onClick={onAnalyze}
              className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-accent rounded-xl text-white text-sm font-bold hover:shadow-lg hover:shadow-brand-600/20 transition-all"
            >
              Analyze Design
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-400">Analyzing your design...</p>
            <p className="text-xs text-gray-500 mt-1">Scoring 12 dimensions</p>
          </div>
        )}

        {result && !isLoading && (
          <div className="space-y-5">
            {/* Overall Score */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-dark-3 border border-white/5">
              <ScoreRing score={result.overallScore} size={72} />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black ${gradeColor}`}>{result.letterGrade}</span>
                  <span className="text-sm text-gray-500">{result.overallScore}/100</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{result.summary}</p>
              </div>
            </div>

            {/* Quick Wins */}
            {result.quickWins.length > 0 && (
              <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                <h4 className="text-xs font-bold text-green-400 mb-2 flex items-center gap-1.5">
                  <span>⚡</span> Quick Wins
                </h4>
                <ul className="space-y-1.5">
                  {result.quickWins.map((w, i) => (
                    <li key={i} className="text-[11px] text-gray-300 leading-tight flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5 shrink-0">→</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Critical Issues */}
            {result.criticalIssues.length > 0 && (
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                <h4 className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1.5">
                  <span>🚨</span> Critical Issues
                </h4>
                <ul className="space-y-1.5">
                  {result.criticalIssues.map((issue, i) => (
                    <li key={i} className="text-[11px] text-gray-300 leading-tight flex items-start gap-1.5">
                      <span className="text-red-500 mt-0.5 shrink-0">!</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <h4 className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-1.5">
                  <span>✨</span> Strengths
                </h4>
                <ul className="space-y-1.5">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-[11px] text-gray-300 leading-tight flex items-start gap-1.5">
                      <span className="text-blue-500 mt-0.5 shrink-0">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dimension Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Dimension Breakdown</h4>
              <div className="space-y-3">
                {result.dimensions
                  .sort((a, b) => a.score - b.score) // worst first
                  .map((dim) => (
                    <DimensionBar key={dim.id} dimension={dim} />
                  ))}
              </div>
            </div>

            {/* Re-analyze button */}
            <button
              onClick={onAnalyze}
              className="w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              Re-analyze Design
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
