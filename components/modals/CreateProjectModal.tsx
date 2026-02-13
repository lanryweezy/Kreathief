
import React, { useState } from 'react';
import { Icons } from '../../constants';
import { CanvasSize } from '../../types';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (size: CanvasSize) => void;
}

const PRESET_SIZES: CanvasSize[] = [
    { width: 1080, height: 1080, name: 'Instagram Post' },
    { width: 1080, height: 1920, name: 'Story / Reel' },
    { width: 1280, height: 720, name: 'YouTube Thumbnail' },
    { width: 1920, height: 1080, name: 'Presentation' },
    { width: 1200, height: 630, name: 'Facebook Post' },
    { width: 1500, height: 500, name: 'Twitter Header' },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
    isOpen,
    onClose,
    onCreate
}) => {
    const [customWidth, setCustomWidth] = useState('1080');
    const [customHeight, setCustomHeight] = useState('1080');
    const [customName, setCustomName] = useState('Untitled Design');

    if (!isOpen) return null;

    const handleCustomCreate = () => {
        onCreate({
            width: parseInt(customWidth) || 1080,
            height: parseInt(customHeight) || 1080,
            name: customName || 'Custom Design'
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={onClose} />

            <div className="bg-[#1e1e1e] border border-gray-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn relative z-10">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-[#252627]">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Icons.FolderPlus className="w-5 h-5 text-[#7d2ae8]" />
                        Create New Design
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
                        <Icons.X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Presets */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Presets</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {PRESET_SIZES.map((size) => (
                                <button
                                    key={size.name}
                                    onClick={() => onCreate(size)}
                                    className="flex items-center justify-between p-3 bg-[#13161a] border border-gray-700 rounded-lg hover:border-[#7d2ae8] hover:bg-[#252627] transition-all group"
                                >
                                    <div className="flex flex-col text-left">
                                        <span className="text-sm font-bold text-gray-200 group-hover:text-white">{size.name}</span>
                                        <span className="text-[10px] text-gray-500">{size.width} × {size.height} px</span>
                                    </div>
                                    <Icons.ArrowUp className="w-4 h-4 text-gray-600 group-hover:text-[#7d2ae8] rotate-90" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Size */}
                    <div className="flex flex-col">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Custom Dimensions</h3>
                        <div className="space-y-4 bg-[#13161a] p-6 rounded-xl border border-gray-700 h-full">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Project Name</label>
                                <input
                                    type="text"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    className="w-full bg-[#1c2127] border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7d2ae8]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Width (px)</label>
                                    <input
                                        type="number"
                                        value={customWidth}
                                        onChange={(e) => setCustomWidth(e.target.value)}
                                        className="w-full bg-[#1c2127] border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7d2ae8]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Height (px)</label>
                                    <input
                                        type="number"
                                        value={customHeight}
                                        onChange={(e) => setCustomHeight(e.target.value)}
                                        className="w-full bg-[#1c2127] border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7d2ae8]"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 mt-auto">
                                <button
                                    onClick={handleCustomCreate}
                                    className="w-full bg-[#7d2ae8] hover:bg-[#6b23c5] text-white py-3 rounded-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-900/20"
                                >
                                    Create Custom Design
                                </button>
                                <p className="text-[10px] text-center text-gray-500 mt-3">
                                    All designs use high-performance hardware acceleration
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
