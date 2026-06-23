import React, { useMemo, useState, useEffect } from 'react';
import { AppMode, AspectRatio, ShapeLayer } from '../../types';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { STARTER_TEMPLATES } from '../../data/templates';
import { communityService, CommunityTemplate } from '../../services/communityService';
import { PanelErrorBoundary } from './PanelErrorBoundary';
import { ConfirmModal } from '../modals/ConfirmModal';

interface TemplatesPanelProps {
  setPrompt: (s: string) => void;
  setAspectRatio: (a: AspectRatio) => void;
  onSetMode: (m: AppMode) => void;
  onApplyLayout?: (shapes: Partial<ShapeLayer>[]) => void;
  onApplyTemplate?: (templateId: string, confirmReplace?: boolean) => void;
  onApplyTheme?: (colors: string[]) => void;
}

const DESIGN_CATEGORIES = [
  { id: 'All', label: 'All Designs', icon: Icons.Grid, color: 'from-gray-700 to-gray-900' },
  { id: 'Social', label: 'Social Media', icon: Icons.Image, color: 'from-pink-500 to-rose-600' },
  { id: 'Business', label: 'Business', icon: Icons.Briefcase, color: 'from-blue-600 to-indigo-700' },
  { id: 'Video', label: 'Video & Thumbnails', icon: Icons.Monitor, color: 'from-red-500 to-orange-600' },
  { id: 'Personal', label: 'Personal', icon: Icons.User, color: 'from-green-500 to-emerald-600' },
];

const THEMES = [
  { name: 'Midnight', colors: ['#0f172a', '#1e293b', '#38bdf8', '#f8fafc'] },
  { name: 'Neon', colors: ['#09090b', '#27272a', '#d946ef', '#22d3ee'] },
  { name: 'Sunset', colors: ['#fff7ed', '#fed7aa', '#f97316', '#431407'] },
  { name: 'Solarized', colors: ['#002b36', '#073642', '#268bd2', '#859900'] },
  { name: 'Nordic', colors: ['#2e3440', '#3b4252', '#88c0d0', '#eceff4'] },
  { name: 'Amethyst', colors: ['#1a1a2e', '#16213e', '#7d2ae8', '#e94560'] },
  { name: 'Luxury', colors: ['#0c0a09', '#1c1917', '#d6d3d1', '#e7e5e4'] },
  { name: 'Corporate', colors: ['#ffffff', '#f1f5f9', '#3b82f6', '#1e3a8a'] },
];

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  setPrompt: _setPrompt,
  setAspectRatio: _setAspectRatio,
  onSetMode: _onSetMode,
  onApplyLayout,
  onApplyTemplate,
  onApplyTheme,
}) => {
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showReplaceWarning, setShowReplaceWarning] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'starter' | 'community'>('starter');
  const [communityTemplates, setCommunityTemplates] = useState<CommunityTemplate[]>([]);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const favoriteTemplates = useStore((state) => state.favoriteTemplates);
  const initializeProject = useStore((state) => state.initializeProject);

  useEffect(() => {
    if (activeTab === 'community') {
      loadCommunity();
    }
  }, [activeTab, category, searchQuery]);

  const loadCommunity = async () => {
    setIsLoadingCommunity(true);
    const data = await communityService.fetchTemplates(category, searchQuery);
    setCommunityTemplates(data);
    setIsLoadingCommunity(false);
  };

  const handleApplyCommunity = (tmpl: CommunityTemplate) => {
    if (!showReplaceWarning) {
      initializeProject(tmpl.state);
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Apply Template?',
      message: 'Apply community template? This will replace your current project.',
      onConfirm: () => initializeProject(tmpl.state),
    });
  };

  const activeCategoryLabel = DESIGN_CATEGORIES.find((c) => c.id === category)?.label || 'All Designs';

  const grids = [
    {
      name: '2-Up Horizontal',
      icon: Icons.LayoutRow,
      shapes: [
        { type: 'rectangle', x: 20, y: 20, width: 226, height: 472, color: '#2a2a2a' },
        { type: 'rectangle', x: 266, y: 20, width: 226, height: 472, color: '#2a2a2a' },
      ],
    },
    {
      name: '3-Column',
      icon: Icons.LayoutCol,
      shapes: [
        { type: 'rectangle', x: 20, y: 20, width: 144, height: 472, color: '#2a2a2a' },
        { type: 'rectangle', x: 184, y: 20, width: 144, height: 472, color: '#333' },
        { type: 'rectangle', x: 348, y: 20, width: 144, height: 472, color: '#2a2a2a' },
      ],
    },
    {
      name: 'Hero Split',
      icon: Icons.LayoutRow,
      shapes: [
        { type: 'rectangle', x: 20, y: 20, width: 472, height: 226, color: '#222' },
        { type: 'rectangle', x: 20, y: 266, width: 226, height: 226, color: '#333' },
        { type: 'rectangle', x: 266, y: 266, width: 226, height: 226, color: '#444' },
      ],
    },
    {
      name: 'Grid 4',
      icon: Icons.Grid,
      shapes: [
        { type: 'rectangle', x: 20, y: 20, width: 226, height: 226, color: '#2a2a2a' },
        { type: 'rectangle', x: 266, y: 20, width: 226, height: 226, color: '#333' },
        { type: 'rectangle', x: 20, y: 266, width: 226, height: 226, color: '#333' },
        { type: 'rectangle', x: 266, y: 266, width: 226, height: 226, color: '#2a2a2a' },
      ],
    },
    { name: 'Golden Vertical', icon: Icons.LayoutCol, layout: 'golden_v' },
    { name: 'Golden Horizontal', icon: Icons.LayoutRow, layout: 'golden_h' },
    { name: 'Golden Grid', icon: Icons.Grid, layout: 'golden_grid' },
  ];

  const starterTemplates = useMemo(() => {
    let filtered = STARTER_TEMPLATES;
    if (category !== 'All') {
      filtered = filtered.filter((t) => t.category === category);
    }
    if (showFavoritesOnly) {
      filtered = filtered.filter((t) => favoriteTemplates.includes(t.id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t as any).description?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [category, showFavoritesOnly, favoriteTemplates, searchQuery]);

  return (
    <div data-testid="templates-panel" className="flex flex-col h-full bg-[#13161a]">
      {/* Header with Categories */}
      <div className="p-4 border-b border-gray-700 bg-[#13161a] sticky top-0 z-10">
        {category === 'All' ? (
          <div className="mb-2">
            <h3 className="text-white font-bold mb-3">Browse Categories</h3>
            <div data-testid="template-panel-category-filters" className="grid grid-cols-2 gap-2">
              {DESIGN_CATEGORIES.filter((c) => c.id !== 'All').map((c) => (
                <button
                  key={c.id}
                  data-testid={`template-panel-category-btn-${c.id.toLowerCase()}`}
                  onClick={() => setCategory(c.id)}
                  className={`relative h-16 rounded-lg overflow-hidden flex items-center justify-center group`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${c.color} opacity-80 group-hover:opacity-100 transition-opacity`}
                  ></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <c.icon className="w-5 h-5 text-white mb-1 drop-shadow-md" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wide drop-shadow-md">
                      {c.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-2">
            <button
              data-testid="template-panel-back-btn"
              onClick={() => setCategory('All')}
              className="p-1 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white"
            >
              <Icons.ArrowLeft className="w-4 h-4" />
            </button>
            <span data-testid="template-panel-category-title" className="text-sm font-bold text-white">
              {activeCategoryLabel}
            </span>
          </div>
        )}

        <div className="relative mt-2">
          <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            data-testid="template-panel-search-input"
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-[#7d2ae8]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-white"
            >
              <Icons.X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border w-full justify-center ${
              showFavoritesOnly
                ? 'bg-red-500/10 border-red-500/50 text-red-400'
                : 'bg-[#1e1e1e] border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            <Icons.Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            Favorites Only
          </button>
        </div>

        {/* Community Tabs */}
        <div className="flex gap-1 mt-4 p-0.5 bg-black/20 rounded-lg border border-white/5">
          <button
            onClick={() => setActiveTab('starter')}
            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${
              activeTab === 'starter' ? 'bg-[#7d2ae8] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Starter
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${
              activeTab === 'community' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Community ✦
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
        {activeTab === 'starter' ? (
          <>
            {/* Themes Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase">Color Themes</h4>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {THEMES.map((theme, i) => (
                  <button
                    key={i}
                    onClick={() => onApplyTheme && onApplyTheme(theme.colors)}
                    className="flex-shrink-0 group flex flex-col gap-1 w-12"
                    title={theme.name}
                  >
                    <div className="h-12 w-12 rounded-full overflow-hidden border border-gray-700 group-hover:border-white transition-colors relative flex flex-wrap">
                      {theme.colors.map((c, ci) => (
                        <div key={ci} style={{ backgroundColor: c }} className="w-1/2 h-1/2"></div>
                      ))}
                    </div>
                    <span className="text-[9px] text-gray-500 text-center truncate group-hover:text-gray-300">
                      {theme.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Layouts Section */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Quick Layouts</h4>
              <div className="grid grid-cols-4 gap-2">
                {grids.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (g.layout) {
                        onApplyLayout && (onApplyLayout as any)(g.layout);
                      } else {
                        onApplyLayout && onApplyLayout(g.shapes as any);
                      }
                    }}
                    className="aspect-square bg-[#1e1e1e] border border-gray-700 rounded hover:border-[#00c4cc] flex flex-col items-center justify-center text-gray-500 hover:text-white transition-all hover:bg-[#252627] gap-1"
                    title={g.name}
                  >
                    <g.icon className="w-5 h-5" />
                    <span className="text-[8px] font-medium hidden sm:block truncate w-full text-center px-1">
                      {g.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Starter Templates */}
            <div data-testid="template-panel-grid">
              {starterTemplates.length > 0 ? (
                <>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Professional Templates</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {starterTemplates.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        data-testid={`template-panel-btn-${tmpl.id}`}
                        onClick={() => {
                          if (!onApplyTemplate) {
                            return;
                          }
                          if (
                            !showReplaceWarning ||
                            (typeof window !== 'undefined' && (window as any).VITE_QA_BYPASS)
                          ) {
                            onApplyTemplate(tmpl.id, showReplaceWarning);
                          } else {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Apply Template?',
                              message: 'Apply template? This will replace your current design.',
                              onConfirm: () => onApplyTemplate(tmpl.id, showReplaceWarning),
                            });
                          }
                        }}
                        className="cursor-pointer group relative aspect-video rounded-lg overflow-hidden bg-[#1e1e1e] border border-gray-700 hover:border-[#7d2ae8] transition-all shadow-lg text-left"
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                          <Icons.Layout className="w-12 h-12" />
                        </div>
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-sm flex items-center justify-between">
                          <span className="font-semibold text-xs text-white truncate">{tmpl.name}</span>
                          <span className="text-[9px] text-gray-400">
                            {tmpl.size.width}×{tmpl.size.height}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-800 rounded-2xl">
                  <Icons.Search className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs font-bold">No templates match your search</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Community View */
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center justify-between">
              Community Creations
              {isLoadingCommunity && <Icons.Loader className="w-3 h-3 animate-spin text-orange-500" />}
            </h4>

            <div className="grid grid-cols-1 gap-4">
              {isLoadingCommunity && [1, 2, 3].map((i) => (
                <div key={`skel-${i}`} className="animate-pulse bg-[#1e1e1e] border border-gray-800 rounded-xl overflow-hidden">
                  <div className="aspect-video bg-white/5" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-2/3" />
                    <div className="h-3 bg-white/5 rounded w-1/3" />
                    <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
                      <div className="h-3 bg-white/5 rounded w-1/4" />
                      <div className="h-3 bg-white/5 rounded w-1/6" />
                    </div>
                  </div>
                </div>
              ))}
              {!isLoadingCommunity && communityTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => handleApplyCommunity(tmpl)}
                  className="bg-[#1e1e1e] border border-gray-800 rounded-xl overflow-hidden group cursor-pointer hover:border-orange-500 transition-all shadow-lg"
                >
                  <div className="aspect-video bg-black/40 relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <Icons.Layout className="w-12 h-12" />
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/5">
                      <Icons.Heart className="w-3 h-3 text-orange-500 fill-orange-500" />
                      <span className="text-[10px] text-white font-black">{tmpl.likes}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-white truncate">{tmpl.name}</h4>
                      <span className="text-[9px] font-black text-orange-500 uppercase tracking-wider">
                        {tmpl.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2">
                      <span className="text-[9px] text-gray-400">
                        by <span className="text-orange-400">{tmpl.userName}</span>
                      </span>
                      <span className="text-[9px] text-gray-600 font-mono">
                        {new Date(tmpl.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {communityTemplates.length === 0 && !isLoadingCommunity && (
                <div className="text-center py-12 px-4 border-2 border-dashed border-gray-800 rounded-2xl">
                  <Icons.Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No designs found</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 p-2 bg-black/20 rounded border border-white/5">
          <input
            id="warn-replace"
            type="checkbox"
            checked={showReplaceWarning}
            onChange={(e) => setShowReplaceWarning(e.target.checked)}
            className="accent-[#7d2ae8]"
          />
          <label htmlFor="warn-replace" className="text-[10px] text-gray-500 cursor-pointer select-none">
            Confirm before replacing design
          </label>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel="Apply"
        cancelLabel="Cancel"
        variant="warning"
      />
    </div>
  );
};

export default function TemplatesPanelWrapped(props: React.ComponentProps<typeof TemplatesPanel>) {
  return (
    <PanelErrorBoundary panelName="Templates">
      <TemplatesPanel {...props} />
    </PanelErrorBoundary>
  );
}
