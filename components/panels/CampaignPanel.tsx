/**
 * CampaignPanel Component
 * Omnichannel AI Campaign Studio that generates multi-format synchronized design assets
 * across 1:1, 9:16, 16:9, and 4:5 aspect ratios simultaneously with batch ZIP export.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { PanelHeader } from './PanelHeader';
import { PanelErrorBoundary } from './PanelErrorBoundary';
import {
  CAMPAIGN_ARCHETYPES,
  CAMPAIGN_FORMATS,
  generateOmnichannelCampaign,
  CampaignGenerationResult,
} from '../../services/campaignGeneratorService';
import { exportCampaignToZip, downloadFile } from '../../services/campaignExportService';
import { CampaignArchetype, CampaignFormatId, Artboard } from '../../types';
import { log } from '../../utils/log';

const SAMPLE_INSPIRATIONS = [
  {
    label: 'Cyberpunk Sneaker Drop',
    prompt: 'Exclusive Cyberpunk High-Top Sneaker Drop with 40% launch discount and holographic sole',
    archetype: 'cyberpunk' as CampaignArchetype,
  },
  {
    label: 'Luxury Watch Launch',
    prompt: 'Obsidian & Gold Automatic Chronograph Watch Release with Swiss precision movement',
    archetype: 'luxury' as CampaignArchetype,
  },
  {
    label: 'SaaS AI Platform',
    prompt: 'Next-Gen AI Graphic Design & Automation Suite for creative directors and marketing teams',
    archetype: 'corporate_tech' as CampaignArchetype,
  },
  {
    label: 'Synthwave Festival',
    prompt: 'Neon Horizon Music & Visual Arts Festival with live retro synth performances',
    archetype: 'synthwave' as CampaignArchetype,
  },
  {
    label: 'Brutalist Coffee Club',
    prompt: 'Artisanal Single-Origin Cold Brew Launch with bold dark roast flavor',
    archetype: 'neo_brutalist' as CampaignArchetype,
  },
];

export const CampaignPanel: React.FC = () => {
  const artboards = useStore((state) => state.artboards) || [];
  const setArtboards = useStore((state) => (state as any).setArtboards || ((boards: any) => useStore.setState({ artboards: boards })));
  const setActiveArtboardId = useStore((state) => state.setActiveArtboardId);
  const activeArtboardId = useStore((state) => state.activeArtboardId);

  const [prompt, setPrompt] = useState('Cyberpunk Streetwear Collection Drop with 35% launch discount');
  const [selectedArchetype, setSelectedArchetype] = useState<CampaignArchetype>('cyberpunk');
  const [selectedFormats, setSelectedFormats] = useState<CampaignFormatId[]>([
    'feed_1_1',
    'story_9_16',
    'banner_16_9',
    'poster_4_5',
  ]);
  const [brandName, setBrandName] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [promoCode, setPromoCode] = useState('KREA2026');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastResult, setLastResult] = useState<CampaignGenerationResult | null>(null);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'svg'>('png');

  // Wire into the Universal Router: automatically pick up intent from the Dashboard/Assistant
  const activeTab = useStore((state) => state.activeTab);
  const globalIntent = useStore((state) => state.agentIntent);
  
  useEffect(() => {
    if (activeTab === 'CAMPAIGN' && globalIntent && globalIntent !== prompt) {
      setPrompt(globalIntent);
    }
  }, [activeTab, globalIntent]);

  const handleToggleFormat = useCallback((formatId: CampaignFormatId) => {
    setSelectedFormats((prev) =>
      prev.includes(formatId) ? prev.filter((id) => id !== formatId) : [...prev, formatId]
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {return;}
    setIsGenerating(true);

    try {
      const result = await generateOmnichannelCampaign({
        prompt,
        archetype: selectedArchetype,
        formats: selectedFormats,
        brandName: brandName.trim() || undefined,
        ctaText: ctaText.trim() || undefined,
        promoCode: promoCode.trim() || undefined,
      });

      setLastResult(result);
      setArtboards(result.artboards);
      if (result.artboards.length > 0) {
        setActiveArtboardId(result.artboards[0].id);
      }
    } catch (err) {
      log.error('[CampaignPanel] Generation failed', err);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedArchetype, selectedFormats, brandName, ctaText, promoCode, setArtboards, setActiveArtboardId]);

  const handleExportZip = useCallback(async () => {
    if (artboards.length === 0) {return;}
    setIsExporting(true);

    try {
      const title = lastResult?.title || 'Omnichannel_Campaign';
      const zipBlob = await exportCampaignToZip(
        artboards,
        title,
        {
          copy: lastResult?.copy,
          archetype: lastResult?.archetype,
        },
        { format: exportFormat, quality: 0.95 }
      );

      const filename = `${title.replace(/\s+/g, '_')}_${Date.now()}.zip`;
      downloadFile(zipBlob, filename);
    } catch (err) {
      log.error('[CampaignPanel] Export failed', err);
    } finally {
      setIsExporting(false);
    }
  }, [artboards, lastResult, exportFormat]);

  return (
    <PanelErrorBoundary panelName="Campaign Studio">
      <div className="flex flex-col h-full bg-surface-dark-2 text-white overflow-hidden">
        <PanelHeader
          title="Campaign Studio"
          action={
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 text-[8px] font-black text-cyan-300 uppercase tracking-widest">
              OMNICHANNEL
            </span>
          }
        />

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
          {/* Hero Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-purple-950/30 to-black/40 border border-cyan-500/30 shadow-[0_0_24px_rgba(0,240,255,0.08)] space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 text-lg">📢</span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  1-Click Multi-Format Campaign
                </h3>
                <p className="text-[9px] text-cyan-300/80 leading-relaxed">
                  Generate Feed, Stories, Banners & Posters simultaneously with unified brand DNA.
                </p>
              </div>
            </div>
          </div>

          {/* Campaign Brief Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
              Campaign Brief & Offer
            </label>
            <textarea
              aria-label="Campaign Brief"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Summer streetwear collection drop with 30% discount for first 100 orders..."
              rows={3}
              className="w-full bg-surface-dark-1/80 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/40 transition-all resize-none"
            />

            {/* Quick Inspiration Pills */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500 block">
                Quick Inspirations
              </span>
              <div className="flex flex-wrap gap-1">
                {SAMPLE_INSPIRATIONS.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setPrompt(item.prompt);
                      setSelectedArchetype(item.archetype);
                    }}
                    className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400/40 hover:bg-white/10 text-[9px] font-medium text-gray-300 hover:text-white transition-all truncate max-w-[150px]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Archetype Style Picker */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                Visual Archetype
              </label>
              <span className="text-[8px] font-mono text-cyan-400 font-bold">
                {CAMPAIGN_ARCHETYPES[selectedArchetype].name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {Object.values(CAMPAIGN_ARCHETYPES).map((arch) => {
                const isSelected = selectedArchetype === arch.id;
                return (
                  <button
                    key={arch.id}
                    data-testid={`archetype-${arch.id}`}
                    onClick={() => setSelectedArchetype(arch.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400/40 shadow-[0_0_16px_rgba(0,240,255,0.15)]'
                        : 'bg-surface-dark-1/80 border-white/5 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <span className="text-[10px] font-black text-white truncate">{arch.name.split(' ')[0]}</span>
                      <span className="text-[8px] font-mono text-gray-400">{arch.fontFamily}</span>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded-full border border-black/40" style={{ backgroundColor: arch.primaryColor }} />
                      <div className="w-3.5 h-3.5 rounded-full border border-black/40" style={{ backgroundColor: arch.secondaryColor }} />
                      <div className="w-3.5 h-3.5 rounded-full border border-black/40" style={{ backgroundColor: arch.backgroundColor }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio Format Selectors */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
              Channels & Formats
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CAMPAIGN_FORMATS.map((fmt) => {
                const isChecked = selectedFormats.includes(fmt.id);
                return (
                  <button
                    key={fmt.id}
                    onClick={() => handleToggleFormat(fmt.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isChecked
                        ? 'bg-purple-950/40 border-purple-400/60 text-white'
                        : 'bg-surface-dark-1/40 border-white/5 text-gray-500 hover:border-white/15'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] font-bold truncate">{fmt.name}</div>
                      <div className="text-[8px] font-mono text-gray-400">{fmt.width}×{fmt.height} ({fmt.aspectRatio})</div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                        isChecked
                          ? 'bg-purple-600 border-purple-400 text-white'
                          : 'border-white/20 bg-transparent'
                      }`}
                    >
                      {isChecked ? '✓' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collapsible Advanced Brand Settings */}
          <div className="space-y-2 border-t border-white/5 pt-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-[9px] font-black uppercase tracking-wider text-gray-400 hover:text-white"
            >
              <span>Custom Brand Copy & CTAs</span>
              <span>{showAdvanced ? '▲' : '▼'}</span>
            </button>

            {showAdvanced && (
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[8px] font-bold uppercase text-gray-400">Brand Name</label>
                  <input
                    aria-label="Brand Name"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. KREATHIEF LABS"
                    className="w-full bg-surface-dark-1 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold uppercase text-gray-400">Button Call To Action</label>
                  <input
                    aria-label="CTA Button Text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="e.g. SHOP COLLECTION"
                    className="w-full bg-surface-dark-1 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold uppercase text-gray-400">Promo Code</label>
                  <input
                    aria-label="Promo Code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="e.g. DROP2026"
                    className="w-full bg-surface-dark-1 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Main Action Button */}
          <button
            data-testid="generate-campaign-btn"
            disabled={isGenerating || selectedFormats.length === 0}
            onClick={handleGenerate}
            className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
              isGenerating
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-400 hover:to-purple-500 shadow-cyan-500/25 active:scale-[0.98]'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Synthesizing Multi-Format Assets...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Generate Omnichannel Campaign</span>
              </>
            )}
          </button>

          {/* Generated Campaign Overview & Batch Export */}
          {artboards.length > 0 && (
            <div className="border-t border-white/10 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">
                  Campaign Artboards ({artboards.length})
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                    className="bg-surface-dark-1 border border-white/10 rounded-lg px-2 py-1 text-[9px] font-bold text-gray-300 focus:outline-none"
                  >
                    <option value="png">PNG (Lossless)</option>
                    <option value="jpeg">JPEG (High-Res)</option>
                    <option value="svg">SVG (Vector)</option>
                  </select>
                </div>
              </div>

              {/* Artboards List */}
              <div className="space-y-2">
                {artboards.map((board: Artboard, index: number) => {
                  const isActive = board.id === activeArtboardId;
                  return (
                    <button
                      key={board.id}
                      onClick={() => setActiveArtboardId(board.id)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isActive
                          ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-sm'
                          : 'bg-surface-dark-1/60 border-white/5 text-gray-400 hover:text-white hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-[9px] font-bold text-cyan-400 font-mono">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-white truncate max-w-[170px]">
                            {board.name}
                          </div>
                          <div className="text-[8px] font-mono text-gray-500">
                            {board.width} × {board.height} • {board.layers?.length || 0} layers
                          </div>
                        </div>
                      </div>
                      {isActive && <span className="text-cyan-400 text-[9px] font-bold">ACTIVE</span>}
                    </button>
                  );
                })}
              </div>

              {/* Batch Export Button */}
              <button
                data-testid="export-campaign-zip-btn"
                disabled={isExporting}
                onClick={handleExportZip}
                className="w-full py-2.5 rounded-xl bg-purple-600/30 border border-purple-500/50 hover:bg-purple-600/50 text-purple-200 font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-purple-300 border-t-transparent animate-spin" />
                    <span>Packaging High-Res ZIP...</span>
                  </>
                ) : (
                  <>
                    <span>📦</span>
                    <span>Download Full Campaign (.ZIP)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </PanelErrorBoundary>
  );
};

export default CampaignPanel;
