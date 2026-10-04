import React, { useState } from 'react';
import { Layer, AutoLayoutSettings } from '../../types';
import { normalizePadding } from '../../layout/autoLayout';
import { HorizontalConstraint, VerticalConstraint } from '../../layout/constraints';

interface AutoLayoutSectionProps {
  selectedLayers: Layer[];
  onUpdateLayers: (updates: Record<string, Partial<Layer>>) => void;
}

export const AutoLayoutSection: React.FC<AutoLayoutSectionProps> = ({
  selectedLayers,
  onUpdateLayers,
}) => {
  const [show4WayPadding, setShow4WayPadding] = useState(false);

  if (!selectedLayers || selectedLayers.length === 0) return null;

  const firstLayer = selectedLayers[0];
  const isGroup = firstLayer.type === 'group';
  const autoLayout = firstLayer.autoLayout;
  const isAutoLayoutEnabled = !!autoLayout;
  const padding = normalizePadding(autoLayout?.padding);

  const toggleAutoLayout = () => {
    if (isAutoLayoutEnabled) {
      onUpdateLayers({ [firstLayer.id]: { autoLayout: undefined } });
    } else {
      const defaultLayout: AutoLayoutSettings = {
        direction: 'row',
        padding: 16,
        spacing: 12,
        alignment: 'center',
        sizing: {
          width: 'hug',
          height: 'hug',
        },
      };
      onUpdateLayers({ [firstLayer.id]: { autoLayout: defaultLayout } });
    }
  };

  const updateAutoLayout = (changes: Partial<AutoLayoutSettings>) => {
    if (!autoLayout) return;
    onUpdateLayers({
      [firstLayer.id]: {
        autoLayout: {
          ...autoLayout,
          ...changes,
        },
      },
    });
  };

  const updateConstraints = (horizontal?: HorizontalConstraint, vertical?: VerticalConstraint) => {
    const updates: Record<string, Partial<Layer>> = {};
    selectedLayers.forEach((layer) => {
      updates[layer.id] = {
        constraints: {
          horizontal: horizontal ?? layer.constraints?.horizontal ?? 'start',
          vertical: vertical ?? layer.constraints?.vertical ?? 'start',
        },
      };
    });
    onUpdateLayers(updates);
  };

  const currentHConstraint = firstLayer.constraints?.horizontal || 'start';
  const currentVConstraint = firstLayer.constraints?.vertical || 'start';

  return (
    <div className="space-y-4 pt-4 border-t border-gray-800">
      {/* Auto Layout Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Auto Layout
          </span>
          {isAutoLayoutEnabled && (
            <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-brand-500/20 text-brand-400 rounded">
              Active
            </span>
          )}
        </div>
        {isGroup && (
          <button
            onClick={toggleAutoLayout}
            className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium ${
              isAutoLayoutEnabled
                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                : 'bg-brand-600 text-white hover:bg-brand-500'
            }`}
          >
            {isAutoLayoutEnabled ? 'Remove' : '+ Auto Layout'}
          </button>
        )}
      </div>

      {/* Auto Layout Controls (when enabled on group) */}
      {isGroup && isAutoLayoutEnabled && (
        <div className="space-y-3 bg-surface-dark-3/60 p-3 rounded-xl border border-gray-800/80">
          {/* Direction */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              Direction
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => updateAutoLayout({ direction: 'row' })}
                className={`py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all ${
                  autoLayout.direction === 'row'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>Horizontal</span>
                <span className="text-sm leading-none">→</span>
              </button>
              <button
                type="button"
                onClick={() => updateAutoLayout({ direction: 'col' })}
                className={`py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all ${
                  autoLayout.direction === 'col'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>Vertical</span>
                <span className="text-sm leading-none">↓</span>
              </button>
            </div>
          </div>

          {/* Alignment & Spacing Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Alignment */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                Alignment
              </label>
              <select
                value={autoLayout.alignment || 'center'}
                onChange={(e) => updateAutoLayout({ alignment: e.target.value as any })}
                className="w-full bg-black/40 border border-gray-800 rounded-lg text-xs text-white p-2 outline-none focus:border-brand-500"
              >
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
                <option value="space-between">Space Between</option>
                <option value="space-around">Space Around</option>
                <option value="space-evenly">Space Evenly</option>
              </select>
            </div>

            {/* Gap / Spacing */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                Gap (px)
              </label>
              <input
                type="number"
                min="0"
                value={autoLayout.spacing ?? 0}
                onChange={(e) => updateAutoLayout({ spacing: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className="w-full bg-black/40 border border-gray-800 rounded-lg text-xs text-white p-2 outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Padding */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                Padding
              </label>
              <button
                type="button"
                onClick={() => setShow4WayPadding(!show4WayPadding)}
                className="text-[9px] text-brand-400 hover:text-brand-300 font-semibold"
              >
                {show4WayPadding ? 'Uniform' : 'Independent'}
              </button>
            </div>

            {!show4WayPadding ? (
              <input
                type="number"
                min="0"
                value={padding.top}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                  updateAutoLayout({ padding: val });
                }}
                className="w-full bg-black/40 border border-gray-800 rounded-lg text-xs text-white p-2 outline-none focus:border-brand-500"
                placeholder="Padding (px)"
              />
            ) : (
              <div className="grid grid-cols-4 gap-1.5">
                <div>
                  <span className="text-[8px] text-gray-500 uppercase block text-center">Top</span>
                  <input
                    type="number"
                    min="0"
                    value={padding.top}
                    onChange={(e) =>
                      updateAutoLayout({
                        padding: { ...padding, top: Math.max(0, parseInt(e.target.value, 10) || 0) },
                      })
                    }
                    className="w-full bg-black/40 border border-gray-800 rounded text-center text-xs text-white p-1"
                  />
                </div>
                <div>
                  <span className="text-[8px] text-gray-500 uppercase block text-center">Right</span>
                  <input
                    type="number"
                    min="0"
                    value={padding.right}
                    onChange={(e) =>
                      updateAutoLayout({
                        padding: { ...padding, right: Math.max(0, parseInt(e.target.value, 10) || 0) },
                      })
                    }
                    className="w-full bg-black/40 border border-gray-800 rounded text-center text-xs text-white p-1"
                  />
                </div>
                <div>
                  <span className="text-[8px] text-gray-500 uppercase block text-center">Bottom</span>
                  <input
                    type="number"
                    min="0"
                    value={padding.bottom}
                    onChange={(e) =>
                      updateAutoLayout({
                        padding: { ...padding, bottom: Math.max(0, parseInt(e.target.value, 10) || 0) },
                      })
                    }
                    className="w-full bg-black/40 border border-gray-800 rounded text-center text-xs text-white p-1"
                  />
                </div>
                <div>
                  <span className="text-[8px] text-gray-500 uppercase block text-center">Left</span>
                  <input
                    type="number"
                    min="0"
                    value={padding.left}
                    onChange={(e) =>
                      updateAutoLayout({
                        padding: { ...padding, left: Math.max(0, parseInt(e.target.value, 10) || 0) },
                      })
                    }
                    className="w-full bg-black/40 border border-gray-800 rounded text-center text-xs text-white p-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sizing Modes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                Width Sizing
              </label>
              <select
                value={autoLayout.sizing?.width || 'hug'}
                onChange={(e) =>
                  updateAutoLayout({
                    sizing: {
                      ...autoLayout.sizing,
                      width: e.target.value as any,
                      height: autoLayout.sizing?.height || 'hug',
                    },
                  })
                }
                className="w-full bg-black/40 border border-gray-800 rounded-lg text-xs text-white p-2 outline-none"
              >
                <option value="hug">Hug contents</option>
                <option value="fixed">Fixed width</option>
                <option value="fill">Fill container</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                Height Sizing
              </label>
              <select
                value={autoLayout.sizing?.height || 'hug'}
                onChange={(e) =>
                  updateAutoLayout({
                    sizing: {
                      ...autoLayout.sizing,
                      width: autoLayout.sizing?.width || 'hug',
                      height: e.target.value as any,
                    },
                  })
                }
                className="w-full bg-black/40 border border-gray-800 rounded-lg text-xs text-white p-2 outline-none"
              >
                <option value="hug">Hug contents</option>
                <option value="fixed">Fixed height</option>
                <option value="fill">Fill container</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Constraints & Pinning Card */}
      <div className="space-y-2.5 bg-surface-dark-3/40 p-3 rounded-xl border border-gray-800/60">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
          Resizing Constraints
        </label>
        <div className="grid grid-cols-2 gap-3">
          {/* Horizontal Pinning */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-500 uppercase block">Horizontal</span>
            <select
              value={currentHConstraint}
              onChange={(e) => updateConstraints(e.target.value as HorizontalConstraint, undefined)}
              className="w-full bg-black/40 border border-gray-800 rounded-lg text-xs text-white p-2 outline-none focus:border-brand-500"
            >
              <option value="start">Left</option>
              <option value="end">Right</option>
              <option value="center">Center</option>
              <option value="scale">Scale</option>
              <option value="both">Left & Right (Stretch)</option>
            </select>
          </div>

          {/* Vertical Pinning */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-500 uppercase block">Vertical</span>
            <select
              value={currentVConstraint}
              onChange={(e) => updateConstraints(undefined, e.target.value as VerticalConstraint)}
              className="w-full bg-black/40 border border-gray-800 rounded-lg text-xs text-white p-2 outline-none focus:border-brand-500"
            >
              <option value="start">Top</option>
              <option value="end">Bottom</option>
              <option value="center">Center</option>
              <option value="scale">Scale</option>
              <option value="both">Top & Bottom (Stretch)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
