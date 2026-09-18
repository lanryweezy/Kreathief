import React, { useEffect, useState, useRef, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, User, CanvasSize } from '../types';
import { Icons } from '../constants';
import { STARTER_TEMPLATES, createProjectFromTemplate } from '../data/templates';
import { ConfirmModal } from './modals/ConfirmModal';
import { CreateProjectModal } from './modals/CreateProjectModal';
import { PricingModal } from './PricingModal';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import CommunityTemplates from './CommunityTemplates';
import { DEFAULT_IMAGE_MODEL, IMAGE_GEN_MODELS } from '../config/imageModels';
import { generateImageWithModel, composeGenerationPrompt } from '../services/imageGenService';
import { ModelPicker } from './ModelPicker';
import { AspectRatio } from '../types';
import { EmptyState } from './EmptyState';
import { DashboardSkeleton } from './DashboardSkeleton';
import { Button } from './Button';
import { log } from '../utils/log';
import { getErrorDetails } from '../utils/errorMessages';
import { fuzzyMatch } from '../utils/search';
import { NodeGraph } from './nodes/NodeGraph';
import { importPdfAsArtboards } from '../utils/pdfImport';
import { StaticLayerRenderer } from './StaticLayerRenderer';
import { TemplatePreview } from './TemplatePreview';
import { StyleChip } from './panels/StylePicker';
import type { DesignStyleEntry } from '../services/designStyleDatabase';

const StylePicker = lazy(() => import('./panels/StylePicker').then((m) => ({ default: m.StylePicker })));

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
    brandKits,
    activeBrandKitId,
    setActiveBrandKit,
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
      brandKits: state.brandKits,
      activeBrandKitId: state.activeBrandKitId,
      setActiveBrandKit: state.setActiveBrandKit,
    }))
  );

  const [sidebarTab, setSidebarTab] = useState<'projects' | 'templates' | 'community' | 'brand' | 'pipelines'>(
    'projects'
  );
  const [activeContextMenu, setActiveContextMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [templateCategory, setTemplateCategory] = useState('All');
  const [templateSort, setTemplateSort] = useState<'newest' | 'popular' | 'name'>('newest');
  const [templatePage, setTemplatePage] = useState(1);
  // Per-user template usage counts — the real signal behind the "Popular" sort
  const [templateUses, setTemplateUses] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('kreathief_template_uses') || '{}');
    } catch {
      return {};
    }
  });

  // AI Prompt state
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedFormat, setSelectedFormat] = useState(0);
  const [selectedImageModel, setSelectedImageModel] = useState(DEFAULT_IMAGE_MODEL);
  // 'design' = agent builds editable layers; 'image' = single flat AI image
  const [generationMode, setGenerationMode] = useState<'design' | 'image'>('design');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Style picker state
  const [selectedStyle, setSelectedStyle] = useState<DesignStyleEntry | null>(null);
  const [showStylePicker, setShowStylePicker] = useState(false);

  const [showNodeGraph, setShowNodeGraph] = useState(false);
  const aiInputRef = useRef<HTMLInputElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const FORMAT_OPTIONS: { label: string; size: CanvasSize }[] = [
    { label: 'Instagram Post', size: { width: 1080, height: 1080, name: 'Instagram Post' } },
    { label: 'Story / Reel', size: { width: 1080, height: 1920, name: 'Story / Reel' } },
    { label: 'YouTube Thumbnail', size: { width: 1280, height: 720, name: 'YouTube Thumbnail' } },
    { label: 'Facebook Post', size: { width: 1200, height: 630, name: 'Facebook Post' } },
    { label: 'Logo', size: { width: 1080, height: 1080, name: 'Logo' } },
    { label: 'Presentation', size: { width: 1920, height: 1080, name: 'Presentation' } },
  ];

  const STYLE_SUGGESTIONS = ['Art Deco', 'Minimalism', 'Brutalism', 'Y2K', 'Kawaii', 'Synthwave'];

  // Design mode: create an empty project, open the editor, and hand the prompt
  // to the 3-stage agent pipeline so the result is fully editable layers.
  const handleDesignGenerate = useCallback(async () => {
    if (!aiPrompt.trim() || isGenerating) {
      return;
    }
    setIsGenerating(true);
    const format = FORMAT_OPTIONS[selectedFormat];
    try {
      const title = aiPrompt.trim().length > 40 ? aiPrompt.trim().slice(0, 40) + '...' : aiPrompt.trim();
      const projectId = await createProject(title, format.size);
      const created = useStore.getState().projects.find((p) => p.id === projectId);
      if (!created) {
        throw new Error('Project creation failed');
      }
      loadProject(created.id);

      // Kick off the agent and surface its progress in the AI overlay's Design Agent tab
      const store = useStore.getState();
      store.setShowAIOverlay(true, 'assistant');
      // Prepend style guidance if a style is selected
      const stylePrefix = selectedStyle
        ? `[Style: ${selectedStyle.name}] ${selectedStyle.tagline}. Use ${selectedStyle.typography.headlineFont} for headlines, ${selectedStyle.typography.bodyFont} for body. `
        : '';
      store.runAgenticWorkflow(stylePrefix + aiPrompt.trim());

      addToast('Design Agent is building your layout...', 'info');
      onOpenProject(created);
    } catch (error) {
      log.error('[DashboardAI] Design generation failed', error);
      const details = getErrorDetails(error);
      addToast(`Generation failed: ${details.message}. ${details.suggestion}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [aiPrompt, selectedFormat, isGenerating, createProject, loadProject, addToast, onOpenProject]);

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

      // Unified generation path shared with the editor's Image Gen panel
      const { useBrandInPrompts, brandKits, activeBrandKitId, styleReference, campaignGoal } = useStore.getState();
      const fullPrompt = composeGenerationPrompt({
        prompt: `${selectedStyle ? `${selectedStyle.name} style. ` : ''}${aiPrompt.trim()}. Professional, high quality, suitable for ${format.label}. Clean composition, good typography.`,
        brandKit: useBrandInPrompts ? brandKits?.find((bk) => bk.id === activeBrandKitId) : undefined,
        styleReference,
        campaignGoal,
        canvasSize: format.size,
      });
      const imageUrl = await generateImageWithModel(fullPrompt, {
        modelId: selectedImageModel,
        aspectRatio: aspectRatio as AspectRatio,
        styleReference,
        onReferenceApplied: (mode) =>
          log.debug('[Dashboard] Reference conditioning mode', { mode, model: selectedImageModel }),
      });
      if (!imageUrl) {
        throw new Error('No image returned from model');
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

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      addToast('Importing PDF...', 'info');
      const artboards = await importPdfAsArtboards(file);
      const title = file.name.replace('.pdf', '');
      const initialState = {
        artboards,
        activeArtboardId: artboards[0].id,
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
        canvasSize: { width: artboards[0].width, height: artboards[0].height, name: 'PDF Document' },
      };

      const projectId = await createProject(title, initialState.canvasSize, initialState);
      const created = useStore.getState().projects.find((p) => p.id === projectId);
      if (created) {
        loadProject(created.id);
        addToast('PDF Imported successfully!', 'success');
        onOpenProject(created);
      }
    } catch (err) {
      const details = getErrorDetails(err);
      addToast(`Failed to import PDF: ${details.message}. ${details.suggestion}`, 'error');
    } finally {
      if (pdfInputRef.current) {
        pdfInputRef.current.value = '';
      }
    }
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

    // Track usage locally so the "Popular" sort reflects what this user actually reaches for
    setTemplateUses((prev) => {
      const next = { ...prev, [templateId]: (prev[templateId] || 0) + 1 };
      try {
        localStorage.setItem('kreathief_template_uses', JSON.stringify(next));
      } catch {
        // Storage blocked/full — usage counts are best-effort
      }
      return next;
    });

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

    // createProject adds the project to the store synchronously before resolving,
    // so we can open it right away. Never fall back to onCreateProject() here —
    // that clears currentProject and lands the user on a blank editor.
    const createdProject = useStore.getState().projects.find((p) => p.id === newProjectId);
    if (createdProject) {
      loadProject(createdProject.id);
      onOpenProject(createdProject);
    } else {
      onOpenProject({ ...newProject, id: newProjectId, state: remixedState, updatedAt: Date.now() } as Project);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = fuzzyMatch(searchQuery, p.name);
    const matchesFavorites = !showFavoritesOnly || favoriteProjects.includes(p.id);
    return matchesSearch && matchesFavorites;
  });

  const filteredTemplates = STARTER_TEMPLATES.filter((t) => {
    const matchesSearch =
      fuzzyMatch(searchQuery, t.name) || fuzzyMatch(searchQuery, t.description) || fuzzyMatch(searchQuery, t.category);
    const matchesCategory = templateCategory === 'All' || t.category === templateCategory;
    return matchesSearch && matchesCategory;
  });

  const TEMPLATES_PER_PAGE = 8;
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (templateSort) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'popular': {
        const diff = (templateUses[b.id] || 0) - (templateUses[a.id] || 0);
        return diff !== 0 ? diff : STARTER_TEMPLATES.indexOf(a) - STARTER_TEMPLATES.indexOf(b);
      }
      case 'newest':
      default:
        // New templates are appended to the catalog, so reverse declaration order = newest first
        return STARTER_TEMPLATES.indexOf(b) - STARTER_TEMPLATES.indexOf(a);
    }
  });
  const templatePageCount = Math.max(1, Math.ceil(sortedTemplates.length / TEMPLATES_PER_PAGE));
  const currentTemplatePage = Math.min(templatePage, templatePageCount);
  const pagedTemplates = sortedTemplates.slice(
    (currentTemplatePage - 1) * TEMPLATES_PER_PAGE,
    currentTemplatePage * TEMPLATES_PER_PAGE
  );

  // Jump back to page 1 whenever the visible template set changes
  useEffect(() => {
    setTemplatePage(1);
  }, [searchQuery, templateCategory, templateSort]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-surface-dark-0 text-white flex flex-col relative z-0">
      {/* Header */}
      <header className="h-20 bg-surface-dark-1/80 border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-30 backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-surface-dark-1 border border-white/10 rounded-xl flex items-center justify-center shadow-lg">
            <img src="/logo.svg" alt="Kreathief" className="w-7 h-7 object-contain" />
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase">Kreathief</span>
        </div>

        <div className="flex items-center gap-6">
          <input
            type="file"
            ref={pdfInputRef}
            className="hidden"
            accept=".pdf"
            onChange={(e) => {
              handlePdfImport(e);
              e.target.value = '';
            }}
          />
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

          {/* New Canvas Button */}
          <button
            id="create-btn"
            data-testid="create-btn"
            onClick={handleCreateClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-brand-600/30 hover:shadow-brand-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
            title="Start a new blank design or pick a canvas size"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Blank Canvas</span>
          </button>

          <div className="h-8 w-px bg-white/10 mx-2"></div>

          <div
            className="flex items-center gap-4 group relative"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setProfileDropdownOpen(false);
              }
            }}
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-black uppercase tracking-widest text-white">{user.name}</div>
              <button
                onClick={() => setShowPricingModal(true)}
                className="text-[9px] text-brand-400 uppercase font-black tracking-widest hover:text-brand-300 hover:underline transition-colors"
                title="View plans & upgrade"
              >
                {user.plan} Plan
              </button>
            </div>
            <button
              data-testid="profile-menu-btn"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
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
              title="Click to open account hub & menu"
              aria-label="Open account menu"
            >
              <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt="Profile" />
            </button>

            <AnimatePresence>
              {profileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-4 w-56 bg-surface-dark-1 border border-white/10 rounded-xl shadow-2xl z-50 p-2 transform origin-top-right"
                  role="menu"
                  aria-label="Profile menu"
                  tabIndex={-1}
                  ref={profileDropdownRef}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setProfileDropdownOpen(false);
                    }
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileDropdownOpen(false);
                      useStore.getState().setShowProfileModal(true);
                    }}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-white hover:bg-white/[0.06] rounded-xl flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:bg-white/[0.06]"
                    role="menuitem"
                  >
                    <Icons.User className="w-4 h-4 text-brand-400" /> Account Hub & Bio
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileDropdownOpen(false);
                      useStore.getState().setShowProfileModal(true);
                    }}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-white hover:bg-white/[0.06] rounded-xl flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:bg-white/[0.06]"
                    role="menuitem"
                  >
                    <Icons.Sliders className="w-4 h-4 text-purple-400" /> Studio Settings
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileDropdownOpen(false);
                      setShowNodeGraph(true);
                    }}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-white hover:bg-white/[0.06] rounded-xl flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:bg-white/[0.06]"
                    role="menuitem"
                  >
                    <Icons.GitMerge className="w-4 h-4 text-emerald-400" /> AI Pipelines (Graph)
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileDropdownOpen(false);
                      pdfInputRef.current?.click();
                    }}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-white hover:bg-white/[0.06] rounded-xl flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:bg-white/[0.06]"
                    role="menuitem"
                  >
                    <Icons.Uploads className="w-4 h-4 text-indigo-400" /> Import PDF
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileDropdownOpen(false);
                      setShowPricingModal(true);
                    }}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-white hover:bg-white/[0.06] rounded-xl flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:bg-white/[0.06]"
                    role="menuitem"
                  >
                    <Icons.Zap className="w-4 h-4 text-yellow-400" /> Upgrade to Pro
                  </button>
                  <div className="my-1 border-t border-white/10" />
                  <button
                    data-testid="logout-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && setProfileDropdownOpen(false)}
                    className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 rounded-xl flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:bg-red-500/10"
                    role="menuitem"
                  >
                    <Icons.LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Skip navigation for keyboard/screen reader users */}
      <a
        href="#dashboard-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-bold focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      <main id="dashboard-content" className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="hidden md:flex flex-col w-64 bg-surface-dark-1/50 border-r border-white/5 py-8 px-4 shrink-0">
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setSidebarTab('projects')}
              onKeyDown={(e) => e.key === 'Enter' && setSidebarTab('projects')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${sidebarTab === 'projects' ? 'bg-brand-600 text-white shadow-glow-brand' : 'text-muted hover:text-white hover:bg-white/5'}`}
            >
              <Icons.Folder className="w-5 h-5" /> Projects
            </button>
            <button
              onClick={() => setSidebarTab('templates')}
              onKeyDown={(e) => e.key === 'Enter' && setSidebarTab('templates')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${sidebarTab === 'templates' ? 'bg-brand-600 text-white shadow-glow-brand' : 'text-muted hover:text-white hover:bg-white/5'}`}
            >
              <Icons.Templates className="w-5 h-5" /> Templates
            </button>
            <button
              onClick={() => setSidebarTab('community')}
              onKeyDown={(e) => e.key === 'Enter' && setSidebarTab('community')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${sidebarTab === 'community' ? 'bg-brand-600 text-white shadow-glow-brand' : 'text-muted hover:text-white hover:bg-white/5'}`}
            >
              <Icons.Users className="w-5 h-5" /> Community
            </button>
            <button
              onClick={() => setSidebarTab('brand')}
              onKeyDown={(e) => e.key === 'Enter' && setSidebarTab('brand')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${sidebarTab === 'brand' ? 'bg-brand-600 text-white shadow-glow-brand' : 'text-muted hover:text-white hover:bg-white/5'}`}
            >
              <Icons.Star className="w-5 h-5" /> Brand Kits
            </button>
            <div className="my-2 border-t border-white/5"></div>
            <button
              onClick={() => setShowNodeGraph(true)}
              onKeyDown={(e) => e.key === 'Enter' && setShowNodeGraph(true)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-muted hover:text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500`}
            >
              <Icons.GitMerge className="w-5 h-5 text-emerald-400" /> AI Pipelines
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 custom-scrollbar">
          <div className="max-w-[1200px] mx-auto" onClick={() => setActiveContextMenu(null)}>
            {/* AI Prompt */}
            {(sidebarTab === 'projects' || sidebarTab === 'templates') && (
              <div className="relative mb-10">
                <div className="max-w-[1100px] mx-auto">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
                      <span className="bg-gradient-to-r from-white via-brand-200 to-white bg-clip-text text-transparent">
                        What do you want to create?
                      </span>
                    </h1>
                    <p className="text-sm text-gray-400 font-medium">
                      Describe your vision and AI will bring it to life
                    </p>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-brand-600/30 via-accent/30 to-brand-600/30 rounded-[28px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-surface-dark-1/80 backdrop-blur-xl border border-white/10 rounded-[24px] p-2 flex flex-col md:flex-row items-center gap-2 group-focus-within:border-brand-500/50 group-focus-within:bg-surface-dark-1 transition-all duration-300 shadow-2xl">
                      <div className="pl-4 shrink-0 text-brand-400 hidden md:block">
                        <Icons.Magic className="w-5 h-5" />
                      </div>
                      <input
                        ref={aiInputRef}
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (generationMode === 'design') {
                              handleDesignGenerate();
                            } else {
                              handleAIGenerate();
                            }
                          }
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="A bold fitness gym ad with dark background and neon accents..."
                        className="flex-1 w-full bg-transparent text-white text-base placeholder:text-gray-500 focus:outline-none font-medium h-12 px-4 md:px-0"
                        disabled={isGenerating}
                      />

                      {/* Mobile controls row */}
                      <div className="flex w-full md:w-auto items-center justify-between md:justify-start gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                        {/* Format Selector */}
                        <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/5 shrink-0">
                          {FORMAT_OPTIONS.map((format, idx) => (
                            <button
                              key={format.label}
                              onClick={() => setSelectedFormat(idx)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedFormat === idx ? 'bg-surface-dark-3 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
                              title={format.label}
                            >
                              {format.label}
                            </button>
                          ))}
                        </div>

                        <div className="w-px h-8 bg-white/10 hidden xl:block"></div>

                        <div className="hidden xl:flex items-center gap-2">
                          {/* Style Picker Button */}
                          <button
                            onClick={() => setShowStylePicker(!showStylePicker)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              selectedStyle
                                ? 'border border-brand-500/50 bg-brand-500/10 text-brand-300'
                                : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {selectedStyle ? (
                              <>
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{
                                    background: `linear-gradient(135deg, ${selectedStyle.palette.primary}, ${selectedStyle.palette.accent})`,
                                  }}
                                />
                                {selectedStyle.name}
                              </>
                            ) : (
                              <>
                                <Icons.Palette className="w-3.5 h-3.5" /> Style
                              </>
                            )}
                          </button>
                          {selectedStyle && (
                            <button
                              onClick={() => setSelectedStyle(null)}
                              className="text-gray-500 hover:text-white transition-colors"
                            >
                              <Icons.X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="w-px h-8 bg-white/10 hidden md:block"></div>

                        <div className="flex items-center gap-1 shrink-0 bg-white/5 rounded-xl p-1 border border-white/5">
                          <button
                            onClick={() => setGenerationMode('design')}
                            title="Generate a fully editable layered design"
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${generationMode === 'design' ? 'bg-brand-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                          >
                            <Icons.Layers className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Design</span>
                          </button>
                          <button
                            onClick={() => setGenerationMode('image')}
                            title="Generate a single AI image"
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${generationMode === 'image' ? 'bg-accent text-white shadow' : 'text-gray-400 hover:text-white'}`}
                          >
                            <Icons.Image className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Image</span>
                          </button>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={generationMode === 'design' ? handleDesignGenerate : handleAIGenerate}
                          disabled={!aiPrompt.trim() || isGenerating}
                          className="px-6 py-3 md:ml-1 bg-white text-black hover:bg-gray-100 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-xl hover:shadow-2xl transition-all h-full shrink-0"
                        >
                          {isGenerating ? (
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          ) : (
                            <>
                              Generate <Icons.ArrowRight className="w-4 h-4 ml-2 hidden sm:block" />
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Style Picker Panel */}
                <AnimatePresence>
                  {showStylePicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 420 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="mt-3 rounded-2xl border border-white/10 overflow-hidden bg-surface-dark-1 shadow-2xl"
                    >
                      <Suspense
                        fallback={
                          <div className="flex items-center justify-center h-full">
                            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        }
                      >
                        <StylePicker
                          onSelectStyle={(style) => {
                            setSelectedStyle(style);
                            setShowStylePicker(false);
                            // Append style keywords to prompt if empty
                            if (!aiPrompt.trim()) {
                              setAiPrompt(style.tagline);
                            }
                            aiInputRef.current?.focus();
                          }}
                          currentStyleId={selectedStyle?.id}
                          onClose={() => setShowStylePicker(false)}
                        />
                      </Suspense>
                    </motion.div>
                  )}
                </AnimatePresence>

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
            )}

            {/* Recent Projects */}
            {sidebarTab === 'projects' && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-black text-muted uppercase tracking-[0.2em]">Recent</span>
                </div>
                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {projects.map((project) => (
                      <motion.div
                        layout
                        key={project.id}
                        data-testid={`project-card-${project.id}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          loadProject(project.id);
                          onOpenProject(project);
                        }}
                        className="group bg-surface-dark-2 border border-white/5 rounded-xl overflow-hidden cursor-pointer hover:border-brand-500/50 hover:shadow-brand-500/10 transition-all shadow-lg hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      >
                        <div className="aspect-[16/10] bg-surface-dark-3 relative overflow-hidden">
                          <div className="absolute top-3 right-3 z-10">
                            <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white">
                              {project.state.canvasSize?.width}×{project.state.canvasSize?.height}
                            </span>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                            {(() => {
                              const layers =
                                project.state.artboards?.[0]?.layers || (project.state as any).layers || [];
                              if (layers.length > 0) {
                                return (
                                  <div
                                    style={{
                                      width: `${project.state.canvasSize?.width || 1080}px`,
                                      height: `${project.state.canvasSize?.height || 1080}px`,
                                      transform: `scale(${Math.min(280 / (project.state.canvasSize?.width || 1080), 180 / (project.state.canvasSize?.height || 1080))})`,
                                      transformOrigin: 'center',
                                      backgroundColor: project.state.canvasBackgroundColor || '#ffffff',
                                    }}
                                    className="shadow-xl rounded border border-white/5 overflow-hidden relative shrink-0"
                                  >
                                    <StaticLayerRenderer
                                      layers={layers}
                                      scale={1}
                                      width={project.state.canvasSize?.width || 1080}
                                      height={project.state.canvasSize?.height || 1080}
                                    />
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="w-full h-full rounded-lg bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-brand-900/20 via-surface-dark-3 to-surface-dark-4 flex flex-col items-center justify-center border border-white/5 opacity-60 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] bg-repeat opacity-30"></div>
                                    <Icons.Image className="w-8 h-8 text-gray-500 mb-2 relative z-10" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 relative z-10">
                                      Empty Project
                                    </span>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        </div>
                        <div className="p-4 flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-white truncate mb-1 group-hover:text-accent transition-colors">
                              {editingProjectId === project.id ? (
                                <input
                                  autoFocus
                                  value={newName}
                                  onChange={(e) => setNewName(e.target.value)}
                                  onBlur={() => handleRename(project.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleRename(project.id);
                                    }
                                    if (e.key === 'Escape') {
                                      setEditingProjectId(null);
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-black/50 border border-brand-500 rounded px-2 py-0.5 text-white w-full h-6 text-sm"
                                />
                              ) : (
                                project.name
                              )}
                            </div>
                            <div className="text-xs text-muted">{new Date(project.updatedAt).toLocaleDateString()}</div>
                          </div>
                          <div className="relative ml-2">
                            <button
                              aria-haspopup="menu"
                              aria-expanded={activeContextMenu === project.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveContextMenu(activeContextMenu === project.id ? null : project.id);
                              }}
                              className={`p-1 rounded bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${activeContextMenu === project.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`}
                            >
                              <Icons.MoreHorizontal className="w-4 h-4" />
                            </button>

                            <AnimatePresence>
                              {activeContextMenu === project.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute bottom-full right-0 mb-1 w-32 bg-surface-dark-1 border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden"
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveContextMenu(null);
                                      startRenaming(e, project);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                  >
                                    Rename
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveContextMenu(null);
                                      handleDuplicate(e, project);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                  >
                                    Duplicate
                                  </button>
                                  <div className="h-px bg-white/10 w-full" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveContextMenu(null);
                                      handleDelete(e, project.id);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : !isLoading ? (
                  <EmptyState
                    icon={Icons.FolderPlus}
                    title="No projects yet"
                    description="Start creating amazing designs with AI-powered tools. Your projects will appear here."
                    action={{ label: 'Create Your First Project', onClick: handleCreateClick }}
                  />
                ) : null}
              </div>
            )}

            {/* Templates */}
            {sidebarTab === 'templates' && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-5">
                  <span
                    data-testid="nav-templates"
                    className="text-xs font-black text-muted uppercase tracking-[0.2em]"
                    onClick={() => setSidebarTab('templates')}
                  >
                    Templates
                  </span>
                  <div className="flex items-center gap-2">
                    {['All', 'Social', 'Business', 'Video', 'Personal'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setTemplateCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${templateCategory === cat ? 'bg-brand-600 text-white' : 'bg-white/5 text-muted hover:text-white hover:bg-white/10'}`}
                      >
                        {cat}
                      </button>
                    ))}
                    <select
                      value={templateSort}
                      onChange={(e) => setTemplateSort(e.target.value as 'newest' | 'popular' | 'name')}
                      aria-label="Sort templates"
                      className="ml-2 px-3 py-1.5 rounded-full text-xs font-bold bg-white/5 text-muted hover:text-white hover:bg-white/10 border border-white/10 focus:outline-none focus:border-brand-500 transition-all cursor-pointer [&>option]:bg-surface-dark-1 [&>option]:text-white"
                    >
                      <option value="newest">Newest</option>
                      <option value="popular">Popular</option>
                      <option value="name">Name</option>
                    </select>
                  </div>
                </div>
                <div
                  id="templates-grid"
                  data-testid="dashboard-templates-grid"
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {pagedTemplates.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      data-testid={`dashboard-template-btn-${tmpl.id}`}
                      onClick={() => handleStartFromTemplate(tmpl.id)}
                      className="group bg-surface-dark-2 border border-white/5 rounded-xl overflow-hidden text-left hover:border-brand-500/50 hover:shadow-brand-500/10 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="aspect-[4/3] relative overflow-hidden bg-black/40">
                        <TemplatePreview template={tmpl} containerWidth={260} containerHeight={195} className="p-2" />
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
                {sortedTemplates.length === 0 && (
                  <div className="py-12">
                    <EmptyState
                      icon={Icons.Search}
                      title="No templates found"
                      description="We couldn't find any templates matching your search criteria. Try a different keyword or category."
                      action={{
                        label: 'Clear Filters',
                        onClick: () => {
                          setSearchQuery('');
                          setTemplateCategory('All');
                        },
                      }}
                    />
                  </div>
                )}
                {templatePageCount > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-5">
                    <button
                      onClick={() => setTemplatePage(currentTemplatePage - 1)}
                      disabled={currentTemplatePage === 1}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/5 text-muted hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Prev
                    </button>
                    <span className="text-xs font-bold text-muted">
                      Page {currentTemplatePage} of {templatePageCount}
                    </span>
                    <button
                      onClick={() => setTemplatePage(currentTemplatePage + 1)}
                      disabled={currentTemplatePage === templatePageCount}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/5 text-muted hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Community/Brand sections */}
            {sidebarTab === 'community' && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Icons.Users className="w-16 h-16 text-muted mb-4" />
                <h2 className="text-xl font-black text-white mb-2">Community Gallery</h2>
                <p className="text-muted text-sm max-w-md">
                  Discover templates and designs created by the Kreathief community. Coming soon in a future update.
                </p>
              </div>
            )}
            {sidebarTab === 'brand' && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Icons.Star className="w-16 h-16 text-muted mb-4" />
                <h2 className="text-xl font-black text-white mb-2">Brand Kits</h2>
                <p className="text-muted text-sm max-w-md">
                  Manage your brand colors, fonts, and logos to keep your designs consistent. (Coming soon)
                </p>
              </div>
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

      {showNodeGraph && (
        <div className="fixed inset-0 z-[100] bg-surface-dark-2">
          <NodeGraph
            onClose={() => setShowNodeGraph(false)}
            onExportToCanvas={(result) => {
              // NodeGraph export logic could be hooked up here
              setShowNodeGraph(false);
            }}
          />
        </div>
      )}

      {showPricingModal && (
        <PricingModal
          onClose={() => setShowPricingModal(false)}
          onUpgrade={() => {
            // No payment backend yet — be honest instead of pretending to upgrade
            addToast('Pro subscriptions are not live yet — everything is free during the beta!', 'info');
            setShowPricingModal(false);
          }}
        />
      )}

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
          // createProject updates the store synchronously before resolving — open directly.
          const s = useStore.getState();
          const newProject = s.projects.find((p) => p.id === newProjectId);
          if (newProject) {
            loadProject(newProject.id);
            onOpenProject(newProject);
          } else {
            // Store was already initialized by createProject; open from live state
            onOpenProject({
              id: newProjectId,
              name: s.projectTitle,
              updatedAt: Date.now(),
              state: {
                artboards: s.artboards,
                activeArtboardId: s.activeArtboardId,
                canvasBackgroundColor: s.canvasBackgroundColor,
                canvasFilters: s.canvasFilters,
                canvasSize: s.canvasSize,
              },
            } as Project);
          }
        }}
      />
    </div>
  );
};
