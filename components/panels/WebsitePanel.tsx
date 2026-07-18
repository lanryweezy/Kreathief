import React, { useState, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { Artboard, SiteSettings } from '../../types';
import { PanelErrorBoundary } from './PanelErrorBoundary';
import { SECTION_BLOCKS, SECTION_CATEGORIES, SectionCategory, SectionBlock } from '../../data/websiteSections';
import { generateWebsiteDesign, GeneratedWebsiteData } from '../../services/geminiService';
import { deployToVercel } from '../../services/vercelService';
import { exportWebsite, downloadWebsiteAsZip } from '../../services/websiteExportService';

type ActiveTab = 'pages' | 'sections' | 'settings' | 'seo';

const BREAKPOINTS = [
  { key: 'mobile', label: 'Mobile', width: 375, icon: Icons.Smartphone },
  { key: 'tablet', label: 'Tablet', width: 768, icon: Icons.Monitor },
  { key: 'desktop', label: 'Desktop', width: 1440, icon: Icons.Monitor },
];

export const WebsitePanel: React.FC = () => {
  const artboards = useStore((state) => state.artboards) || [];
  const activeArtboardId = useStore((state) => state.activeArtboardId);
  const setActiveArtboardId = useStore((state) => state.setActiveArtboardId);
  const updateArtboard = useStore((state) => state.updateArtboard);
  const deleteArtboard = useStore((state) => state.deleteArtboard);
  const siteSettings = useStore((state: any) => state.siteSettings) as SiteSettings;
  const updateSiteSettings = useStore((state: any) => state.updateSiteSettings);
  const addWebsitePage = useStore((state: any) => state.addWebsitePage);
  const websiteMode = useStore((state: any) => state.websiteMode);
  const setWebsiteMode = useStore((state: any) => state.setWebsiteMode);

  const [activeTab, setActiveTab] = useState<ActiveTab>('pages');
  const [sectionSearch, setSectionSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<SectionCategory | 'All'>('All');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<string | null>(null);

  // AI Generation State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPromptText, setAIPromptText] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Deployment State
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [vercelToken, setVercelToken] = useState(() => localStorage.getItem('vercel_token') || '');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState('');
  const [deployError, setDeployError] = useState('');

  const websitePages = artboards.filter((a: Artboard) => a.websitePage);
  const activeArtboard = artboards.find((a: Artboard) => a.id === activeArtboardId);

  const handleAddPage = useCallback(() => {
    addWebsitePage('New Page');
  }, [addWebsitePage]);

  const handleDeletePage = (id: string) => {
    if (websitePages.length <= 1) return;
    deleteArtboard(id);
  };

  const handleUpdatePageMeta = (id: string, field: string, value: any) => {
    const artboard = artboards.find((a: Artboard) => a.id === id);
    if (!artboard) return;
    const current = (artboard as any).websitePage || {};
    updateArtboard(id, { websitePage: { ...current, [field]: value } });
  };

  const handleInsertSection = useCallback(
    (block: SectionBlock) => {
      const state = useStore.getState();
      const artboard = state.artboards.find((a: Artboard) => a.id === state.activeArtboardId);
      if (!artboard) return;

      const { addShapeLayer, addTextLayer } = state as any;

      // Compute Y position below existing content
      const maxY = artboard.layers.reduce((max: number, l: any) => {
        return Math.max(max, (l.y || 0) + (l.height || 0));
      }, 0);
      const yOffset = maxY + 20;

      // Build a representative layer group for the section
      // Background rect
      addShapeLayer('rectangle', {
        name: `${block.name} — Background`,
        x: 0,
        y: yOffset,
        width: 1440,
        height: block.defaultHeight,
        color: block.category === 'Navigation' ? '#0f172a' : block.category === 'Footer' ? '#0f172a' : '#1e293b',
        opacity: 1,
        cornerRadius: 0,
      });

      // Title text
      addTextLayer({
        name: `${block.name} — Heading`,
        text: block.name,
        x: 80,
        y: yOffset + 40,
        width: 700,
        height: 60,
        fontSize: block.category === 'Hero' ? 72 : 36,
        fontWeight: '800',
        fontFamily: siteSettings?.fontFamily || 'Inter',
        color: '#ffffff',
        opacity: 1,
        textAlign: 'left',
      });

      // Subtitle / description
      addTextLayer({
        name: `${block.name} — Subtitle`,
        text: block.description,
        x: 80,
        y: yOffset + 120,
        width: 600,
        height: 40,
        fontSize: 18,
        fontWeight: '400',
        fontFamily: siteSettings?.fontFamily || 'Inter',
        color: '#94a3b8',
        opacity: 1,
        textAlign: 'left',
      });

      // CTA button for Hero / CTA sections
      if (['Hero', 'CTA'].includes(block.category)) {
        addShapeLayer('rectangle', {
          name: `${block.name} — CTA Button`,
          x: 80,
          y: yOffset + block.defaultHeight - 120,
          width: 180,
          height: 52,
          color: siteSettings?.primaryColor || '#6366f1',
          cornerRadius: 10,
          opacity: 1,
        });
        addTextLayer({
          name: `${block.name} — CTA Label`,
          text: 'Get Started',
          x: 80,
          y: yOffset + block.defaultHeight - 120,
          width: 180,
          height: 52,
          fontSize: 16,
          fontWeight: '700',
          fontFamily: siteSettings?.fontFamily || 'Inter',
          color: '#ffffff',
          opacity: 1,
          textAlign: 'center',
        });
      }
    },
    [siteSettings]
  );

  const handleGenerateWebsite = async () => {
    if (!aiPromptText.trim() || isGeneratingAI) return;

    setIsGeneratingAI(true);
    try {
      const generated = await generateWebsiteDesign(aiPromptText);

      const state = useStore.getState();
      const { updateSiteSettings, addWebsitePage, updateArtboard, setActiveArtboardId, addShapeLayer, addTextLayer } =
        state as any;

      // Update Site Settings
      updateSiteSettings({
        name: generated.siteSettings.name,
        primaryColor: generated.siteSettings.primaryColor,
        fontFamily: generated.siteSettings.fontFamily,
      });

      // Build each page
      for (const page of generated.pages) {
        addWebsitePage(page.name);

        // Let state update and grab the new artboard
        const newState = useStore.getState();
        const newArtboard = newState.artboards[newState.artboards.length - 1];

        if (!newArtboard) continue;

        // Set Metadata
        updateArtboard(newArtboard.id, {
          websitePage: {
            slug: page.slug,
            isHomePage: page.isHomePage,
            seoKeywords: page.seoKeywords,
            metaDescription: page.metaDescription,
          },
        });

        // Set as active so addShapeLayer/addTextLayer works on it
        setActiveArtboardId(newArtboard.id);

        // We must re-fetch state to get the correct activeArtboard for the layers functions
        let currentYOffset = 0;

        for (const section of page.sections) {
          const block =
            SECTION_BLOCKS.find((b) => b.id === section.type) ||
            SECTION_BLOCKS.find((b) => b.id === 'hero-fullscreen')!;

          const title = section.title || block.name;
          const desc = section.content || block.description;

          const sState = useStore.getState() as any;

          // Background rect
          sState.addShapeLayer('rectangle', {
            name: `${title} — Background`,
            x: 0,
            y: currentYOffset,
            width: 1440,
            height: block.defaultHeight,
            color: block.category === 'Navigation' ? '#0f172a' : block.category === 'Footer' ? '#0f172a' : '#1e293b',
            opacity: 1,
            cornerRadius: 0,
          });

          // Title text
          sState.addTextLayer({
            name: `${title} — Heading`,
            text: title,
            x: 80,
            y: currentYOffset + 40,
            width: 700,
            height: 60,
            fontSize: block.category === 'Hero' ? 72 : 36,
            fontWeight: '800',
            fontFamily: generated.siteSettings.fontFamily || 'Inter',
            color: '#ffffff',
            opacity: 1,
            textAlign: 'left',
          });

          // Subtitle / description
          sState.addTextLayer({
            name: `${title} — Subtitle`,
            text: desc,
            x: 80,
            y: currentYOffset + 120,
            width: 600,
            height: 40,
            fontSize: 18,
            fontWeight: '400',
            fontFamily: generated.siteSettings.fontFamily || 'Inter',
            color: '#94a3b8',
            opacity: 1,
            textAlign: 'left',
          });

          if (['Hero', 'CTA'].includes(block.category)) {
            sState.addShapeLayer('rectangle', {
              name: `${title} — CTA Button`,
              x: 80,
              y: currentYOffset + block.defaultHeight - 120,
              width: 180,
              height: 52,
              color: generated.siteSettings.primaryColor || '#6366f1',
              cornerRadius: 10,
              opacity: 1,
            });
            sState.addTextLayer({
              name: `${title} — CTA Label`,
              text: 'Get Started',
              x: 80,
              y: currentYOffset + block.defaultHeight - 120,
              width: 180,
              height: 52,
              fontSize: 16,
              fontWeight: '700',
              fontFamily: generated.siteSettings.fontFamily || 'Inter',
              color: '#ffffff',
              opacity: 1,
              textAlign: 'center',
            });
          }

          currentYOffset += block.defaultHeight;
        }
      }

      setShowAIModal(false);
      setAIPromptText('');
    } catch (e) {
      console.error(e);
      alert('Failed to generate website with AI.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleDeployToVercel = async () => {
    if (!vercelToken.trim()) {
      setDeployError('Please provide a valid Vercel API Token.');
      return;
    }

    setIsDeploying(true);
    setDeployError('');
    try {
      localStorage.setItem('vercel_token', vercelToken);

      const result = await exportWebsite(websitePages, siteSettings);

      const vercelFiles = [
        ...result.pages.map((p) => ({ file: p.filename, data: p.html })),
        { file: 'styles.css', data: result.css },
      ];

      const deployRes = await deployToVercel(vercelFiles, vercelToken, siteSettings?.name || 'kreathief-site');
      setDeployUrl(deployRes.url);
    } catch (err: any) {
      setDeployError(err.message || 'Deployment failed');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDownloadZip = async () => {
    try {
      await downloadWebsiteAsZip(websitePages, siteSettings, siteSettings?.name);
    } catch (error) {
      console.error('Failed to export zip:', error);
      alert('Failed to generate ZIP file.');
    }
  };

  const filteredSections = SECTION_BLOCKS.filter((b) => {
    const matchesCategory = activeCategory === 'All' || b.category === activeCategory;
    const matchesSearch =
      !sectionSearch ||
      b.name.toLowerCase().includes(sectionSearch.toLowerCase()) ||
      b.tags.some((t) => t.includes(sectionSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <PanelErrorBoundary componentName="WebsitePanel">
      <div className="flex flex-col h-full bg-surface-dark-2 text-white">
        {/* Header */}
        <div className="p-4 border-b border-surface-dark-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold tracking-wide uppercase flex items-center gap-2">
                <Icons.Globe className="w-4 h-4 text-brand-400" />
                Website Builder
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{siteSettings?.name || 'Untitled Site'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeployModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition-all shadow-glow-brand"
                title="Publish Website"
              >
                <Icons.Rocket className="w-3.5 h-3.5" />
                Publish
              </button>
              {/* Website mode toggle */}
              <button
                onClick={() => setWebsiteMode(!websiteMode)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  websiteMode
                    ? 'bg-surface-dark-1 border border-brand-500/30 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
                title={websiteMode ? 'Exit Website Mode' : 'Enable Website Mode'}
              >
                <Icons.Globe className="w-3.5 h-3.5" />
                {websiteMode ? 'Active' : 'Enable'}
              </button>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-lg bg-surface-dark-0 p-0.5">
            {(
              [
                { key: 'pages', label: 'Pages', icon: Icons.FileText },
                { key: 'sections', label: 'Sections', icon: Icons.LayoutGrid },
                { key: 'settings', label: 'Settings', icon: Icons.Settings },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as ActiveTab)}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab.key ? 'bg-surface-dark-2 text-white shadow' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ===== PAGES TAB ===== */}
          {activeTab === 'pages' && (
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  {websitePages.length} {websitePages.length === 1 ? 'Page' : 'Pages'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAIModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-600/20 hover:bg-brand-600/40 text-brand-400 text-xs font-semibold rounded-lg transition-colors border border-brand-500/30"
                    title="Generate Website with AI"
                  >
                    <Icons.Sparkles className="w-3.5 h-3.5" />
                    Auto-Build
                  </button>
                  <button
                    onClick={handleAddPage}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-dark-1 hover:bg-surface-dark-0 border border-surface-dark-0 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Icons.Plus className="w-3.5 h-3.5" />
                    New
                  </button>
                </div>
              </div>

              {websitePages.length === 0 && (
                <div className="text-center py-10 px-4">
                  <Icons.Globe className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-300 mb-1">No Website Pages Yet</p>
                  <p className="text-xs text-gray-500 mb-4">
                    Click "Add Page" to create your first website page. Each page is a 1440px artboard.
                  </p>
                  <button
                    onClick={handleAddPage}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-sm font-semibold rounded-xl transition-colors"
                  >
                    Create Home Page
                  </button>
                </div>
              )}

              {websitePages.map((artboard: Artboard, index: number) => {
                const page = (artboard as any).websitePage || {};
                const isActive = artboard.id === activeArtboardId;
                return (
                  <div
                    key={artboard.id}
                    onClick={() => setActiveArtboardId(artboard.id)}
                    className={`group relative rounded-xl border p-3 cursor-pointer transition-all ${
                      isActive
                        ? 'bg-surface-dark-1/80 border-brand-500/70 ring-1 ring-brand-500/20'
                        : 'bg-surface-dark-0/40 border-surface-dark-1/50 hover:bg-surface-dark-1/40'
                    }`}
                  >
                    {/* Page header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {page.isHomePage && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-brand-600/30 text-brand-300 rounded font-semibold uppercase tracking-wider">
                              Home
                            </span>
                          )}
                          {page.hidden && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-gray-600/30 text-gray-400 rounded font-semibold">
                              Hidden
                            </span>
                          )}
                          <span
                            className={`text-xs font-semibold truncate ${isActive ? 'text-brand-300' : 'text-gray-200'}`}
                          >
                            {artboard.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono mt-0.5 block truncate">
                          {page.slug || '/'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPageId(editingPageId === artboard.id ? null : artboard.id);
                          }}
                          className="p-1 rounded text-gray-400 hover:text-brand-400 hover:bg-surface-dark-2 transition-colors"
                          title="Page settings"
                        >
                          <Icons.Settings className="w-3 h-3" />
                        </button>
                        {websitePages.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePage(artboard.id);
                            }}
                            className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-surface-dark-2 transition-colors"
                            title="Delete page"
                          >
                            <Icons.Trash className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Page info chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] bg-surface-dark-1 text-gray-400 px-1.5 py-0.5 rounded border border-surface-dark-0">
                        {artboard.layers?.length || 0} layers
                      </span>
                      <span className="text-[9px] bg-surface-dark-1 text-gray-400 px-1.5 py-0.5 rounded border border-surface-dark-0">
                        {artboard.width}x{artboard.height}
                      </span>
                    </div>

                    {/* Expanded SEO settings */}
                    {editingPageId === artboard.id && (
                      <div
                        className="mt-3 pt-3 border-t border-surface-dark-0 space-y-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label className="block">
                          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                            Page Title (SEO)
                          </span>
                          <input
                            type="text"
                            value={page.title || ''}
                            onChange={(e) => handleUpdatePageMeta(artboard.id, 'title', e.target.value)}
                            placeholder="e.g. Home | My Brand"
                            className="w-full mt-1 bg-surface-dark-0 border border-surface-dark-1 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 placeholder-gray-600"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                            URL Slug
                          </span>
                          <input
                            type="text"
                            value={page.slug || '/'}
                            onChange={(e) => handleUpdatePageMeta(artboard.id, 'slug', e.target.value)}
                            placeholder="/about"
                            className="w-full mt-1 bg-surface-dark-0 border border-surface-dark-1 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono placeholder-gray-600"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                            Meta Description
                          </span>
                          <textarea
                            value={page.metaDescription || ''}
                            onChange={(e) => handleUpdatePageMeta(artboard.id, 'metaDescription', e.target.value)}
                            placeholder="Describe this page for search engines..."
                            rows={2}
                            className="w-full mt-1 bg-surface-dark-0 border border-surface-dark-1 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 resize-none placeholder-gray-600"
                          />
                          <span
                            className={`text-[9px] ${(page.metaDescription || '').length > 160 ? 'text-red-400' : 'text-gray-500'}`}
                          >
                            {(page.metaDescription || '').length}/160
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!page.hidden}
                            onChange={(e) => handleUpdatePageMeta(artboard.id, 'hidden', !e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-xs text-gray-300">Show in navigation menu</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!page.isHomePage}
                            onChange={(e) => handleUpdatePageMeta(artboard.id, 'isHomePage', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-xs text-gray-300">Set as Home Page (/)</span>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Non-website artboards notice */}
              {artboards.filter((a: Artboard) => !(a as any).websitePage).length > 0 && (
                <div className="mt-4 p-3 rounded-xl border border-dashed border-surface-dark-1/60 text-center">
                  <p className="text-[10px] text-gray-500">
                    {artboards.filter((a: Artboard) => !(a as any).websitePage).length} non-website artboard(s) on
                    canvas
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ===== SECTIONS TAB ===== */}
          {activeTab === 'sections' && (
            <div className="flex flex-col h-full">
              {/* Search */}
              <div className="p-3 border-b border-surface-dark-0">
                <div className="relative">
                  <Icons.Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    value={sectionSearch}
                    onChange={(e) => setSectionSearch(e.target.value)}
                    placeholder="Search sections..."
                    className="w-full bg-surface-dark-0 border border-surface-dark-1 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 placeholder-gray-600"
                  />
                </div>
              </div>

              {/* Category pills */}
              <div className="flex gap-1.5 px-3 py-2 border-b border-surface-dark-0 overflow-x-auto no-scrollbar">
                {(['All', ...SECTION_CATEGORIES] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat as any)}
                    className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                      activeCategory === cat
                        ? 'bg-brand-600 text-white shadow'
                        : 'bg-surface-dark-0 text-gray-400 hover:bg-surface-dark-1 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Section grid */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {filteredSections.map((block) => (
                  <div
                    key={block.id}
                    className="group flex items-start gap-3 p-2.5 rounded-xl border border-surface-dark-1/40 hover:border-brand-500/30 bg-surface-dark-0/30 hover:bg-surface-dark-1/50 transition-all cursor-pointer"
                    onClick={() => handleInsertSection(block)}
                    title={`Insert ${block.name}`}
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-surface-dark-1 border border-surface-dark-0 flex items-center justify-center">
                      {block.category === 'Hero' && <Icons.Monitor className="w-5 h-5 text-brand-400" />}
                      {block.category === 'Navigation' && <Icons.LayoutGrid className="w-5 h-5 text-blue-400" />}
                      {block.category === 'Features' && <Icons.Zap className="w-5 h-5 text-yellow-400" />}
                      {block.category === 'Testimonials' && <Icons.MessageSquare className="w-5 h-5 text-green-400" />}
                      {block.category === 'Pricing' && <Icons.DollarSign className="w-5 h-5 text-emerald-400" />}
                      {block.category === 'Team' && <Icons.Users className="w-5 h-5 text-purple-400" />}
                      {block.category === 'Gallery' && <Icons.Image className="w-5 h-5 text-pink-400" />}
                      {block.category === 'Blog' && <Icons.BookOpen className="w-5 h-5 text-orange-400" />}
                      {block.category === 'Contact' && <Icons.Mail className="w-5 h-5 text-cyan-400" />}
                      {block.category === 'FAQ' && <Icons.Help className="w-5 h-5 text-teal-400" />}
                      {block.category === 'CTA' && <Icons.Zap className="w-5 h-5 text-red-400" />}
                      {block.category === 'Footer' && <Icons.LayoutGrid className="w-5 h-5 text-gray-400" />}
                      {block.category === 'E-commerce' && <Icons.ShoppingCart className="w-5 h-5 text-rose-400" />}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white group-hover:text-brand-300 transition-colors truncate">
                          {block.name}
                        </span>
                        {block.isPremium && (
                          <span className="text-[8px] px-1 py-0.5 bg-yellow-500/20 text-yellow-400 rounded font-bold tracking-wider flex-shrink-0">
                            PRO
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{block.description}</p>
                      {block.variants && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {block.variants.map((v) => (
                            <span
                              key={v}
                              className="text-[8px] px-1.5 py-0.5 bg-surface-dark-2 text-gray-400 rounded border border-surface-dark-0"
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Insert indicator */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Icons.Plus className="w-4 h-4 text-brand-400" />
                    </div>
                  </div>
                ))}
                {filteredSections.length === 0 && (
                  <div className="text-center py-10">
                    <Icons.Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No sections match your search</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== SETTINGS TAB ===== */}
          {activeTab === 'settings' && (
            <div className="p-4 space-y-5">
              {/* Site Identity */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Site Identity</h3>
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-[11px] text-gray-400 font-medium">Site Name</span>
                    <input
                      type="text"
                      value={siteSettings?.name || ''}
                      onChange={(e) => updateSiteSettings({ name: e.target.value })}
                      placeholder="My Website"
                      className="w-full mt-1 bg-surface-dark-0 border border-surface-dark-1 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 placeholder-gray-600"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-gray-400 font-medium">Default Meta Description</span>
                    <textarea
                      value={siteSettings?.defaultMetaDescription || ''}
                      onChange={(e) => updateSiteSettings({ defaultMetaDescription: e.target.value })}
                      placeholder="Describe your website for search engines..."
                      rows={2}
                      className="w-full mt-1 bg-surface-dark-0 border border-surface-dark-1 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 resize-none placeholder-gray-600"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-gray-400 font-medium">Favicon URL</span>
                    <input
                      type="text"
                      value={siteSettings?.faviconUrl || ''}
                      onChange={(e) => updateSiteSettings({ faviconUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full mt-1 bg-surface-dark-0 border border-surface-dark-1 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 placeholder-gray-600 font-mono"
                    />
                  </label>
                </div>
              </div>

              {/* Design System */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Design System</h3>
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-[11px] text-gray-400 font-medium">Primary Color</span>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={siteSettings?.primaryColor || '#6366f1'}
                        onChange={(e) => updateSiteSettings({ primaryColor: e.target.value })}
                        className="w-9 h-9 rounded-lg border border-surface-dark-1 cursor-pointer bg-surface-dark-0"
                      />
                      <input
                        type="text"
                        value={siteSettings?.primaryColor || '#6366f1'}
                        onChange={(e) => updateSiteSettings({ primaryColor: e.target.value })}
                        className="flex-1 bg-surface-dark-0 border border-surface-dark-1 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-gray-400 font-medium">Font Family</span>
                    <select
                      value={siteSettings?.fontFamily || 'Inter'}
                      onChange={(e) => updateSiteSettings({ fontFamily: e.target.value })}
                      className="w-full mt-1 bg-surface-dark-0 border border-surface-dark-1 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    >
                      {[
                        'Inter',
                        'Roboto',
                        'Poppins',
                        'Montserrat',
                        'Raleway',
                        'Open Sans',
                        'Lato',
                        'Playfair Display',
                        'Bebas Neue',
                        'DM Sans',
                      ].map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-gray-400 font-medium">Navigation Style</span>
                    <div className="flex gap-2 mt-1">
                      {(['solid', 'transparent', 'sticky'] as const).map((style) => (
                        <button
                          key={style}
                          onClick={() => updateSiteSettings({ navStyle: style })}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold capitalize transition-all ${
                            siteSettings?.navStyle === style
                              ? 'bg-brand-600 text-white'
                              : 'bg-surface-dark-0 text-gray-400 hover:bg-surface-dark-1'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </label>
                </div>
              </div>

              {/* Analytics & Integration */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Analytics & Integrations
                </h3>
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-[11px] text-gray-400 font-medium">Google Analytics ID</span>
                    <input
                      type="text"
                      value={siteSettings?.googleAnalyticsId || ''}
                      onChange={(e) => updateSiteSettings({ googleAnalyticsId: e.target.value })}
                      placeholder="G-XXXXXXXXXX"
                      className="w-full mt-1 bg-surface-dark-0 border border-surface-dark-1 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono placeholder-gray-600"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-gray-400 font-medium">Custom Domain</span>
                    <input
                      type="text"
                      value={siteSettings?.customDomain || ''}
                      onChange={(e) => updateSiteSettings({ customDomain: e.target.value })}
                      placeholder="www.mysite.com"
                      className="w-full mt-1 bg-surface-dark-0 border border-surface-dark-1 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono placeholder-gray-600"
                    />
                  </label>
                </div>
              </div>

              {/* Code Injection */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Code Injection</h3>
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-[11px] text-gray-400 font-medium">Global Head Code</span>
                    <textarea
                      value={siteSettings?.globalHeadCode || ''}
                      onChange={(e) => updateSiteSettings({ globalHeadCode: e.target.value })}
                      placeholder="<!-- Custom scripts, meta tags... -->"
                      rows={3}
                      className="w-full mt-1 bg-surface-dark-0 border border-surface-dark-1 rounded-lg px-3 py-2 text-[10px] text-green-300 focus:outline-none focus:border-brand-500 resize-none placeholder-gray-600 font-mono"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-gray-400 font-medium">Global Footer Code</span>
                    <textarea
                      value={siteSettings?.globalFooterCode || ''}
                      onChange={(e) => updateSiteSettings({ globalFooterCode: e.target.value })}
                      placeholder="<!-- Analytics, chat widgets... -->"
                      rows={3}
                      className="w-full mt-1 bg-surface-dark-0 border border-surface-dark-1 rounded-lg px-3 py-2 text-[10px] text-green-300 focus:outline-none focus:border-brand-500 resize-none placeholder-gray-600 font-mono"
                    />
                  </label>
                </div>
              </div>

              {/* Export / Publish */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Publish & Export</h3>
                <div className="space-y-2">
                  <button
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-emerald-900/30"
                    onClick={() => {
                      const toastStore = useStore.getState() as any;
                      if (toastStore.addToast) {
                        toastStore.addToast({
                          message: 'Website HTML exported successfully',
                          type: 'success',
                        });
                      }
                      // Export triggered via ExportModal
                      if (toastStore.setShowExportModal) {
                        toastStore.setShowExportModal(true);
                      }
                    }}
                  >
                    <Icons.Download className="w-4 h-4" />
                    Export as HTML/CSS
                  </button>
                  <button
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface-dark-0 hover:bg-surface-dark-1 text-gray-300 text-sm font-semibold rounded-xl transition-colors border border-surface-dark-1"
                    onClick={() => {
                      const s = useStore.getState() as any;
                      s.addToast?.({ message: 'Vercel deploy coming in next update', type: 'info' });
                    }}
                  >
                    <Icons.Globe className="w-4 h-4" />
                    Publish to Vercel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Modal Overlay */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-dark-2 border border-surface-dark-1 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-surface-dark-1 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Icons.Sparkles className="w-4 h-4 text-brand-400" />
                Generate Website Structure
              </h3>
              <button
                onClick={() => !isGeneratingAI && setShowAIModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Describe the website you want to build. Our AI will automatically create the pages, select the best
                structural sections (heroes, features, footers), and lay them out on the canvas.
              </p>
              <textarea
                value={aiPromptText}
                onChange={(e) => setAIPromptText(e.target.value)}
                placeholder="E.g., A minimalist portfolio for a freelance photographer. Dark theme, a big hero image, a masonry gallery, and a simple contact page."
                className="w-full h-32 bg-surface-dark-1 border border-surface-dark-0 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder-gray-500 mb-6"
                disabled={isGeneratingAI}
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAIModal(false)}
                  disabled={isGeneratingAI}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateWebsite}
                  disabled={isGeneratingAI || !aiPromptText.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-surface-dark-1 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
                >
                  {isGeneratingAI ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Icons.Wand2 className="w-4 h-4" />
                      Generate Website
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vercel Deployment & Export Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-dark-2 border border-surface-dark-1 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-surface-dark-1 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Icons.Rocket className="w-4 h-4 text-brand-400" />
                Publish Website
              </h3>
              <button
                onClick={() => !isDeploying && setShowDeployModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {deployUrl ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                    <Icons.Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Deployment Successful!</h4>
                  <p className="text-sm text-gray-400 mb-6">Your website is now live on Vercel.</p>

                  <div className="flex items-center justify-center gap-3">
                    <a
                      href={deployUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-glow-brand transition-all flex items-center gap-2"
                    >
                      <Icons.ExternalLink className="w-4 h-4" />
                      Visit Site
                    </a>
                    <button
                      onClick={() => setDeployUrl('')}
                      className="px-6 py-2.5 bg-surface-dark-1 hover:bg-surface-dark-0 text-white font-semibold rounded-xl border border-surface-dark-0 transition-all"
                    >
                      Deploy Again
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                      <Icons.Download className="w-4 h-4 text-gray-400" />
                      Download Source Code
                    </h4>
                    <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                      Export your Kreathief artboards as clean HTML and CSS files packed in a ZIP archive.
                    </p>
                    <button
                      onClick={handleDownloadZip}
                      className="w-full px-4 py-2 bg-surface-dark-1 hover:bg-surface-dark-0 border border-surface-dark-0 rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-2"
                    >
                      <Icons.Download className="w-4 h-4" />
                      Download ZIP
                    </button>
                  </div>

                  <div className="relative py-2 mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-surface-dark-1"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-2 bg-surface-dark-2 text-xs text-gray-500 font-semibold uppercase">
                        OR DEPLOY LIVE
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                      <svg
                        viewBox="0 0 76 65"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-white"
                      >
                        <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor" />
                      </svg>
                      Deploy to Vercel
                    </h4>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                      Push your website directly to your Vercel account. Provide a{' '}
                      <a
                        href="https://vercel.com/account/tokens"
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-400 hover:underline"
                      >
                        Vercel API Token
                      </a>{' '}
                      to authorize the deployment.
                    </p>

                    <div className="space-y-3 mb-6">
                      <input
                        type="password"
                        value={vercelToken}
                        onChange={(e) => setVercelToken(e.target.value)}
                        placeholder="Vercel API Token (e.g., k39d8x...)"
                        className="w-full bg-surface-dark-1 border border-surface-dark-0 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder-gray-500"
                        disabled={isDeploying}
                      />
                      {deployError && (
                        <p className="text-xs text-red-400 font-medium bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                          {deployError}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowDeployModal(false)}
                        disabled={isDeploying}
                        className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeployToVercel}
                        disabled={isDeploying || !vercelToken.trim() || websitePages.length === 0}
                        className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-surface-dark-1 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-glow-brand"
                      >
                        {isDeploying ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Deploying...
                          </>
                        ) : (
                          <>
                            <Icons.Rocket className="w-4 h-4" />
                            Deploy Now
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </PanelErrorBoundary>
  );
};

export default WebsitePanel;
