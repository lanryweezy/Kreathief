import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { lintArtboardDesign, DesignLintIssue } from '../../services/canvasDesignLinter';
import { NavTab } from '../../types';

export const CanvasHealthPill: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hudRef = useRef<HTMLDivElement>(null);

  const {
    artboards,
    activeArtboardId,
    canvasBackgroundColor,
    setActiveTab,
    updateLayer,
    setSelectedLayerIds,
    addToast,
    saveToHistory,
  } = useStore(
    useShallow((state) => ({
      artboards: state.artboards,
      activeArtboardId: state.activeArtboardId,
      canvasBackgroundColor: state.canvasBackgroundColor,
      setActiveTab: state.setActiveTab,
      updateLayer: state.updateLayer,
      setSelectedLayerIds: state.setSelectedLayerIds,
      addToast: state.addToast,
      saveToHistory: state.saveToHistory,
    }))
  );

  useEffect(() => {
    if (!isExpanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (hudRef.current && !hudRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  const activeArtboard = useMemo(
    () => artboards.find((a) => a.id === activeArtboardId) || artboards[0],
    [artboards, activeArtboardId]
  );

  const lintReport = useMemo(() => {
    if (!activeArtboard || (activeArtboard.layers || []).length <= 1) return null;
    return lintArtboardDesign(activeArtboard, canvasBackgroundColor);
  }, [activeArtboard, canvasBackgroundColor]);

  if (!lintReport) return null;

  const { score, issues } = lintReport;
  const fixableIssues = issues.filter((i) => !!i.autoFix);
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const isHealthy = score >= 85 && errorCount === 0;

  const handleFixAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fixableIssues.length === 0) return;

    saveToHistory?.();
    for (const issue of fixableIssues) {
      if (issue.autoFix) {
        updateLayer(issue.layerId, issue.autoFix.patch);
      }
    }
    addToast?.(`Applied ${fixableIssues.length} design auto-fixes! Canvas health restored.`, 'success');
  };

  const handleFixSingle = (e: React.MouseEvent, issue: DesignLintIssue) => {
    e.stopPropagation();
    if (!issue.autoFix) return;
    saveToHistory?.();
    updateLayer(issue.layerId, issue.autoFix.patch);
    addToast?.(`Fixed "${issue.layerName}": ${issue.autoFix.label}`, 'success');
  };

  const handleSelectLayer = (layerId: string) => {
    setSelectedLayerIds?.([layerId]);
  };

  const handleOpenAccessibility = () => {
    setIsExpanded(false);
    setActiveTab(NavTab.ACCESSIBILITY);
  };

  return (
    <div ref={hudRef} className="absolute bottom-4 left-4 z-[90] flex flex-col items-start gap-2 select-none">
      {/* Expandable Canvas Health HUD Popover */}
      {isExpanded && (
        <div
          className="w-80 sm:w-96 max-h-[380px] flex flex-col bg-surface-dark-2/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200"
          role="dialog"
          aria-label="Canvas Health Inspector"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-black/25">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isHealthy ? 'bg-emerald-400 shadow-glow-emerald' : 'bg-amber-400 animate-pulse'
                }`}
              />
              <div>
                <div className="text-xs font-black text-white uppercase tracking-wider">
                  Design Health: {score}%
                </div>
                <div className="text-[10px] text-gray-400">
                  {issues.length === 0
                    ? 'All visual checks passed'
                    : `${issues.length} ${issues.length === 1 ? 'finding' : 'findings'} detected`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleOpenAccessibility}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-gray-300 hover:text-white transition-colors"
                title="Open full Accessibility & Linter panel"
              >
                Full Audit
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close Health Inspector"
              >
                <Icons.X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Issues List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {issues.length === 0 ? (
              <div className="py-6 text-center space-y-1.5">
                <Icons.Check className="w-6 h-6 text-emerald-400 mx-auto" />
                <div className="text-xs font-bold text-white">No layout or contrast defects</div>
                <div className="text-[10px] text-gray-400">
                  Your artboard meets WCAG contrast and safe-zone guidelines.
                </div>
              </div>
            ) : (
              issues.map((issue) => {
                const badgeColor =
                  issue.severity === 'error'
                    ? 'bg-red-500/20 text-red-300 border-red-500/30'
                    : issue.severity === 'warning'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30';

                return (
                  <div
                    key={issue.id}
                    onClick={() => handleSelectLayer(issue.layerId)}
                    className="p-2.5 rounded-xl bg-surface-dark-3/80 hover:bg-surface-dark-3 border border-white/5 hover:border-white/15 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${badgeColor}`}
                        >
                          {issue.severity}
                        </span>
                        <span className="text-[11px] font-bold text-white truncate">{issue.layerName}</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 shrink-0">
                        {issue.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-snug mb-2">{issue.message}</p>
                    {issue.autoFix && (
                      <button
                        onClick={(e) => handleFixSingle(e, issue)}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/30 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Icons.Zap className="w-3 h-3" />
                        Fix: {issue.autoFix.label}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          {fixableIssues.length > 0 && (
            <div className="p-2.5 border-t border-white/10 bg-black/25">
              <button
                onClick={handleFixAll}
                className="w-full py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg hover:shadow-brand-500/25 active:scale-[0.98]"
              >
                <Icons.Zap className="w-3.5 h-3.5 text-yellow-300" />
                Auto-Fix All ({fixableIssues.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pill Trigger */}
      <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div
          className={`flex items-center rounded-xl border backdrop-blur-md transition-all shadow-2xl overflow-hidden ${
            isHealthy
              ? 'bg-surface-dark-3/90 border-white/10 hover:border-emerald-500/30 text-gray-300 hover:text-white'
              : 'bg-surface-dark-3/95 border-amber-500/40 text-amber-200 shadow-amber-500/10'
          }`}
        >
          <button
            onClick={handleOpenAccessibility}
            aria-label="Open Accessibility & Design Linter"
            title="Open Accessibility & Design Linter"
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 cursor-pointer hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              {isHealthy ? (
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow-emerald" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
              <span className="text-[11px] font-black tracking-wide">
                {isHealthy ? `HEALTH ${score}%` : `HEALTH ${score}% (${issues.length})`}
              </span>
            </div>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label="Toggle Design Health Inspector"
            aria-expanded={isExpanded}
            title="Inspect findings and apply 1-click fixes"
            className="px-2 py-1.5 border-l border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
          >
            <Icons.ChevronDown
              className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {!isHealthy && fixableIssues.length > 0 && !isExpanded && (
          <button
            onClick={handleFixAll}
            aria-label="Auto-Fix All"
            className="px-2.5 py-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all shadow-md hover:shadow-brand-500/25 active:scale-95 border border-brand-400/30"
            title="Auto-fix all design issues"
          >
            <Icons.Zap className="w-3 h-3 text-yellow-300" />
            Auto-Fix All
          </button>
        )}
      </div>
    </div>
  );
};
