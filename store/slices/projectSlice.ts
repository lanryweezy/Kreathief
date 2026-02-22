import { StateCreator } from 'zustand';
import { Project, CanvasSize } from '../../types';
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
    const { projectId, projectTitle, layers, canvasBackgroundColor, canvasFilters, canvasSize } = get();
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
          layers,
          canvasBackgroundColor,
          canvasFilters,
          canvasSize,
        },
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
    const newProject: Project = {
      id,
      name,
      updatedAt: Date.now(),
      state: {
        layers: [],
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
    set({
      projectId: project.id,
      projectTitle: project.name,
      layers: project.state.layers,
      canvasBackgroundColor: project.state.canvasBackgroundColor,
      canvasFilters: project.state.canvasFilters,
      canvasSize: project.state.canvasSize,
      selectedLayerIds: [],
    });
  },
});
