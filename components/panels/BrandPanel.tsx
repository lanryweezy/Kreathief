import React, { useState, useRef } from 'react';
import { BrandKit } from '../../types';
import { Icons, FONT_FAMILIES } from '../../constants';
import { Button } from '../Button';
import * as photoService from '../../services/photoService';

import { useStore } from '../../store/useStore';
import { v4 as uuidv4 } from 'uuid';

export const BrandPanel = () => {
  const brandKits = useStore((state) => state.brandKits);
  const onAddBrandKit = useStore((state) => state.addBrandKit);
  const onDeleteBrandKit = useStore((state) => state.deleteBrandKit);
  const onApplyBrandColors = useStore((state) => state.applyBrandColors);
  const onApplyBrandFonts = useStore((state) => state.applyBrandFonts);
  const addLayer = useStore((state) => state.addLayer);
  const canvasSize = useStore((state) => state.canvasSize);

  const onAddLogoToCanvas = (url: string) => {
    addLayer({
      id: uuidv4(),
      type: 'image',
      name: 'Brand Logo',
      src: url,
      x: canvasSize.width / 2 - 100,
      y: canvasSize.height / 2 - 100,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      flipX: false,
      flipY: false,
      blendMode: 'normal',
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        blur: 0,
        sepia: 0,
        hueRotate: 0,
        vignette: 0,
        opacity: 1,
      },
      skewX: 0,
      skewY: 0,
    });
  };
  const [isCreating, setIsCreating] = useState(false);
  const [newKitName, setNewKitName] = useState('');
  const [newColors, setNewColors] = useState<string[]>(['#000000', '#ffffff', '#7d2ae8']);
  const [newFonts, setNewFonts] = useState<string[]>(['Space Grotesk', 'Inter']);
  const [newLogos, setNewLogos] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    if (!newKitName.trim()) {
      return;
    }
    const kit: BrandKit = {
      id: `brand_${Date.now()}`,
      name: newKitName,
      colors: newColors,
      fonts: newFonts,
      logos: newLogos,
      primaryLogo: newLogos[0], // Default first logo to primary if available
      secondaryLogo: newLogos[1],
    };
    onAddBrandKit(kit);
    setIsCreating(false);
    resetForm();
  };

  const resetForm = () => {
    setNewKitName('');
    setNewColors(['#000000', '#ffffff', '#7d2ae8']);
    setNewFonts(['Space Grotesk', 'Inter']);
    setNewLogos([]);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (newLogos.length < 10) {
        setNewLogos((prev) => [...prev, url]);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateNewColor = (index: number, color: string) => {
    const updated = [...newColors];
    updated[index] = color;
    setNewColors(updated);
  };

  const extractColorsFromLogo = async () => {
    if (newLogos.length === 0) {
      alert('Please upload a logo first.');
      return;
    }
    setIsAnalyzing(true);
    try {
      const extracted = await photoService.extractPalette(newLogos[0], 5);
      if (extracted && extracted.length > 0) {
        setNewColors(extracted);
      } else {
        alert('Could not extract colors. Try another image.');
      }
    } catch (e) {
      console.error(e);
      alert('Extraction failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportKit = (kit: BrandKit) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(kit));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `${kit.name.replace(/\s+/g, '_')}_brandkit.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportKit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const kit = JSON.parse(event.target?.result as string);
        if (kit.name && kit.colors && kit.fonts) {
          // Ensure unique ID
          kit.id = `brand_imported_${Date.now()}`;
          onAddBrandKit(kit);
        } else {
          alert('Invalid Brand Kit JSON');
        }
      } catch (e) {
        alert('Error parsing JSON');
      }
    };
    reader.readAsText(file);
    if (importInputRef.current) {
      importInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full p-4 overflow-hidden bg-[#13161a]">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Icons.Brand className="w-5 h-5 text-[#7d2ae8]" />
          Brand Kits
        </h3>
        <div className="flex gap-2">
          <input type="file" accept=".json" ref={importInputRef} onChange={handleImportKit} className="hidden" />
          <button
            onClick={() => importInputRef.current?.click()}
            className="text-xs bg-[#252627] hover:bg-[#333] border border-gray-700 text-gray-300 px-2 py-1 rounded flex items-center gap-1"
            title="Import JSON Kit"
          >
            <Icons.Plus className="w-3 h-3 rotate-45" /> Import
          </button>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="text-xs bg-[#7d2ae8] hover:bg-[#6b23c5] text-white px-2 py-1 rounded font-bold shadow-lg shadow-purple-900/20"
            >
              + New Kit
            </button>
          )}
        </div>
      </div>

      {isCreating && (
        <div className="bg-[#1e1e1e] p-4 rounded-lg border border-gray-700 mb-6 animate-fadeIn flex-shrink-0 relative">
          <input
            type="text"
            placeholder="Brand Name (e.g. Acme Corp)"
            className="w-full bg-[#252627] border border-gray-600 rounded px-2 py-1.5 text-sm text-white mb-4 focus:border-[#7d2ae8] outline-none"
            value={newKitName}
            onChange={(e) => setNewKitName(e.target.value)}
            autoFocus
          />

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Logos (Max 10)</label>
              {newLogos.length > 0 && (
                <button
                  onClick={extractColorsFromLogo}
                  disabled={isAnalyzing}
                  className="text-[10px] text-[#7d2ae8] hover:text-[#9f5afd] flex items-center gap-1 disabled:opacity-50"
                >
                  <Icons.Magic className="w-3 h-3" />
                  {isAnalyzing ? 'Analyzing...' : 'Extract Colors'}
                </button>
              )}
            </div>
            <div className="flex gap-3 flex-wrap">
              {newLogos.map((logo, i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded border border-gray-700 bg-black flex items-center justify-center relative group"
                >
                  <img src={logo} className="max-w-full max-h-full object-contain" />
                  <button
                    onClick={() => setNewLogos((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icons.X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              {newLogos.length < 10 && (
                <label className="w-12 h-12 rounded border-2 border-dashed border-gray-700 hover:border-[#7d2ae8] transition-colors flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-[#7d2ae8]">
                  <Icons.Plus className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Palette</label>
            <div className="flex gap-2 flex-wrap">
              {newColors.map((c, i) => (
                <div
                  key={i}
                  className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-600 cursor-pointer hover:scale-110 transition-transform group"
                >
                  <input
                    type="color"
                    value={c}
                    onChange={(e) => updateNewColor(i, e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-full h-full" style={{ backgroundColor: c }} />
                  <button
                    onClick={() => setNewColors((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute inset-0 m-auto text-white opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/50"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {newColors.length < 8 && (
                <button
                  onClick={() => setNewColors([...newColors, '#000000'])}
                  className="w-8 h-8 rounded-full border border-dashed border-gray-600 flex items-center justify-center text-gray-500 hover:text-white hover:border-gray-400"
                >
                  <Icons.Plus className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Typography</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-12">Headings</span>
                <select
                  className="flex-1 bg-[#252627] border border-gray-600 rounded px-2 py-1 text-xs text-white"
                  value={newFonts[0]}
                  onChange={(e) => setNewFonts([e.target.value, newFonts[1]])}
                >
                  {FONT_FAMILIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-12">Body</span>
                <select
                  className="flex-1 bg-[#252627] border border-gray-600 rounded px-2 py-1 text-xs text-white"
                  value={newFonts[1]}
                  onChange={(e) => setNewFonts([newFonts[0], e.target.value])}
                >
                  {FONT_FAMILIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-700">
            <Button size="sm" onClick={handleCreate} disabled={!newKitName.trim()}>
              Save Kit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsCreating(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pb-10">
        {brandKits.length === 0 && !isCreating ? (
          <div className="text-center text-gray-500 mt-10">
            <div className="w-16 h-16 rounded-full bg-[#1e1e1e] flex items-center justify-center mx-auto mb-4">
              <Icons.Brand className="w-8 h-8 opacity-30" />
            </div>
            <h4 className="text-sm font-bold text-gray-300 mb-1">No Brand Kits</h4>
            <p className="text-xs max-w-[200px] mx-auto">
              Create a kit to save your brand colors, fonts, and logos for quick access.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-4 text-[#7d2ae8] text-xs font-bold hover:underline"
            >
              Create your first kit
            </button>
          </div>
        ) : (
          brandKits.map((kit) => (
            <div
              key={kit.id}
              className="bg-[#1e1e1e] border border-gray-700 rounded-lg p-3 group relative hover:border-gray-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-sm text-white">{kit.name}</h4>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleExportKit(kit)}
                    className="text-gray-500 hover:text-white p-1"
                    title="Export Kit"
                  >
                    <Icons.Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDeleteBrandKit(kit.id)}
                    className="text-gray-500 hover:text-red-400 p-1"
                    title="Delete Kit"
                  >
                    <Icons.Trash className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Colors */}
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                {kit.colors.map((c, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border border-white/10 shadow-sm"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
                <button
                  onClick={() => onApplyBrandColors(kit.colors)}
                  className="ml-auto text-[10px] bg-[#7d2ae8]/10 hover:bg-[#7d2ae8]/20 text-[#7d2ae8] px-2 py-0.5 rounded border border-[#7d2ae8]/20 transition-colors font-bold"
                >
                  Apply
                </button>
              </div>

              {/* Typography */}
              <div className="bg-[#252627] rounded p-2 mb-3 border border-gray-800">
                <div className="flex justify-between items-center border-b border-gray-700 pb-1 mb-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Typography</span>
                  <button
                    onClick={() => onApplyBrandFonts(kit.fonts[0], kit.fonts[1])}
                    className="text-[10px] text-[#7d2ae8] hover:text-white transition-colors"
                  >
                    Apply
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] text-gray-500 block">Aa</span>
                    <span
                      className="text-[10px] font-medium text-white truncate block"
                      style={{ fontFamily: kit.fonts[0] }}
                    >
                      {kit.fonts[0]}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 block">Aa</span>
                    <span
                      className="text-[10px] font-medium text-white truncate block"
                      style={{ fontFamily: kit.fonts[1] }}
                    >
                      {kit.fonts[1]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Logos */}
              {kit.logos && kit.logos.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Assets</label>
                  <div className="grid grid-cols-4 gap-2">
                    {kit.logos.slice(0, 4).map((logo, i) => (
                      <button
                        key={i}
                        onClick={() => onAddLogoToCanvas(logo)}
                        className="aspect-square rounded border border-gray-700 bg-black/20 p-1 flex items-center justify-center hover:border-[#7d2ae8] transition-colors"
                      >
                        <img src={logo} className="max-w-full max-h-full object-contain pointer-events-none" />
                      </button>
                    ))}
                    {kit.logos.length > 4 && (
                      <div className="aspect-square rounded border border-gray-700 bg-[#252627] flex items-center justify-center text-[10px] text-gray-500">
                        +{kit.logos.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default BrandPanel;
