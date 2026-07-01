import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Icons } from '../../constants';
import { Button } from '../Button';
import { Layer, Artboard } from '../../types';

/**
 * ComponentProperties Panel — Shows component info, variants, and instance controls.
 * Appears in the SidePanel when a component or instance is selected.
 */
export const ComponentPropertiesPanel: React.FC = () => {
  const {
    selectedLayerIds,
    artboards,
    convertToComponent,
    instantiateComponent,
    detachInstance,
    resetOverrides,
    swapInstance,
    getComponentInstances,
    getComponentDefinition,
    addVariant,
    applyVariant,
    updateInstanceLayer,
  } = useStore(
    useShallow((state) => ({
      selectedLayerIds: state.selectedLayerIds,
      artboards: state.artboards,
      convertToComponent: state.convertToComponent,
      instantiateComponent: state.instantiateComponent,
      detachInstance: state.detachInstance,
      resetOverrides: state.resetOverrides,
      swapInstance: state.swapInstance,
      getComponentInstances: state.getComponentInstances,
      getComponentDefinition: state.getComponentDefinition,
      addVariant: state.addVariant,
      applyVariant: state.applyVariant,
      updateInstanceLayer: state.updateInstanceLayer,
    }))
  );

  const [newVariantName, setNewVariantName] = useState('');
  const [showSwapPicker, setShowSwapPicker] = useState(false);

  // Get selected layer
  const selectedId = selectedLayerIds?.[0];
  const selectedLayer = artboards
    .flatMap((a: Artboard) => a.layers)
    .find((l) => l.id === selectedId);

  if (!selectedLayer) {
    return (
      <div className="p-4 text-center text-gray-500 text-xs">
        Select a layer to view component properties
      </div>
    );
  }

  const isMaster = !!selectedLayer.componentId;
  const isInstance = !!selectedLayer.masterId;
  const isNeither = !isMaster && !isInstance;

  // ── Not a component yet — offer to create one ──
  if (isNeither) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center">
          <Icons.Layers className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-xs text-gray-400 mb-3">
            Convert this layer into a reusable component
          </p>
          <Button
            variant="primary"
            onClick={() => convertToComponent(selectedLayer.id)}
            className="w-full"
          >
            Create Component
          </Button>
        </div>
      </div>
    );
  }

  // ── Master Component View ──
  if (isMaster) {
    const componentId = selectedLayer.componentId!;
    const instances = getComponentInstances(componentId);
    const definition = getComponentDefinition(componentId);

    return (
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Icons.Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Master Component</h3>
            <p className="text-[10px] text-gray-400">{instances.length} instance{instances.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Instance List */}
        {instances.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Instances</span>
            <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
              {instances.map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-center justify-between p-2 bg-surface-dark-4 rounded-lg text-[10px] text-gray-300 hover:bg-surface-dark-5 cursor-pointer"
                  onClick={() => useStore.getState().setSelectedLayerIds([inst.id])}
                >
                  <span className="truncate">{inst.name || inst.id.slice(0, 8)}</span>
                  <span className="text-gray-500">{(inst.overrides || []).length} overrides</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Instance Button */}
        <Button
          variant="accent"
          onClick={() => instantiateComponent(componentId)}
          className="w-full"
        >
          <Icons.Plus className="w-3.5 h-3.5 mr-1.5" />
          New Instance
        </Button>

        {/* Variants */}
        {definition && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Variants</span>
            <div className="grid grid-cols-2 gap-1">
              {definition.variants.map((v: any) => (
                <button
                  key={v.id}
                  className="px-2 py-1.5 bg-surface-dark-4 border border-gray-700 rounded-lg text-[10px] text-gray-300 hover:border-brand-600 transition-colors"
                >
                  {v.name}
                </button>
              ))}
            </div>

            {/* Add Variant */}
            <div className="flex gap-1">
              <input
                type="text"
                value={newVariantName}
                onChange={(e) => setNewVariantName(e.target.value)}
                placeholder="Variant name..."
                className="flex-1 bg-surface-dark-0/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white placeholder-gray-500 outline-none focus:border-brand-600"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newVariantName.trim()) {
                    addVariant(componentId, newVariantName.trim(), {});
                    setNewVariantName('');
                  }
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (newVariantName.trim()) {
                    addVariant(componentId, newVariantName.trim(), {});
                    setNewVariantName('');
                  }
                }}
                disabled={!newVariantName.trim()}
              >
                <Icons.Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Instance View ──
  if (isInstance) {
    const masterId = selectedLayer.masterId!;
    const overrides = selectedLayer.overrides || [];
    const definition = getComponentDefinition(masterId);

    return (
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Icons.Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Component Instance</h3>
            <p className="text-[10px] text-gray-400">
              {overrides.length} override{overrides.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Overrides List */}
        {overrides.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overrides</span>
            <div className="flex flex-wrap gap-1">
              {overrides.map((prop) => (
                <span
                  key={prop}
                  className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[9px] font-mono"
                >
                  {prop}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            onClick={() => resetOverrides(selectedLayer.id)}
            className="w-full"
            disabled={overrides.length === 0}
          >
            <Icons.RotateCw className="w-3.5 h-3.5 mr-1.5" />
            Reset to Master
          </Button>

          <Button
            variant="ghost"
            onClick={() => detachInstance(selectedLayer.id)}
            className="w-full"
          >
            <Icons.Scissors className="w-3.5 h-3.5 mr-1.5" />
            Detach Instance
          </Button>

          <Button
            variant="accent"
            onClick={() => setShowSwapPicker(!showSwapPicker)}
            className="w-full"
          >
            <Icons.RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Swap Component
          </Button>
        </div>

        {/* Variant Picker */}
        {definition && definition.variants.length > 1 && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Variant</span>
            <div className="grid grid-cols-2 gap-1">
              {definition.variants.map((v: any) => (
                <button
                  key={v.id}
                  onClick={() => applyVariant(selectedLayer.id, v.id)}
                  className="px-2 py-1.5 bg-surface-dark-4 border border-gray-700 rounded-lg text-[10px] text-gray-300 hover:border-brand-600 transition-colors"
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Swap Picker */}
        {showSwapPicker && (
          <SwapComponentPicker
            currentMasterId={masterId}
            onSelect={(newMasterId) => {
              swapInstance(selectedLayer.id, newMasterId);
              setShowSwapPicker(false);
            }}
            onCancel={() => setShowSwapPicker(false)}
          />
        )}
      </div>
    );
  }

  return null;
};

// ── Swap Picker Sub-Component ──

const SwapComponentPicker: React.FC<{
  currentMasterId: string;
  onSelect: (masterId: string) => void;
  onCancel: () => void;
}> = ({ currentMasterId, onSelect, onCancel }) => {
  const { artboards } = useStore(
    useShallow((state) => ({
      artboards: state.artboards,
    }))
  );

  // Find all master components
  const allComponents = artboards.flatMap((a: Artboard) =>
    a.layers.filter((l) => l.componentId && l.componentId !== currentMasterId)
  );

  return (
    <div className="space-y-2 p-3 bg-surface-dark-0/50 rounded-xl border border-white/10">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Swap to</span>
      {allComponents.length === 0 ? (
        <p className="text-[10px] text-gray-500">No other components available</p>
      ) : (
        <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
          {allComponents.map((comp) => (
            <button
              key={comp.componentId}
              onClick={() => onSelect(comp.componentId!)}
              className="w-full text-left p-2 bg-surface-dark-4 border border-gray-700 rounded-lg text-[10px] text-gray-300 hover:border-brand-600 transition-colors"
            >
              {comp.name || comp.id.slice(0, 8)}
            </button>
          ))}
        </div>
      )}
      <Button variant="ghost" size="sm" onClick={onCancel} className="w-full">
        Cancel
      </Button>
    </div>
  );
};

ComponentPropertiesPanel.displayName = 'ComponentPropertiesPanel';
