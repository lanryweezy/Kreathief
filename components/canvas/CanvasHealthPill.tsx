import React, { useMemo } from 'react';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { lintArtboardDesign, DesignLintIssue } from '../../services/canvasDesignLinter';
import { NavTab } from '../../types';

export const CanvasHealthPill: React.FC = () => {
  const { artboards, activeArtboardId, canvasBackgroundColor, setActiveTab, updateLayer, addToast, saveToHistory } =
    useStore(
      useShallow((state) => ({
        artboards: state.artboards,
        activeArtboardId: state.activeArtboardId,
        canvasBackgroundColor: state.canvasBackgroundColor,
        setActiveTab: state.setActiveTab,
        updateLayer: state.updateLayer,
        addToast: state.addToast,
        saveToHistory: state.saveToHistory,
      }))
    );

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

  const handleOpenAccessibility = () => {
    setActiveTab(NavTab.ACCESSIBILITY);
  };

  return (
    <div className="absolute bottom-4 left-4 z-[90] flex items-center gap-1.5 select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
      <button
        onClick={handleOpenAccessibility}
        aria-label="Open Accessibility & Design Linter"
        title="Open Accessibility & Design Linter"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02] shadow-2xl ${
          isHealthy
            ? 'bg-surface-dark-3/90 border-white/10 hover:border-emerald-500/30 text-gray-300 hover:text-white'
            : 'bg-surface-dark-3/95 border-amber-500/40 text-amber-200 shadow-amber-500/10'
        }`}
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

      {!isHealthy && fixableIssues.length > 0 && (
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
  );
};
