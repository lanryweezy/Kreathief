import React from 'react';
import { Icons } from '../../constants';

interface PenToolOptions {
  isClosed: boolean;
  hasFill: boolean;
  hasStroke: boolean;
  strokeWidth: number;
  strokeColor: string;
  fillColor: string;
  snapToGrid: boolean;
  showPreview: boolean;
}

interface PenToolbarProps {
  options: PenToolOptions;
  onUpdateOptions: (options: Partial<PenToolOptions>) => void;
  onClose: () => void;
}

export const PenToolbar = React.memo(({ options, onUpdateOptions, onClose }: PenToolbarProps) => {
  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl flex items-center gap-1 p-2 animate-slide-down">
      {/* Path Type Toggle */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-700">
        <button
          onClick={() => onUpdateOptions({ isClosed: false })}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            !options.isClosed
              ? 'bg-[#7d2ae8] text-white shadow-lg shadow-purple-900/20'
              : 'bg-[#252627] text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Open Path"
          aria-label="Open Path"
        >
          <Icons.Path className="w-4 h-4" />
        </button>
        <button
          onClick={() => onUpdateOptions({ isClosed: true })}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            options.isClosed
              ? 'bg-[#7d2ae8] text-white shadow-lg shadow-purple-900/20'
              : 'bg-[#252627] text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Closed Path"
          aria-label="Closed Path"
        >
          <Icons.Circle className="w-4 h-4" />
        </button>
      </div>

      {/* Fill Toggle */}
      <div className="flex items-center gap-1 px-2 border-r border-gray-700">
        <button
          onClick={() => onUpdateOptions({ hasFill: !options.hasFill })}
          className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center ${
            options.hasFill ? 'border-[#7d2ae8] bg-[#7d2ae8]/20' : 'border-gray-600 bg-[#252627] hover:border-gray-500'
          }`}
          title="Toggle Fill"
          aria-label="Toggle Fill"
        >
          <div
            className="w-5 h-5 rounded"
            style={{
              backgroundColor: options.hasFill ? options.fillColor : 'transparent',
              border: '1px dashed currentColor',
            }}
          />
        </button>
        {options.hasFill && (
          <input
            type="color"
            value={options.fillColor}
            onChange={(e) => onUpdateOptions({ fillColor: e.target.value })}
            className="w-6 h-6 rounded border border-gray-600 cursor-pointer bg-transparent"
            title="Fill Color"
          />
        )}
      </div>

      {/* Stroke Toggle */}
      <div className="flex items-center gap-1 px-2 border-r border-gray-700">
        <button
          onClick={() => onUpdateOptions({ hasStroke: !options.hasStroke })}
          className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center ${
            options.hasStroke
              ? 'border-[#7d2ae8] bg-[#7d2ae8]/20'
              : 'border-gray-600 bg-[#252627] hover:border-gray-500'
          }`}
          title="Toggle Stroke"
          aria-label="Toggle Stroke"
        >
          <div
            className="w-5 h-5 rounded border-2"
            style={{
              borderColor: options.hasStroke ? options.strokeColor : 'currentColor',
              backgroundColor: 'transparent',
              borderWidth: options.hasStroke ? Math.max(2, options.strokeWidth / 2) : 2,
            }}
          />
        </button>
        {options.hasStroke && (
          <>
            <input
              type="color"
              value={options.strokeColor}
              onChange={(e) => onUpdateOptions({ strokeColor: e.target.value })}
              className="w-6 h-6 rounded border border-gray-600 cursor-pointer bg-transparent"
              title="Stroke Color"
            />
            <input
              type="range"
              min="1"
              max="20"
              value={options.strokeWidth}
              onChange={(e) => onUpdateOptions({ strokeWidth: parseInt(e.target.value) })}
              className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
              title="Stroke Width"
            />
          </>
        )}
      </div>

      {/* Snapping Toggle */}
      <div className="flex items-center gap-1 px-2">
        <button
          onClick={() => onUpdateOptions({ snapToGrid: !options.snapToGrid })}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            options.snapToGrid
              ? 'bg-[#7d2ae8] text-white shadow-lg shadow-purple-900/20'
              : 'bg-[#252627] text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Snap to Grid"
          aria-label="Snap to Grid"
        >
          <Icons.Snap className="w-4 h-4" />
          <span>Snap</span>
        </button>
      </div>

      {/* Preview Toggle */}
      <div className="flex items-center gap-1 pl-2 border-l border-gray-700">
        <button
          onClick={() => onUpdateOptions({ showPreview: !options.showPreview })}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            options.showPreview
              ? 'bg-[#00c4cc] text-white shadow-lg shadow-cyan-900/20'
              : 'bg-[#252627] text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Show Preview"
          aria-label="Show Preview"
        >
          <Icons.Eye className="w-4 h-4" />
          <span>Preview</span>
        </button>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="ml-2 p-2 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"
        title="Close Pen Tool"
        aria-label="Close Pen Tool"
      >
        <Icons.X className="w-4 h-4" />
      </button>
    </div>
  );
  PenToolbar.displayName = 'PenToolbar';
});
