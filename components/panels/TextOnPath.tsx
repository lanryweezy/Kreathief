import React, { useState, useCallback, useMemo } from 'react';
import { Icons } from '../../constants';

interface TextOnPathProps {
  text?: string;
  path?: string;
  curvature?: number;
  onApply: (options: { text: string; path: string; curvature: number }) => void;
}

export const TextOnPath: React.FC<TextOnPathProps> = ({
  text = 'Curved Text',
  path = 'arc',
  curvature = 50,
  onApply,
}) => {
  const [inputText, setInputText] = useState(text);
  const [pathType, setPathType] = useState<'arc' | 'circle' | 'wave' | 'spiral'>('arc');
  const [curvatureValue, setCurvatureValue] = useState(curvature);
  const [fontSize, setFontSize] = useState(32);
  const [startAngle, setStartAngle] = useState(0);

  const handleApply = useCallback(() => {
    onApply({
      text: inputText,
      path: pathType,
      curvature: curvatureValue,
    });
  }, [inputText, pathType, curvatureValue, onApply]);

  // Generate SVG path for preview
  const svgPath = useMemo(() => {
    const width = 300;
    const height = 150;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 80 + curvatureValue;

    switch (pathType) {
      case 'arc':
        return `M ${centerX - 100} ${centerY + 50} Q ${centerX} ${centerY - curvatureValue} ${centerX + 100} ${centerY + 50}`;
      case 'circle':
        return `M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 1 1 ${centerX} ${centerY + radius} A ${radius} ${radius} 0 1 1 ${centerX} ${centerY - radius}`;
      case 'wave':
        return `M 0 ${centerY} Q ${width / 4} ${centerY - curvatureValue} ${width / 2} ${centerY} T ${width} ${centerY}`;
      case 'spiral':
        let spiral = `M ${centerX} ${centerY}`;
        for (let i = 0; i < 720; i += 10) {
          const angle = (i * Math.PI) / 180;
          const r = (i / 720) * radius;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          spiral += ` L ${x} ${y}`;
        }
        return spiral;
      default:
        return '';
    }
  }, [pathType, curvatureValue]);

  // Generate curved text for preview
  const curvedTextPreview = useMemo(() => {
    if (pathType !== 'arc') return inputText;
    
    const chars = inputText.split('');
    const totalAngle = (curvatureValue / 100) * 120 * (chars.length / 10);
    const startAngleRad = ((-totalAngle / 2) + startAngle) * (Math.PI / 180);
    const anglePerChar = (totalAngle / chars.length) * (Math.PI / 180);
    const radius = 80;

    return chars.map((char, i) => {
      const angle = startAngleRad + (i * anglePerChar);
      const x = 150 + radius * Math.sin(angle);
      const y = 75 - radius * Math.cos(angle);
      const rotate = (angle * 180) / Math.PI;
      
      return (
        <text
          key={i}
          x={x}
          y={y}
          fontSize={fontSize / 3}
          fill="white"
          textAnchor="middle"
          transform={`rotate(${rotate}, ${x}, ${y})`}
          style={{ fontFamily: 'Inter', fontWeight: 'bold' }}
        >
          {char}
        </text>
      );
    });
  }, [inputText, pathType, curvatureValue, startAngle, fontSize]);

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Icons.Curve className="w-4 h-4 text-gray-400" />
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Text on Path</h3>
      </div>

      {/* Preview */}
      <div className="w-full h-40 bg-black/30 rounded-lg overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 300 150">
          {/* Path guide */}
          <path
            d={svgPath}
            fill="none"
            stroke="#7d2ae8"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.5"
          />
          {/* Curved text */}
          {pathType === 'arc' ? curvedTextPreview : (
            <text
              x="150"
              y="75"
              fontSize={fontSize / 3}
              fill="white"
              textAnchor="middle"
              style={{ fontFamily: 'Inter', fontWeight: 'bold' }}
            >
              {inputText}
            </text>
          )}
        </svg>
      </div>

      {/* Text Input */}
      <div>
        <label className="text-[10px] text-gray-500 block mb-2">Text</label>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full bg-[#252627] border border-gray-600 rounded px-3 py-2 text-sm text-white"
          placeholder="Enter your text"
        />
      </div>

      {/* Path Type */}
      <div>
        <label className="text-[10px] text-gray-500 block mb-2">Path Type</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'arc', label: 'Arc', icon: '⌒' },
            { id: 'circle', label: 'Circle', icon: '○' },
            { id: 'wave', label: 'Wave', icon: '〜' },
            { id: 'spiral', label: 'Spiral', icon: '🌀' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setPathType(type.id as any)}
              className={`py-2 rounded text-xs font-bold transition-all ${
                pathType === type.id
                  ? 'bg-[#7d2ae8] text-white'
                  : 'bg-[#252627] text-gray-400 hover:text-white'
              }`}
            >
              {type.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Curvature Control */}
      {(pathType === 'arc' || pathType === 'wave') && (
        <div>
          <label className="text-[10px] text-gray-500 block mb-2">
            Curvature: {curvatureValue}
          </label>
          <input
            type="range"
            min="-100"
            max="100"
            value={curvatureValue}
            onChange={(e) => setCurvatureValue(parseInt(e.target.value))}
            className="w-full accent-[#7d2ae8]"
          />
        </div>
      )}

      {/* Font Size */}
      <div>
        <label className="text-[10px] text-gray-500 block mb-2">Font Size: {fontSize}px</label>
        <input
          type="range"
          min="12"
          max="72"
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
          className="w-full accent-[#7d2ae8]"
        />
      </div>

      {/* Start Angle (for arc) */}
      {pathType === 'arc' && (
        <div>
          <label className="text-[10px] text-gray-500 block mb-2">
            Start Angle: {startAngle}°
          </label>
          <input
            type="range"
            min="-180"
            max="180"
            value={startAngle}
            onChange={(e) => setStartAngle(parseInt(e.target.value))}
            className="w-full accent-[#7d2ae8]"
          />
        </div>
      )}

      {/* Apply Button */}
      <button
        onClick={handleApply}
        className="w-full py-3 bg-[#7d2ae8] hover:bg-[#9d4edd] rounded-lg text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
      >
        <Icons.Plus className="w-4 h-4" />
        Add Curved Text to Canvas
      </button>

      {/* Usage Tips */}
      <div className="pt-3 border-t border-gray-700">
        <p className="text-[9px] text-gray-500">
          💡 <strong>Tip:</strong> Perfect for logos, badges, and circular designs. Adjust curvature to match your shape.
        </p>
      </div>
    </div>
  );
};
