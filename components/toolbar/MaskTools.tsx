import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../../constants';
import { IconButton } from './ToolbarShared';
import { ColorPicker } from '../ColorPicker';
import { Layer } from '../../types';

interface MaskToolsProps {
    layer: Layer;
    onUpdateLayer: (changes: any) => void;
    documentColors?: string[];
    isPro?: boolean;
    onOpenPricing?: () => void;
}

export const MaskTools = React.memo(({ layer, onUpdateLayer, documentColors, isPro, onOpenPricing }: MaskToolsProps) => {
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                onUpdateLayer({
                    imageFill: {
                        src: event.target?.result as string,
                        fit: 'cover',
                        scale: 1,
                        offsetX: 0,
                        offsetY: 0,
                        opacity: 1
                    }
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const updateFill = (changes: any) => {
        onUpdateLayer({ imageFill: { ...(layer as any).imageFill, ...changes } });
    };

    const updateGradient = (changes: any) => {
        const currentGradient = (layer as any).imageFill?.gradientOverlay || (layer as any).backgroundGradient || { type: 'linear', angle: 0, colors: [{ color: '#ffffff', position: 0 }, { color: '#000000', position: 1 }] };
        const newGradient = { ...currentGradient, ...changes };
        if ((layer as any).imageFill) {
            updateFill({ gradientOverlay: newGradient });
        } else {
            onUpdateLayer({ backgroundGradient: newGradient });
        }
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
                <label className="cursor-pointer" title="Upload image mask">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <div className={`p-1.5 rounded-lg border border-dashed transition-all ${(layer as any).imageFill ? 'bg-[#7d2ae8] border-[#7d2ae8] text-white shadow-lg shadow-[#7d2ae8]/30' : 'bg-black/20 border-white/20 text-gray-400 hover:border-[#7d2ae8]/50 hover:text-white'}`}>
                        <Icons.Image className="w-4 h-4" />
                    </div>
                </label>

                {(layer as any).imageFill && (
                    <div className="relative" ref={settingsRef}>
                        <IconButton
                            onClick={() => setShowSettings(!showSettings)}
                            active={showSettings}
                            title="Mask Settings"
                        >
                            <Icons.Settings className="w-4 h-4" />
                        </IconButton>

                        {showSettings && (
                            <div className="absolute top-full left-0 mt-3 w-64 bg-[#1e1e1e] rounded-xl shadow-2xl border border-white/10 p-4 z-50 animate-fadeIn space-y-4 backdrop-blur-xl max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="space-y-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Fit & Scale</span>
                                    <div className="flex bg-black/40 rounded-lg p-1 gap-1">
                                        {['cover', 'contain', 'fill'].map((fit) => (
                                            <button
                                                key={fit}
                                                onClick={() => updateFill({ fit })}
                                                className={`flex-1 text-[9px] py-1 rounded capitalize font-bold transition-all ${(layer as any).imageFill.fit === fit ? 'bg-[#7d2ae8] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                {fit}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-[9px] text-gray-500 font-bold uppercase">Scale</span>
                                            <span className="text-[9px] text-white font-mono">{Math.round((layer as any).imageFill.scale * 100)}%</span>
                                        </div>
                                        <input type="range" min="0.1" max="3" step="0.1" value={(layer as any).imageFill.scale} onChange={(e) => updateFill({ scale: parseFloat(e.target.value) })} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-gray-500 font-bold uppercase block text-center">Offset X</span>
                                            <input type="number" value={(layer as any).imageFill.offsetX} onChange={(e) => updateFill({ offsetX: parseInt(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-lg text-[10px] text-white p-1.5 outline-none font-mono text-center" />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-gray-500 font-bold uppercase block text-center">Offset Y</span>
                                            <input type="number" value={(layer as any).imageFill.offsetY} onChange={(e) => updateFill({ offsetY: parseInt(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-lg text-[10px] text-white p-1.5 outline-none font-mono text-center" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-white/5 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gradient Overlay</span>
                                        <button
                                            onClick={() => {
                                                if ((layer as any).imageFill.gradientOverlay) {
                                                    updateFill({ gradientOverlay: undefined });
                                                } else {
                                                    updateGradient({}); // Initialize
                                                }
                                            }}
                                            className={`text-[9px] px-2 py-0.5 rounded font-black border uppercase transition-all ${(layer as any).imageFill.gradientOverlay ? 'border-red-500/50 text-red-500 bg-red-500/10' : 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10'}`}
                                        >
                                            {(layer as any).imageFill.gradientOverlay ? 'Remove' : 'Add'}
                                        </button>
                                    </div>

                                    {(layer as any).imageFill.gradientOverlay && (
                                        <div className="space-y-3 pl-1 border-l-2 border-[#7d2ae8]/20">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] text-gray-500 font-bold uppercase">Angle</span>
                                                <span className="text-[9px] text-white font-mono">{(layer as any).imageFill.gradientOverlay.angle}°</span>
                                            </div>
                                            <input type="range" min="0" max="360" value={(layer as any).imageFill.gradientOverlay.angle || 0} onChange={(e) => updateGradient({ angle: parseInt(e.target.value) })} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]" />

                                            <div className="grid grid-cols-2 gap-2">
                                                {(layer as any).imageFill.gradientOverlay.colors.map((c: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between bg-black/20 p-1 rounded">
                                                        <ColorPicker
                                                            value={c.color}
                                                            onChange={(color) => {
                                                                const newColors = [...(layer as any).imageFill.gradientOverlay.colors];
                                                                newColors[i] = { ...c, color };
                                                                updateGradient({ colors: newColors });
                                                            }}
                                                            small
                                                            documentColors={documentColors}
                                                        />
                                                        <span className="text-[8px] text-gray-600 font-mono">Pos {i + 1}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-white/5">
                                    <button
                                        onClick={() => onUpdateLayer({ imageFill: undefined })}
                                        className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all border border-red-500/20"
                                    >
                                        Clear Mask
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});
