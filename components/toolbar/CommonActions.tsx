import React, { useRef } from 'react';
import { Icons } from '../../constants';
import { IconButton, Divider } from './ToolbarShared';
import { Dropdown } from '../Dropdown';
import { Layer } from '../../types';

interface CommonActionsProps {
  selectedLayer: Layer;
  handleUpdateLayer: (changes: any) => void;
  documentColors?: string[];
  onMoveLayer: (id: string, direction: 'forward' | 'backward') => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
}

export const CommonActions = React.memo(
  ({ selectedLayer, handleUpdateLayer, onMoveLayer, onDuplicateLayer, onDeleteLayer }: CommonActionsProps) => {
    const [showEffects, setShowEffects] = React.useState(false);
    const [showLockDropdown, setShowLockDropdown] = React.useState(false);
    const appearanceButtonRef = useRef<HTMLButtonElement>(null);
    const lockButtonRef = useRef<HTMLButtonElement>(null);

    const hasCustomBlend = selectedLayer.blendMode && selectedLayer.blendMode !== 'normal';
    const hasCustomOpacity = (selectedLayer.opacity ?? 1) < 1;

    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            ref={appearanceButtonRef}
            onClick={() => setShowEffects(!showEffects)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
              hasCustomBlend || hasCustomOpacity
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200 shadow-md shadow-indigo-900/20'
                : showEffects
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-black/20 border-white/10 text-gray-300 hover:border-white/20 hover:bg-black/30'
            }`}
            title="Layer Blend Mode & Opacity"
          >
            <Icons.Blend className={`w-3.5 h-3.5 ${hasCustomBlend ? 'text-indigo-400' : 'text-gray-400'}`} />
            <span className="capitalize">{hasCustomBlend ? selectedLayer.blendMode : 'Blend'}</span>
            <span className="text-[9px] font-mono bg-black/40 px-1 py-0.5 rounded text-gray-300">
              {Math.round((selectedLayer.opacity ?? 1) * 100)}%
            </span>
          </button>
          <Dropdown
            anchorRef={appearanceButtonRef}
            isOpen={showEffects}
            onClose={() => setShowEffects(false)}
            align="right"
          >
            <div className="w-72 bg-surface-dark-3 rounded-xl shadow-2xl border border-white/10 p-4 animate-fadeIn space-y-3.5 backdrop-blur-xl">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.Blend className="w-4 h-4 text-indigo-400" />
                  Blend & Opacity
                </span>
                {(hasCustomBlend || hasCustomOpacity) && (
                  <button
                    onClick={() => handleUpdateLayer({ blendMode: 'normal', opacity: 1 })}
                    className="text-[9px] text-gray-400 hover:text-white font-bold px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Opacity slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Opacity</span>
                  <span className="text-[10px] text-indigo-300 font-mono font-bold bg-indigo-900/30 px-1.5 py-0.5 rounded">
                    {Math.round((selectedLayer.opacity ?? 1) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={selectedLayer.opacity ?? 1}
                  onChange={(e) => handleUpdateLayer({ opacity: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                />
              </div>

              {/* Quick Blend Presets */}
              <div className="pt-2 border-t border-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                  Quick Blend Modes
                </span>
                <div className="grid grid-cols-4 gap-1 mb-2.5">
                  {(['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'soft-light', 'color-dodge'] as const).map(
                    (bm) => {
                      const isActive = (selectedLayer.blendMode || 'normal') === bm;
                      return (
                        <button
                          key={bm}
                          onClick={() => handleUpdateLayer({ blendMode: bm })}
                          className={`px-1.5 py-1 text-[9px] font-bold rounded border capitalize transition-all truncate ${
                            isActive
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                              : 'bg-black/20 border-white/5 text-gray-300 hover:text-white hover:border-white/15'
                          }`}
                        >
                          {bm.replace('-', ' ')}
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">All Modes</span>
                  <select
                    value={selectedLayer.blendMode || 'normal'}
                    onChange={(e) => handleUpdateLayer({ blendMode: e.target.value })}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg text-xs text-white p-1.5 outline-none focus:border-indigo-500/50 transition-all cursor-pointer capitalize"
                  >
                    <optgroup label="Normal">
                      <option value="normal">Normal</option>
                    </optgroup>
                    <optgroup label="Darken">
                      <option value="darken">Darken</option>
                      <option value="multiply">Multiply</option>
                      <option value="color-burn">Color Burn</option>
                    </optgroup>
                    <optgroup label="Lighten">
                      <option value="lighten">Lighten</option>
                      <option value="screen">Screen</option>
                      <option value="color-dodge">Color Dodge</option>
                    </optgroup>
                    <optgroup label="Contrast">
                      <option value="overlay">Overlay</option>
                      <option value="soft-light">Soft Light</option>
                      <option value="hard-light">Hard Light</option>
                    </optgroup>
                    <optgroup label="Inversion">
                      <option value="difference">Difference</option>
                      <option value="exclusion">Exclusion</option>
                    </optgroup>
                    <optgroup label="Component">
                      <option value="hue">Hue</option>
                      <option value="saturation">Saturation</option>
                      <option value="color">Color</option>
                      <option value="luminosity">Luminosity</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          </Dropdown>
        </div>

        <Divider />

        <IconButton onClick={() => onMoveLayer(selectedLayer.id, 'forward')} title="Bring Forward">
          <Icons.ArrowUp className="w-3.5 h-3.5" />
        </IconButton>
        <IconButton onClick={() => onMoveLayer(selectedLayer.id, 'backward')} title="Send Backward">
          <Icons.ArrowDown className="w-3.5 h-3.5" />
        </IconButton>

        <IconButton onClick={() => onDuplicateLayer(selectedLayer.id)} title="Duplicate" shortcut="Ctrl+D">
          <Icons.Copy className="w-3.5 h-3.5" />
        </IconButton>
        <IconButton
          onClick={() => onDeleteLayer(selectedLayer.id)}
          className="hover:bg-red-500/20 hover:text-red-400"
          title="Delete"
        >
          <Icons.Trash className="w-3.5 h-3.5" />
        </IconButton>

        <div className="relative">
          <IconButton
            ref={lockButtonRef}
            onClick={() => setShowLockDropdown(!showLockDropdown)}
            active={
              selectedLayer.locked || selectedLayer.lockPosition || selectedLayer.lockStyle || selectedLayer.lockText
            }
            title="Locking & Permissions"
            className={
              selectedLayer.locked || selectedLayer.lockPosition || selectedLayer.lockStyle || selectedLayer.lockText
                ? 'text-red-400'
                : ''
            }
          >
            {selectedLayer.locked || selectedLayer.lockPosition || selectedLayer.lockStyle || selectedLayer.lockText ? (
              <Icons.Lock className="w-3.5 h-3.5" />
            ) : (
              <Icons.Unlock className="w-3.5 h-3.5" />
            )}
          </IconButton>

          <Dropdown
            anchorRef={lockButtonRef}
            isOpen={showLockDropdown}
            onClose={() => setShowLockDropdown(false)}
            align="right"
          >
            <div className="w-56 bg-surface-dark-3 rounded-xl shadow-2xl border border-white/10 p-3 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pb-1 block">
                Enterprise Locks
              </span>
              <button
                onClick={() => handleUpdateLayer({ locked: !selectedLayer.locked })}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedLayer.locked ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/5 text-gray-300 hover:text-white'}`}
              >
                <Icons.Lock className="w-3.5 h-3.5 shrink-0" />
                <div className="flex-1 text-left">Master Lock (Read-only)</div>
              </button>

              <div className="h-px bg-white/10 my-1 mx-2" />

              <button
                onClick={() => handleUpdateLayer({ lockPosition: !selectedLayer.lockPosition })}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedLayer.lockPosition ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-white/5 text-gray-300 hover:text-white'}`}
              >
                <Icons.Layout className="w-3.5 h-3.5 shrink-0" />
                <div className="flex-1 text-left">Lock Position / Scale</div>
              </button>

              <button
                onClick={() => handleUpdateLayer({ lockStyle: !selectedLayer.lockStyle })}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedLayer.lockStyle ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5 text-gray-300 hover:text-white'}`}
              >
                <Icons.Blend className="w-3.5 h-3.5 shrink-0" />
                <div className="flex-1 text-left">Lock Style (Colors/Fonts)</div>
              </button>

              {selectedLayer.type === 'text' && (
                <button
                  onClick={() => handleUpdateLayer({ lockText: !selectedLayer.lockText })}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedLayer.lockText ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/5 text-gray-300 hover:text-white'}`}
                >
                  <Icons.Text className="w-3.5 h-3.5 shrink-0" />
                  <div className="flex-1 text-left">Lock Text Content</div>
                </button>
              )}
            </div>
          </Dropdown>
        </div>
      </div>
    );
  }
);

CommonActions.displayName = 'CommonActions';
