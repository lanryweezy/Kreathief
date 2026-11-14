import React, { useState, useMemo } from 'react';
import { Icons } from '../../constants';
import { PanelHeader } from './PanelHeader';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';

export interface PrototypeInteraction {
  id: string;
  trigger: 'on_click' | 'on_hover' | 'on_drag' | 'after_delay';
  targetArtboardId: string;
  animation: 'instant' | 'dissolve' | 'smart_animate' | 'push' | 'slide_in';
}

export const PrototypingPanel = () => {
  const { selectedLayerIds, artboards, activeArtboardId, updateLayer, addToast, setShowPresentation } = useStore(
    useShallow((s) => ({
      selectedLayerIds: s.selectedLayerIds,
      artboards: s.artboards,
      activeArtboardId: s.activeArtboardId,
      updateLayer: s.updateLayer,
      addToast: s.addToast,
      setShowPresentation: s.setShowPresentation,
    }))
  );

  const [interactionType, setInteractionType] = useState<PrototypeInteraction['trigger']>('on_click');
  const [navigateTarget, setNavigateTarget] = useState('');
  const [animationType, setAnimationType] = useState<PrototypeInteraction['animation']>('smart_animate');

  const activeArtboard = useMemo(
    () => artboards.find((a) => a.id === activeArtboardId) || artboards[0],
    [artboards, activeArtboardId]
  );

  const selectedLayer = useMemo(() => {
    if (!activeArtboard || !selectedLayerIds.length) {
      return null;
    }
    const id = selectedLayerIds[selectedLayerIds.length - 1];
    return activeArtboard.layers.find((l) => l.id === id) || null;
  }, [activeArtboard, selectedLayerIds]);

  const interactions: PrototypeInteraction[] = useMemo(() => {
    if (!selectedLayer) {
      return [];
    }
    return ((selectedLayer as any).prototypeInteractions as PrototypeInteraction[]) || [];
  }, [selectedLayer]);

  const handleAddInteraction = () => {
    if (!selectedLayer) {
      return;
    }
    if (!navigateTarget) {
      addToast('Select a destination artboard first', 'warning');
      return;
    }

    const newRule: PrototypeInteraction = {
      id: `proto_${Date.now()}`,
      trigger: interactionType,
      targetArtboardId: navigateTarget,
      animation: animationType,
    };

    const next = [...interactions.filter((r) => r.trigger !== interactionType), newRule];
    updateLayer(selectedLayer.id, { prototypeInteractions: next } as any);
    const targetName = artboards.find((a) => a.id === navigateTarget)?.name || navigateTarget;
    addToast(`Linked "${selectedLayer.name || selectedLayer.type}" to ${targetName}`, 'success');
  };

  const handleRemoveInteraction = (ruleId: string) => {
    if (!selectedLayer) {
      return;
    }
    const next = interactions.filter((r) => r.id !== ruleId);
    updateLayer(selectedLayer.id, { prototypeInteractions: next } as any);
    addToast('Interaction removed', 'info');
  };

  return (
    <div className="flex flex-col h-full bg-surface-dark-2 overflow-hidden">
      <PanelHeader
        title="Prototyping"
        icon={<Icons.Zap className="w-5 h-5 text-brand-500" />}
        action={
          <button
            onClick={() => setShowPresentation(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-[10px] font-bold text-white transition-colors"
            title="Preview Interactive Prototype"
          >
            <Icons.Play className="w-3 h-3" />
            Preview
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-10 space-y-6">
        {!selectedLayer ? (
          <div className="text-center text-gray-500 text-xs mt-10 p-6 bg-surface-dark-3/40 rounded-xl border border-white/5">
            <Icons.MousePointer2 className="w-8 h-8 mx-auto mb-3 opacity-30 text-brand-400" />
            <p className="font-semibold text-gray-300 mb-1">No Layer Selected</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Select any button, card, or layer on your canvas to wire interactive navigation between artboards.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="p-3 bg-surface-dark-3 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block">
                  Selected Layer
                </span>
                <span className="text-xs font-bold text-white truncate block max-w-[180px]">
                  {selectedLayer.name || selectedLayer.type}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/15 text-brand-300 border border-brand-500/30">
                {interactions.length} {interactions.length === 1 ? 'Link' : 'Links'}
              </span>
            </div>

            {/* Existing Interactions */}
            {interactions.length > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Active Interactions
                </label>
                {interactions.map((rule) => {
                  const targetBoard = artboards.find((a) => a.id === rule.targetArtboardId);
                  return (
                    <div
                      key={rule.id}
                      className="p-2.5 bg-brand-600/10 border border-brand-500/30 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-white truncate">
                          {rule.trigger.replace('_', ' ').toUpperCase()} → {targetBoard?.name || 'Artboard'}
                        </div>
                        <div className="text-[9px] text-brand-300/80 font-mono uppercase">
                          Transition: {rule.animation.replace('_', ' ')}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveInteraction(rule.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                        title="Remove interaction"
                        aria-label="Remove interaction"
                      >
                        <Icons.Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Interaction Trigger */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Trigger</label>
              <select
                className="w-full bg-surface-dark-4 border border-gray-700 rounded-lg text-xs p-2.5 text-white outline-none focus:border-brand-500"
                value={interactionType}
                onChange={(e) => setInteractionType(e.target.value as PrototypeInteraction['trigger'])}
              >
                <option value="on_click">On Click</option>
                <option value="on_hover">While Hovering</option>
                <option value="on_drag">On Drag</option>
                <option value="after_delay">After Delay</option>
              </select>
            </div>

            {/* Action / Destination */}
            <div className="p-3 bg-surface-dark-3 border border-gray-700/50 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Icons.ArrowRight className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-semibold text-white">Navigate To</span>
              </div>
              <select
                className="w-full bg-surface-dark-4 border border-gray-700 rounded-lg text-xs p-2.5 text-white outline-none focus:border-brand-500"
                value={navigateTarget}
                onChange={(e) => setNavigateTarget(e.target.value)}
              >
                <option value="">Select Target Artboard...</option>
                {artboards.map((ab, idx) => (
                  <option key={ab.id} value={ab.id}>
                    {ab.name || `Artboard ${idx + 1}`} {ab.id === activeArtboardId ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Animation Settings */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                Animation
              </label>
              <select
                className="w-full bg-surface-dark-4 border border-gray-700 rounded-lg text-xs p-2.5 text-white outline-none focus:border-brand-500"
                value={animationType}
                onChange={(e) => setAnimationType(e.target.value as PrototypeInteraction['animation'])}
              >
                <option value="instant">Instant</option>
                <option value="dissolve">Dissolve</option>
                <option value="smart_animate">Smart Animate</option>
                <option value="push">Push</option>
                <option value="slide_in">Slide In</option>
              </select>
            </div>

            <button
              onClick={handleAddInteraction}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20"
            >
              <Icons.Plus className="w-4 h-4" />
              Add Interaction
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
