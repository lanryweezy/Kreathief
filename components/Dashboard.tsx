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
import { IMAGE_GEN_MODELS, DEFAULT_IMAGE_MODEL, IMAGE_MODEL_CATEGORIES, ImageGenModel } from '../config/imageModels';
import { aiModelsService } from '../services/aiModelsService';
import { EmptyState } from './EmptyState';
import { Button } from './Button';
import * as geminiService from '../services/geminiService';
import { log } from '../utils/log';
import { getErrorDetails } from '../utils/errorMessages';
import { fuzzyMatch } from '../utils/search';

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
  const [templateCategory, setTemplateCategory] = useState('All');

  // AI Prompt state
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedFormat, setSelectedFormat] = useState(0);
  const [selectedImageModel, setSelectedImageModel] = useState(DEFAULT_IMAGE_MODEL);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const aiInputRef = useRef<HTMLTextAreaElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);

  const FORMAT_OPTIONS: { label: string; size: CanvasSize }[] = [
    { label: 'Instagram Post', size: { width: 1080, height: 1080, name: 'Instagram Post' } },
    { label: 'Story / Reel', size: { width: 1080, height: 1920, name: 'Story / Reel' } },
    { label: 'YouTube Thumbnail', size: { width: 1280, height: 720, name: 'YouTube Thumbnail' } },
    { label: 'Facebook Post', size: { width: 1200, height: 630, name: 'Facebook Post' } },
    { label: 'Logo', size: { width: 1080, height: 1080, name: 'Logo' } },
    { label: 'Presentation', size: { width: 1920, height: 1080, name: 'Presentation' } },
  ];

  const STYLE_SUGGESTIONS = [
    'Modern minimalist',
    'Bold and vibrant',
    'Elegant luxury',
    'Neon cyberpunk',
    'Warm earthy tones',
    'Clean corporate',
  ];

  const handleAIGenerate = useCallback(async () => {
    if (!aiPrompt.trim() || isGenerating) {
      return;
    }
    setIsGenerating(true);
    const format = FORMAT_OPTIONS[selectedFormat];
    const model = IMAGE_GEN_MODELS.find((m) => m.id === selectedImageModel);
    try {
      addToast(`Generating with ${model?.name || 'AI'}...`, 'info');

      const aspectRatio =
        format.size.width > format.size.height ? '16:9' : format.size.width === format.size.height ? '1:1' : '9:16';

      let imageUrl: string;

      if (model?.id === 'recraft-vector') {
        // Vector generation via Recraft
        const svgResult = await aiModelsService.generateVectorRecraft(aiPrompt.trim());
        if (!svgResult) {
          throw new Error('Vector generation failed');
        }
        // Convert SVG to data URL for layer
        if (svgResult.startsWith('<svg')) {
          imageUrl = `data:image/svg+xml;base64,${btoa(svgResult)}`;
        } else {
          imageUrl = svgResult;
        }
      } else if (model?.falEndpoint) {
        // Image generation via Fal.ai (FLUX, SDXL, etc.)
        const falEndpoint = model.falEndpoint;
        const imageSize = aspectRatio === '1:1' ? 'square' : aspectRatio === '16:9' ? 'landscape_hd' : 'portrait_hd';

        const data = await fetch('/api/fal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: falEndpoint,
            body: {
              prompt: `${aiPrompt.trim()}. Professional, high quality, suitable for ${format.label}. Clean composition.`,
              image_size: imageSize,
            },
          }),
        }).then((r) => r.json());

        imageUrl = data.images?.[0]?.url || data.image?.url;
        if (!imageUrl) {
          throw new Error('No image returned from model');
        }
      } else {
        // Fallback to Gemini
        const enhancedPrompt = `${aiPrompt.trim()}. Style: professional, high quality, suitable for ${format.label}. Clean composition, good typography.`;
        imageUrl = await geminiService.generateImage(enhancedPrompt, aspectRatio, 'standard');
      }

      const imageLayer = {
        id: `ai_img_${Date.now()}`,
        type: 'image' as const,
        name: 'AI Generated',
        src: imageUrl,
        x: 0,
        y: 0,
        width: format.size.width,
        height: format.size.height,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        flipX: false,
        flipY: false,
        filters: {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          grayscale: 0,
          sepia: 0,
          blur: 0,
          hueRotate: 0,
          vignette: 0,
          opacity: 1,
        },
        blendMode: 'normal',
        skewX: 0,
        skewY: 0,
        perspective: 0,
        rotateX: 0,
        rotateY: 0,
      };

      const title = aiPrompt.trim().length > 40 ? aiPrompt.trim().slice(0, 40) + '...' : aiPrompt.trim();
      const initialState = {
        artboards: [
          {
            id: 'default',
            name: 'Artboard 1',
            x: 0,
            y: 0,
            width: format.size.width,
            height: format.size.height,
            layers: [imageLayer],
          },
        ],
        activeArtboardId: 'default',
        canvasBackgroundColor: '#ffffff',
        canvasFilters: {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          sepia: 0,
          grayscale: 0,
          blur: 0,
          opacity: 1,
          vignette: 0,
          hueRotate: 0,
        },
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
      const details = getErrorDetails(error);
      addToast(`Generation failed: ${details.message}. ${details.suggestion}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [aiPrompt, selectedFormat, selectedImageModel, isGenerating, createProject, loadProject, addToast, onOpenProject]);

  useEffect(() => {
    loadAllProjects().then(() => setIsLoading(false));
  }, [loadAllProjects]);

  // Close model picker on outside click
  useEffect(() => {
    if (!showModelPicker) {
      return;
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModelPicker]);

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
    const matchesSearch = fuzzyMatch(searchQuery, p.name);
    const matchesFavorites = !showFavoritesOnly || favoriteProjects.includes(p.id);
    return matchesSearch && matchesFavorites;
  });

  const filteredTemplates = STARTER_TEMPLATES.filter((t) => {
    const matchesSearch =
      fuzzyMatch(searchQuery, t.name) ||
      fuzzyMatch(searchQuery, t.description) ||
      fuzzyMatch(searchQuery, t.category);
    const matchesCategory = templateCategory === 'All' || t.category === templateCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-surface-dark-0 text-white flex flex-col relative z-0">
      {/* Header */}
      <header className="h-20 bg-surface-dark-1/80 border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-30 backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#0E1318] border border-white/10 rounded-xl flex items-center justify-center shadow-lg">
            <img src="/logo.svg" alt="Kreathief" className="w-7 h-7 object-contain" />
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
              if (profileDropdownOpen) {
                setProfileDropdownOpen(false);
              }
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
                if (e.key === 'Escape') {
                  setProfileDropdownOpen(false);
                }
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
                if (e.key === 'Escape') {
                  setProfileDropdownOpen(false);
                }
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
          <div className="max-w-[1200px] mx-auto">
            {/* AI Prompt */}
            <div className="relative mb-10">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
                    <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                      What do you want to create?
                    </span>
                  </h1>
                  <p className="text-sm text-muted">Describe your vision and AI will bring it to life</p>
                </div>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-brand-600/20 via-accent/20 to-brand-600/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-surface-dark-1 border border-white/10 rounded-xl p-4 group-focus-within:border-brand-500/50 transition-all duration-300">
                    <textarea
                      ref={aiInputRef}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAIGenerate();
                        }
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="A bold fitness gym ad with dark background and neon accents..."
                      rows={2}
                      className="w-full bg-transparent text-white text-base placeholder:text-muted/50 resize-none focus:outline-none font-medium leading-relaxed"
                      disabled={isGenerating}
                    />
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {FORMAT_OPTIONS.map((format, idx) => (
                          <button
                            key={format.label}
                            onClick={() => setSelectedFormat(idx)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedFormat === idx ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white'}`}
                          >
                            {format.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        {/* Model Picker Dropdown */}
                        <div className="relative" ref={modelPickerRef}>
                          <button
                            onClick={() => setShowModelPicker(!showModelPicker)}
                            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-muted hover:text-white hover:border-brand-500/50 transition-all flex items-center gap-1.5"
                          >
                            <span>{IMAGE_GEN_MODELS.find((m) => m.id === selectedImageModel)?.icon}</span>
                            <span className="hidden sm:inline">
                              {IMAGE_GEN_MODELS.find((m) => m.id === selectedImageModel)?.name}
                            </span>
                            <Icons.ChevronDown className="w-3 h-3" />
                          </button>

                          <AnimatePresence>
                            {showModelPicker && (
                              <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                className="absolute right-0 bottom-full mb-2 w-80 bg-surface-dark-1 border border-white/10 rounded-xl shadow-2xl z-50 p-2 max-h-96 overflow-y-auto"
                              >
                                {(['google', 'chinese', 'fast', 'quality', 'vector'] as const).map((cat) => (
                                  <div key={cat} className="mb-2">
                                    <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-muted">
                                      {IMAGE_MODEL_CATEGORIES[cat].label} — {IMAGE_MODEL_CATEGORIES[cat].description}
                                    </div>
                                    {IMAGE_GEN_MODELS.filter((m) => m.category === cat).map((model) => (
                                      <button
                                        key={model.id}
                                        onClick={() => {
                                          setSelectedImageModel(model.id);
                                          setShowModelPicker(false);
                                        }}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-3 ${
                                          selectedImageModel === model.id
                                            ? 'bg-brand-600 text-white'
                                            : 'text-muted-light hover:bg-white/5 hover:text-white'
                                        }`}
                                      >
                                        <span className="text-lg">{model.icon}</span>
                                        <div className="flex-1 min-w-0">
                                          <div className="font-bold truncate">{model.name}</div>
                                          <div className="text-[9px] opacity-60">
                                            {model.provider} ·{' '}
                                            {model.outputType === 'svg' ? 'SVG Vector' : 'Raster Image'}
                                          </div>
                                        </div>
                                        {selectedImageModel === model.id && (
                                          <Icons.Check className="w-3.5 h-3.5 text-white shrink-0" />
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleAIGenerate}
                          disabled={!aiPrompt.trim() || isGenerating}
                          className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-accent rounded-xl text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-brand-600/20 hover:shadow-xl hover:shadow-brand-600/30 transition-all"
                        >
                          {isGenerating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Generating
                            </>
                          ) : (
                            <>
                              <Icons.Magic className="w-4 h-4" />
                              Generate
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
                <AnimatePresence>
                  {showSuggestions && !aiPrompt && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="mt-4 flex items-center gap-2 flex-wrap justify-center"
                    >
                      <span className="text-xs text-muted font-bold uppercase tracking-wider">Try:</span>
                      {STYLE_SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setAiPrompt((prev) => (prev ? `${prev}, ${s.toLowerCase()}` : s));
                            setShowSuggestions(false);
                            aiInputRef.current?.focus();
                          }}
                          className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-muted hover:text-white hover:border-brand-500/50 hover:bg-brand-500/5 transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Quick Start */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-black text-muted uppercase tracking-[0.2em]">Quick Start</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {FORMAT_OPTIONS.map((format, idx) => (
                  <button
                    key={format.label}
                    onClick={() => {
                      setSelectedFormat(idx);
                      setAiPrompt('');
                      aiInputRef.current?.focus();
                    }}
                    className="group aspect-square rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-200 border border-white/5 hover:border-brand-500/40 hover:bg-brand-500/5 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${['#1a1a2e,#16213e', '#16213e,#0f3460', '#0f3460,#1a1a2e', '#533483,#1a1a2e', '#1a1a2e,#e94560', '#e94560,#533483'][idx]})`,
                    }}
                  >
                    <span className="text-2xl">{['📸', '📱', '🎬', '📄', '🎨', '👕'][idx]}</span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-muted group-hover:text-white transition-colors">
                      {format.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Projects */}
            {projects.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-black text-muted uppercase tracking-[0.2em]">Recent</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.slice(0, 3).map((project) => (
                    <motion.div
                      layout
                      key={project.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        loadProject(project.id);
                        onOpenProject(project);
                      }}
                      className="group bg-surface-dark-1 border border-white/5 rounded-xl overflow-hidden cursor-pointer hover:border-white/15 transition-all shadow-lg hover:shadow-xl"
                    >
                      <div className="aspect-[16/10] bg-surface-dark-2 relative overflow-hidden">
                        <div className="absolute top-3 right-3 z-10">
                          <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white">
                            {project.state.canvasSize?.width}×{project.state.canvasSize?.height}
                          </span>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                          <div
                            style={{
                              width: `${project.state.canvasSize?.width || 1080}px`,
                              height: `${project.state.canvasSize?.height || 1080}px`,
                              transform: `scale(${Math.min(280 / (project.state.canvasSize?.width || 1080), 180 / (project.state.canvasSize?.height || 1080))})`,
                              transformOrigin: 'center',
                              backgroundColor: project.state.canvasBackgroundColor || '#ffffff',
                            }}
                            className="shadow-xl rounded border border-white/5 overflow-hidden"
                          />
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="font-bold text-sm text-white truncate mb-1 group-hover:text-accent transition-colors">
                          {project.name}
                        </div>
                        <div className="text-xs text-muted">{new Date(project.updatedAt).toLocaleDateString()}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Templates */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-black text-muted uppercase tracking-[0.2em]">Templates</span>
                <div className="flex gap-2">
                  {['All', 'Social', 'Business', 'Video', 'Personal'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setTemplateCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${templateCategory === cat ? 'bg-brand-600 text-white' : 'bg-white/5 text-muted hover:text-white hover:bg-white/10'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredTemplates.slice(0, 8).map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleStartFromTemplate(tmpl.id)}
                    className="group bg-surface-dark-1 border border-white/5 rounded-xl overflow-hidden text-left hover:border-white/15 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center p-3 pointer-events-none">
                        <div
                          style={{
                            width: `${tmpl.size.width || 1080}px`,
                            height: `${tmpl.size.height || 1080}px`,
                            transform: `scale(${Math.min(220 / (tmpl.size.width || 1080), 165 / (tmpl.size.height || 1080))})`,
                            transformOrigin: 'center',
                            backgroundColor: tmpl.state?.canvasBackgroundColor || '#0f172a',
                          }}
                          className="shadow-xl rounded border border-white/5 overflow-hidden"
                        />
                      </div>
                      <div className="absolute top-2 left-2 z-10">
                        <span className="bg-brand-600 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white">
                          {tmpl.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="font-bold text-sm text-white truncate group-hover:text-accent transition-colors">
                        {tmpl.name}
                      </div>
                      <div className="text-xs text-muted mt-0.5">{tmpl.size.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Empty State */}
            {projects.length === 0 && !isLoading && (
              <EmptyState
                icon={Icons.FolderPlus}
                title="No projects yet"
                description="Start creating amazing designs with AI-powered tools. Your projects will appear here."
                action={{ label: 'Create Your First Project', onClick: handleCreateClick }}
              />
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-surface-dark-1 border border-white/5 rounded-2xl overflow-hidden animate-pulse"
                  >
                    <div className="aspect-[16/10] bg-white/5" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-white/5 rounded w-3/4" />
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                  </div>
                ))}
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
