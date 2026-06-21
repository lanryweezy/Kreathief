import React, { useMemo } from 'react';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { runAccessibilityAudit } from '../../services/accessibilityService';

export const AccessibilityPanel: React.FC = () => {
  // Use useShallow to prevent unnecessary re-renders when other store values change
  const { artboards, activeArtboardId, selectLayer, updateLayer } = useStore(
    useShallow((state) => ({
      artboards: state.artboards,
      activeArtboardId: state.activeArtboardId,
      selectLayer: state.selectLayer,
      updateLayer: state.updateLayer,
    }))
  );

  const activeArtboard = useMemo(
    () => artboards.find((a) => a.id === activeArtboardId) || artboards[0],
    [artboards, activeArtboardId]
  );

  const auditResult = useMemo(() => {
    if (!activeArtboard) {
      return null;
    }
    return runAccessibilityAudit(activeArtboard);
  }, [activeArtboard]);

  if (!auditResult) {
    return null;
  }

  const { score, issues } = auditResult;

  const getSeverityColor = (severity: 'error' | 'warning') => {
    return severity === 'error' ? 'text-red-400' : 'text-orange-400';
  };

  const getSeverityBg = (severity: 'error' | 'warning') => {
    return severity === 'error' ? 'bg-red-400/10 border-red-400/20' : 'bg-orange-400/10 border-orange-400/20';
  };

  return (
    <div className="flex flex-col h-full bg-[#13161a] p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Icons.Help className="w-5 h-5 text-yellow-400" />
          WCAG Audit
        </h3>
        <div
          className={`px-3 py-1 rounded-full text-[10px] font-black border ${
            score >= 90
              ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20'
              : score >= 70
                ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20'
                : 'bg-red-500/20 text-red-500 border-red-500/20'
          }`}
        >
          {score}% COMPLIANT
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-10">
        {issues.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <Icons.Check className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">No Issues Found</h4>
            <p className="text-xs text-gray-500 max-w-[200px] mx-auto leading-relaxed">
              Your design meets basic WCAG 2.1 accessibility standards for contrast and structure.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
              {issues.length} Critical Observations
            </div>
            {issues.map((issue) => (
              <div
                key={issue.id}
                className={`p-3 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer ${getSeverityBg(issue.severity)}`}
                onClick={() => selectLayer(issue.layerId)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${getSeverityColor(issue.severity)}`}>
                    <Icons.Help className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-tighter text-white truncate">
                        {issue.layerName}
                      </span>
                      <span className={`text-[8px] font-bold uppercase ${getSeverityColor(issue.severity)}`}>
                        {issue.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-300 font-medium leading-relaxed mb-2">{issue.message}</p>

                    <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                      <span className="text-[8px] font-black text-gray-500 uppercase block mb-1">Fix Suggestion</span>
                      <p className="text-[10px] text-gray-400 italic leading-snug">{issue.suggestion}</p>
                    </div>

                    {issue.type === 'alt-text' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const alt = prompt('Enter alternative text:');
                          if (alt) {
                            updateLayer(issue.layerId, { altText: alt });
                          }
                        }}
                        className="mt-3 w-full py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-white border border-white/10 transition-colors"
                      >
                        Add Alt Text
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-white/5 text-center">
        <p className="text-[8px] text-gray-600 font-black uppercase tracking-[0.2em]">WCAG 2.1 AA Compliance Check</p>
      </div>
    </div>
  );
};
