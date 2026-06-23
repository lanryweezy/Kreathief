import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { Button } from '../Button';
import { VectorPoint, PointType } from '../../types';
import { PanelErrorBoundary } from './PanelErrorBoundary';

export const VectorEditingPanel: React.FC = () => {
  const selectedLayer = useStore((state) => {
    const selectedIds = state.selectedLayerIds || [];
    if (selectedIds.length !== 1) return null;

    const artboard = state.artboards?.find((a: any) => a.id === state.activeArtboardId);
    return artboard?.layers.find((l: any) => l.id === selectedIds[0]);
  });

  const { updateLayer, handleBooleanOperation, handleJoinPaths, saveToHistory } = useStore();

  const [activePanel, setActivePanel] = useState<'path' | 'boolean' | 'effects' | 'transform'>('path');
  const [simplifyTolerance, setSimplifyTolerance] = useState(2.5);
  const [offsetDistance, setOffsetDistance] = useState(5);
  const [cornerRadius, setCornerRadius] = useState(10);

  const isVectorLayer =
    selectedLayer &&
    (selectedLayer.type === 'path' || (selectedLayer as any).vectorPath || (selectedLayer as any).pathData);

  if (!isVectorLayer) {
    return (
      <div className="p-6 text-center text-gray-400">
        <Icons.Edit className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Select a vector path to edit</p>
        <p className="text-xs mt-2">Use the Pen tool (P) to create vector paths</p>
      </div>
    );
  }

  const handleSimplify = () => {
    if (!selectedLayer) return;

    saveToHistory();
    // This would call the simplification service
    updateLayer(selectedLayer.id, {
      needsSimplification: true,
      simplifyTolerance,
    });
  };

  const handleOffset = () => {
    if (!selectedLayer) return;

    saveToHistory();
    updateLayer(selectedLayer.id, {
      needsOffset: true,
      offsetDistance,
    });
  };

  const handleRoundCorners = () => {
    if (!selectedLayer) return;

    saveToHistory();
    updateLayer(selectedLayer.id, {
      needsCornerRounding: true,
      cornerRadius,
    });
  };

  const handleConvertToPath = () => {
    if (!selectedLayer) return;

    saveToHistory();
    updateLayer(selectedLayer.id, {
      convertToPath: true,
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Icons.Edit className="w-4 h-4" />
          Vector Editing
        </h3>
        <p className="text-xs text-gray-400 mt-1">Advanced path manipulation</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700">
        {(['path', 'boolean', 'effects', 'transform'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActivePanel(tab)}
            className={`flex-1 px-3 py-2 text-xs font-medium capitalize transition-colors ${
              activePanel === tab
                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-50/5'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activePanel === 'path' && <PathOperationsPanel />}
        {activePanel === 'boolean' && <BooleanOperationsPanel />}
        {activePanel === 'effects' && (
          <PathEffectsPanel
            simplifyTolerance={simplifyTolerance}
            setSimplifyTolerance={setSimplifyTolerance}
            offsetDistance={offsetDistance}
            setOffsetDistance={setOffsetDistance}
            cornerRadius={cornerRadius}
            setCornerRadius={setCornerRadius}
            onSimplify={handleSimplify}
            onOffset={handleOffset}
            onRoundCorners={handleRoundCorners}
          />
        )}
        {activePanel === 'transform' && <PathTransformPanel />}
      </div>
    </div>
  );
};

// Path Operations Sub-Panel
const PathOperationsPanel: React.FC = () => {
  const { selectedLayerIds, deleteSelected, duplicateSelected, saveToHistory, updateLayer } = useStore();
  const selectedLayer = useStore((state) => {
    if (!selectedLayerIds || selectedLayerIds.length !== 1) return null;
    const artboard = state.artboards?.find((a: any) => a.id === state.activeArtboardId);
    return artboard?.layers.find((l: any) => l.id === selectedLayerIds[0]);
  });

  const [selectedPointType, setSelectedPointType] = useState<PointType>('smooth');

  const handleClosePath = () => {
    if (!selectedLayer) return;
    saveToHistory();
    updateLayer(selectedLayer.id, {
      vectorPath: {
        ...(selectedLayer as any).vectorPath,
        isClosed: !(selectedLayer as any).vectorPath?.isClosed,
      },
    });
  };

  const handleReversePath = () => {
    if (!selectedLayer) return;
    saveToHistory();
    const vectorPath = (selectedLayer as any).vectorPath;
    if (vectorPath) {
      updateLayer(selectedLayer.id, {
        vectorPath: {
          ...vectorPath,
          points: [...vectorPath.points].reverse(),
        },
      });
    }
  };

  const handleConvertPoints = (type: PointType) => {
    if (!selectedLayer) return;
    saveToHistory();
    const vectorPath = (selectedLayer as any).vectorPath;
    if (vectorPath) {
      const newPoints = vectorPath.points.map((pt: VectorPoint) => ({
        ...pt,
        type,
        // Clear handles for sharp points
        ...(type === 'sharp' && { handleIn: undefined, handleOut: undefined }),
      }));
      updateLayer(selectedLayer.id, {
        vectorPath: {
          ...vectorPath,
          points: newPoints,
        },
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Path Status */}
      <div className="bg-gray-800/50 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Points:</span>
          <span className="text-white font-medium">{(selectedLayer as any)?.vectorPath?.points?.length || 0}</span>
        </div>
        <div className="flex items-center justify-between text-xs mt-2">
          <span className="text-gray-400">Closed:</span>
          <span className="text-white font-medium">{(selectedLayer as any)?.vectorPath?.isClosed ? 'Yes' : 'No'}</span>
        </div>
      </div>

      {/* Path Operations */}
      <div>
        <label className="text-xs font-medium text-gray-300 mb-2 block">Path Operations</label>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleClosePath} size="sm" variant="secondary" className="text-xs">
            <Icons.GitCommit className="w-3 h-3 mr-1" />
            {(selectedLayer as any)?.vectorPath?.isClosed ? 'Open' : 'Close'}
          </Button>
          <Button onClick={handleReversePath} size="sm" variant="secondary" className="text-xs">
            <Icons.RefreshCw className="w-3 h-3 mr-1" />
            Reverse
          </Button>
          <Button onClick={duplicateSelected} size="sm" variant="secondary" className="text-xs">
            <Icons.Copy className="w-3 h-3 mr-1" />
            Duplicate
          </Button>
          <Button
            onClick={deleteSelected}
            size="sm"
            variant="secondary"
            className="text-xs text-red-400 hover:bg-red-900/20"
          >
            <Icons.Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Point Type Conversion */}
      <div>
        <label className="text-xs font-medium text-gray-300 mb-2 block">Convert Points To</label>
        <div className="space-y-2">
          {(['sharp', 'smooth', 'symmetric'] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleConvertPoints(type)}
              className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs text-left capitalize transition-colors flex items-center justify-between"
            >
              <span>{type}</span>
              {type === 'sharp' && <Icons.Triangle className="w-3 h-3" />}
              {type === 'smooth' && <Icons.Circle className="w-3 h-3" />}
              {type === 'symmetric' && <Icons.Square className="w-3 h-3" />}
            </button>
          ))}
        </div>
      </div>

      {/* Add Point Tool Info */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
        <p className="text-xs text-blue-300">
          <strong>Tip:</strong> Click on a path segment to add a new point, or drag an existing point to move it.
        </p>
      </div>
    </div>
  );
};

// Boolean Operations Sub-Panel
const BooleanOperationsPanel: React.FC = () => {
  const { handleBooleanOperation, selectedLayerIds } = useStore();
  const [hoveredOp, setHoveredOp] = useState<string | null>(null);

  const operations = [
    { id: 'unite', label: 'Union', icon: Icons.Plus, desc: 'Combine shapes into one' },
    { id: 'subtract', label: 'Subtract', icon: Icons.Minus, desc: 'Remove overlap from first shape' },
    { id: 'intersect', label: 'Intersect', icon: Icons.GitMerge, desc: 'Keep only overlapping area' },
    { id: 'exclude', label: 'Exclude', icon: Icons.Scissors, desc: 'Remove overlapping area' },
  ];

  const canPerformBoolean = selectedLayerIds && selectedLayerIds.length >= 2;

  return (
    <div className="space-y-4">
      {!canPerformBoolean && (
        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
          <p className="text-xs text-yellow-300">Select 2 or more vector paths to perform boolean operations</p>
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-gray-300 mb-2 block">Boolean Operations</label>
        <div className="space-y-2">
          {operations.map((op) => (
            <button
              key={op.id}
              onClick={() => canPerformBoolean && handleBooleanOperation(op.id as any)}
              onMouseEnter={() => setHoveredOp(op.id)}
              onMouseLeave={() => setHoveredOp(null)}
              disabled={!canPerformBoolean}
              className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-left transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-600/20 rounded flex items-center justify-center group-hover:bg-purple-600/30">
                  <op.icon className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-white">{op.label}</div>
                  <div className="text-xs text-gray-400">{op.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview Info */}
      <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-3">
        <p className="text-xs text-purple-300">
          <strong>Tip:</strong> Hover over shapes while holding Shift to preview boolean results before applying.
        </p>
      </div>
    </div>
  );
};

// Path Effects Sub-Panel
interface PathEffectsPanelProps {
  simplifyTolerance: number;
  setSimplifyTolerance: (val: number) => void;
  offsetDistance: number;
  setOffsetDistance: (val: number) => void;
  cornerRadius: number;
  setCornerRadius: (val: number) => void;
  onSimplify: () => void;
  onOffset: () => void;
  onRoundCorners: () => void;
}

const PathEffectsPanel: React.FC<PathEffectsPanelProps> = ({
  simplifyTolerance,
  setSimplifyTolerance,
  offsetDistance,
  setOffsetDistance,
  cornerRadius,
  setCornerRadius,
  onSimplify,
  onOffset,
  onRoundCorners,
}) => {
  return (
    <div className="space-y-4">
      {/* Simplify Path */}
      <div>
        <label className="text-xs font-medium text-gray-300 mb-2 block">Simplify Path</label>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Tolerance</span>
            <span className="text-xs text-white">{simplifyTolerance.toFixed(1)}px</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            value={simplifyTolerance}
            onChange={(e) => setSimplifyTolerance(parseFloat(e.target.value))}
            className="w-full"
          />
          <Button onClick={onSimplify} size="sm" className="w-full">
            <Icons.Zap className="w-3 h-3 mr-1" />
            Simplify
          </Button>
        </div>
      </div>

      {/* Offset Path */}
      <div>
        <label className="text-xs font-medium text-gray-300 mb-2 block">Offset Path</label>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Distance</span>
            <span className="text-xs text-white">{offsetDistance}px</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="1"
            value={offsetDistance}
            onChange={(e) => setOffsetDistance(parseInt(e.target.value))}
            className="w-full"
          />
          <Button onClick={onOffset} size="sm" className="w-full">
            <Icons.Move className="w-3 h-3 mr-1" />
            Apply Offset
          </Button>
        </div>
      </div>

      {/* Round Corners */}
      <div>
        <label className="text-xs font-medium text-gray-300 mb-2 block">Round Corners</label>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Radius</span>
            <span className="text-xs text-white">{cornerRadius}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={cornerRadius}
            onChange={(e) => setCornerRadius(parseInt(e.target.value))}
            className="w-full"
          />
          <Button onClick={onRoundCorners} size="sm" className="w-full">
            <Icons.Circle className="w-3 h-3 mr-1" />
            Round Corners
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-gray-800/50 rounded-lg p-3">
        <p className="text-xs text-gray-400">
          These operations modify the path structure. Use undo (Ctrl+Z) if needed.
        </p>
      </div>
    </div>
  );
};

// Path Transform Sub-Panel
const PathTransformPanel: React.FC = () => {
  const { selectedLayerIds, updateLayer, saveToHistory } = useStore();
  const selectedLayer = useStore((state) => {
    if (!selectedLayerIds || selectedLayerIds.length !== 1) return null;
    const artboard = state.artboards?.find((a: any) => a.id === state.activeArtboardId);
    return artboard?.layers.find((l: any) => l.id === selectedLayerIds[0]);
  });

  const [scaleX, setScaleX] = useState(100);
  const [scaleY, setScaleY] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleFlipHorizontal = () => {
    if (!selectedLayer) return;
    saveToHistory();
    updateLayer(selectedLayer.id, { flipX: !(selectedLayer as any).flipX });
  };

  const handleFlipVertical = () => {
    if (!selectedLayer) return;
    saveToHistory();
    updateLayer(selectedLayer.id, { flipY: !(selectedLayer as any).flipY });
  };

  const handleRotate90 = () => {
    if (!selectedLayer) return;
    saveToHistory();
    const currentRotation = selectedLayer.rotation || 0;
    updateLayer(selectedLayer.id, { rotation: currentRotation + 90 });
  };

  return (
    <div className="space-y-4">
      {/* Flip Operations */}
      <div>
        <label className="text-xs font-medium text-gray-300 mb-2 block">Flip</label>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleFlipHorizontal} size="sm" variant="secondary">
            <Icons.Maximize2 className="w-3 h-3 mr-1 rotate-90" />
            Horizontal
          </Button>
          <Button onClick={handleFlipVertical} size="sm" variant="secondary">
            <Icons.Maximize2 className="w-3 h-3 mr-1" />
            Vertical
          </Button>
        </div>
      </div>

      {/* Rotation */}
      <div>
        <label className="text-xs font-medium text-gray-300 mb-2 block">Rotate</label>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Angle</span>
            <span className="text-xs text-white">{rotation}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={rotation}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setRotation(val);
              if (selectedLayer) {
                updateLayer(selectedLayer.id, { rotation: val });
              }
            }}
            className="w-full"
          />
          <Button onClick={handleRotate90} size="sm" variant="secondary" className="w-full">
            <Icons.RotateCw className="w-3 h-3 mr-1" />
            Rotate 90°
          </Button>
        </div>
      </div>

      {/* Scale */}
      <div>
        <label className="text-xs font-medium text-gray-300 mb-2 block">Scale</label>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Width</span>
              <span className="text-xs text-white">{scaleX}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={scaleX}
              onChange={(e) => setScaleX(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Height</span>
              <span className="text-xs text-white">{scaleY}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={scaleY}
              onChange={(e) => setScaleY(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Outline Stroke */}
      <div>
        <label className="text-xs font-medium text-gray-300 mb-2 block">Outline Stroke</label>
        <Button size="sm" variant="secondary" className="w-full">
          <Icons.Maximize className="w-3 h-3 mr-1" />
          Convert Stroke to Path
        </Button>
        <p className="text-xs text-gray-400 mt-2">Converts the stroke into a filled path outline</p>
      </div>
    </div>
  );
};

export default function VectorEditingPanelWrapped() {
  return (
    <PanelErrorBoundary panelName="VectorEditing">
      <VectorEditingPanel />
    </PanelErrorBoundary>
  );
}
