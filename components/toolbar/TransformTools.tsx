import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { IconButton, CompactInput } from './ToolbarShared';
import { Layer } from '../../types';
import { pxToUnit, unitToPx } from '../../utils/unitUtils';

interface TransformToolsProps {
  selectedLayer: Layer;
}

export const TransformTools = React.memo(({ selectedLayer }: TransformToolsProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const onUpdateLayers = useStore((state) => state.updateLayers);
  const unit = useStore((state) => state.unit);

  const handleUpdateLayer = (changes: any) => {
    if (selectedLayer && onUpdateLayers) {
      onUpdateLayers({ [selectedLayer.id]: changes });
    }
  };

  const handleUnitChange = (key: string, value: string) => {
    const floatVal = parseFloat(value);
    if (!isNaN(floatVal)) {
      const pxVal = unitToPx(floatVal, unit);
      handleUpdateLayer({ [key]: pxVal });
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <CompactInput
          label="X"
          value={pxToUnit(selectedLayer.x, unit)}
          onChange={(e: any) => handleUnitChange('x', e.target.value)}
          width="w-10 sm:w-14"
        />
        <CompactInput
          label="Y"
          value={pxToUnit(selectedLayer.y, unit)}
          onChange={(e: any) => handleUnitChange('y', e.target.value)}
          width="w-10 sm:w-14"
        />
        <div className="relative flex items-center gap-2">
          <CompactInput
            label="W"
            value={pxToUnit(selectedLayer.width, unit)}
            onChange={(e: any) => handleUnitChange('width', e.target.value)}
            min={1}
            width="w-10 sm:w-14"
          />
          
          <div className="flex flex-col items-center -mx-1 z-10">
            <div className={`w-0.5 h-2 transition-colors ${selectedLayer.lockProportions ? 'bg-[#7d2ae8]' : 'bg-transparent'}`} />
            <button
              onClick={() => handleUpdateLayer({ lockProportions: !selectedLayer.lockProportions })}
              className={`p-0.5 rounded-full transition-all border ${selectedLayer.lockProportions ? 'bg-[#7d2ae8] border-[#7d2ae8] text-white' : 'bg-[#252627] border-gray-700 text-gray-500 hover:text-gray-300'}`}
              title="Lock Aspect Ratio"
            >
              {selectedLayer.lockProportions ? <Icons.Lock className="w-2.5 h-2.5" /> : <Icons.Unlock className="w-2.5 h-2.5" />}
            </button>
            <div className={`w-0.5 h-2 transition-colors ${selectedLayer.lockProportions ? 'bg-[#7d2ae8]' : 'bg-transparent'}`} />
          </div>

          {selectedLayer.type !== 'text' && (
            <CompactInput
              label="H"
              value={pxToUnit((selectedLayer as any).height || 0, unit)}
              onChange={(e: any) => handleUnitChange('height', e.target.value)}
              min={1}
              width="w-10 sm:w-14"
            />
          )}

          {/* Visual connected borders for #12 */}
          {selectedLayer.lockProportions && selectedLayer.type !== 'text' && (
            <div className="absolute -right-1 top-0 bottom-0 w-2 pointer-events-none animate-fadeIn">
                <div className="absolute top-[20%] bottom-[20%] right-full w-4 border-y border-r border-[#7d2ae8]/50 rounded-r-md" />
            </div>
          )}
        </div>
      </div>

      <IconButton onClick={() => setShowAdvanced(!showAdvanced)} active={showAdvanced} title="Advanced Transform">
        <Icons.Settings className={`w-4 h-4 ${showAdvanced ? 'animate-spin-slow' : ''}`} />
      </IconButton>
      <IconButton
        onClick={() => handleUpdateLayer({ rotation: (selectedLayer.rotation + 90) % 360 })}
        title="Rotate 90°"
      >
        <Icons.RotateCw className="w-4 h-4" />
      </IconButton>

      {showAdvanced && (
        <div className="flex items-center gap-3 animate-fadeIn border-l border-white/10 ml-2 pl-3">
          <CompactInput
            label="R"
            value={selectedLayer.rotation}
            onChange={(e: any) => handleUpdateLayer({ rotation: parseInt(e.target.value) })}
            min={0}
            max={360}
            width="w-9"
          />
          <CompactInput
            label="RX"
            value={(selectedLayer as any).rotateX || 0}
            onChange={(e: any) => handleUpdateLayer({ rotateX: parseInt(e.target.value) })}
            min={-180}
            max={180}
            width="w-8"
          />
          <CompactInput
            label="RY"
            value={(selectedLayer as any).rotateY || 0}
            onChange={(e: any) => handleUpdateLayer({ rotateY: parseInt(e.target.value) })}
            min={-180}
            max={180}
            width="w-8"
          />
          <CompactInput
            label="P"
            value={(selectedLayer as any).perspective || 0}
            onChange={(e: any) => handleUpdateLayer({ perspective: parseInt(e.target.value) })}
            min={0}
            max={2000}
            width="w-10"
          />
        </div>
      )}
    </div>
  );
});

TransformTools.displayName = 'TransformTools';
