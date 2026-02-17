
import React, { RefObject, useState } from 'react';
import { AppMode, AspectRatio, ImageLayer, GenerationQuality } from '../../types';
import { Icons } from '../../constants';
import { Button } from '../Button';
import * as geminiService from '../../services/geminiService';

import { useStore } from '../../store/useStore';

interface MagicPanelProps {
  onGenerate: () => void;
  uploadedImage: string | null;
  fileInputRef: RefObject<HTMLInputElement>;
}

export const MagicPanel: React.FC<MagicPanelProps> = ({
  onGenerate,
  uploadedImage,
  fileInputRef
}) => {
  const {
    mode, setMode: onSetMode,
    prompt, setPrompt,
    aspectRatio, setAspectRatio,
    isProcessing,
    quality, setQuality,
    selectedLayerIds,
    imageLayers,
    updateLayer
  } = useStore();

  const selectedLayerId = selectedLayerIds[selectedLayerIds.length - 1] || null;

  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const enhanced = await geminiService.enhancePrompt(prompt);
      setPrompt(enhanced);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const selectedImageLayer = imageLayers.find(l => l.id === selectedLayerId);

  // -- Contextual Edit Mode --
  if (selectedImageLayer && mode !== AppMode.THEME) {
    return (
      <div className="flex flex-col h-full bg-[#13161a]">
        <div className="p-4 border-b border-gray-700">
          <div className="bg-[#252627] rounded-lg p-3 border border-[#7d2ae8]/30 mb-4 shadow-lg shadow-purple-900/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#7d2ae8]"><Icons.Magic className="w-4 h-4" /></span>
              <h4 className="text-sm font-bold text-white">Generative Edit</h4>
            </div>
            <p className="text-[10px] text-gray-400">
              Edit <span className="text-white font-medium">"{selectedImageLayer.name || 'Image'}"</span> using natural language.
            </p>
          </div>

          <div className="relative mb-4">
            <textarea
              className="w-full h-32 bg-[#1e1e1e] border border-gray-600 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:border-[#7d2ae8] focus:ring-1 focus:ring-[#7d2ae8] outline-none resize-none custom-scrollbar"
              placeholder="E.g., Turn the cat into a dog, Change the background to a beach..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={handleEnhancePrompt}
              disabled={isEnhancing || !prompt.trim()}
              className="absolute bottom-2 right-2 text-[10px] bg-[#7d2ae8]/20 hover:bg-[#7d2ae8]/40 text-[#7d2ae8] px-2 py-1 rounded flex items-center gap-1 transition-colors"
              title="Enhance prompt with AI"
            >
              {isEnhancing ? <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" /> : <Icons.Sparkles className="w-3 h-3" />}
              Enhance
            </button>
          </div>

          <Button
            variant="primary"
            className="w-full py-3 shadow-xl shadow-indigo-900/20"
            onClick={onGenerate}
            loading={isProcessing}
            disabled={!prompt.trim()}
          >
            <Icons.Wand className="w-4 h-4 mr-2" />
            Generate Edit
          </Button>
        </div>
      </div>
    );
  }

  // -- Main Generation Mode --

  const getButtonLabel = () => {
    switch (mode) {
      case AppMode.GENERATE: return "Generate Image";
      case AppMode.EDIT: return "Generate Edits";
      case AppMode.THEME: return "Apply Theme";
      default: return "Generate";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#13161a]">
      {/* Top Tabs */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex bg-[#1e1e1e] p-1 rounded-lg mb-4 border border-gray-700">
          <button
            onClick={() => onSetMode(AppMode.GENERATE)}
            className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${mode === AppMode.GENERATE ? 'bg-[#7d2ae8] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Imagine
          </button>
          <button
            onClick={() => onSetMode(AppMode.EDIT)}
            className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${mode === AppMode.EDIT ? 'bg-[#7d2ae8] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Remix
          </button>
          <button
            onClick={() => onSetMode(AppMode.THEME)}
            className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${mode === AppMode.THEME ? 'bg-[#7d2ae8] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Theme
          </button>
        </div>

        {/* Input Area */}
        <div className="relative mb-4">
          <textarea
            className="w-full h-28 bg-[#1e1e1e] border border-gray-600 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:border-[#7d2ae8] focus:ring-1 focus:ring-[#7d2ae8] outline-none resize-none custom-scrollbar shadow-inner"
            placeholder={mode === AppMode.GENERATE ? "A futuristic city with flying cars..." : "Describe changes..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            onClick={handleEnhancePrompt}
            disabled={isEnhancing || !prompt.trim()}
            className="absolute bottom-3 right-3 text-[10px] bg-[#2a2a2a] hover:bg-[#333] border border-gray-600 text-purple-400 px-2 py-1 rounded flex items-center gap-1 transition-all shadow-sm"
          >
            {isEnhancing ? <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" /> : <Icons.Sparkles className="w-3 h-3" />}
            Enhance
          </button>
        </div>

        {/* Settings Row */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block">Quality</label>
            <div className="flex bg-[#1e1e1e] rounded border border-gray-700 p-0.5">
              <button onClick={() => setQuality('standard')} className={`flex-1 py-1 rounded text-[10px] font-bold ${quality === 'standard' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>Fast</button>
              <button onClick={() => setQuality('hd')} className={`flex-1 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 ${quality === 'hd' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 'text-gray-400'}`}>Pro <Icons.Star className="w-2 h-2" /></button>
            </div>
          </div>

          {mode === AppMode.GENERATE && (
            <div className="flex-1">
              <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block">Ratio</label>
              <div className="flex bg-[#1e1e1e] rounded border border-gray-700 p-0.5 gap-0.5">
                {[AspectRatio.SQUARE, AspectRatio.LANDSCAPE, AspectRatio.PORTRAIT].map(r => (
                  <button
                    key={r}
                    onClick={() => setAspectRatio(r)}
                    className={`flex-1 py-1 rounded text-[10px] font-bold ${aspectRatio === r ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
                    title={r}
                  >
                    {r === AspectRatio.SQUARE ? '1:1' : r === AspectRatio.LANDSCAPE ? '16:9' : '9:16'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit Mode Upload */}
        {mode === AppMode.EDIT && (
          <div className="mb-4">
            <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block">Source Image</label>
            {uploadedImage ? (
              <div className="relative group rounded-lg overflow-hidden border border-gray-600 aspect-[2/1] bg-black/50">
                <img src={uploadedImage} className="w-full h-full object-contain" />
                <button
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded-full border border-white/20">Replace</span>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-gray-700 bg-[#1e1e1e] rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
              >
                <Icons.Upload className="w-5 h-5 text-gray-500 mb-1" />
                <span className="text-[10px] text-gray-400">Click to upload reference</span>
              </div>
            )}
          </div>
        )}

        <Button
          variant="primary"
          className="w-full py-3 shadow-lg shadow-purple-900/20"
          onClick={onGenerate}
          loading={isProcessing}
          disabled={!prompt.trim() || (mode === AppMode.EDIT && !uploadedImage)}
        >
          <Icons.Magic className="w-4 h-4 mr-2" />
          {getButtonLabel()}
        </Button>
      </div>

      {/* Styles Gallery */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-3 sticky top-0 bg-[#13161a] py-1 z-10">Quick Styles</h4>
        <div className="grid grid-cols-2 gap-2 pb-10">
          {[
            { name: 'Photorealistic', style: 'highly detailed, photorealistic, 8k, cinematic lighting, depth of field' },
            { name: '3D Render', style: '3d render, blender, octane render, vivid colors, smooth textures' },
            { name: 'Cyberpunk', style: 'cyberpunk aesthetic, neon lights, futuristic, high contrast, dark atmosphere' },
            { name: 'Watercolor', style: 'watercolor painting, artistic, soft edges, pastel colors, paper texture' },
            { name: 'Line Art', style: 'minimalist line art, vector style, clean lines, black and white, simple' },
            { name: 'Oil Painting', style: 'oil painting style, visible brushstrokes, textured, classical art' },
            { name: 'Pixel Art', style: 'pixel art, 8-bit, retro game style, limited palette' },
            { name: 'Anime', style: 'anime style, studio ghibli, vibrant colors, detailed background' }
          ].map(item => (
            <button
              key={item.name}
              onClick={() => setPrompt(prompt ? `${prompt}, ${item.style}` : item.style)}
              className="group relative h-16 bg-[#1e1e1e] border border-gray-700 rounded-lg overflow-hidden hover:border-[#7d2ae8] transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                <span className="text-xs font-medium text-gray-300 group-hover:text-white">{item.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; export default MagicPanel;
