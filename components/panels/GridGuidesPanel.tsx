import React, { useState, useCallback } from 'react';
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

  const [gridSize, setGridSize] = useState(20);
  const [gridColor, setGridColor] = useState('#7d2ae8');
  const [guides, setGuides] = useState<{ type: 'horizontal' | 'vertical'; position: number }[]>([]);

  const handleAddGuide = useCallback((type: 'horizontal' | 'vertical') => {
    const newGuide = {
      type,
      position: type === 'horizontal' ? 500 : 500,
    };
    setGuides([...guides, newGuide]);
    addToast(`${type === 'horizontal' ? 'Horizontal' : 'Vertical'} guide added`, 'success');
  }, [guides, addToast]);

  const handleClearGuides = useCallback(() => {
    setGuides([]);
    addToast('All guides cleared', 'info');
  }, [addToast]);

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-4 space-y-4">
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
            className="accent-[#7d2ae8]"
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
            className="accent-[#7d2ae8]"
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
            className="accent-[#7d2ae8]"
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
            className="accent-[#7d2ae8]"
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
            className="w-full accent-[#7d2ae8]"
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
            className="flex-1 py-1.5 bg-[#252627] hover:bg-gray-700 rounded text-[9px] text-gray-400 hover:text-white"
          >
            + Horizontal
          </button>
          <button
            onClick={() => handleAddGuide('vertical')}
            className="flex-1 py-1.5 bg-[#252627] hover:bg-gray-700 rounded text-[9px] text-gray-400 hover:text-white"
          >
            + Vertical
          </button>
        </div>

        {guides.length > 0 && (
          <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
            {guides.map((guide, index) => (
              <div
                key={index}
                className="text-[10px] text-gray-500 bg-[#252627] rounded px-2 py-1.5 flex items-center justify-between"
              >
                <span>
                  {guide.type === 'horizontal' ? '↔' : '↕'} {guide.position}px
                </span>
                <button
                  onClick={() => {
                    const newGuides = guides.filter((_, i) => i !== index);
                    setGuides(newGuides);
                  }}
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
