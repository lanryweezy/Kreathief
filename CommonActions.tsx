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
    const appearanceButtonRef = useRef<HTMLButtonElement>(null);

    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            ref={appearanceButtonRef}
            onClick={() => setShowEffects(!showEffects)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${showEffects ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-black/20 border-white/10 text-gray-300 hover:border-white/20 hover:bg-black/30'}`}
          >
            <Icons.Blend className="w-3.5 h-3.5" /> Appearance
          </button>
          <Dropdown
            anchorRef={appearanceButtonRef}
            isOpen={showEffects}
            onClose={() => setShowEffects(false)}
            align="right"
          >
            <div className="w-64 bg-surface-dark-3 rounded-xl shadow-2xl border border-white/10 p-4 animate-fadeIn space-y-4 backdrop-blur-xl">
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Opacity</span>
                  <span className="text-[10px] text-white font-mono">{Math.round(selectedLayer.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={selectedLayer.opacity}
                  onChange={(e) => handleUpdateLayer({ opacity: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              <div className="pt-3 border-t border-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                  Blend Mode
                </span>
                <select
                  value={selectedLayer.blendMode || 'normal'}
                  onChange={(e) => handleUpdateLayer({ blendMode: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg text-xs text-white p-2 outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
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

        <IconButton
          onClick={() => handleUpdateLayer({ locked: !selectedLayer.locked })}
          active={selectedLayer.locked}
          title={selectedLayer.locked ? 'Unlock' : 'Lock'}
          className={selectedLayer.locked ? 'text-red-400' : ''}
        >
          {selectedLayer.locked ? <Icons.Lock className="w-3.5 h-3.5" /> : <Icons.Unlock className="w-3.5 h-3.5" />}
        </IconButton>
      </div>
    );
  }
);

CommonActions.displayName = 'CommonActions';
