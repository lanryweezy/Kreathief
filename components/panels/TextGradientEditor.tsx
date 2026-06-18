import React, { useState, useCallback } from 'react';
import { Icons } from '../../constants';

interface GradientStop {
  color: string;
  position: number;
}

interface TextGradientEditorProps {
  gradient?: {
    enabled: boolean;
    type: 'linear' | 'radial';
    angle: number;
    colors: GradientStop[];
  };
  onChange: (gradient: { enabled: boolean; type: 'linear' | 'radial'; angle: number; colors: GradientStop[] }) => void;
}

export const TextGradientEditor: React.FC<TextGradientEditorProps> = ({ gradient, onChange }) => {
  const [enabled, setEnabled] = useState(gradient?.enabled || false);
  const [type, setType] = useState<'linear' | 'radial'>(gradient?.type || 'linear');
  const [angle, setAngle] = useState(gradient?.angle || 90);
  const [colors, setColors] = useState<GradientStop[]>(
    gradient?.colors || [
      { color: '#7d2ae8', position: 0 },
      { color: '#00c4cc', position: 100 },
    ]
  );

  const handleAddStop = useCallback(() => {
    if (colors.length >= 10) {
      return;
    }
    const newStop: GradientStop = { color: '#ffffff', position: 50 };
    const newColors = [...colors, newStop].sort((a, b) => a.position - b.position);
    setColors(newColors);
    onChange({ enabled, type, angle, colors: newColors });
  }, [colors, enabled, type, angle, onChange]);

  const handleRemoveStop = useCallback(
    (index: number) => {
      if (colors.length <= 2) {
        return;
      }
      const newColors = colors.filter((_, i) => i !== index);
      setColors(newColors);
      onChange({ enabled, type, angle, colors: newColors });
    },
    [colors, enabled, type, angle, onChange]
  );

  const handleColorChange = useCallback(
    (index: number, color: string) => {
      const newColors = [...colors];
      newColors[index].color = color;
      setColors(newColors);
      onChange({ enabled, type, angle, colors: newColors });
    },
    [colors, enabled, type, angle, onChange]
  );

  const handlePositionChange = useCallback(
    (index: number, position: number) => {
      const newColors = [...colors];
      newColors[index].position = position;
      newColors.sort((a, b) => a.position - b.position);
      setColors(newColors);
      onChange({ enabled, type, angle, colors: newColors });
    },
    [colors, enabled, type, angle, onChange]
  );

  const previewStyle: React.CSSProperties = {
    background:
      type === 'linear'
        ? `linear-gradient(${angle}deg, ${colors.map((c) => `${c.color} ${c.position}%`).join(', ')})`
        : `radial-gradient(circle, ${colors.map((c) => `${c.color} ${c.position}%`).join(', ')})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Text Gradient</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              setEnabled(e.target.checked);
              onChange({ enabled: e.target.checked, type, angle, colors });
            }}
            className="accent-[#7d2ae8]"
          />
          <span className="text-[10px] text-gray-400">Enabled</span>
        </label>
      </div>

      {!enabled ? (
        <p className="text-[10px] text-gray-500 text-center py-4">Enable gradient to customize text colors</p>
      ) : (
        <>
          {/* Preview */}
          <div className="w-full h-16 flex items-center justify-center bg-black/20 rounded-lg">
            <span className="text-4xl font-black" style={previewStyle}>
              ABC
            </span>
          </div>

          {/* Type Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setType('linear');
                onChange({ enabled, type: 'linear', angle, colors });
              }}
              className={`flex-1 px-3 py-1.5 rounded text-[10px] font-bold transition-all ${
                type === 'linear' ? 'bg-[#7d2ae8] text-white' : 'bg-[#252627] text-gray-400 hover:text-white'
              }`}
            >
              Linear
            </button>
            <button
              onClick={() => {
                setType('radial');
                onChange({ enabled, type: 'radial', angle, colors });
              }}
              className={`flex-1 px-3 py-1.5 rounded text-[10px] font-bold transition-all ${
                type === 'radial' ? 'bg-[#7d2ae8] text-white' : 'bg-[#252627] text-gray-400 hover:text-white'
              }`}
            >
              Radial
            </button>
          </div>

          {/* Angle Control */}
          {type === 'linear' && (
            <div>
              <label className="text-[10px] text-gray-500 block mb-2">Angle: {angle}°</label>
              <input
                type="range"
                min="0"
                max="360"
                value={angle}
                onChange={(e) => {
                  const newAngle = parseInt(e.target.value);
                  setAngle(newAngle);
                  onChange({ enabled, type, angle: newAngle, colors });
                }}
                className="w-full accent-[#7d2ae8]"
              />
            </div>
          )}

          {/* Color Stops */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-gray-500">Colors ({colors.length}/10)</label>
              <button
                onClick={handleAddStop}
                disabled={colors.length >= 10}
                className="text-[10px] text-[#7d2ae8] hover:text-[#9d4edd] disabled:opacity-50 flex items-center gap-1"
              >
                <Icons.Plus className="w-3 h-3" /> Add
              </button>
            </div>

            <div className="space-y-2">
              {colors.map((stop, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded border border-gray-700">
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    className="w-6 h-6 rounded border border-gray-600 cursor-pointer"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={stop.position}
                    onChange={(e) => handlePositionChange(index, parseInt(e.target.value))}
                    className="flex-1 accent-[#7d2ae8]"
                  />
                  <span className="text-[10px] text-gray-400 w-8">{stop.position}%</span>
                  <button
                    onClick={() => handleRemoveStop(index)}
                    disabled={colors.length <= 2}
                    className="text-gray-500 hover:text-red-400 disabled:opacity-50"
                  >
                    <Icons.Trash className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
