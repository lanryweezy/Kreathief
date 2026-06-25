import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, User, CanvasSize } from '../types';
import { Icons } from '../constants';
import { STARTER_TEMPLATES, createProjectFromTemplate } from '../data/templates';
import { ConfirmModal } from './modals/ConfirmModal';
import { CreateProjectModal } from './modals/CreateProjectModal';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import CommunityTemplates from './CommunityTemplates';
import { EmptyState } from './EmptyState';
import { Button } from './Button';
import * as geminiService from '../services/geminiService';
import { log } from '../utils/log';

interface DashboardProps {
  user: User;
  onOpenProject: (project: Project) => void;
  onCreateProject: () => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onOpenProject, onCreateProject, onLogout }) => {
  const {
    projects,
    loadAllProjects,
    deleteProject,
    duplicateProject,
    updateProject,
    createProject,
    loadProject,
    favoriteProjects,
    toggleFavoriteProject,
    shareToCommunity,
    addToast,
  } = useStore(
    useShallow((state) => ({
      projects: state.projects,
      loadAllProjects: state.loadAllProjects,
      deleteProject: state.deleteProject,
      duplicateProject: state.duplicateProject,
      updateProject: state.updateProject,
      createProject: state.createProject,
      loadProject: state.loadProject,
      favoriteProjects: state.favoriteProjects,
      toggleFavoriteProject: state.toggleFavoriteProject,
      shareToCommunity: state.shareToCommunity,
      addToast: state.addToast,
    }))
  );

  const [sidebarTab, setSidebarTab] = useState<'projects' | 'templates' | 'community'>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // AI Prompt state
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedFormat, setSelectedFormat] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const aiInputRef = useRef<HTMLTextAreaElement>(null);

  const FORMAT_OPTIONS: { label: string; size: CanvasSize }[] = [
    { label: 'Instagram Post', size: { width: 1080, height: 1080, name: 'Instagram Post' } },
    { label: 'Story / Reel', size: { width: 1080, height: 1920, name: 'Story / Reel' } },
    { label: 'YouTube Thumbnail', size: { width: 1280, height: 720, name: 'YouTube Thumbnail' } },
    { label: 'Facebook Post', size: { width: 1200, height: 630, name: 'Facebook Post' } },
    { label: 'Logo', size: { width: 1080, height: 1080, name: 'Logo' } },
    { label: 'Presentation', size: { width: 1920, height: 1080, name: 'Presentation' } },
  ];

  const STYLE_SUGGESTIONS = [
    'Modern minimalist', 'Bold and vibrant', 'Elegant luxury',
    'Neon cyberpunk', 'Warm earthy tones', 'Clean corporate',
  ];

  const handleAIGenerate = useCallback(async () => {
    if (!aiPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    const format = FORMAT_OPTIONS[selectedFormat];
    try {
      addToast('Generating your design...', 'info');
      const enhancedPrompt = `${aiPrompt.trim()}. Style: professional, high quality, suitable for ${format.label}. Clean composition, good typography.`;
      const aspectRatio = format.size.width > format.size.height ? '16:9' : format.size.width === format.size.height ? '1:1' : '9:16';
      const imageUrl = await geminiService.generateImage(enhancedPrompt, aspectRatio, 'standard');

      const imageLayer = {
        id: `ai_img_${Date.now()}`, type: 'image' as const, name: 'AI Generated',
        src: imageUrl, x: 0, y: 0, width: format.size.width, height: format.size.height,
        rotation: 0, opacity: 1, locked: false, visible: true, flipX: false, flipY: false,
        filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0, hueRotate: 0, vignette: 0, opacity: 1 },
        blendMode: 'normal', skewX: 0, skewY: 0, perspective: 0, rotateX: 0, rotateY: 0,
      };

      const title = aiPrompt.trim().length > 40 ? aiPrompt.trim().slice(0, 40) + '...' : aiPrompt.trim();
      const initialState = {
        artboards: [{ id: 'default', name: 'Artboard 1', x: 0, y: 0, width: format.size.width, height: format.size.height, layers: [imageLayer] }],
        activeArtboardId: 'default', canvasBackgroundColor: '#ffffff',
        canvasFilters: { brightness: 100, contrast: 100, saturation: 100, sepia: 0, grayscale: 0, blur: 0, opacity: 1, vignette: 0, hueRotate: 0 },
        canvasSize: format.size,
      };

      const projectId = await createProject(title, format.size, initialState);
      const allProjects = useStore.getState().projects;
      const created = allProjects.find((p) => p.id === projectId);
      if (created) {
        loadProject(created.id);
        addToast('Design created! Opening editor...', 'success');
        onOpenProject(created);
      }
    } catch (error) {
      log.error('[DashboardAI] Generation failed', error);
      addToast('Generation failed. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [aiPrompt, selectedFormat, isGenerating, createProject, loadProject, addToast, onOpenProject]);

  useEffect(() => {
    loadAllProjects().then(() => setIsLoading(false));
  }, [loadAllProjects]);

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; projectId: string | null }>({
    isOpen: false,
    projectId: null,
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, projectId: id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.projectId) {
      return;
    }
    await deleteProject(deleteConfirm.projectId);
    setDeleteConfirm({ isOpen: false, projectId: null });
  };

  const handleCreateClick = () => {
    setCreateModalOpen(true);
  };

  const handleDuplicate = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setDuplicatingId(project.id);
    try {
      await duplicateProject(project);
    } finally {
      setDuplicatingId(null);
    }
  };

  const startRenaming = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setNewName(project.name);
  };

  const handleRename = async (id: string) => {
    if (!newName.trim()) {
      setEditingProjectId(null);
      return;
    }
    await updateProject(id, { name: newName });
    setEditingProjectId(null);
  };

  const handleStartFromTemplate = async (templateId: string) => {
    const template = STARTER_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      return;
    }

    const newProject = createProjectFromTemplate(template);
    const remixedState = {
      artboards: newProject.state.artboards || [
        {
          id: 'default',
          name: 'Artboard 1',
          x: 0,
          y: 0,
          width: newProject.state.canvasSize?.width || 1080,
          height: newProject.state.canvasSize?.height || 1080,
          layers: (newProject.state as any).layers || [],
        },
      ],
      activeArtboardId: newProject.state.activeArtboardId || 'default',
      canvasBackgroundColor: newProject.state.canvasBackgroundColor || '#ffffff',
      canvasFilters: newProject.state.canvasFilters || {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        opacity: 1,
        vignette: 0,
        sepia: 0,
        grayscale: 0,
        hueRotate: 0,
      },
      canvasSize: newProject.state.canvasSize || { width: 1080, height: 1080, name: 'Instagram Post' },
    };
    const newProjectId = await createProject(newProject.name, newProject.state.canvasSize, remixedState);

    // Wait for store to update, then open the new project
    setTimeout(() => {
      const allProjects = useStore.getState().projects;
      const createdProject = allProjects.find((p) => p.id === newProjectId);
      if (createdProject) {
        loadProject(createdProject.id);
        onOpenProject(createdProject);
      } else {
        onCreateProject();
      }
    }, 0);
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorites = !showFavoritesOnly || favoriteProjects.includes(p.id);
    return matchesSearch && matchesFavorites;
  });

  const filteredTemplates = STARTER_TEMPLATES.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-surface-dark-0 text-white flex flex-col relative z-0">
      {/* Header */}
      <header className="h-20 bg-surface-dark-1/80 border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-30 backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-glow-brand">
            <Icons.Magic className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase">Kreathief</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative hidden md:block group">
            <Icons.Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-brand-500 transition-colors"
              aria-hidden="true"
            />
            <input
              data-testid="dashboard-search-input"
              type="text"
              placeholder="Search designs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search designs"
              className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-xs uppercase tracking-widest font-black w-64 focus:outline-none focus:border-brand-500 focus:w-80 transition-all"
            />
          </div>

          <div className="h-8 w-px bg-white/10 mx-2"></div>

          <div
            className="flex items-center gap-4 group relative"
            onMouseLeave={() => {
              if (profileDropdownOpen) setProfileDropdownOpen(false);
            }}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setProfileDropdownOpen(false);
              }
            }}
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-black uppercase tracking-widest text-white">{user.name}</div>
              <div className="text-[9px] text-brand-400 uppercase font-black tracking-widest">{user.plan} Plan</div>
            </div>
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e: any) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const avatarUrl = evt.target?.result as string;
                      useStore.getState().setUser({
                        ...user,
                        avatar: avatarUrl,
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              onFocus={() => setProfileDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setProfileDropdownOpen(true);
                }
                if (e.key === 'Escape') setProfileDropdownOpen(false);
              }}
              className="w-10 h-10 rounded-full border-2 border-white/10 group-hover:border-brand-500 focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/50 transition-colors overflow-hidden p-0.5 cursor-pointer relative"
              title="Click to update profile image"
              aria-label="Update profile image"
            >
              <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt="Profile" />
            </button>

            <div
              className="absolute right-0 top-full mt-4 w-56 bg-surface-dark-1 border border-white/10 rounded-xl shadow-2xl z-50 p-2 transition-all transform origin-top-right focus-within:opacity-100"
              role="menu"
              aria-label="Profile menu"
              tabIndex={-1}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setProfileDropdownOpen(false);
              }}
              style={{
                opacity: profileDropdownOpen ? 1 : 0,
                pointerEvents: profileDropdownOpen ? 'auto' : 'none',
                visibility: profileDropdownOpen ? 'visible' : 'hidden',
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileDropdownOpen(false);
                  onLogout();
                }}
                onKeyDown={(e) => e.key === 'Enter' && setProfileDropdownOpen(false)}
                className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 rounded-xl flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:bg-red-500/10"
                role="menuitem"
              >
                <Icons.MicOff className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            {/* AI Prompt */}
            <div className="relative mb-8">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-xl md:text-2xl font-black text-white mb-2 tracking-tight">What do you want to create?</h2>
                  <p className="text-xs text-muted-light font-medium">Describe your vision and AI will bring it to life</p>
                </div>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-brand-600/20 via-accent/20 to-brand-600/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-surface-dark-1 border border-white/10 rounded-2xl p-4 group-focus-within:border-brand-500/50 transition-colors">
                    <textarea
                      ref={aiInputRef}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAIGenerate(); } }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="A bold fitness gym ad with dark background and neon accents..."
                      rows={2}
                      className="w-full bg-transparent text-white text-sm md:text-base placeholder:text-muted resize-none focus:outline-none font-medium leading-relaxed"
                      disabled={isGenerating}
                    />
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {FORMAT_OPTIONS.map((format, idx) => (
                          <button key={format.label} onClick={() => setSelectedFormat(idx)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${selectedFormat === idx ? 'bg-brand-600 text-white shadow-glow-brand' : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white'}`}>
                            {format.label}
                          </button>
                        ))}
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleAIGenerate} disabled={!aiPrompt.trim() || isGenerating}
                        className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-accent rounded-xl text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-glow-brand hover:shadow-xl transition-shadow ml-3 shrink-0">
                        {isGenerating ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating</>) : (<><Icons.Magic className="w-4 h-4" />Generate</>)}
                      </motion.button>
                    </div>
                  </div>
                </div>
                <AnimatePresence>
                  {showSuggestions && !aiPrompt && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="mt-3 flex items-center gap-2 flex-wrap justify-center">
                      <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Try:</span>
                      {STYLE_SUGGESTIONS.map((s) => (
                        <button key={s} onMouseDown={(e) => { e.preventDefault(); setAiPrompt((prev) => prev ? `${prev}, ${s.toLowerCase()}` : s); setShowSuggestions(false); aiInputRef.current?.focus(); }}
                          className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-muted-light hover:text-white hover:border-brand-500/50 transition-all font-medium">
                          {s}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-start sm:items-center justify-between gap-4 mb-8 flex-col sm:flex-row">
              <div
                className="text-xl md:text-2xl font-bold flex items-center gap-3 md:gap-4 overflow-x-auto whitespace-nowrap pb-2 sm:pb-0 w-full sm:w-auto custom-scrollbar"
                role="tablist"
              >
                <button
                  role="tab"
                  data-testid="nav-projects"
                  aria-selected={sidebarTab === 'projects'}
                  onClick={() => setSidebarTab('projects')}
                  className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all relative py-2 ${sidebarTab === 'projects' ? 'text-white' : 'text-muted hover:text-gray-300'}`}
                >
                  My Projects
                  {sidebarTab === 'projects' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500 rounded-full"
                    />
                  )}
                </button>
                <button
                  role="tab"
                  data-testid="nav-templates"
                  aria-selected={sidebarTab === 'templates'}
                  onClick={() => setSidebarTab('templates')}
                  className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all relative py-2 ${sidebarTab === 'templates' ? 'text-white' : 'text-muted hover:text-gray-300'}`}
                >
                  Templates
                  {sidebarTab === 'templates' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500 rounded-full"
                    />
                  )}
                </button>
                <button
                  role="tab"
                  data-testid="nav-community"
                  aria-selected={sidebarTab === 'community'}
                  onClick={() => setSidebarTab('community')}
                  className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all relative py-2 ${sidebarTab === 'community' ? 'text-white' : 'text-muted hover:text-gray-300'}`}
                >
                  Community
                  {sidebarTab === 'community' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500 rounded-full"
                    />
                  )}
                </button>
              </div>
              <Button
                id="create-btn"
                onClick={handleCreateClick}
                variant="primary"
                className="px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[12px] uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-95 shrink-0"
              >
                <Icons.Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> New Design
              </Button>
            </div>

            {/* Filter Controls (for Projects) */}
            {sidebarTab === 'projects' && (
              <div data-testid="dashboard-category-filters" className="flex items-center gap-4 mb-6">
                <button
                  data-testid="dashboard-favorites-filter"
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                    showFavoritesOnly
                      ? 'bg-red-500/10 border-red-500/50 text-red-400'
                      : 'bg-surface-dark-3 border-white/5 text-muted-light hover:text-white hover:border-white/20'
                  }`}
                >
                  <Icons.Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                  Favorites Only
                </button>
              </div>
            )}

            {/* Templates Tab */}
            {sidebarTab === 'templates' && (
              <div data-testid="dashboard-templates-panel" className="mb-10">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Icons.Templates className="w-4 h-4 text-accent" />
                  Quick templates
                </h3>
                <div
                  id="templates-grid"
                  data-testid="dashboard-templates-grid"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 staggered-entry"
                >
                  {filteredTemplates.length > 0 ? (
                    filteredTemplates.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        data-testid={`dashboard-template-btn-${tmpl.id}`}
                        onClick={() => handleStartFromTemplate(tmpl.id)}
                        className="group bg-surface-dark-1 border border-white/5 rounded-xl overflow-hidden text-left hover:border-white/20 transition-all duration-300 shadow-xl relative"
                      >
                        <div className="aspect-[4/3] bg-surface-dark-1 flex items-center justify-center relative overflow-hidden group-hover:bg-surface-dark-2 transition-colors border-b border-white/5">
                          {/* High-fidelity Miniature Render of the template */}
                          <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-3 select-none pointer-events-none">
                            <div
                              style={{
                                width: `${tmpl.size.width || 1080}px`,
                                height: `${tmpl.size.height || 1080}px`,
                                transform: `scale(${Math.min(260 / (tmpl.size.width || 1080), 195 / (tmpl.size.height || 1080))})`,
                                transformOrigin: 'center center',
                                backgroundColor: tmpl.state?.canvasBackgroundColor || '#0f172a',
                              }}
                              className="relative flex-shrink-0 shadow-2xl rounded-sm border border-white/5 overflow-hidden"
                            >
                              {tmpl.state?.layers?.map((l: any, idx: number) => {
                                if (l.type === 'rectangle') {
                                  return (
                                    <div
                                      key={l.id || idx}
                                      style={{
                                        position: 'absolute',
                                        left: `${l.x}px`,
                                        top: `${l.y}px`,
                                        width: `${l.width}px`,
                                        height: `${l.height}px`,
                                        backgroundColor: l.color || '#fff',
                                        borderRadius: `${l.cornerRadius || 0}px`,
                                        opacity: l.opacity ?? 1,
                                        transform: `rotate(${l.rotation || 0}deg) skew(${l.skewX || 0}deg, ${l.skewY || 0}deg)`,
                                      }}
                                    />
                                  );
                                }
                                if (l.type === 'circle') {
                                  return (
                                    <div
                                      key={l.id || idx}
                                      style={{
                                        position: 'absolute',
                                        left: `${l.x}px`,
                                        top: `${l.y}px`,
                                        width: `${l.width}px`,
                                        height: `${l.height}px`,
                                        backgroundColor: l.color || '#fff',
                                        borderRadius: '50%',
                                        opacity: l.opacity ?? 1,
                                        transform: `rotate(${l.rotation || 0}deg)`,
                                      }}
                                    />
                                  );
                                }
                                if (l.type === 'text') {
                                  return (
                                    <div
                                      key={l.id || idx}
                                      style={{
                                        position: 'absolute',
                                        left: `${l.x}px`,
                                        top: `${l.y}px`,
                                        width: `${l.width}px`,
                                        height: `${l.height}px`,
                                        color: l.color || '#fff',
                                        fontSize: `${l.fontSize || 16}px`,
                                        fontFamily: l.fontFamily || 'sans-serif',
                                        fontWeight: l.fontWeight || '400',
                                        textAlign: l.textAlign || 'left',
                                        opacity: l.opacity ?? 1,
                                        transform: `rotate(${l.rotation || 0}deg) skew(${l.skewX || 0}deg, ${l.skewY || 0}deg)`,
                                        whiteSpace: 'pre-wrap',
                                        overflow: 'hidden',
                                      }}
                                    >
                                      {l.text}
                                    </div>
                                  );
                                }
                                if (l.type === 'path' || l.type === 'svg' || l.pathData) {
                                  const isDrawing = l.id?.startsWith('draw_') || l.brushType;
                                  const strokeColor = l.stroke?.color || l.color || '#fff';
                                  const strokeWidth = l.stroke?.width || 2;
                                  return (
                                    <svg
                                      key={l.id || idx}
                                      style={{
                                        position: 'absolute',
                                        left: `${l.x}px`,
                                        top: `${l.y}px`,
                                        width: `${l.width}px`,
                                        height: `${l.height}px`,
                                        opacity: l.opacity ?? 1,
                                        transform: `rotate(${l.rotation || 0}deg)`,
                                        overflow: 'visible',
                                      }}
                                      viewBox={l.viewBox || `0 0 ${l.width || 512} ${l.height || 512}`}
                                    >
                                      <path
                                        d={l.pathData || l.path || l.d}
                                        fill={isDrawing ? 'none' : l.color || '#fff'}
                                        stroke={isDrawing ? strokeColor : 'none'}
                                        strokeWidth={isDrawing ? strokeWidth : 0}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  );
                                }
                                if (l.type === 'image') {
                                  return (
                                    <img
                                      key={l.id || idx}
                                      src={l.src}
                                      style={{
                                        position: 'absolute',
                                        left: `${l.x}px`,
                                        top: `${l.y}px`,
                                        width: `${l.width}px`,
                                        height: `${l.height}px`,
                                        opacity: l.opacity ?? 1,
                                        transform: `rotate(${l.rotation || 0}deg)`,
                                        objectFit: 'cover',
                                      }}
                                    />
                                  );
                                }
                                return null;
                              })}
                            </div>
                          </div>

                          {/* Top Overlays */}
                          <div className="absolute inset-x-0 top-0 p-3 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pointer-events-none select-none">
                            <span className="text-[10px] font-black uppercase tracking-wider text-white bg-brand-600 px-2 py-0.5 rounded shadow-lg border border-white/10">
                              {tmpl.category}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-light bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/5">
                              {tmpl.size.name}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 bg-surface-dark-1">
                          <div className="text-sm font-bold text-white truncate mb-1 group-hover:text-accent transition-colors">
                            {tmpl.name}
                          </div>
                          <div className="text-[11px] text-muted-light line-clamp-2">{tmpl.description}</div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 border-2 border-dashed border-surface-dark-4 rounded-xl">
                      <Icons.Search className="w-8 h-8 text-surface-dark-5 mx-auto mb-2" />
                      <p className="text-muted text-xs font-bold">No templates match your search</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* All Projects Tab (default) */}
            {sidebarTab === 'projects' &&
              (isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-surface-dark-1 border border-white/5 rounded-xl overflow-hidden animate-pulse"
                    >
                      <div className="aspect-[4/3] bg-white/5" />
                      <div className="p-5 space-y-3">
                        <div className="h-4 bg-white/5 rounded w-3/4" />
                        <div className="h-3 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <EmptyState
                  icon={Icons.FolderPlus}
                  title="No projects yet"
                  description="Start creating amazing designs with AI-powered tools. Your projects will appear here."
                  action={{
                    label: 'Create Your First Project',
                    onClick: handleCreateClick,
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 staggered-entry">
                  {/* Create New Card */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateClick}
                    data-testid="blank-canvas-card"
                    role="button"
                    aria-label="Create new blank canvas"
                    className="aspect-[4/3] glass-card-premium border-2 border-dashed border-surface-dark-5 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-brand-500/50 group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-brand-500/20 group-hover:text-brand-400 text-muted shadow-xl group-hover:shadow-glow-brand">
                      <Icons.Plus className="w-8 h-8" />
                    </div>
                    <span className="font-black text-[10px] text-muted group-hover:text-white uppercase tracking-[0.2em] transition-colors">
                      Blank Canvas
                    </span>
                  </motion.div>

                  {/* Project Cards */}
                  {filteredProjects.map((project) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={project.id}
                      data-testid={`project-card-${project.id}`}
                      id={`project-card-${project.id}`}
                      role="button"
                      aria-label={`Open ${project.name}`}
                      onClick={() => {
                        loadProject(project.id);
                        onOpenProject(project);
                      }}
                      className="group bg-surface-dark-1 border border-white/5 rounded-xl overflow-hidden cursor-pointer relative hover:border-white/20 transition-all duration-300 shadow-xl"
                    >
                      <div className="aspect-[4/3] bg-surface-dark-2 relative overflow-hidden flex items-center justify-center">
                        {project.thumbnail ? (
                          <img
                            src={project.thumbnail}
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                          />
                        ) : (
                          /* Fallback Miniature Render for Projects without thumbnails */
                          <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-4 select-none pointer-events-none group-hover:scale-105 transition-transform duration-700 bg-gradient-to-br from-surface-dark-3 to-surface-dark-2">
                            <div
                              style={{
                                width: `${project.state.canvasSize?.width || 1080}px`,
                                height: `${project.state.canvasSize?.height || 1080}px`,
                                transform: `scale(${Math.min(260 / (project.state.canvasSize?.width || 1080), 195 / (project.state.canvasSize?.height || 1080))})`,
                                transformOrigin: 'center center',
                                backgroundColor: project.state.canvasBackgroundColor || '#ffffff',
                              }}
                              className="relative flex-shrink-0 shadow-2xl rounded-sm border border-white/5 overflow-hidden"
                            >
                              {(project.state as any).layers?.map((l: any, idx: number) => {
                                if (!l.visible) {
                                  return null;
                                }
                                if (l.type === 'rectangle') {
                                  return (
                                    <div
                                      key={l.id || idx}
                                      style={{
                                        position: 'absolute',
                                        left: `${l.x}px`,
                                        top: `${l.y}px`,
                                        width: `${l.width}px`,
                                        height: `${l.height}px`,
                                        backgroundColor: l.color || '#fff',
                                        borderRadius: `${l.cornerRadius || 0}px`,
                                        opacity: l.opacity ?? 1,
                                        transform: `rotate(${l.rotation || 0}deg)`,
                                      }}
                                    />
                                  );
                                }
                                if (l.type === 'circle') {
                                  return (
                                    <div
                                      key={l.id || idx}
                                      style={{
                                        position: 'absolute',
                                        left: `${l.x}px`,
                                        top: `${l.y}px`,
                                        width: `${l.width}px`,
                                        height: `${l.height}px`,
                                        backgroundColor: l.color || '#fff',
                                        borderRadius: '50%',
                                        opacity: l.opacity ?? 1,
                                        transform: `rotate(${l.rotation || 0}deg)`,
                                      }}
                                    />
                                  );
                                }
                                if (l.type === 'text') {
                                  return (
                                    <div
                                      key={l.id || idx}
                                      style={{
                                        position: 'absolute',
                                        left: `${l.x}px`,
                                        top: `${l.y}px`,
                                        width: `${l.width}px`,
                                        height: `${l.height}px`,
                                        color: l.color || '#fff',
                                        fontSize: `${l.fontSize || 16}px`,
                                        fontFamily: l.fontFamily || 'sans-serif',
                                        fontWeight: l.fontWeight || '400',
                                        textAlign: l.textAlign || 'left',
                                        opacity: l.opacity ?? 1,
                                        transform: `rotate(${l.rotation || 0}deg)`,
                                        whiteSpace: 'pre-wrap',
                                        overflow: 'hidden',
                                      }}
                                    >
                                      {l.text}
                                    </div>
                                  );
                                }
                                if (l.type === 'path' || l.type === 'svg' || l.pathData) {
                                  const isDrawing = l.id?.startsWith('draw_') || l.brushType;
                                  const strokeColor = l.stroke?.color || l.color || '#fff';
                                  const strokeWidth = l.stroke?.width || 2;
                                  return (
                                    <svg
                                      key={l.id || idx}
                                      style={{
                                        position: 'absolute',
                                        left: `${l.x}px`,
                                        top: `${l.y}px`,
                                        width: `${l.width}px`,
                                        height: `${l.height}px`,
                                        opacity: l.opacity ?? 1,
                                        transform: `rotate(${l.rotation || 0}deg)`,
                                        overflow: 'visible',
                                      }}
                                      viewBox={l.viewBox || `0 0 ${l.width || 512} ${l.height || 512}`}
                                    >
                                      <path
                                        d={l.pathData || l.path || l.d}
                                        fill={isDrawing ? 'none' : l.color || '#fff'}
                                        stroke={isDrawing ? strokeColor : 'none'}
                                        strokeWidth={isDrawing ? strokeWidth : 0}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  );
                                }
                                if (l.type === 'image') {
                                  return (
                                    <img
                                      key={l.id || idx}
                                      src={l.src}
                                      style={{
                                        position: 'absolute',
                                        left: `${l.x}px`,
                                        top: `${l.y}px`,
                                        width: `${l.width}px`,
                                        height: `${l.height}px`,
                                        opacity: l.opacity ?? 1,
                                        transform: `rotate(${l.rotation || 0}deg)`,
                                        objectFit: 'cover',
                                      }}
                                    />
                                  );
                                }
                                return null;
                              })}
                            </div>
                          </div>
                        )}

                        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-10px] group-hover:translate-y-0 duration-300">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteProject(project.id);
                            }}
                            aria-label={`${favoriteProjects.includes(project.id) ? 'Remove from' : 'Add to'} Favorites`}
                            className="p-2 bg-black/60 hover:bg-red-500 text-red-500 rounded-xl backdrop-blur-md transition-all shadow-lg"
                          >
                            <Icons.Heart
                              className={`w-3.5 h-3.5 ${favoriteProjects.includes(project.id) ? 'fill-current' : ''}`}
                            />
                          </button>
                          <button
                            onClick={(e) => startRenaming(e, project)}
                            aria-label={`Rename ${project.name}`}
                            className="p-2 bg-black/60 hover:bg-brand-600 text-white rounded-xl backdrop-blur-md transition-all shadow-lg"
                          >
                            <Icons.Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDuplicate(e, project)}
                            aria-label={`Duplicate ${project.name}`}
                            disabled={duplicatingId === project.id}
                            className="p-2 bg-black/60 hover:bg-accent text-white rounded-xl backdrop-blur-md transition-all shadow-lg disabled:opacity-50"
                          >
                            {duplicatingId === project.id ? (
                              <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                              <Icons.Plus className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              shareToCommunity(project);
                              addToast('Design shared successfully with the community!', 'success');
                            }}
                            title="Share with Community"
                            aria-label={`Share ${project.name} to Community`}
                            className="p-2 bg-black/60 hover:bg-green-500 text-white rounded-xl backdrop-blur-md transition-all shadow-lg"
                          >
                            <Icons.Cloud className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, project.id)}
                            aria-label={`Delete ${project.name}`}
                            className="p-2 bg-black/60 hover:bg-red-500 text-white rounded-xl backdrop-blur-md transition-all shadow-lg"
                          >
                            <Icons.Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="p-5 bg-surface-dark-1">
                        {editingProjectId === project.id ? (
                          <input
                            autoFocus
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={() => handleRename(project.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename(project.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-surface-dark-2 border border-brand-600 rounded px-2 py-1 text-sm text-white focus:outline-none"
                          />
                        ) : (
                          <h3 className="font-bold text-sm text-white truncate mb-1 group-hover:text-accent transition-colors">
                            {project.name}
                          </h3>
                        )}
                        <div className="flex justify-between items-center text-[9px] text-muted font-black uppercase tracking-widest">
                          <span className="flex items-center gap-1.5">
                            <Icons.History className="w-3 h-3" />
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </span>
                          <span className="bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                            {project.state.canvasSize?.width} × {project.state.canvasSize?.height}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}

            {/* Community Tab */}
            {sidebarTab === 'community' && (
              <div className="rounded-3xl overflow-hidden border border-white/5 min-h-[600px]">
                <CommunityTemplates onOpenProject={onOpenProject} />
              </div>
            )}
          </div>
        </div>
      </main>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, projectId: null })}
        onConfirm={confirmDelete}
        title="Delete Project?"
        message="This action cannot be undone. All your carefully crafted layers and AI generations in this design will be permanently removed."
        confirmLabel="Delete Forever"
        variant="danger"
      />

      <CreateProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={async (size, initialState) => {
          const newProjectId = await createProject(size.name || 'Untitled Design', size, initialState);
          setCreateModalOpen(false);
          // Wait a tick for store to update, then get the new project
          setTimeout(() => {
            const allProjects = useStore.getState().projects;
            const newProject = allProjects.find((p) => p.id === newProjectId);
            if (newProject) {
              loadProject(newProject.id);
              onOpenProject(newProject);
            } else {
              onCreateProject();
            }
          }, 0);
        }}
      />
    </div>
  );
};
