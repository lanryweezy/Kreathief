
import React, { useState, useRef, useEffect } from 'react';
import { Icons, CANVAS_SIZE_PRESETS } from '../constants';
import { CanvasSize } from '../types';

interface CanvasSizePickerProps {
    currentSize: CanvasSize;
    onSizeChange: (size: CanvasSize) => void;
}

export const CanvasSizePicker: React.FC<CanvasSizePickerProps> = ({ currentSize, onSizeChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Social': return <Icons.Smartphone className="w-3.5 h-3.5" />;
            case 'Video': return <Icons.Play className="w-3.5 h-3.5" />;
            case 'Print': return <Icons.FileText className="w-3.5 h-3.5" />;
            default: return <Icons.Layout className="w-3.5 h-3.5" />;
        }
    };

    const categories = Array.from(new Set(CANVAS_SIZE_PRESETS.map(p => p.category)));

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#252627] border border-gray-700 rounded hover:border-[#7d2ae8] transition-all group"
            >
                <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Size:</span>
                <span className="text-xs text-white font-medium truncate max-w-[120px]">
                    {currentSize.name}
                </span>
                <Icons.ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-2xl z-[100] p-1 animate-fadeIn overflow-hidden">
                    <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {categories.map(cat => (
                            <div key={cat} className="mb-2">
                                <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 bg-[#252627]/50 rounded mb-1">
                                    {getCategoryIcon(cat)}
                                    {cat}
                                </div>
                                <div className="space-y-0.5">
                                    {CANVAS_SIZE_PRESETS.filter(p => p.category === cat).map(preset => (
                                        <button
                                            key={preset.id}
                                            onClick={() => {
                                                onSizeChange({ width: preset.width, height: preset.height, name: preset.name });
                                                setIsOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded flex items-center justify-between group transition-colors ${currentSize.width === preset.width && currentSize.height === preset.height
                                                    ? 'bg-indigo-500/10 text-indigo-400'
                                                    : 'text-gray-300 hover:bg-[#2d2f32] hover:text-white'
                                                }`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{preset.name}</span>
                                                <span className="text-[10px] text-gray-500">{preset.width} × {preset.height} px</span>
                                            </div>
                                            {currentSize.width === preset.width && currentSize.height === preset.height && (
                                                <Icons.Check className="w-4 h-4 text-[#7d2ae8]" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
