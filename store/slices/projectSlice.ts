import { StateCreator } from 'zustand';
import { Project, CanvasSize, Artboard } from '../../types';
import { storageService } from '../../services/storageService';
import { v4 as uuidv4 } from 'uuid';
import { createNebulaDemoDesign } from './project/demoDesign';
import { log } from '../../utils/log';

export interface ProjectSlice {
  projects: Project[];
  projectId: string;
  projectTitle: string;
  isSaving: boolean;
  syncStatus: 'synced' | 'offline' | 'syncing' | 'error';
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  autoSaveEnabled: boolean;
  communityProjects: any[];
  shareToCommunity: (project: Project) => void;

  setSyncStatus: (status: 'synced' | 'offline' | 'syncing' | 'error') => void;
  setProjectId: (id: string) => void;
  setProjectTitle: (title: string) => void;
  setIsSaving: (isSaving: boolean) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  saveProject: () => Promise<void>;
  startAutoSave: () => void;
  stopAutoSave: () => void;
  createProject: (name: string, size?: CanvasSize, initialState?: any) => Promise<string>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (project: Project) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  loadProject: (id: string) => void;
  loadAllProjects: () => Promise<void>;
  setProjects: (projects: Project[]) => void;
  initializeProject: (project: Project) => void;

  // Comments
  addCanvasComment: (x: number, y: number, content: string, author: { name: string; avatar?: string }) => void;
  resolveCanvasComment: (id: string) => void;
  deleteCanvasComment: (id: string) => void;
  updateCanvasComment: (id: string, content: string) => void;
}

let autoSaveTimer: NodeJS.Timeout | null = null;

export const createProjectSlice: StateCreator<any, [], [], ProjectSlice> = (set, get) => ({
  projects: [],
  projectId: `proj_${Date.now()}`,
  projectTitle: 'Untitled Design',
  isSaving: false,
  syncStatus: 'synced',
  lastSaved: null,
  hasUnsavedChanges: false,
  autoSaveEnabled: true,
  communityProjects: [],
  shareToCommunity: (project: Project) => {
    set((state: any) => ({
      communityProjects: [
        {
          id: `tpl_shared_${Date.now()}`,
          title: project.name,
          author: 'You',
          likes: 0,
          downloads: 0,
          thumbnail: project.thumbnail || 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&q=80',
          tags: ['Community', 'Shared'],
          category: 'Social',
          state: project.state,
        },
        ...state.communityProjects,
      ],
    }));
  },

  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setProjectId: (projectId) => set({ projectId }),
  setProjectTitle: (projectTitle) => {
    set({ projectTitle, hasUnsavedChanges: true });
  },
  setIsSaving: (isSaving) => set({ isSaving }),
  setHasUnsavedChanges: (hasUnsavedChanges) => set({ hasUnsavedChanges }),
  setAutoSaveEnabled: (autoSaveEnabled) => {
    set({ autoSaveEnabled });
    if (autoSaveEnabled) {
      get().startAutoSave();
    } else {
      get().stopAutoSave();
    }
  },

  startAutoSave: () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
    }

    autoSaveTimer = setInterval(() => {
      const state = get();
      if (state.projectId && state.hasUnsavedChanges && !state.isSaving && state.autoSaveEnabled) {
        state.saveProject();
      }
    }, 30000); // Auto-save every 30 seconds
  },

  stopAutoSave: () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }
  },

  saveProject: async () => {
    const {
      projectId,
      projectTitle,
      artboards,
      activeArtboardId,
      canvasBackgroundColor,
      canvasFilters,
      canvasSize,
      brandKits,
      showGrid,
      showRulers,
    } = get();
    if (!projectId) {
      return;
    }

    set({ isSaving: true, syncStatus: 'syncing' });
    try {
      const existingProject = get().projects.find((p: Project) => p.id === projectId);
      const updatedProject: Project = {
        id: projectId,
        name: projectTitle,
        thumbnail: existingProject?.thumbnail,
        updatedAt: Date.now(),
        state: {
          artboards,
          activeArtboardId,
          canvasBackgroundColor,
          canvasFilters,
          canvasSize,
          brandKits,
          showGrid,
          showRulers,
        },
        comments: existingProject?.comments || [],
      };
      await storageService.saveProject(updatedProject);
      set((state: any) => ({
        isSaving: false,
        syncStatus: 'synced',
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        projects: state.projects.map((p: Project) => (p.id === projectId ? updatedProject : p)),
      }));
    } catch (e) {
      log.error('Save failed', e, { projectId });
      set({ isSaving: false, syncStatus: 'error' });
      // Show error toast
      get().addToast?.({ message: 'Failed to sync to cloud', type: 'error' });
    }
  },

  createProject: async (name, size, initialState) => {
    const id = uuidv4();
    const defaultArtboard: Artboard =
      name.toLowerCase().includes('demo') || name.toLowerCase().includes('nebula')
        ? createNebulaDemoDesign()
        : {
            id: 'default',
            name: 'Artboard 1',
            x: 0,
            y: 0,
            width: size?.width || 1080,
            height: size?.height || 1080,
            layers: [],
          };

    if (defaultArtboard.id === 'nebula_demo') {
      defaultArtboard.id = uuidv4();
    }

    const newProject: Project = {
      id,
      name,
      updatedAt: Date.now(),
      comments: [],
      state: initialState || {
        artboards: [defaultArtboard],
        activeArtboardId: defaultArtboard.id,
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
        canvasSize: size || { width: 1080, height: 1080, name: 'Square (IG Post)' },
      },
    };
    await storageService.saveProject(newProject);
    set((state: any) => ({ projects: [newProject, ...state.projects] }));
    get().initializeProject(newProject);
    return id;
  },

  deleteProject: async (id) => {
    await storageService.deleteProject(id);
    set((state: any) => ({ projects: state.projects.filter((p: Project) => p.id !== id) }));
  },

  duplicateProject: async (project) => {
    const newProject = {
      ...project,
      id: uuidv4(),
      name: `${project.name} Copy`,
      updatedAt: Date.now(),
    };
    await storageService.saveProject(newProject);
    set((state: any) => ({ projects: [newProject, ...state.projects] }));
  },

  updateProject: async (id, updates) => {
    const { projects } = get();
    const project = projects.find((p: Project) => p.id === id);
    if (!project) {
      return;
    }

    const updatedProject = { ...project, ...updates, updatedAt: Date.now() };
    await storageService.saveProject(updatedProject);
    set((state: any) => ({
      projects: state.projects.map((p: Project) => (p.id === id ? updatedProject : p)),
    }));
  },

  loadProject: (id) => {
    const { projects } = get();
    const project = projects.find((p: Project) => p.id === id);
    if (project) {
      get().initializeProject(project);
    }
  },

  loadAllProjects: async () => {
    const projects = await storageService.getAllProjects();
    set({ projects });
  },

  setProjects: (projects) => set({ projects }),

  initializeProject: (project) => {
    // Migration: if project has root layers but no artboards, create a default artboard
    let artboards = project.state.artboards || [];
    let activeArtboardId = project.state.activeArtboardId || (artboards.length > 0 ? artboards[0].id : 'default');

    if (artboards.length === 0 && (project.state as any).layers?.length >= 0) {
      artboards = [
        {
          id: 'default',
          name: 'Artboard 1',
          x: 0,
          y: 0,
          width: project.state.canvasSize?.width || 1080,
          height: project.state.canvasSize?.height || 1080,
          layers: (project.state as any).layers || [],
        },
      ];
      activeArtboardId = 'default';
    } else if (artboards.length > 0 && artboards[0].layers.length === 0 && (project.state as any).layers?.length > 0) {
      // Handle templates where layers are at the root state level but artboards exist
      artboards = [
        {
          ...artboards[0],
          layers: (project.state as any).layers,
        },
        ...artboards.slice(1),
      ];
    }

    set({
      projectId: project.id,
      projectTitle: project.name,
      artboards,
      activeArtboardId,
      canvasBackgroundColor: project.state.canvasBackgroundColor || '#ffffff',
      canvasFilters: project.state.canvasFilters,
      canvasSize: project.state.canvasSize,
      brandKits: project.state.brandKits || [],
      selectedLayerIds: [],
      showGrid: project.state?.showGrid || false,
      showRulers: project.state?.showRulers || false,
      lastSaved: new Date(project.updatedAt),
      hasUnsavedChanges: false,
    });

    if (project.state.artboards.length === 0 && project.name === 'Untitled Design') {
      const demo = createNebulaDemoDesign();
      set({ artboards: [demo], activeArtboardId: demo.id });
    }

    // Start auto-save
    get().startAutoSave();
  },

  // Comments Actions
  addCanvasComment: (x, y, content, author) => {
    const { projectId } = get();
    if (!projectId) {
      return;
    }

    const newComment = {
      id: uuidv4(),
      x,
      y,
      content,
      author,
      createdAt: Date.now(),
      resolved: false,
    };

    set((state: any) => ({
      projects: state.projects.map((p: Project) =>
        p.id === projectId ? { ...p, comments: [...(p.comments || []), newComment] } : p
      ),
    }));
    get().saveProject();
  },

  resolveCanvasComment: (id) => {
    const { projectId } = get();
    if (!projectId) {
      return;
    }

    set((state: any) => ({
      projects: state.projects.map((p: Project) =>
        p.id === projectId
          ? {
              ...p,
              comments: (p.comments || []).map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c)),
            }
          : p
      ),
    }));
    get().saveProject();
  },

  deleteCanvasComment: (id) => {
    const { projectId } = get();
    if (!projectId) {
      return;
    }

    set((state: any) => ({
      projects: state.projects.map((p: Project) =>
        p.id === projectId
          ? {
              ...p,
              comments: (p.comments || []).filter((c) => c.id !== id),
            }
          : p
      ),
    }));
    get().saveProject();
  },

  updateCanvasComment: (id, content) => {
    const { projectId } = get();
    if (!projectId) {
      return;
    }

    set((state: any) => ({
      projects: state.projects.map((p: Project) =>
        p.id === projectId
          ? {
              ...p,
              comments: (p.comments || []).map((c) => (c.id === id ? { ...c, content, createdAt: Date.now() } : c)),
            }
          : p
      ),
    }));
    get().saveProject();
  },
});
