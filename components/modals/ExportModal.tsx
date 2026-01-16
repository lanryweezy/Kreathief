import React, { useState } from 'react';
import { Icons } from '../../constants';
import { Button } from '../Button';

interface ExportModalProps {
    onClose: () => void;
    onExport: (format: 'png' | 'jpeg' | 'webp' | 'pdf', quality: number, size?: { width: number, height: number }) => Promise<void>;
    currentSize: { width: number, height: number, name: string };
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose, onExport, currentSize }) => {
    const [format, setFormat] = useState<'png' | 'jpeg' | 'webp' | 'pdf'>('png');
    const [quality, setQuality] = useState(0.95);
    const [activePreset, setActivePreset] = useState<string>('current');
    const [isExporting, setIsExporting] = useState(false);

    const presets = [
        { id: 'current', name: `Current (${currentSize.width}x${currentSize.height})`, width: currentSize.width, height: currentSize.height },
        { id: 'ig_post', name: 'Instagram Post', width: 1080, height: 1080 },
        { id: 'ig_story', name: 'Instagram Story', width: 1080, height: 1920 },
        { id: 'fb_cover', name: 'Facebook Cover', width: 820, height: 312 },
        { id: 'twitter_header', name: 'Twitter Header', width: 1500, height: 500 },
        { id: 'hd_video', name: 'HD Video (1080p)', width: 1920, height: 1080 },
        { id: '4k_wallpaper', name: '4K Ultra HD', width: 3840, height: 2160 },
    ];

    const handleExportClick = async () => {
        setIsExporting(true);
        try {
            const preset = presets.find(p => p.id === activePreset);
            await onExport(format, quality, preset ? { width: preset.width, height: preset.height } : undefined);
            onClose();
        } catch (e) {
            console.error(e);
            alert("Export failed. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[#1e1e1e] border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col md:flex-row relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-2">
                    <div className="text-2xl leading-none">&times;</div>
                </button>

                {/* Info/Preview Side */}
                <div className="md:w-1/3 bg-[#13161a] p-8 border-r border-gray-700 hidden md:flex flex-col">
                    <div className="w-12 h-12 bg-[#7d2ae8] rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-900/20">
                        <Icons.Download className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Export Design</h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-8">
                        Download your creation in professional formats. Choose a preset or stick with your current canvas size.
                    </p>

                    <div className="mt-auto p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl">
                        <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Pro Tip</h4>
                        <p className="text-[10px] text-gray-400">
                            For the best quality on Instagram, use PNG format and the Instagram Post preset.
                        </p>
                    </div>
                </div>

                {/* Controls Side */}
                <div className="flex-1 p-8">
                    <div className="space-y-6">
                        {/* Format Selection */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Format</label>
                            <div className="grid grid-cols-4 gap-2">
                                {(['png', 'jpeg', 'webp', 'pdf'] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFormat(f)}
                                        className={`py-2 rounded-lg text-xs font-bold transition-all border ${format === f ? 'bg-[#7d2ae8] border-[#7d2ae8] text-white' : 'bg-[#252627] border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                    >
                                        {f.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quality Slider (not for PDF) */}
                        {format !== 'pdf' && (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quality</label>
                                    <span className="text-xs font-medium text-[#00c4cc]">{Math.round(quality * 100)}%</span>
                                </div>
                                <input
                                    type="range" min="0.1" max="1" step="0.05"
                                    value={quality}
                                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#00c4cc]"
                                />
                            </div>
                        )}

                        {/* Presets */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Size Presets</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                {presets.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setActivePreset(p.id)}
                                        className={`flex flex-col items-start p-3 rounded-xl border transition-all ${activePreset === p.id ? 'bg-[#7d2ae8]/10 border-[#7d2ae8] ring-1 ring-[#7d2ae8]' : 'bg-[#13161a] border-gray-700 hover:border-gray-600'}`}
                                    >
                                        <span className={`text-xs font-bold ${activePreset === p.id ? 'text-white' : 'text-gray-300'}`}>{p.name}</span>
                                        <span className="text-[10px] text-gray-500">{p.width} x {p.height} px</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleExportClick}
                            disabled={isExporting}
                            className="w-full py-4 bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] text-white rounded-xl font-bold shadow-lg shadow-purple-900/40 transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {isExporting ? (
                                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                                <>Download {format.toUpperCase()} <Icons.Download className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
