import React, { useState, useCallback } from 'react';
import { Icons } from '../../constants';
import { TextLayer } from '../../types';
import { useStore } from '../../store/useStore';

interface TextSpacingControlsProps {
  selectedLayer?: TextLayer;
}

export const TextSpacingControls: React.FC<TextSpacingControlsProps> = ({ selectedLayer }) => {
  const updateLayer = useStore((state) => state.updateLayer);
  const addToast = useStore((state) => state.addToast);

  const [kerning, setKerning] = useState(selectedLayer?.kerning || 0);
  const [tracking, setTracking] = useState(selectedLayer?.letterSpacing || 0);
  const [leading, setLeading] = useState(selectedLayer?.lineHeight || 1.5);

  const handleKerningChange = useCallback(
    (value: number) => {
      setKerning(value);
      if (selectedLayer) {
        updateLayer(selectedLayer.id, { kerning: value });
      }
    },
    [selectedLayer, updateLayer]
  );

  const handleTrackingChange = useCallback(
    (value: number) => {
      setTracking(value);
      if (selectedLayer) {
        updateLayer(selectedLayer.id, { letterSpacing: value });
      }
    },
    [selectedLayer, updateLayer]
  );

  const handleLeadingChange = useCallback(
    (value: number) => {
      setLeading(value);
      if (selectedLayer) {
        updateLayer(selectedLayer.id, { lineHeight: value });
      }
    },
    [selectedLayer, updateLayer]
  );

  const handleReset = useCallback(() => {
    setKerning(0);
    setTracking(0);
    setLeading(1.5);
    if (selectedLayer) {
      updateLayer(selectedLayer.id, {
        kerning: 0,
        letterSpacing: 0,
        lineHeight: 1.5,
      });
      addToast('Spacing reset to defaults', 'success');
    }
  }, [selectedLayer, updateLayer, addToast]);

  if (!selectedLayer || selectedLayer.type !== 'text') {
    return (
      <div className="bg-surface-dark-3 rounded-xl border border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icons.Spacing className="w-4 h-4 text-gray-400" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Spacing</h3>
        </div>
        <p className="text-[10px] text-gray-500 text-center py-4">Select a text layer to adjust spacing</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-dark-3 rounded-xl border border-gray-700 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.Spacing className="w-4 h-4 text-gray-400" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Spacing</h3>
        </div>
        <button onClick={handleReset} className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1">
          <Icons.Refresh className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Kerning (Character Spacing) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] text-gray-500">Kerning</label>
          <span className="text-[10px] text-gray-400 font-mono">{kerning}</span>
        </div>
        <input
          type="range"
          min="-50"
          max="50"
          value={kerning}
          onChange={(e) => handleKerningChange(parseInt(e.target.value))}
          className="w-full accent-brand-600"
        />
        <div className="flex justify-between text-[9px] text-gray-600 mt-1">
          <span>Tighter</span>
          <span>Looser</span>
        </div>
        <p className="text-[9px] text-gray-600 mt-1">Adjusts spacing between specific character pairs</p>
      </div>

      {/* Tracking (Letter Spacing) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] text-gray-500">Tracking</label>
          <span className="text-[10px] text-gray-400 font-mono">{tracking}</span>
        </div>
        <input
          type="range"
          min="-200"
          max="200"
          value={tracking}
          onChange={(e) => handleTrackingChange(parseFloat(e.target.value))}
          className="w-full accent-brand-600"
        />
        <div className="flex justify-between text-[9px] text-gray-600 mt-1">
          <span>Condensed</span>
          <span>Expanded</span>
        </div>
        <p className="text-[9px] text-gray-600 mt-1">Adjusts spacing uniformly across all characters</p>
      </div>

      {/* Leading (Line Height) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] text-gray-500">Leading (Line Height)</label>
          <span className="text-[10px] text-gray-400 font-mono">{leading.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0.3"
          max="5.0"
          step="0.1"
          value={leading}
          onChange={(e) => handleLeadingChange(parseFloat(e.target.value))}
          className="w-full accent-brand-600"
        />
        <div className="flex justify-between text-[9px] text-gray-600 mt-1">
          <span>Tight</span>
          <span>Loose</span>
        </div>
        <p className="text-[9px] text-gray-600 mt-1">Adjusts vertical spacing between lines of text</p>
      </div>

      {/* Quick Presets */}
      <div className="pt-3 border-t border-gray-700">
        <label className="text-[10px] text-gray-500 block mb-2">Quick Presets</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              handleTrackingChange(-10);
              handleLeadingChange(1.2);
              addToast('Applied tight spacing', 'info');
            }}
            className="py-1.5 px-2 bg-surface-dark-4 hover:bg-gray-700 rounded text-[9px] text-gray-400 hover:text-white transition-colors"
          >
            Tight
          </button>
          <button
            onClick={() => {
              handleTrackingChange(0);
              handleLeadingChange(1.5);
              addToast('Applied normal spacing', 'info');
            }}
            className="py-1.5 px-2 bg-surface-dark-4 hover:bg-gray-700 rounded text-[9px] text-gray-400 hover:text-white transition-colors"
          >
            Normal
          </button>
          <button
            onClick={() => {
              handleTrackingChange(5);
              handleLeadingChange(1.8);
              addToast('Applied loose spacing', 'info');
            }}
            className="py-1.5 px-2 bg-surface-dark-4 hover:bg-gray-700 rounded text-[9px] text-gray-400 hover:text-white transition-colors"
          >
            Airy
          </button>
        </div>
      </div>

      {/* Visual Guide */}
      <div className="pt-3 border-t border-gray-700">
        <div className="bg-black/30 rounded p-3">
          <p
            className="text-sm"
            style={{
              letterSpacing: `${tracking}px`,
              lineHeight: leading,
              fontFamily: selectedLayer.fontFamily,
            }}
          >
            The quick brown fox jumps over the lazy dog.
          </p>
          <p className="text-[9px] text-gray-600 mt-2">Preview with current spacing settings</p>
        </div>
      </div>
    </div>
  );
};
