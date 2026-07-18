import React, { useCallback } from 'react';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';

export const GridGuidesPanel: React.FC = () => {
  const showGrid = useStore((state) => state.showGrid) || false;
  const setShowGrid = useStore((state) => state.setShowGrid);
  const showRulers = useStore((state) => state.showRulers) || false;
  const setShowRulers = useStore((state) => state.setShowRulers);
  const snapToGrid = useStore((state) => state.snapToGrid) || false;
  const setSnapToGrid = useStore((state) => state.setSnapToGrid);
  const snapToObjects = useStore((state) => state.snapToObjects) || false;
  const setSnapToObjects = useStore((state) => state.setSnapToObjects);
  const addToast = useStore((state) => state.addToast);

  const gridSize = useStore((state) => state.gridSize) || 20;
  const setGridSize = useStore((state) => state.setGridSize);
  const gridColor = useStore((state) => state.gridColor) || '#7c3aed';
  const setGridColor = useStore((state) => state.setGridColor);
  const guides = useStore((state) => state.guides) || [];
  const addGuide = useStore((state) => state.addGuide);
  const removeGuide = useStore((state) => state.removeGuide);
  const clearGuides = useStore((state) => state.clearGuides);

  const handleAddGuide = useCallback(
    (type: 'horizontal' | 'vertical') => {
      addGuide(type, 500);
      addToast(`${type === 'horizontal' ? 'Horizontal' : 'Vertical'} guide added`, 'success');
    },
    [addGuide, addToast]
  );

  const handleClearGuides = useCallback(() => {
    clearGuides();
    addToast('All guides cleared', 'info');
  }, [clearGuides, addToast]);

  return (
    <div className="bg-surface-dark-3 rounded-xl border border-gray-700 p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Icons.Grid className="w-4 h-4 text-gray-400" />
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Grid & Guides</h3>
      </div>

      {/* Grid Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-gray-400">Show Grid</label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
            className="accent-brand-600"
          />
          <span className="text-[10px] text-gray-500">{showGrid ? 'On' : 'Off'}</span>
        </label>
      </div>

      {/* Rulers Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-gray-400">Show Rulers</label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showRulers}
            onChange={(e) => setShowRulers(e.target.checked)}
            className="accent-brand-600"
          />
          <span className="text-[10px] text-gray-500">{showRulers ? 'On' : 'Off'}</span>
        </label>
      </div>

      {/* Snap to Grid */}
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-gray-400">Snap to Grid</label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={(e) => setSnapToGrid(e.target.checked)}
            className="accent-brand-600"
          />
          <span className="text-[10px] text-gray-500">{snapToGrid ? 'On' : 'Off'}</span>
        </label>
      </div>

      {/* Snap to Objects */}
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-gray-400">Snap to Objects</label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={snapToObjects}
            onChange={(e) => setSnapToObjects(e.target.checked)}
            className="accent-brand-600"
          />
          <span className="text-[10px] text-gray-500">{snapToObjects ? 'On' : 'Off'}</span>
        </label>
      </div>

      {/* Grid Size */}
      {showGrid && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] text-gray-500">Grid Size</label>
            <span className="text-[10px] text-gray-400">{gridSize}px</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            value={gridSize}
            onChange={(e) => setGridSize(parseInt(e.target.value))}
            className="w-full accent-brand-600"
          />
        </div>
      )}

      {/* Grid Color */}
      {showGrid && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={gridColor}
            onChange={(e) => setGridColor(e.target.value)}
            className="w-8 h-8 rounded border border-gray-600"
          />
          <span className="text-[10px] text-gray-400">Grid Color</span>
        </div>
      )}

      {/* Guides */}
      <div className="border-t border-gray-700 pt-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] text-gray-400 font-bold">Guides</label>
          <button
            onClick={handleClearGuides}
            disabled={guides.length === 0}
            className="text-[10px] text-red-400 hover:text-red-300 disabled:opacity-50"
          >
            Clear All
          </button>
        </div>

        <div className="flex gap-2 mb-2">
          <button
            onClick={() => handleAddGuide('horizontal')}
            className="flex-1 py-1.5 bg-surface-dark-4 hover:bg-gray-700 rounded text-[9px] text-gray-400 hover:text-white"
          >
            + Horizontal
          </button>
          <button
            onClick={() => handleAddGuide('vertical')}
            className="flex-1 py-1.5 bg-surface-dark-4 hover:bg-gray-700 rounded text-[9px] text-gray-400 hover:text-white"
          >
            + Vertical
          </button>
        </div>

        {guides.length > 0 && (
          <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
            {guides.map((guide, index) => (
              <div
                key={index}
                className="text-[10px] text-gray-500 bg-surface-dark-4 rounded px-2 py-1.5 flex items-center justify-between"
              >
                <span>
                  {guide.type === 'horizontal' ? '↔' : '↕'} {guide.position}px
                </span>
                <button
                  onClick={() => removeGuide(index)}
                  className="text-gray-600 hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid Preview */}
      {showGrid && (
        <div
          className="w-full h-24 rounded-lg border border-gray-700"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${gridColor}33 1px, transparent 1px),
              linear-gradient(to bottom, ${gridColor}33 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        />
      )}
    </div>
  );
};
