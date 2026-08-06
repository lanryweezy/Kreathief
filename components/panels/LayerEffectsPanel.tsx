import React, { useState, useCallback } from 'react';
import { Icons } from '../../constants';
import { Layer, Shadow, Stroke, AdvancedShadow } from '../../types';
import { useStore } from '../../store/useStore';

interface LayerEffectsPanelProps {
  selectedLayer?: Layer;
}

export const LayerEffectsPanel = React.memo(({ selectedLayer }: LayerEffectsPanelProps) => {
  const updateLayer = useStore((state) => state.updateLayer);
  const addToast = useStore((state) => state.addToast);

  const [dropShadow, setDropShadow] = useState<Shadow | undefined>(selectedLayer?.shadow);
  const [stroke, setStroke] = useState<Stroke | undefined>(selectedLayer?.stroke);

  const handleAddDropShadow = useCallback(() => {
    const newShadow: Shadow = {
      color: '#000000',
      blur: 10,
      offsetX: 0,
      offsetY: 4,
    };
    setDropShadow(newShadow);
    if (selectedLayer) {
      updateLayer(selectedLayer.id, { shadow: newShadow });
      addToast('Drop shadow added', 'success');
    }
  }, [selectedLayer, updateLayer, addToast]);

  const handleRemoveDropShadow = useCallback(() => {
    setDropShadow(undefined);
    if (selectedLayer) {
      updateLayer(selectedLayer.id, { shadow: undefined });
      addToast('Drop shadow removed', 'info');
    }
  }, [selectedLayer, updateLayer, addToast]);

  const handleAddStroke = useCallback(() => {
    const newStroke: Stroke = {
      color: '#000000',
      width: 2,
      opacity: 1,
    };
    setStroke(newStroke);
    if (selectedLayer) {
      updateLayer(selectedLayer.id, { stroke: newStroke });
      addToast('Stroke added', 'success');
    }
  }, [selectedLayer, updateLayer, addToast]);

  const handleRemoveStroke = useCallback(() => {
    setStroke(undefined);
    if (selectedLayer) {
      updateLayer(selectedLayer.id, { stroke: undefined });
      addToast('Stroke removed', 'info');
    }
  }, [selectedLayer, updateLayer, addToast]);

  if (!selectedLayer) {
    return (
      <div className="bg-surface-dark-3 rounded-xl border border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icons.Layers className="w-4 h-4 text-gray-400" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Layer Effects</h3>
        </div>
        <p className="text-[10px] text-gray-500 text-center py-4">Select a layer to add effects</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-dark-3 rounded-xl border border-gray-700 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.Layers className="w-4 h-4 text-gray-400" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Layer Effects</h3>
        </div>
      </div>

      {/* Drop Shadow */}
      <div className="border border-gray-700 rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <label className="text-[10px] text-gray-400 font-bold">Drop Shadow</label>
          {!dropShadow ? (
            <button
              onClick={handleAddDropShadow}
              className="text-[10px] text-brand-600 hover:text-brand-500 flex items-center gap-1"
            >
              <Icons.Plus className="w-3 h-3" /> Add
            </button>
          ) : (
            <button
              onClick={handleRemoveDropShadow}
              className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <Icons.Trash className="w-3 h-3" /> Remove
            </button>
          )}
        </div>

        {dropShadow && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                aria-label="Drop Shadow Color"
                type="color"
                value={dropShadow.color}
                onChange={(e) => {
                  const updated = { ...dropShadow, color: e.target.value };
                  setDropShadow(updated);
                  updateLayer(selectedLayer.id, { shadow: updated });
                }}
                className="w-6 h-6 rounded border border-gray-600"
              />
              <span className="text-[10px] text-gray-400">Color</span>
            </div>

            <div>
              <div className="flex justify-between text-[9px] text-gray-500 mb-1">
                <span>Opacity</span>
                <span>{Math.round(((dropShadow as AdvancedShadow).opacity || 1) * 100)}%</span>
              </div>
              <input
                aria-label="Drop Shadow Opacity"
                type="range"
                min="0"
                max="100"
                value={((dropShadow as AdvancedShadow).opacity || 1) * 100}
                onChange={(e) => {
                  const updated = { ...dropShadow, opacity: parseInt(e.target.value) / 100 } as AdvancedShadow;
                  setDropShadow(updated);
                  updateLayer(selectedLayer.id, { shadow: updated });
                }}
                className="w-full accent-brand-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-[9px] text-gray-500 mb-1">
                <span>Blur</span>
                <span>{dropShadow.blur}px</span>
              </div>
              <input
                aria-label="Drop Shadow Blur"
                type="range"
                min="0"
                max="100"
                value={dropShadow.blur}
                onChange={(e) => {
                  const updated = { ...dropShadow, blur: parseInt(e.target.value) };
                  setDropShadow(updated);
                  updateLayer(selectedLayer.id, { shadow: updated });
                }}
                className="w-full accent-brand-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-[9px] text-gray-500 mb-1">
                  <span>X Offset</span>
                  <span>{dropShadow.offsetX}px</span>
                </div>
                <input
                  aria-label="Drop Shadow X Offset"
                  type="range"
                  min="-100"
                  max="100"
                  value={dropShadow.offsetX}
                  onChange={(e) => {
                    const updated = { ...dropShadow, offsetX: parseInt(e.target.value) };
                    setDropShadow(updated);
                    updateLayer(selectedLayer.id, { shadow: updated });
                  }}
                  className="w-full accent-brand-600"
                />
              </div>
              <div>
                <div className="flex justify-between text-[9px] text-gray-500 mb-1">
                  <span>Y Offset</span>
                  <span>{dropShadow.offsetY}px</span>
                </div>
                <input
                  aria-label="Drop Shadow Y Offset"
                  type="range"
                  min="-100"
                  max="100"
                  value={dropShadow.offsetY}
                  onChange={(e) => {
                    const updated = { ...dropShadow, offsetY: parseInt(e.target.value) };
                    setDropShadow(updated);
                    updateLayer(selectedLayer.id, { shadow: updated });
                  }}
                  className="w-full accent-brand-600"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stroke */}
      <div className="border border-gray-700 rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <label className="text-[10px] text-gray-400 font-bold">Stroke</label>
          {!stroke ? (
            <button
              onClick={handleAddStroke}
              className="text-[10px] text-brand-600 hover:text-brand-500 flex items-center gap-1"
            >
              <Icons.Plus className="w-3 h-3" /> Add
            </button>
          ) : (
            <button
              onClick={handleRemoveStroke}
              className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <Icons.Trash className="w-3 h-3" /> Remove
            </button>
          )}
        </div>

        {stroke && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                aria-label="Stroke Color"
                type="color"
                value={stroke.color}
                onChange={(e) => {
                  const updated = { ...stroke, color: e.target.value };
                  setStroke(updated);
                  updateLayer(selectedLayer.id, { stroke: updated });
                }}
                className="w-6 h-6 rounded border border-gray-600"
              />
              <span className="text-[10px] text-gray-400">Color</span>
            </div>

            <div>
              <div className="flex justify-between text-[9px] text-gray-500 mb-1">
                <span>Width</span>
                <span>{stroke.width}px</span>
              </div>
              <input
                aria-label="Stroke Width"
                type="range"
                min="0"
                max="50"
                value={stroke.width}
                onChange={(e) => {
                  const updated = { ...stroke, width: parseInt(e.target.value) };
                  setStroke(updated);
                  updateLayer(selectedLayer.id, { stroke: updated });
                }}
                className="w-full accent-brand-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-[9px] text-gray-500 mb-1">
                <span>Opacity</span>
                <span>{Math.round((stroke.opacity || 1) * 100)}%</span>
              </div>
              <input
                aria-label="Stroke Opacity"
                type="range"
                min="0"
                max="100"
                value={(stroke.opacity || 1) * 100}
                onChange={(e) => {
                  const updated = { ...stroke, opacity: parseInt(e.target.value) / 100 };
                  setStroke(updated);
                  updateLayer(selectedLayer.id, { stroke: updated });
                }}
                className="w-full accent-brand-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-[9px] text-gray-500 mb-1">
                <span>Alignment</span>
                <span>{(stroke as any).alignment || 'center'}</span>
              </div>
              <div className="flex gap-1">
                {(['inside', 'center', 'outside'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => {
                      const updated = { ...stroke, alignment: a } as any;
                      setStroke(updated);
                      updateLayer(selectedLayer.id, { stroke: updated });
                    }}
                    className={`flex-1 py-1 text-[9px] rounded border transition-colors ${
                      (stroke as any).alignment === a || (!stroke.alignment && a === 'center')
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'bg-surface-dark-4 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Coming Soon Effects */}
      <div className="border border-gray-700 rounded-lg p-3 opacity-50">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] text-gray-400 font-bold">Inner Shadow</label>
          <span className="text-[9px] text-gray-600">Coming Soon</span>
        </div>
      </div>

      <div className="border border-gray-700 rounded-lg p-3 opacity-50">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] text-gray-400 font-bold">Outer Glow</label>
          <span className="text-[9px] text-gray-600">Coming Soon</span>
        </div>
      </div>

      <div className="border border-gray-700 rounded-lg p-3 opacity-50">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] text-gray-400 font-bold">Inner Glow</label>
          <span className="text-[9px] text-gray-600">Coming Soon</span>
        </div>
      </div>

      {/* Preview */}
      <div className="pt-3 border-t border-gray-700">
        <div
          className="w-full h-24 bg-black/30 rounded-lg flex items-center justify-center"
          style={{
            boxShadow: dropShadow
              ? `${dropShadow.offsetX}px ${dropShadow.offsetY}px ${dropShadow.blur}px ${dropShadow.color}`
              : 'none',
            border: stroke ? `${stroke.width}px solid ${stroke.color}` : 'none',
          }}
        >
          <span className="text-white text-sm font-bold">Preview</span>
        </div>
      </div>
    </div>
  );
  LayerEffectsPanel.displayName = 'LayerEffectsPanel';
});
