import React, { useState, useCallback } from 'react';
import { Icons } from '../../constants';

interface GradientStop {
  color: string;
  position: number;
}

interface GradientEditorProps {
  gradient?: {
    type: 'linear' | 'radial';
    angle: number;
    stops: GradientStop[];
  };
  onChange: (gradient: { type: 'linear' | 'radial'; angle: number; stops: GradientStop[] }) => void;
}

export const GradientEditor: React.FC<GradientEditorProps> = ({ gradient, onChange }) => {
  const [type, setType] = useState<'linear' | 'radial'>(gradient?.type || 'linear');
  const [angle, setAngle] = useState(gradient?.angle || 90);
  const [stops, setStops] = useState<GradientStop[]>(
    gradient?.stops || [
      { color: '#7d2ae8', position: 0 },
      { color: '#00c4cc', position: 100 },
    ]
  );
  const [selectedStop, setSelectedStop] = useState<number | null>(null);

  const handleAddStop = useCallback(() => {
    if (stops.length >= 10) {return;}
    const newStop: GradientStop = {
      color: '#ffffff',
      position: 50,
    };
    const newStops = [...stops, newStop].sort((a, b) => a.position - b.position);
    setStops(newStops);
    setSelectedStop(newStops.length - 1);
    onChange({ type, angle, stops: newStops });
  }, [stops, type, angle, onChange]);

  const handleRemoveStop = useCallback(
    (index: number) => {
      if (stops.length <= 2) {return;}
      const newStops = stops.filter((_, i) => i !== index);
      setStops(newStops);
      onChange({ type, angle, stops: newStops });
    },
    [stops, type, angle, onChange]
  );

  const handleStopColorChange = useCallback(
    (index: number, color: string) => {
      const newStops = [...stops];
      newStops[index].color = color;
      setStops(newStops);
      onChange({ type, angle, stops: newStops });
    },
    [stops, type, angle, onChange]
  );

  const handleStopPositionChange = useCallback(
    (index: number, position: number) => {
      const newStops = [...stops];
      newStops[index].position = position;
      newStops.sort((a, b) => a.position - b.position);
      setStops(newStops);
      onChange({ type, angle, stops: newStops });
    },
    [stops, type, angle, onChange]
  );

  const gradientPreview = {
    background:
      type === 'linear'
        ? `linear-gradient(${angle}deg, ${stops.map((s) => `${s.color} ${s.position}%`).join(', ')})`
        : `radial-gradient(circle, ${stops.map((s) => `${s.color} ${s.position}%`).join(', ')})`,
  };

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gradient Editor</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setType('linear');
              onChange({ type: 'linear', angle, stops });
            }}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
              type === 'linear'
                ? 'bg-[#7d2ae8] text-white'
                : 'bg-[#252627] text-gray-400 hover:text-white'
            }`}
          >
            Linear
          </button>
          <button
            onClick={() => {
              setType('radial');
              onChange({ type: 'radial', angle, stops });
            }}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
              type === 'radial'
                ? 'bg-[#7d2ae8] text-white'
                : 'bg-[#252627] text-gray-400 hover:text-white'
            }`}
          >
            Radial
          </button>
        </div>
      </div>

      {/* Preview */}
      <div
        className="w-full h-24 rounded-lg border border-gray-600"
        style={gradientPreview}
      />

      {/* Angle Control (Linear only) */}
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
              onChange({ type, angle: newAngle, stops });
            }}
            className="w-full accent-[#7d2ae8]"
          />
        </div>
      )}

      {/* Color Stops */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] text-gray-500">Color Stops ({stops.length}/10)</label>
          <button
            onClick={handleAddStop}
            disabled={stops.length >= 10}
            className="text-[10px] text-[#7d2ae8] hover:text-[#9d4edd] disabled:opacity-50 flex items-center gap-1"
          >
            <Icons.Plus className="w-3 h-3" /> Add Stop
          </button>
        </div>

        <div className="space-y-2">
          {stops.map((stop, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 p-2 rounded border transition-all ${
                selectedStop === index ? 'border-[#7d2ae8] bg-[#7d2ae8]/10' : 'border-gray-700'
              }`}
              onClick={() => setSelectedStop(index)}
            >
              <input
                type="color"
                value={stop.color}
                onChange={(e) => handleStopColorChange(index, e.target.value)}
                className="w-8 h-8 rounded border border-gray-600 cursor-pointer"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={stop.position}
                onChange={(e) => handleStopPositionChange(index, parseInt(e.target.value))}
                className="flex-1 accent-[#7d2ae8]"
              />
              <span className="text-[10px] text-gray-400 w-8">{stop.position}%</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveStop(index);
                }}
                disabled={stops.length <= 2}
                className="text-gray-500 hover:text-red-400 disabled:opacity-50"
              >
                <Icons.Trash className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CSS Output */}
      <div className="pt-2 border-t border-gray-700">
        <label className="text-[10px] text-gray-500 block mb-1">CSS Output</label>
        <code className="text-[9px] text-gray-400 bg-black/30 p-2 rounded block break-all">
          {type === 'linear'
            ? `background: linear-gradient(${angle}deg, ${stops
                .map((s) => `${s.color} ${s.position}%`)
                .join(', ')});`
            : `background: radial-gradient(circle, ${stops
                .map((s) => `${s.color} ${s.position}%`)
                .join(', ')});`}
        </code>
      </div>
    </div>
  );
};
