import { StateCreator } from 'zustand';
import { Project, CanvasSize, Artboard } from '../../types';
import { storageService } from '../../services/storageService';
import { v4 as uuidv4 } from 'uuid';

export interface ProjectSlice {
  projects: Project[];
  projectId: string;
  projectTitle: string;
  isSaving: boolean;

  setProjectId: (id: string) => void;
  setProjectTitle: (title: string) => void;
  setIsSaving: (isSaving: boolean) => void;
  saveProject: () => Promise<void>;
  createProject: (name: string, size?: CanvasSize) => Promise<string>;
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

export const createProjectSlice: StateCreator<any, [], [], ProjectSlice> = (set, get) => ({
  projects: [],
  projectId: `proj_${Date.now()}`,
  projectTitle: 'Untitled Design',
  isSaving: false,

  setProjectId: (projectId) => set({ projectId }),
  setProjectTitle: (projectTitle) => set({ projectTitle }),
  setIsSaving: (isSaving) => set({ isSaving }),

  saveProject: async () => {
    const { projectId, projectTitle, artboards, activeArtboardId, canvasBackgroundColor, canvasFilters, canvasSize } = get();
    if (!projectId) {
      return;
    }

    set({ isSaving: true });
    try {
      const updatedProject: Project = {
        id: projectId,
        name: projectTitle,
        updatedAt: Date.now(),
        state: {
          artboards,
          activeArtboardId,
          canvasBackgroundColor,
          canvasFilters,
          canvasSize,
        },
        comments: get().projects.find((p: Project) => p.id === projectId)?.comments || [],
      };
      await storageService.saveProject(updatedProject);
      set((state: any) => ({
        isSaving: false,
        projects: state.projects.map((p: Project) => (p.id === projectId ? updatedProject : p)),
      }));
    } catch (e) {
      console.error('Save failed', e);
      set({ isSaving: false });
    }
  },

  createProject: async (name, size) => {
    const id = uuidv4();
    const defaultArtboard: Artboard = {
      id: 'default',
      name: 'Artboard 1',
      x: 0,
      y: 0,
      width: size?.width || 1080,
      height: size?.height || 1080,
      layers: [],
    };

    const newProject: Project = {
      id,
      name,
      updatedAt: Date.now(),
      comments: [],
      state: {
        artboards: [defaultArtboard],
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
      artboards = [{
        id: 'default',
        name: 'Artboard 1',
        x: 0,
        y: 0,
        width: project.state.canvasSize?.width || 1080,
        height: project.state.canvasSize?.height || 1080,
        layers: (project.state as any).layers || [],
      }];
      activeArtboardId = 'default';
    }

    set({
      projectId: project.id,
      projectTitle: project.name,
      artboards,
      activeArtboardId,
      canvasBackgroundColor: project.state.canvasBackgroundColor || '#ffffff',
      canvasFilters: project.state.canvasFilters,
      canvasSize: project.state.canvasSize,
      selectedLayerIds: [],
      showGrid: project.state?.showGrid || false,
      showRulers: project.state?.showRulers || false,
    });
  },

  // Comments Actions
  addCanvasComment: (x, y, content, author) => {
    const { projectId } = get();
    if (!projectId) {return;}

    const newComment = {
      id: uuidv4(),
      x,
      y,
      content,
      author,
      createdAt: Date.now(),
      resolved: false
    };

    set((state: any) => ({
      projects: state.projects.map((p: Project) => 
        p.id === projectId 
          ? { ...p, comments: [...(p.comments || []), newComment] }
          : p
      )
    }));
    get().saveProject();
  },

  resolveCanvasComment: (id) => {
    const { projectId } = get();
    if (!projectId) {return;}

    set((state: any) => ({
      projects: state.projects.map((p: Project) => 
        p.id === projectId 
          ? { 
              ...p, 
              comments: (p.comments || []).map(c => c.id === id ? { ...c, resolved: !c.resolved } : c)
            }
          : p
      )
    }));
    get().saveProject();
  },

  deleteCanvasComment: (id) => {
    const { projectId } = get();
    if (!projectId) {return;}

    set((state: any) => ({
      projects: state.projects.map((p: Project) => 
        p.id === projectId 
          ? { 
              ...p, 
              comments: (p.comments || []).filter(c => c.id !== id)
            }
          : p
      )
    }));
    get().saveProject();
  },

  updateCanvasComment: (id, content) => {
    const { projectId } = get();
    if (!projectId) {return;}

    set((state: any) => ({
      projects: state.projects.map((p: Project) => 
        p.id === projectId 
          ? { 
              ...p, 
              comments: (p.comments || []).map(c => c.id === id ? { ...c, content, createdAt: Date.now() } : c)
            }
          : p
      )
    }));
    get().saveProject();
  }
});
