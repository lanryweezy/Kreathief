import React, { useState, useRef } from 'react';
import { BrandKit } from '../../types';
import { Icons, FONT_FAMILIES } from '../../constants';
import * as photoService from '../../services/photoService';

import { useStore } from '../../store/useStore';
import { getErrorDetails } from '../../utils/errorMessages';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../../utils/log';
import { PanelErrorBoundary } from './PanelErrorBoundary';
import { Input } from '../Input';
import { Button } from '../Button';
import { motion, AnimatePresence } from 'framer-motion';

export const BrandPanel = () => {
  const brandKits = useStore((state) => state.brandKits);
  const activeBrandKitId = useStore((state) => state.activeBrandKitId);
  const setActiveBrandKit = useStore((state) => state.setActiveBrandKit);
  const onAddBrandKit = useStore((state) => state.addBrandKit);
  const onDeleteBrandKit = useStore((state) => state.deleteBrandKit);
  const onApplyBrandColors = useStore((state) => state.applyBrandColors);
  const onApplyBrandFonts = useStore((state) => state.applyBrandFonts);
  const addLayer = useStore((state) => state.addLayer);
  const canvasSize = useStore((state) => state.canvasSize);
  const addToast = useStore((state) => state.addToast);

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
  const [newColors, setNewColors] = useState<string[]>(['#000000', '#ffffff', '#7D2AE8']);
  const [newFonts, setNewFonts] = useState<string[]>(['Space Grotesk', 'Inter']);
  const [newLogos, setNewLogos] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [kitsLoaded, setKitsLoaded] = useState(false);
  const [confirmDeleteKitId, setConfirmDeleteKitId] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setKitsLoaded(true), 400);
    return () => clearTimeout(t);
  }, []);

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
    setNewColors(['#000000', '#ffffff', '#7D2AE8']);
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
      addToast?.('Please upload a logo first.', 'warning');
      return;
    }
    setIsAnalyzing(true);
    try {
      const extracted = await photoService.extractPalette(newLogos[0], 5);
      if (extracted && extracted.length > 0) {
        setNewColors(extracted);
      } else {
        addToast?.('Could not extract colors. Try another image.', 'warning');
      }
    } catch (e) {
      log.error('[BrandPanel] Color extraction failed', e);
      // 🌸 BLOOM: Replaced generic "Extraction failed" with actionable, specific error details
      const details = getErrorDetails(e);
      addToast?.(`Color extraction failed: ${details.message}. ${details.suggestion}`, 'error');
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
          // 🌸 BLOOM: Improved technical "Invalid Brand Kit JSON" error to be actionable
          addToast?.(
            'The imported file is missing required brand kit data (name, colors, or fonts). Please check the file.',
            'error'
          );
        }
      } catch (e) {
        log.error('[BrandPanel] Failed to parse imported Brand Kit JSON', e);
        // 🌸 BLOOM: Replaced technical "Error parsing JSON" with a user-friendly message
        const details = getErrorDetails(e);
        addToast?.(
          `Failed to import Brand Kit: ${details.message}. Please ensure you are uploading a valid brand kit file.`,
          'error'
        );
      }
    };
    reader.readAsText(file);
    if (importInputRef.current) {
      importInputRef.current.value = '';
    }
  };

  return (
    <div data-testid="brand-panel" className="flex flex-col h-full p-4 overflow-hidden bg-surface-dark-2">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Icons.Brand className="w-5 h-5 text-brand-600" />
          Brand Kits
        </h3>
        <div className="flex gap-2">
          <input type="file" accept=".json" ref={importInputRef} onChange={handleImportKit} className="hidden" />
          <Button
            variant="secondary"
            size="xs"
            onClick={() => importInputRef.current?.click()}
            title="Import JSON Kit"
            aria-label="Import JSON Kit"
          >
            <Icons.Plus className="w-3 h-3 rotate-45" /> Import
          </Button>
          {!isCreating && (
            <Button data-testid="add-brand-kit-btn" variant="primary" size="xs" onClick={() => setIsCreating(true)}>
              + New Kit
            </Button>
          )}
        </div>
      </div>

      {isCreating && (
        <div
          data-testid="create-brand-kit-form"
          className="bg-surface-dark-3 p-4 rounded-xl border border-gray-700 mb-6 animate-fadeIn flex-shrink-0 relative"
        >
          <Input
            data-testid="brand-kit-name-input"
            type="text"
            placeholder="Brand Name (e.g. Acme Corp)"
            aria-label="New Kit Name"
            className="text-sm mb-4"
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
                  className="text-[10px] text-brand-600 hover:text-brand-400 flex items-center gap-1 disabled:opacity-50"
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
                    aria-label="Remove logo"
                  >
                    <Icons.X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              {newLogos.length < 10 && (
                <label className="w-12 h-12 rounded border-2 border-dashed border-gray-700 hover:border-brand-600 transition-colors flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-brand-600">
                  <Icons.Plus className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Palette</label>
            <div data-testid="brand-colors-edit" className="flex gap-2 flex-wrap">
              {newColors.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 bg-surface-dark-4 border border-gray-700 rounded-xl p-1 animate-fadeIn shrink-0"
                >
                  <div className="relative w-6 h-6 rounded-md overflow-hidden border border-gray-600 cursor-pointer shrink-0">
                    <input
                      data-testid={`brand-color-input-${i}`}
                      type="color"
                      value={c}
                      aria-label={`Color picker for brand color ${i + 1}`}
                      onChange={(e) => updateNewColor(i, e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    />
                    <div className="w-full h-full" style={{ backgroundColor: c }} />
                  </div>
                  <input
                    type="text"
                    value={c}
                    aria-label={`Hex value for brand color ${i + 1}`}
                    onChange={(e) => updateNewColor(i, e.target.value)}
                    className="w-16 bg-transparent border-none text-xs text-white outline-none font-mono"
                  />
                  <button
                    onClick={() => setNewColors((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-gray-500 hover:text-red-400 p-0.5"
                    title="Remove color"
                    aria-label="Remove color"
                  >
                    <Icons.X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {newColors.length < 8 && (
                <button
                  onClick={() => setNewColors([...newColors, '#000000'])}
                  className="w-8 h-8 rounded-full border border-dashed border-gray-600 flex items-center justify-center text-gray-500 hover:text-white hover:border-gray-400 self-center"
                  aria-label="Add new color"
                >
                  <Icons.Plus className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Typography</label>
            <div data-testid="brand-fonts-edit" className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-12">Headings</span>
                <select
                  data-testid="brand-font-heading-select"
                  className="flex-1 bg-surface-dark-4 border border-gray-600 rounded-xl px-2 py-1 text-xs text-white"
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
                  data-testid="brand-font-body-select"
                  className="flex-1 bg-surface-dark-4 border border-gray-600 rounded-xl px-2 py-1 text-xs text-white"
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
            <Button
              data-testid="save-brand-kit-btn"
              variant="primary"
              size="sm"
              onClick={handleCreate}
              disabled={!newKitName.trim()}
              title={!newKitName.trim() ? 'Please enter a brand name to save' : 'Save Brand Kit'}
            >
              Save Kit
            </Button>
            <Button
              variant="ghost"
              size="sm"
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
        {!kitsLoaded ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="bg-surface-dark-3 border border-gray-700 rounded-lg p-3 space-y-3">
                <div className="h-4 bg-white/5 rounded w-1/2" />
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="w-5 h-5 rounded-full bg-white/5" />
                  ))}
                </div>
                <div className="h-16 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : brandKits.length === 0 && !isCreating ? (
          <div className="text-center text-gray-500 mt-10">
            <div className="w-16 h-16 rounded-full bg-surface-dark-3 flex items-center justify-center mx-auto mb-4">
              <Icons.Brand className="w-8 h-8 opacity-30" />
            </div>
            <h4 className="text-sm font-bold text-gray-300 mb-1">No Brand Kits</h4>
            <p className="text-xs max-w-[200px] mx-auto">
              Create a kit to save your brand colors, fonts, and logos for quick access.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreating(true)}
              className="mt-4 text-brand-600 font-bold hover:underline"
            >
              Create your first kit
            </Button>
          </div>
        ) : (
          brandKits.map((kit) => (
            <div
              key={kit.id}
              data-testid={`brand-kit-item-${kit.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-surface-dark-3 border border-gray-700 rounded-xl p-3 group relative hover:border-gray-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-sm text-white">{kit.name}</h4>
                <div className="flex gap-1">
                  <button
                    data-testid="export-brand-kit-btn"
                    onClick={() => handleExportKit(kit)}
                    className="text-gray-500 hover:text-white p-1"
                    title="Export Kit"
                    aria-label="Export Brand Kit"
                  >
                    <Icons.Download className="w-3 h-3" />
                  </button>
                  <button
                    data-testid="delete-brand-kit-btn"
                    onClick={() => setConfirmDeleteKitId(kit.id)}
                    className="text-gray-500 hover:text-red-400 p-1"
                    title="Delete Kit"
                    aria-label="Delete Brand Kit"
                  >
                    <Icons.Trash className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Colors */}
              <div data-testid="brand-colors-display" className="flex items-center gap-1.5 mb-3 flex-wrap">
                {kit.colors.map((c, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border border-white/10 shadow-sm"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
                <button
                  data-testid="apply-brand-colors-btn"
                  onClick={() => {
                    onApplyBrandColors(kit.colors, kit.id);
                    setActiveBrandKit(kit.id);
                  }}
                  className={`ml-auto text-[10px] px-2 py-0.5 rounded border transition-colors font-bold ${activeBrandKitId === kit.id ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20' : 'bg-brand-600/10 hover:bg-brand-600/20 text-brand-600 border-brand-600/20'}`}
                >
                  {activeBrandKitId === kit.id ? 'Live' : 'Apply'}
                </button>
              </div>

              {/* Typography */}
              <div
                data-testid="brand-fonts-display"
                className="bg-surface-dark-4 rounded-xl p-2 mb-3 border border-gray-800"
              >
                <div className="flex justify-between items-center border-b border-gray-700 pb-1 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Typography</span>
                    {activeBrandKitId === kit.id && (
                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                  <button
                    data-testid="apply-brand-fonts-btn"
                    onClick={() => onApplyBrandFonts(kit.fonts[0], kit.fonts[1], kit.id)}
                    className="text-[10px] text-brand-600 hover:text-white transition-colors"
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
                        className="aspect-square rounded border border-gray-700 bg-black/20 p-1 flex items-center justify-center hover:border-brand-600 transition-colors"
                        aria-label="Add logo to canvas"
                      >
                        <img src={logo} className="max-w-full max-h-full object-contain pointer-events-none" />
                      </button>
                    ))}
                    {kit.logos.length > 4 && (
                      <div className="aspect-square rounded border border-gray-700 bg-surface-dark-4 flex items-center justify-center text-[10px] text-gray-500">
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

      {/* Delete Brand Kit Confirmation Dialog */}
      <AnimatePresence>
        {confirmDeleteKitId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-modal flex items-center justify-center p-6"
            onClick={() => setConfirmDeleteKitId(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative bg-[#1a1d21] border border-white/10 rounded-2xl p-6 w-full max-w-[280px] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Icons.Trash className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Delete Brand Kit?</h4>
                  <p className="text-[11px] text-gray-400">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDeleteKitId(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteBrandKit(confirmDeleteKitId);
                    setConfirmDeleteKitId(null);
                  }}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-red-500 hover:bg-red-400 rounded-xl transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default function BrandPanelWrapped() {
  return (
    <PanelErrorBoundary panelName="Brand">
      <BrandPanel />
    </PanelErrorBoundary>
  );
}
