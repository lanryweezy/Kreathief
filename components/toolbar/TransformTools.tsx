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
        <CompactInput
          label="W"
          value={pxToUnit(selectedLayer.width, unit)}
          onChange={(e: any) => handleUnitChange('width', e.target.value)}
          min={1}
          width="w-10 sm:w-14"
        />
        {selectedLayer.type !== 'text' && (
          <CompactInput
            label="H"
            value={pxToUnit((selectedLayer as any).height || 0, unit)}
            onChange={(e: any) => handleUnitChange('height', e.target.value)}
            min={1}
            width="w-10 sm:w-14"
          />
        )}
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
