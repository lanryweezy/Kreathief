import React, { useState, useMemo } from 'react';
import { Icons } from '../../constants';
import {
  generateHarmonies,
  generateTints,
  generateShades,
  generateTones,
  getContrastRatio,
  checkWCAG,
  getAccessibleTextColor,
} from '../../utils/colorUtils';

interface ColorHarmonyGeneratorProps {
  baseColor: string;
  onColorSelect: (color: string) => void;
}

type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'split' | 'tetradic' | 'monochromatic';
type VariationType = 'tints' | 'shades' | 'tones';

export const ColorHarmonyGenerator: React.FC<ColorHarmonyGeneratorProps> = ({
  baseColor,
  onColorSelect,
}) => {
  const [activeHarmony, setActiveHarmony] = useState<HarmonyType>('complementary');
  const [showVariations, setShowVariations] = useState<VariationType | null>(null);

  const harmonies = useMemo(() => {
    return generateHarmonies(baseColor);
  }, [baseColor]);

  const variations = useMemo(() => {
    return {
      tints: generateTints(baseColor, 5),
      shades: generateShades(baseColor, 5),
      tones: generateTones(baseColor, 5),
    };
  }, [baseColor]);

  const contrastInfo = useMemo(() => {
    return checkWCAG(baseColor, '#ffffff');
  }, [baseColor]);

  const getHarmonyColors = (): string[] => {
    switch (activeHarmony) {
      case 'complementary':
        return [baseColor, (harmonies as any).complementary];
      case 'analogous':
        return [(harmonies as any).analogous[0], baseColor, (harmonies as any).analogous[1]];
      case 'triadic':
        return [baseColor, (harmonies as any).triadic[0], (harmonies as any).triadic[1]];
      case 'split':
        return [baseColor, (harmonies as any).splitComplementary[0], (harmonies as any).splitComplementary[1]];
      case 'tetradic':
        return [baseColor, (harmonies as any).tetradic[0], (harmonies as any).tetradic[1], (harmonies as any).tetradic[2]];
      case 'monochromatic':
        return [baseColor, ...(harmonies as any).monochromatic];
      default:
        return [baseColor];
    }
  };

  const harmonyColors = getHarmonyColors();

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-4 space-y-4">
      {/* Harmony Type Selector */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Color Harmony
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'complementary', label: 'Complementary', icon: '◐' },
            { id: 'analogous', label: 'Analogous', icon: '◅▻' },
            { id: 'triadic', label: 'Triadic', icon: '△' },
            { id: 'split', label: 'Split Comp.', icon: '◰' },
            { id: 'tetradic', label: 'Tetradic', icon: '□' },
            { id: 'monochromatic', label: 'Monochromatic', icon: '◫' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveHarmony(type.id as HarmonyType)}
              className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${
                activeHarmony === type.id
                  ? 'bg-[#7d2ae8] text-white shadow-lg shadow-purple-900/20'
                  : 'bg-[#252627] text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span className="text-sm">{type.icon}</span>
              <span className="truncate w-full text-center">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Harmony Colors Display */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {activeHarmony.charAt(0).toUpperCase() + activeHarmony.slice(1)} Palette
          </h3>
          <span className="text-[10px] text-gray-500">{harmonyColors.length} colors</span>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-gray-700 h-16">
          {harmonyColors.map((color, index) => {
            const textColor = getAccessibleTextColor(color);
            return (
              <button
                key={index}
                onClick={() => onColorSelect(color)}
                className="flex-1 relative group hover:flex-[1.5] transition-all duration-300"
                style={{ backgroundColor: color }}
                title={color}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: textColor }}
                >
                  <Icons.Plus className="w-5 h-5" />
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {harmonyColors.map((color, index) => (
            <button
              key={index}
              onClick={() => onColorSelect(color)}
              className="px-2 py-1 bg-[#0e1318] border border-gray-700 rounded text-[10px] font-mono text-gray-300 hover:border-[#7d2ae8] transition-colors"
            >
              {color.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Color Variations */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Variations
          </h3>
          <div className="flex gap-1">
            {(['tints', 'shades', 'tones'] as VariationType[]).map((type) => (
              <button
                key={type}
                onClick={() => setShowVariations(showVariations === type ? null : type)}
                className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                  showVariations === type
                    ? 'bg-[#00c4cc] text-white'
                    : 'bg-[#252627] text-gray-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {showVariations && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex rounded-lg overflow-hidden border border-gray-700 h-12">
              {variations[showVariations].map((color, index) => (
                <button
                  key={index}
                  onClick={() => onColorSelect(color)}
                  className="flex-1 hover:flex-[1.5] transition-all duration-300 group relative"
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Icons.Plus className="w-4 h-4 text-white drop-shadow-lg" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Accessibility Info */}
      <div className="bg-[#0e1318] rounded-lg p-3 border border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Icons.Shield className="w-3.5 h-3.5" />
            Accessibility
          </h3>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              contrastInfo.level === 'AAA'
                ? 'bg-green-500/20 text-green-400'
                : contrastInfo.level === 'AA'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            WCAG {contrastInfo.level === 'fail' ? 'Fail' : contrastInfo.level}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded border border-gray-600 flex items-center justify-center text-[10px] font-bold"
              style={{
                backgroundColor: baseColor,
                color: getAccessibleTextColor(baseColor),
              }}
            >
              Aa
            </div>
            <span className="text-[10px] text-gray-400">
              {contrastInfo.ratio}:1 on White
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded border border-gray-600 flex items-center justify-center text-[10px] font-bold"
              style={{
                backgroundColor: '#ffffff',
                color: baseColor,
              }}
            >
              Aa
            </div>
            <span className="text-[10px] text-gray-400">
              {getContrastRatio('#ffffff', baseColor).toFixed(2)}:1 White on Color
            </span>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="flex gap-2 pt-2 border-t border-gray-700">
        <button
          onClick={() => {
            const css = `--color-primary: ${baseColor};\n${harmonyColors.map((c, i) => `--color-${i + 1}: ${c};`).join('\n')}`;
            navigator.clipboard.writeText(css);
          }}
          className="flex-1 px-3 py-2 bg-[#252627] hover:bg-gray-700 rounded-lg text-[10px] font-bold text-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          <Icons.Copy className="w-3.5 h-3.5" />
          Copy CSS
        </button>
        <button
          onClick={() => {
            const json = JSON.stringify({
              base: baseColor,
              harmony: activeHarmony,
              colors: harmonyColors,
              variations,
            }, null, 2);
            navigator.clipboard.writeText(json);
          }}
          className="flex-1 px-3 py-2 bg-[#252627] hover:bg-gray-700 rounded-lg text-[10px] font-bold text-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          <Icons.Code className="w-3.5 h-3.5" />
          Copy JSON
        </button>
      </div>
    </div>
  );
};
