
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
    const [position, setPosition] = useState({ top: 0, left: 0 });

    // Calculate position relative to selection, ensuring it stays within viewport
    useEffect(() => {
        // This is a simplified positioning. Ideally we'd use useLayoutEffect and measure dom rects
        // But for now, we'll position it above the layer based on its coordinates
        // The parent container (Canvas) handles the actual screen-space conversion via `zoom` prop if needed
        // logic here assumes toolbar is rendered in the same coordinate space as layers? 
        // No, usually floating toolbars are in UI space overlapping the canvas.
        // Let's assume this component is placed absolutely within the Canvas viewport container

        // Actually, looking at FloatingTypographyToolbar usage, it might be positioned via style prop in parent.
        // Let's check how FloatingTypographyToolbar is used.
    }, [selectedLayer, zoom]);

    if (!selectedLayer) return null;

    // Determine available actions based on layer type
    const isText = selectedLayer.type === 'text';
    const isShape = ['rectangle', 'circle', 'triangle', 'star', 'hexagon', 'diamond', 'arrow', 'heart', 'speech_bubble', 'ribbon', 'shield', 'banner', 'pentagon', 'octagon', 'plus', 'star_4', 'star_8', 'path'].includes(selectedLayer.type);
    const isImage = selectedLayer.type === 'image';

    return (
        <div
            className="absolute flex items-center gap-1 p-1 bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-xl z-[100] animate-fadeIn"
            style={{
                left: selectedLayer.x + (selectedLayer.width / 2) - 150, // Center horizontally-ish
                top: selectedLayer.y - 60, // Above the layer
                transform: `scale(${1 / zoom})`, // Counter-scale against canvas zoom if it's inside the zoomed container
                transformOrigin: 'bottom center'
            }}
            onMouseDown={(e) => e.stopPropagation()} // Prevent canvas drag
        >
            {/* Common Actions */}
            <button
                onClick={() => onDuplicateLayer(selectedLayer.id)}
                className="p-2 hover:bg-[#2a2a2a] rounded text-gray-300 hover:text-white tooltip-trigger"
                title="Duplicate"
            >
                <Icons.Copy className="w-4 h-4" />
            </button>

            {/* Layer Ordering */}
            <div className="h-4 w-px bg-gray-700 mx-1" />

            <button
                onClick={() => onMoveLayer(selectedLayer.id, 'forward')}
                className="p-2 hover:bg-[#2a2a2a] rounded text-gray-300 hover:text-white"
                title="Bring Forward"
            >
                <Icons.ArrowUp className="w-4 h-4" />
            </button>
            <button
                onClick={() => onMoveLayer(selectedLayer.id, 'backward')}
                className="p-2 hover:bg-[#2a2a2a] rounded text-gray-300 hover:text-white"
                title="Send Backward"
            >
                <Icons.ArrowDown className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-gray-700 mx-1" />

            {/* Type Specific */}
            {(isText || isShape) && (
                <div className="relative">
                    <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="p-1 hover:bg-[#2a2a2a] rounded flex items-center gap-2"
                        title="Color"
                    >
                        <div
                            className="w-5 h-5 rounded border border-gray-600"
                            style={{ backgroundColor: (selectedLayer as ShapeLayer | TextLayer).color }}
                        />
                    </button>
                    {showColorPicker && (
                        <div className="absolute top-full left-0 mt-2 z-50">
                            <ColorPicker
                                value={(selectedLayer as ShapeLayer | TextLayer).color}
                                onChange={(color) => onUpdateLayer(selectedLayer.id, { color })}
                            />
                        </div>
                    )}
                </div>
            )}

            {isImage && (
                <button
                    className="p-2 hover:bg-[#2a2a2a] rounded text-gray-300 hover:text-white"
                    title="Filters (Coming Soon)"
                >
                    <Icons.Filter className="w-4 h-4" />
                </button>
            )}

            {/* Opacity Slider Popover Trigger - simplified for now */}
            <div className="flex items-center gap-2 px-2">
                <Icons.Transparency className="w-4 h-4 text-gray-400" />
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedLayer.opacity}
                    onChange={(e) => onUpdateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })}
                    className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                />
            </div>

            <div className="h-4 w-px bg-gray-700 mx-1" />

            <button
                onClick={() => onDeleteLayer(selectedLayer.id)}
                className="p-2 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                title="Delete"
            >
                <Icons.Trash className="w-4 h-4" />
            </button>
        </div>
    );
};
