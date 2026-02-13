
import React, { useState, useEffect } from 'react';
import { Layer, TextLayer, ShapeLayer, ImageLayer } from '../types';
import { Icons } from '../constants';
import { ColorPicker } from './ColorPicker';

interface FloatingToolbarProps {
    selectedLayer: Layer;
    onUpdateLayer: (id: string, changes: Partial<Layer>) => void;
    onDeleteLayer: (id: string) => void;
    onDuplicateLayer: (id: string) => void;
    onMoveLayer: (id: string, direction: 'front' | 'back' | 'forward' | 'backward') => void;
    zoom: number;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
    selectedLayer,
    onUpdateLayer,
    onDeleteLayer,
    onDuplicateLayer,
    onMoveLayer,
    zoom
}) => {
    const [showColorPicker, setShowColorPicker] = useState(false);

    if (!selectedLayer) return null;

    const isLocked = selectedLayer.locked;
    const isText = selectedLayer.type === 'text';
    const isShape = ['rectangle', 'circle', 'triangle', 'star', 'hexagon', 'diamond', 'arrow', 'heart', 'speech_bubble', 'ribbon', 'shield', 'banner', 'pentagon', 'octagon', 'plus', 'star_4', 'star_8', 'path'].includes(selectedLayer.type);
    const isImage = selectedLayer.type === 'image';

    return (
        <div
            className="absolute flex items-center gap-0.5 p-1 bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl z-[200] animate-in zoom-in-95 duration-200 select-none backdrop-blur-md"
            style={{
                left: selectedLayer.x + (selectedLayer.width / 2) - 140,
                top: selectedLayer.y - 60,
                transform: `scale(${Math.max(0.6, Math.min(1.2, 1 / zoom))})`,
                transformOrigin: 'bottom center'
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {/* Lock Action */}
            <button
                onClick={() => onUpdateLayer(selectedLayer.id, { locked: !isLocked })}
                className={`p-2 rounded-lg transition-all ${isLocked ? 'text-red-400 bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                title={isLocked ? "Unlock Layer" : "Lock Layer"}
            >
                {isLocked ? <Icons.Lock className="w-4 h-4" /> : <Icons.Unlock className="w-4 h-4 opacity-50" />}
            </button>

            <div className="w-px h-6 bg-gray-800 mx-1" />

            {!isLocked && (
                <>
                    {/* Duplicate */}
                    <button
                        onClick={() => onDuplicateLayer(selectedLayer.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                        title="Duplicate"
                    >
                        <Icons.Copy className="w-4 h-4" />
                    </button>

                    <div className="w-px h-6 bg-gray-800 mx-1" />

                    {/* Ordering */}
                    <button
                        onClick={() => onMoveLayer(selectedLayer.id, 'forward')}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                        title="Bring Forward"
                    >
                        <Icons.ArrowUp className="w-4 h-4 rotate-45" />
                    </button>
                    <button
                        onClick={() => onMoveLayer(selectedLayer.id, 'backward')}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                        title="Send Backward"
                    >
                        <Icons.ArrowDown className="w-4 h-4 rotate-45" />
                    </button>

                    <div className="w-px h-6 bg-gray-800 mx-1" />

                    {/* Color (if applicable) */}
                    {(isText || isShape) && (
                        <div className="relative flex items-center">
                            <button
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                className="p-1 rounded-lg hover:bg-gray-800 transition-all"
                                title="Change Color"
                            >
                                <div
                                    className="w-6 h-6 rounded-md border border-gray-700 shadow-inner"
                                    style={{ backgroundColor: (selectedLayer as ShapeLayer | TextLayer).color }}
                                />
                            </button>
                            {showColorPicker && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[300] bg-[#1e1e1e] p-2 rounded-xl border border-gray-700 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                                    <ColorPicker
                                        value={(selectedLayer as ShapeLayer | TextLayer).color}
                                        onChange={(color) => onUpdateLayer(selectedLayer.id, { color })}
                                    />
                                    <button
                                        onClick={() => setShowColorPicker(false)}
                                        className="mt-2 w-full py-1 text-[10px] font-bold uppercase text-gray-500 hover:text-white transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Opacity slider - subtle */}
                    <div className="flex items-center gap-2 px-3 group/opacity">
                        <Icons.Transparency className="w-3.5 h-3.5 text-gray-500 group-hover/opacity:text-[#7d2ae8] transition-colors" />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={selectedLayer.opacity}
                            onChange={(e) => onUpdateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })}
                            className="w-12 h-1 bg-gray-800 rounded-full appearance-none cursor-pointer accent-[#7d2ae8] hover:w-20 transition-all duration-300"
                        />
                    </div>
                </>
            )}

            <div className="w-px h-6 bg-gray-800 mx-1" />

            {/* Delete */}
            <button
                onClick={() => onDeleteLayer(selectedLayer.id)}
                className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Delete Layer"
            >
                <Icons.Trash className="w-4 h-4" />
            </button>
        </div>
    );
};
