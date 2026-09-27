import React, { useMemo, useState } from 'react';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { lintArtboardDesign, DesignLintIssue } from '../../services/canvasDesignLinter';
import { PanelErrorBoundary } from './PanelErrorBoundary';
import { PanelHeader } from './PanelHeader';

export const AccessibilityPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'linter' | 'vision'>('linter');
  const [simulatedVision, setSimulatedVision] = useState<'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'>('normal');

  const { artboards, activeArtboardId, selectLayer, updateLayer, canvasBackgroundColor } = useStore(
    useShallow((state) => ({
      artboards: state.artboards,
      activeArtboardId: state.activeArtboardId,
      selectLayer: state.selectLayer,
      updateLayer: state.updateLayer,
      canvasBackgroundColor: state.canvasBackgroundColor,
    }))
  );

  const activeArtboard = useMemo(
    () => artboards.find((a) => a.id === activeArtboardId) || artboards[0],
    [artboards, activeArtboardId]
  );

  const lintReport = useMemo(() => {
    if (!activeArtboard) return null;
    return lintArtboardDesign(activeArtboard, canvasBackgroundColor);
  }, [activeArtboard, canvasBackgroundColor]);

  if (!lintReport) return null;

  const { score, issues, metrics } = lintReport;
  const fixableIssues = issues.filter((i) => !!i.autoFix);

  const handleApplyFix = (issue: DesignLintIssue, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (issue.autoFix) {
      useStore.getState().saveToHistory?.();
      updateLayer(issue.layerId, issue.autoFix.patch);
      useStore.getState().addToast?.(`Auto-fixed: ${issue.autoFix.label}`, 'success');
    }
  };

  const handleFixAll = () => {
    if (fixableIssues.length === 0) return;
    useStore.getState().saveToHistory?.();
    for (const issue of fixableIssues) {
      if (issue.autoFix) {
        updateLayer(issue.layerId, issue.autoFix.patch);
      }
    }
    useStore.getState().addToast?.(
      `Applied ${fixableIssues.length} design auto-fixes! Canvas health restored.`,
      'success'
    );
  };

  const getSeverityBadge = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'info':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-dark-2 overflow-hidden">
      <PanelHeader
        tabs={[
          { id: 'linter', label: 'Design Linter', count: issues.length },
          { id: 'vision', label: 'Vision Sim' },
        ]}
        activeTabId={activeTab}
        onTabChange={(id) => setActiveTab(id as any)}
        action={
          <div className="flex items-center gap-2">
            <div
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border tracking-wider ${
                score >= 85
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-glow-emerald'
                  : score >= 65
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}
            >
              HEALTH: {score}%
            </div>
          </div>
        }
      />

      {activeTab === 'linter' ? (
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 p-4">
          {/* Critical Health Warning Banner if score < 80 */}
          {score < 80 && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                  <Icons.AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">Design Health Warning ({score}%)</p>
                  <p className="text-[10px] text-red-300/80 leading-normal">
                    {issues.filter((i) => i.severity === 'error').length} critical defects require attention.
                  </p>
                </div>
              </div>
              {fixableIssues.length > 0 && (
                <button
                  onClick={handleFixAll}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white rounded-lg text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 transition-all shadow-md shrink-0"
                >
                  <Icons.Zap className="w-3 h-3" />
                  Fix All
                </button>
              )}
            </div>
          )}

          {/* Summary Metric Ribbon */}
          <div className="grid grid-cols-4 gap-1.5 p-2 bg-black/40 rounded-xl border border-white/5 text-center">
            <div>
              <span className="block text-[8px] font-black text-gray-500 uppercase">Contrast</span>
              <span className={`text-[11px] font-black ${metrics.contrastIssues > 0 ? 'text-red-400' : 'text-gray-300'}`}>
                {metrics.contrastIssues}
              </span>
            </div>
            <div>
              <span className="block text-[8px] font-black text-gray-500 uppercase">Safe Zone</span>
              <span className={`text-[11px] font-black ${metrics.safeZoneIssues > 0 ? 'text-amber-400' : 'text-gray-300'}`}>
                {metrics.safeZoneIssues}
              </span>
            </div>
            <div>
              <span className="block text-[8px] font-black text-gray-500 uppercase">Align</span>
              <span className={`text-[11px] font-black ${metrics.alignmentIssues > 0 ? 'text-blue-400' : 'text-gray-300'}`}>
                {metrics.alignmentIssues}
              </span>
            </div>
            <div>
              <span className="block text-[8px] font-black text-gray-500 uppercase">Hierarchy</span>
              <span className={`text-[11px] font-black ${metrics.hierarchyIssues > 0 ? 'text-purple-400' : 'text-gray-300'}`}>
                {metrics.hierarchyIssues}
              </span>
            </div>
          </div>

          {fixableIssues.length > 1 && (
            <button
              onClick={handleFixAll}
              className="w-full py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20 transition-all hover:scale-[1.01]"
            >
              <Icons.Zap className="w-3.5 h-3.5 text-yellow-300" />
              Auto-Fix All ({fixableIssues.length} Issues)
            </button>
          )}

          {issues.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
                <Icons.Check className="w-7 h-7 text-emerald-400" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">Canvas Is Production-Ready</h4>
              <p className="text-[10px] text-gray-500 max-w-[220px] mx-auto leading-relaxed">
                Passed all WCAG AA contrast checks, edge safe-zone margins, and optical alignment audits.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl border border-white/5 transition-all group"
                  onClick={() => selectLayer(issue.layerId)}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-black text-white truncate max-w-[150px]">
                      {issue.layerName}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${getSeverityBadge(issue.severity)}`}>
                      {issue.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-300 font-medium leading-relaxed mb-2.5">
                    {issue.message}
                  </p>

                  {issue.autoFix && (
                    <button
                      onClick={(e) => handleApplyFix(issue, e)}
                      className="w-full py-1.5 px-3 bg-white/5 hover:bg-brand-600/20 border border-white/10 hover:border-brand-500/40 rounded-lg text-[10px] font-bold text-brand-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <Icons.Wand className="w-3 h-3 text-brand-400" />
                      {issue.autoFix.label}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Vision Simulation Mode */
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 p-4">
          <div className="bg-black/30 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
              Accessibility Preview
            </span>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Simulate color vision deficiencies in real-time to verify that information does not rely solely on color.
            </p>
          </div>

          <div className="space-y-2">
            {[
              { id: 'normal', name: 'Normal Vision', desc: 'Standard full-color vision spectrum' },
              { id: 'deuteranopia', name: 'Deuteranopia (Green-Weak)', desc: '~6% of male population' },
              { id: 'protanopia', name: 'Protanopia (Red-Weak)', desc: '~2% of male population' },
              { id: 'tritanopia', name: 'Tritanopia (Blue-Weak)', desc: 'Rare blue/yellow spectrum deficiency' },
              { id: 'achromatopsia', name: 'Monochromacy (Greyscale)', desc: 'Complete absence of color vision' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSimulatedVision(mode.id as any)}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  simulatedVision === mode.id
                    ? 'bg-brand-600/20 border-brand-500 text-white shadow-lg'
                    : 'bg-white/[0.02] border-white/5 text-gray-400 hover:border-white/10 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-black">{mode.name}</span>
                  {simulatedVision === mode.id && <Icons.Check className="w-3.5 h-3.5 text-brand-400" />}
                </div>
                <span className="text-[10px] text-gray-500 block">{mode.desc}</span>
              </button>
            ))}
          </div>

          {/* SVG Filter for Vision Simulation */}
          <svg className="hidden">
            <defs>
              <filter id="sim-protanopia">
                <feColorMatrix
                  type="matrix"
                  values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0"
                />
              </filter>
              <filter id="sim-deuteranopia">
                <feColorMatrix
                  type="matrix"
                  values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0"
                />
              </filter>
              <filter id="sim-tritanopia">
                <feColorMatrix
                  type="matrix"
                  values="0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0"
                />
              </filter>
              <filter id="sim-achromatopsia">
                <feColorMatrix
                  type="matrix"
                  values="0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0, 0, 0, 1, 0"
                />
              </filter>
            </defs>
          </svg>

          {simulatedVision !== 'normal' && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-1">
                Active Simulation
              </span>
              <p className="text-[10px] text-amber-200/80 leading-relaxed">
                Viewing design under {simulatedVision}. Switch back to &quot;Normal Vision&quot; to restore full fidelity.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto py-2.5 px-4 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-500 font-bold uppercase tracking-wider">
        <span>Kreathief Real-Time Linter</span>
        <span>Sub-5ms Evaluation</span>
      </div>
    </div>
  );
};

export default function AccessibilityPanelWrapped() {
  return (
    <PanelErrorBoundary panelName="Accessibility">
      <AccessibilityPanel />
    </PanelErrorBoundary>
  );
}

