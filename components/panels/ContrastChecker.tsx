import React, { useState, useMemo } from 'react';
import { Icons } from '../../constants';
import { getContrastRatio, checkWCAG, getAccessibleTextColor } from '../../utils/colorUtils';

interface ContrastCheckerProps {
  backgroundColor?: string;
  onBackgroundChange?: (color: string) => void;
}

export const ContrastChecker: React.FC<ContrastCheckerProps> = ({
  backgroundColor = '#ffffff',
  onBackgroundChange,
}) => {
  const [foregroundColor, setForegroundColor] = useState('#000000');

  // Ensure colors are valid hex for internal logic
  const safeBackground = backgroundColor.startsWith('#') ? backgroundColor : '#ffffff';
  const safeForeground = foregroundColor.startsWith('#') ? foregroundColor : '#000000';

  const contrastRatio = useMemo(() => getContrastRatio(safeBackground, safeForeground), [safeBackground, safeForeground]);
  
  const wcagResult = useMemo(() => checkWCAG(safeBackground, safeForeground), [safeBackground, safeForeground]);
  
  const suggestedColor = useMemo(() => getAccessibleTextColor(safeBackground), [safeBackground]);

  const getRatingColor = () => {
    if (wcagResult.AAA) {return 'text-green-400';}
    if (wcagResult.AA) {return 'text-yellow-400';}
    return 'text-red-400';
  };

  const getRatingIcon = () => {
    if (wcagResult.AAA) {return '✓✓✓';}
    if (wcagResult.AA) {return '✓✓';}
    if (wcagResult.largeAA) {return '✓';}
    return '✗';
  };

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Icons.Eye className="w-4 h-4 text-gray-400" />
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Contrast Checker
        </h3>
      </div>

      {/* Preview */}
      <div
        className="w-full h-32 rounded-lg flex items-center justify-center p-4"
        style={{ backgroundColor: safeBackground }}
      >
        <p
          className="text-center font-medium"
          style={{ color: foregroundColor }}
        >
          Sample Text
          <br />
          <span className="text-sm">Preview your colors here</span>
        </p>
      </div>

      {/* Color Pickers */}
      <div className="grid grid-cols-2 gap-3 min-w-0">
        <div className="min-w-0">
          <label className="text-[10px] text-gray-500 block mb-2">Background</label>
          <div className="flex items-center gap-1.5 min-w-0">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => onBackgroundChange?.(e.target.value)}
              className="w-10 h-10 rounded border border-gray-600 cursor-pointer flex-shrink-0"
            />
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => onBackgroundChange?.(e.target.value)}
              className="flex-1 min-w-0 w-full bg-[#252627] border border-gray-600 rounded px-1.5 py-1 text-[10px] text-white font-mono uppercase"
            />
          </div>
        </div>

        <div className="min-w-0">
          <label className="text-[10px] text-gray-500 block mb-2">Foreground</label>
          <div className="flex items-center gap-1.5 min-w-0">
            <input
              type="color"
              value={foregroundColor}
              onChange={(e) => setForegroundColor(e.target.value)}
              className="w-10 h-10 rounded border border-gray-600 cursor-pointer flex-shrink-0"
            />
            <input
              type="text"
              value={foregroundColor}
              onChange={(e) => setForegroundColor(e.target.value)}
              className="flex-1 min-w-0 w-full bg-[#252627] border border-gray-600 rounded px-1.5 py-1 text-[10px] text-white font-mono uppercase"
            />
          </div>
        </div>
      </div>


      {/* Contrast Ratio */}
      <div className="text-center py-3 bg-black/30 rounded-lg">
        <div className={`text-3xl font-bold ${getRatingColor()}`}>
          {contrastRatio.toFixed(2)}:1
        </div>
        <div className={`text-xs font-bold mt-1 ${getRatingColor()}`}>
          {getRatingIcon()} WCAG {wcagResult.level || 'Fail'}
        </div>
      </div>

      {/* WCAG Requirements */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-400">WCAG AA (Normal Text)</span>
          <span className={wcagResult.AA ? 'text-green-400' : 'text-red-400'}>
            {wcagResult.AA ? '✓ Pass (4.5:1)' : '✗ Fail (need 4.5:1)'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-400">WCAG AA (Large Text)</span>
          <span className={contrastRatio >= 3 ? 'text-green-400' : 'text-red-400'}>
            {contrastRatio >= 3 ? '✓ Pass (3:1)' : '✗ Fail (need 3:1)'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-400">WCAG AAA (Normal Text)</span>
          <span className={wcagResult.AAA ? 'text-green-400' : 'text-red-400'}>
            {wcagResult.AAA ? '✓ Pass (7:1)' : '✗ Fail (need 7:1)'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-400">WCAG AAA (Large Text)</span>
          <span className={contrastRatio >= 4.5 ? 'text-green-400' : 'text-red-400'}>
            {contrastRatio >= 4.5 ? '✓ Pass (4.5:1)' : '✗ Fail (need 4.5:1)'}
          </span>
        </div>
      </div>

      {/* Suggestion */}
      {!wcagResult.AA && (
        <div className="pt-2 border-t border-gray-700">
          <p className="text-[10px] text-gray-500 mb-2">💡 Suggested accessible color:</p>
          <button
            onClick={() => setForegroundColor(suggestedColor)}
            className="w-full py-2 px-3 bg-[#252627] hover:bg-gray-700 border border-gray-600 rounded-lg text-xs text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <div
              className="w-6 h-6 rounded border border-gray-500"
              style={{ backgroundColor: suggestedColor }}
            />
            Use {suggestedColor} (
            {getContrastRatio(backgroundColor, suggestedColor).toFixed(2)}:1 contrast)
          </button>
        </div>
      )}
    </div>
  );
};
