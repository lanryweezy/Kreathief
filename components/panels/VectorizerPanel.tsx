
import React, { useState, useRef } from 'react';
import { Icons } from '../../constants';
import * as geminiService from '../../services/geminiService';
import * as photoService from '../../services/photoService';
import { Layer } from '../../types';

import { useStore } from '../../store/useStore';

interface VectorizerPanelProps { }

type Tab = 'image' | 'text';

export const VectorizerPanel: React.FC<VectorizerPanelProps> = ({ }) => {
    const onAddLayers = useStore(state => state.addLayers);
    const isProcessing = useStore(state => state.isProcessing);
    const setIsProcessing = useStore(state => state.setIsProcessing);
    const [activeTab, setActiveTab] = useState<Tab>('image');
    const [image, setImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [colors, setColors] = useState(4);
    const [useAlgorithm, setUseAlgorithm] = useState(false);
    const [trials, setTrials] = useState(2);
    const [result, setResult] = useState<Array<{ path: string, color: string }> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => setImage(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleVectorize = async () => {
        if (activeTab === 'image') {
            if (!image) return;
            setIsProcessing(true);
            try {
                let paths;
                if (useAlgorithm) {
                    paths = await photoService.traceImageToSVG(image, colors);
                } else {
                    if (trials <= 0) {
                        alert("No trials remaining for AI vectorization.");
                        return;
                    }
                    paths = await geminiService.vectorizeImage(image, colors);
                    setTrials(prev => prev - 1);
                }
                setResult(paths);
            } catch (error) {
                console.error(error);
                alert("Vectorization failed.");
            } finally {
                setIsProcessing(false);
            }
        } else {
            if (!prompt.trim() || trials <= 0) return;
            setIsProcessing(true);
            try {
                const paths = await geminiService.generateAIVector(prompt);
                setResult(paths);
                setTrials(prev => prev - 1);
            } catch (error) {
                console.error(error);
                alert("Generation failed.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const addToCanvas = () => {
        if (!result) return;

        const newLayers = result.map((item, i) => ({
            id: crypto.randomUUID(),
            type: 'path' as const,
            name: `AI Vector ${i + 1}`,
            x: 100 + (i * 10),
            y: 100 + (i * 10),
            width: 300,
            height: 300,
            rotation: 0,
            color: item.color,
            pathData: item.path,
            viewBox: "0 0 100 100",
            opacity: 1,
            visible: true,
            locked: false,
            cornerRadius: 0
        }));

        onAddLayers(newLayers);
    };

    return (
        <div className="flex flex-col h-full bg-[#13161a] p-4 overflow-y-auto custom-scrollbar">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Icons.Magic className="w-5 h-5 text-[#7d2ae8]" />
                    AI Vector Studio
                </h3>
                <div className="text-[10px] bg-[#7d2ae8]/20 text-[#7d2ae8] px-2 py-0.5 rounded-full font-bold">
                    PRO
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-900/50 p-1 rounded-xl mb-6 border border-white/5">
                <button
                    onClick={() => { setActiveTab('image'); setResult(null); }}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'image' ? 'bg-[#7d2ae8] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Image to Vector
                </button>
                <button
                    onClick={() => { setActiveTab('text'); setResult(null); }}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'text' ? 'bg-[#7d2ae8] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Text to Vector
                </button>
            </div>

            {activeTab === 'image' ? (
                <div className="space-y-6">
                    {!image ? (
                        <div
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square rounded-xl border-2 border-dashed border-gray-700 hover:border-[#7d2ae8] hover:bg-[#7d2ae8]/5 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group"
                        >
                            <Icons.Uploads className="w-8 h-8 text-gray-500 group-hover:text-[#7d2ae8] transition-colors" />
                            <div className="text-center">
                                <p className="text-[11px] font-bold text-white">Upload Image</p>
                                <p className="text-[10px] text-gray-500">Kittl AI will vectorize it</p>
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                        </div>
                    ) : (
                        <div className="aspect-square rounded-xl overflow-hidden border border-gray-700 relative group">
                            <img src={image} className="w-full h-full object-contain" alt="Preview" />
                            <button onClick={() => setImage(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Icons.Trash className="w-4 h-4" /></button>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Complexity ({colors} colors)</span>
                        </div>
                        <input type="range" min="2" max="12" value={colors} onChange={(e) => setColors(parseInt(e.target.value))} className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]" />
                    </div>

                    <div className="p-3 bg-gray-900/30 border border-white/5 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icons.Zap className={`w-3.5 h-3.5 ${useAlgorithm ? 'text-emerald-500' : 'text-amber-500'}`} />
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tight">
                                    {useAlgorithm ? 'Fast Algorithmic engine' : 'Magic AI engine'}
                                </span>
                                {useAlgorithm && (
                                    <span className="text-[8px] bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter animate-pulse">
                                        Free
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setUseAlgorithm(!useAlgorithm)}
                                className={`w-8 h-4 rounded-full relative transition-colors ${useAlgorithm ? 'bg-emerald-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useAlgorithm ? 'right-0.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                        <p className="text-[9px] text-gray-500 leading-relaxed italic">
                            {useAlgorithm
                                ? "Instant client-side tracing. No credits consumed. Best for simple logos."
                                : "Powerful Gemini-driven vectorization. Consumes 1 trial. Best for complex art."}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the vector graphic (e.g., 'A vintage minimalist mountain logo')"
                        className="w-full h-32 bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs text-white placeholder:text-gray-600 focus:border-[#7d2ae8] focus:ring-1 focus:ring-[#7d2ae8] outline-none transition-all resize-none"
                    />
                </div>
            )}

            <button
                onClick={handleVectorize}
                disabled={isProcessing || trials <= 0 || (activeTab === 'image' && !image) || (activeTab === 'text' && !prompt.trim())}
                className="w-full py-3 bg-[#7d2ae8] hover:bg-[#6b23c5] disabled:bg-gray-800 disabled:text-gray-600 rounded-xl text-white font-bold text-xs mt-6 transition-all flex items-center justify-center gap-2"
            >
                {isProcessing ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Icons.Zap className="w-4 h-4" />}
                {activeTab === 'image' ? 'Vectorize' : 'Generate Vector'}
            </button>

            <div className="mt-3 text-center">
                {useAlgorithm ? (
                    <span className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest flex items-center justify-center gap-2">
                        <Icons.Check className="w-3 h-3" /> No trials needed
                    </span>
                ) : (
                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{trials} AI attempts remaining</span>
                )}
            </div>

            {result && !isProcessing && (
                <div className="mt-8 pt-8 border-t border-gray-800 space-y-4 animate-slideUp">
                    <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <Icons.Check className="w-4 h-4 text-emerald-500" />
                        <span className="text-[11px] font-bold text-white">Generation Complete</span>
                    </div>
                    <button onClick={addToCanvas} className="w-full py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">
                        Add to Canvas
                    </button>
                </div>
            )}
        </div>
    );
};

export default VectorizerPanel;
