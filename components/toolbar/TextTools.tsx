import React from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { IconButton, Divider, CompactInput } from './ToolbarShared';
import { ColorPicker } from '../ColorPicker';
import { FontPicker } from '../FontPicker';
import { GlyphPalette } from '../GlyphPalette';
import { MaskTools } from './MaskTools';
import { loadFont } from '../../services/FontLoader';
import { TextLayer } from '../../types';

interface TextToolsProps {
    layer: TextLayer;
    onUpdateTextLayer: (id: string, changes: any) => void;
    documentColors?: string[];
    onMagicWrite: (id: string) => void;
    showFontPicker: boolean;
    setShowFontPicker: (show: boolean) => void;
    fontSearch: string;
    setFontSearch: (search: string) => void;
    fontPickerRef: React.RefObject<HTMLDivElement>;
    showRewriteTones: boolean;
    setShowRewriteTones: (show: boolean) => void;
    rewriteRef: React.RefObject<HTMLDivElement>;
    handleToneRewrite: (id: string, instruction: string) => void;
    showTextEffects: boolean;
    setShowTextEffects: (show: boolean) => void;
    textEffectsRef: React.RefObject<HTMLDivElement>;
    showGlyphs: boolean;
    setShowGlyphs: (show: boolean) => void;
}

export const TextTools = React.memo(({
    layer, onUpdateTextLayer, documentColors, onMagicWrite,
    showFontPicker, setShowFontPicker, fontSearch, setFontSearch, fontPickerRef,
    showRewriteTones, setShowRewriteTones, rewriteRef,
    handleToneRewrite, showTextEffects, setShowTextEffects, textEffectsRef,
    showGlyphs, setShowGlyphs
}: TextToolsProps) => (
    <div className="flex items-center gap-3 flex-wrap">
        <div className="relative" ref={fontPickerRef}>
            <button
                onClick={() => setShowFontPicker(!showFontPicker)}
                className="w-40 bg-black/20 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white text-left flex justify-between items-center hover:border-[#7d2ae8]/50 hover:bg-black/30 transition-all group"
                title="Font Family"
            >
                <span className="truncate mr-2 font-medium">{layer.fontFamily}</span>
                <Icons.ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#7d2ae8] transition-colors" />
            </button>
            {showFontPicker && (
                <FontPicker
                    currentFont={layer.fontFamily}
                    onSelectFont={(font: string) => {
                        loadFont(font);
                        onUpdateTextLayer(layer.id, { fontFamily: font });
                        setShowFontPicker(false);
                    }}
                    onClose={() => setShowFontPicker(false)}
                    search={fontSearch}
                    setSearch={setFontSearch}
                />
            )}
        </div>

        <CompactInput value={layer.fontSize} onChange={(e: any) => onUpdateTextLayer(layer.id, { fontSize: parseInt(e.target.value) })} min={8} max={500} width="w-10" />
        <ColorPicker value={layer.color} onChange={(color) => onUpdateTextLayer(layer.id, { color, gradient: undefined })} documentColors={documentColors} />
        <Divider />


        <IconButton onClick={() => onUpdateTextLayer(layer.id, { fontWeight: layer.fontWeight === 'bold' ? 'normal' : 'bold' })} active={layer.fontWeight === 'bold'} title="Bold"><Icons.Bold className="w-3.5 h-3.5" /></IconButton>
        <IconButton onClick={() => onUpdateTextLayer(layer.id, { fontStyle: layer.fontStyle === 'italic' ? 'normal' : 'italic' })} active={layer.fontStyle === 'italic'} title="Italic"><Icons.Italic className="w-3.5 h-3.5" /></IconButton>

        <CompactInput label="AV" value={layer.letterSpacing || 0} onChange={(e: any) => onUpdateTextLayer(layer.id, { letterSpacing: parseFloat(e.target.value) })} step={1} width="w-8" title="Tracking" />
        <CompactInput label="Kr" value={layer.kerning || 0} onChange={(e: any) => onUpdateTextLayer(layer.id, { kerning: parseFloat(e.target.value) })} step={1} width="w-8" title="Kerning" />
        <IconButton
            onClick={() => onUpdateTextLayer(layer.id, { ligatures: !layer.ligatures })}
            active={layer.ligatures}
            title="Standard Ligatures"
        >
            <Icons.Scissors className="w-3.5 h-3.5" />
        </IconButton>

        <CompactInput label="LH" value={layer.lineHeight || 1.2} onChange={(e: any) => onUpdateTextLayer(layer.id, { lineHeight: parseFloat(e.target.value) })} step={0.1} width="w-8" title="Line Height" />
        <Divider />


        <IconButton onClick={() => onUpdateTextLayer(layer.id, { textAlign: 'left' })} active={layer.textAlign === 'left'} title="Align Left"><Icons.AlignLeft className="w-3.5 h-3.5" /></IconButton>
        <IconButton onClick={() => onUpdateTextLayer(layer.id, { textAlign: 'center' })} active={layer.textAlign === 'center'} title="Align Center"><Icons.AlignCenter className="w-3.5 h-3.5" /></IconButton>
        <IconButton onClick={() => onUpdateTextLayer(layer.id, { textAlign: 'right' })} active={layer.textAlign === 'right'} title="Align Right"><Icons.AlignRight className="w-3.5 h-3.5" /></IconButton>

        <div className="relative">
            <IconButton onClick={() => setShowGlyphs(!showGlyphs)} active={showGlyphs} title="Glyph Palette"><Icons.Grid className="w-3.5 h-3.5" /></IconButton>
            {showGlyphs && (
                <GlyphPalette
                    onSelect={(g) => onUpdateTextLayer(layer.id, { text: layer.text + g })}
                    onClose={() => setShowGlyphs(false)}
                    fontFamily={layer.fontFamily}
                />
            )}
        </div>
        <Divider />


        <div className="relative" ref={textEffectsRef}>
            <button
                onClick={() => setShowTextEffects(!showTextEffects)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${showTextEffects ? 'bg-[#7d2ae8] border-[#7d2ae8] text-white shadow-lg shadow-[#7d2ae8]/30' : 'bg-black/20 border-white/10 text-gray-300 hover:border-white/20 hover:bg-black/30'}`}
            >
                <Icons.Magic className="w-3.5 h-3.5" /> Effects
            </button>


            {showTextEffects && (
                <div className="absolute top-full right-0 mt-3 w-72 bg-[#1e1e1e] rounded-xl shadow-2xl border border-white/10 p-4 z-50 animate-fadeIn space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar backdrop-blur-xl">
                    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={!!layer.shadow}
                                    onChange={(e) => onUpdateTextLayer(layer.id, { shadow: e.target.checked ? { color: '#000000', blur: 4, offsetX: 2, offsetY: 2 } : undefined })}
                                    className="accent-[#7d2ae8] w-3 h-3"
                                />
                                Drop Shadow
                            </span>
                        </div>
                        {layer.shadow && (
                            <div className="space-y-3 pl-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-gray-500 font-bold uppercase">Color</span>
                                    <ColorPicker value={layer.shadow.color} onChange={(color) => onUpdateTextLayer(layer.id, { shadow: { ...layer.shadow!, color } })} small documentColors={documentColors} />
                                </div>
                                {[
                                    { label: 'Blur', key: 'blur', max: 50 },
                                    { label: 'X', key: 'offsetX', min: -50, max: 50 },
                                    { label: 'Y', key: 'offsetY', min: -50, max: 50 }
                                ].map(idx => (
                                    <div key={idx.key} className="space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-[9px] text-gray-500 font-bold uppercase">{idx.label}</span>
                                            <span className="text-[9px] text-white font-mono">{(layer.shadow as any)[idx.key]}</span>
                                        </div>
                                        <input
                                            type="range" min={idx.min ?? 0} max={idx.max}
                                            value={(layer.shadow as any)[idx.key]}
                                            onChange={(e) => onUpdateTextLayer(layer.id, { shadow: { ...layer.shadow!, [idx.key]: parseInt(e.target.value) } })}
                                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={!!layer.stroke}
                                    onChange={(e) => onUpdateTextLayer(layer.id, { stroke: e.target.checked ? { color: '#000000', width: 1 } : undefined })}
                                    className="accent-[#7d2ae8] w-3 h-3"
                                />
                                Stroke
                            </span>
                        </div>
                        {layer.stroke && (
                            <div className="space-y-3 pl-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-gray-500 font-bold uppercase">Color</span>
                                    <ColorPicker value={layer.stroke.color} onChange={(color) => onUpdateTextLayer(layer.id, { stroke: { ...layer.stroke!, color } })} small documentColors={documentColors} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-[9px] text-gray-500 font-bold uppercase">Width</span>
                                        <span className="text-[9px] text-white font-mono">{layer.stroke.width}</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="20"
                                        value={layer.stroke.width}
                                        onChange={(e) => onUpdateTextLayer(layer.id, { stroke: { ...layer.stroke!, width: parseInt(e.target.value) } })}
                                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Bend Text</span>
                        <div className="grid grid-cols-4 gap-1.5 mb-3">
                            {['none', 'arc', 'flag', 'rise'].map((style) => (
                                <button
                                    key={style}
                                    onClick={() => onUpdateTextLayer(layer.id, { warpStyle: style as any, curve: layer.curve || 50 })}
                                    className={`text-[9px] py-1.5 rounded-md border capitalize font-bold transition-all ${layer.warpStyle === style || (!layer.warpStyle && style === 'none') ? 'bg-[#7d2ae8] text-white border-[#7d2ae8]' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'}`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                        {layer.warpStyle && layer.warpStyle !== 'none' && (
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-[9px] text-gray-500 font-bold uppercase">Intensity</span>
                                    <span className="text-[9px] text-white font-mono">{layer.curve}%</span>
                                </div>
                                <input type="range" min="-100" max="100" value={layer.curve || 0} onChange={(e) => onUpdateTextLayer(layer.id, { curve: parseInt(e.target.value) })} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]" />
                            </div>
                        )}
                    </div>

                    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <IconButton
                                    onClick={() => onUpdateTextLayer(layer.id, { depth: layer.depth ? 0 : 5, depthColor: layer.depthColor || '#333333' })}
                                    active={!!(layer.depth && layer.depth > 0)}
                                    small
                                >
                                    <Icons.Layers className="w-3 h-3" />
                                </IconButton>
                                3D Depth
                            </span>
                        </div>
                        {layer.depth !== undefined && layer.depth > 0 && (
                            <div className="space-y-3 pl-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-gray-500 font-bold uppercase">Color</span>
                                    <ColorPicker value={layer.depthColor || '#333333'} onChange={(color) => onUpdateTextLayer(layer.id, { depthColor: color })} small documentColors={documentColors} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-[9px] text-gray-500 font-bold uppercase">Extrusion</span>
                                        <span className="text-[9px] text-white font-mono">{layer.depth}px</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="50"
                                        value={layer.depth}
                                        onChange={(e) => onUpdateTextLayer(layer.id, { depth: parseInt(e.target.value) })}
                                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        <MaskTools
            layer={layer}
            onUpdateLayer={(changes: any) => onUpdateTextLayer(layer.id, changes)}
            isPro={true}
            onOpenPricing={() => { }}
            documentColors={documentColors}
        />

        <div className="relative" ref={rewriteRef}>
            <div className="flex bg-gradient-to-r from-[#7d2ae8]/20 to-[#00c4cc]/20 border border-white/10 rounded-lg overflow-hidden group">
                <button onClick={() => onMagicWrite(layer.id)} className="px-3 py-1.5 hover:bg-[#7d2ae8]/20 text-[#7d2ae8] text-[10px] font-bold transition-all flex items-center gap-1.5">
                    <Icons.Magic className="w-3.5 h-3.5" /> AI Rewrite
                </button>
                <button onClick={() => setShowRewriteTones(!showRewriteTones)} className="px-1.5 py-1.5 border-l border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all">
                    <Icons.ChevronDown className="w-3.5 h-3.5" />
                </button>
            </div>
            {showRewriteTones && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl z-50 p-1.5 animate-fadeIn backdrop-blur-xl">
                    {[
                        { label: 'Magic', icon: Icons.Magic, instruction: 'Rewrite this to be more creative and catchy.' },
                        { label: 'Shorten', icon: Icons.Minus, instruction: 'Rewrite this to be shorter and more concise.' },
                        { label: 'Expand', icon: Icons.Plus, instruction: 'Rewrite this to be longer and more descriptive.' },
                        { label: 'Pro', icon: Icons.Check, instruction: 'Rewrite this to be more professional and corporate.' },
                        { label: 'Funny', icon: Icons.Bot, instruction: 'Rewrite this to be funny and witty.' },
                    ].map(tone => (
                        <button
                            key={tone.label}
                            onClick={() => handleToneRewrite(layer.id, tone.instruction)}
                            className="w-full text-left px-3 py-2 text-[10px] text-gray-400 hover:bg-[#7d2ae8] hover:text-white rounded-lg flex items-center gap-2.5 transition-all font-medium"
                        >
                            <tone.icon className="w-3.5 h-3.5" /> {tone.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    </div>
));
