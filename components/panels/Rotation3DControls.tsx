import React, { useState, useCallback, useRef, useEffect } from 'react';
import { use3DRotation } from '../../hooks/use3DRotation';
import { Icons } from '../../constants';
import { Button } from '../Button';

interface Rotation3DControlsProps {
  layerId: string;
  layerType: string;
  onComplete?: () => void;
}

/**
 * 3D Rotation Controls — appears when an image layer is selected.
 * Provides rotateX/Y sliders and a "3D Rotate" button.
 */
export const Rotation3DControls: React.FC<Rotation3DControlsProps> = ({ layerId, layerType, onComplete }) => {
  const {
    start3DRotation,
    updateRotation,
    finishRotation,
    cancelRotation,
    currentResult,
    isFilling,
    fillProgress,
    is3DRotating,
  } = use3DRotation();

  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [showControls, setShowControls] = useState(false);

  const isImage = layerType === 'image';

  const handleStart = useCallback(() => {
    start3DRotation(layerId);
    setShowControls(true);
  }, [layerId, start3DRotation]);

  const handleRotateXChange = useCallback(
    (value: number) => {
      setRotateX(value);
      updateRotation(value, rotateY);
    },
    [rotateY, updateRotation]
  );

  const handleRotateYChange = useCallback(
    (value: number) => {
      setRotateY(value);
      updateRotation(rotateX, value);
    },
    [rotateX, updateRotation]
  );

  const handleFinish = useCallback(() => {
    finishRotation();
    setShowControls(false);
    setRotateX(0);
    setRotateY(0);
    onComplete?.();
  }, [finishRotation, onComplete]);

  const handleCancel = useCallback(() => {
    cancelRotation();
    setShowControls(false);
    setRotateX(0);
    setRotateY(0);
  }, [cancelRotation]);

  if (!isImage) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* 3D Rotate Button */}
      {!is3DRotating && !showControls && (
        <button
          onClick={handleStart}
          className="w-full flex items-center gap-2 p-2 bg-surface-dark-3 border border-gray-700 rounded-xl text-xs text-gray-300 hover:border-brand-600 hover:text-white transition-all"
        >
          <Icons.RotateCw className="w-4 h-4 text-brand-600" />
          <span className="font-bold">3D Rotate with AI Fill</span>
        </button>
      )}

      {/* 3D Rotation Controls */}
      {showControls && (
        <div className="p-3 bg-surface-dark-3 border border-brand-600/30 rounded-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">3D Rotation</h4>
            <span className="text-[9px] text-gray-500">Drag sliders to rotate in 3D</span>
          </div>

          {/* Rotate X (vertical tilt) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] text-gray-400">Tilt Forward/Back</label>
              <span className="text-[10px] font-mono text-brand-600">{rotateX}°</span>
            </div>
            <input
              type="range"
              min="-60"
              max="60"
              step="1"
              value={rotateX}
              onChange={(e) => handleRotateXChange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
              aria-label="Tilt Forward/Back"
            />
          </div>

          {/* Rotate Y (horizontal rotation) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] text-gray-400">Rotate Left/Right</label>
              <span className="text-[10px] font-mono text-brand-600">{rotateY}°</span>
            </div>
            <input
              type="range"
              min="-60"
              max="60"
              step="1"
              value={rotateY}
              onChange={(e) => handleRotateYChange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
              aria-label="Rotate Left/Right"
            />
          </div>

          {/* Empty pixels indicator */}
          {currentResult && (
            <div className="flex items-center gap-2 text-[9px]">
              <div
                className={`w-2 h-2 rounded-full ${currentResult.hasEmptyPixels ? 'bg-amber-500' : 'bg-green-500'}`}
              />
              <span className="text-gray-400">
                {currentResult.hasEmptyPixels
                  ? `${Math.round((currentResult.emptyPixelCount / (currentResult.transformedCanvas.width * currentResult.transformedCanvas.height)) * 100)}% empty — will be AI-filled`
                  : 'No empty regions — clean transform'}
              </span>
            </div>
          )}

          {/* Fill progress */}
          {isFilling && (
            <div className="space-y-1">
              <div className="flex justify-between text-[9px]">
                <span className="text-brand-400">AI filling empty regions...</span>
                <span className="text-brand-600">{fillProgress}%</span>
              </div>
              <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 to-accent transition-all duration-300"
                  style={{ width: `${fillProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isFilling} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleFinish}
              disabled={isFilling || (rotateX === 0 && rotateY === 0)}
              className="flex-1"
            >
              {isFilling ? 'Filling...' : 'Apply 3D Rotation'}
            </Button>
          </div>

          {/* Quick presets */}
          <div className="flex gap-1">
            {[
              { label: '30° Right', x: 0, y: 30 },
              { label: '30° Left', x: 0, y: -30 },
              { label: '20° Tilt', x: 20, y: 0 },
              { label: '45° iso', x: 20, y: 30 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setRotateX(preset.x);
                  setRotateY(preset.y);
                  updateRotation(preset.x, preset.y);
                }}
                className="flex-1 py-1 bg-surface-dark-4 border border-gray-700 rounded-lg text-[9px] text-gray-400 hover:border-brand-600 hover:text-white transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

Rotation3DControls.displayName = 'Rotation3DControls';
