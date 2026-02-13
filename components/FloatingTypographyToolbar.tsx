import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TextLayer } from '../types';
import { Icons, FONT_FAMILIES } from '../constants';
import { ColorPicker } from './ColorPicker';
import { loadFont } from '../services/FontLoader';

interface FloatingTypographyToolbarProps {
    layer: TextLayer;
    onUpdateTextLayer: (id: string, changes: Partial<TextLayer>) => void;
    onMagicWrite: (id: string) => void;
    onInteractionStart: () => void;
    onFontHover: (font: string | null) => void;
    documentColors?: string[];
    position: { x: number; y: number };
}

export const FloatingTypographyToolbar: React.FC<FloatingTypographyToolbarProps> = ({
    layer,
    onUpdateTextLayer,
    onMagicWrite,
    onInteractionStart,
    onFontHover,
    documentColors = [],
    position
}) => {
    const [showFontPicker, setShowFontPicker] = useState(false);
    const [fontSearch, setFontSearch] = useState('');
    const fontPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fontPickerRef.current && !fontPickerRef.current.contains(event.target as Node)) {
                setShowFontPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredFonts = useMemo(() =>
        FONT_FAMILIES.filter(f => f.toLowerCase().includes(fontSearch.toLowerCase())),
        [fontSearch]);

    return (
        <div
            className="fixed z-[100] flex items-center gap-2 p-2 bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200"
            style={{
                left: `${position.x}px`,
                top: `${position.y - 60}px`,
                transform: 'translateX(-50%)'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Font Family */}
            <div className="relative" ref={fontPickerRef}>
                <button
                    onClick={() => setShowFontPicker(!showFontPicker)}
                    className="w-32 bg-[#252627] border border-gray-700 rounded px-2 py-1.5 text-xs text-white text-left flex justify-between items-center hover:border-gray-500 transition-colors"
                >
                    <span className="truncate mr-2 font-medium">{layer.fontFamily}</span>
                    <Icons.ChevronDown className="w-3 h-3 text-gray-500" />
                </button>
                {showFontPicker && (
                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto z-50 p-1 custom-scrollbar">
                        <div className="sticky top-0 bg-[#1e1e1e] p-1 mb-1 border-b border-gray-700 z-10">
                            <input
                                type="text"
                                placeholder="Search fonts..."
                                className="w-full bg-[#13161a] border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:border-[#7d2ae8] outline-none"
                                value={fontSearch}
                                onChange={(e) => setFontSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        {filteredFonts.map((font: string) => (
                            <button
                                key={font}
                                onMouseEnter={() => onFontHover(font)}
                                onMouseLeave={() => onFontHover(null)}
                                onClick={() => { loadFont(font); onUpdateTextLayer(layer.id, { fontFamily: font }); setShowFontPicker(false); onFontHover(null); }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-[#7d2ae8] hover:text-white rounded flex items-center justify-between group ${layer.fontFamily === font ? 'bg-indigo-900/30 text-[#7d2ae8]' : 'text-gray-300'}`}
                                style={{ fontFamily: `"${font}", sans-serif` }}
                            >
                                <span className="truncate">{font}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Font Size */}
            <div className="flex items-center gap-1 bg-[#252627] border border-gray-700 rounded px-1.5 py-1">
                <Icons.Text className="w-3 h-3 text-gray-500" />
                <input
                    type="number"
                    value={Math.round(layer.fontSize)}
                    onChange={(e) => onUpdateTextLayer(layer.id, { fontSize: parseInt(e.target.value) })}
                    className="w-10 bg-transparent text-[11px] text-white outline-none font-mono text-center no-spinner"
                />
            </div>

            {/* Color */}
            <ColorPicker
                value={layer.color}
                onChange={(color) => onUpdateTextLayer(layer.id, { color })}
                documentColors={documentColors}
            />

            <div className="w-px h-6 bg-gray-700/50 mx-1"></div>

            {/* Bold/Italic */}
            <div className="flex bg-[#252627] rounded border border-gray-700 p-0.5 gap-0.5">
                <button
                    onClick={() => onUpdateTextLayer(layer.id, { fontWeight: layer.fontWeight === 'bold' ? 'normal' : 'bold' })}
                    className={`p-1.5 rounded transition-colors ${layer.fontWeight === 'bold' ? 'bg-[#7d2ae8] text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                >
                    <Icons.Bold className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => onUpdateTextLayer(layer.id, { fontStyle: layer.fontStyle === 'italic' ? 'normal' : 'italic' })}
                    className={`p-1.5 rounded transition-colors ${layer.fontStyle === 'italic' ? 'bg-[#7d2ae8] text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                >
                    <Icons.Italic className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* AI Action */}
            <button
                onClick={() => onMagicWrite(layer.id)}
                className="px-2 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-[10px] font-bold rounded flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-500/20"
            >
                <Icons.Magic className="w-3 h-3" />
                Magic
            </button>
        </div>
    );
};
