import { create } from 'zustand';
import { DesignNode, ToolType, HistoryCommand } from '../types/design';
import { surface, content, semantic } from '../lib/tokens';
import { UserPreferences, DesignPattern, BrandGuideline, DesignAction, SkillLevel, DesignStyle } from '../types/memory';
import { CreativeSuggestion } from '../types/creativeDirector';
import type { BrandViolation } from '../services/brandMemory';
import { ToastMessage } from '../components/Toast';

// Lazy-loaded services — deferred from critical path (~1700 lines)
// Each service is loaded on-demand via dynamic import(), not at module scope.
// The module-level singleton is cached after first load by the JS runtime.
async function getDesignMemory() {
  const { designMemory } = await import('../services/designMemory');
  return designMemory;
}
async function getPatternAnalyzer() {
  const { patternAnalyzer } = await import('../services/patternAnalyzer');
  return patternAnalyzer;
}
async function getBrandMemory() {
  const { brandMemory } = await import('../services/brandMemory');
  return brandMemory;
}
async function getCreativeDirector() {
  const { creativeDirector } = await import('../services/creativeDirector');
  return creativeDirector;
}

interface KreathiefStore {
  // Canvas state
  nodes: Map<string, DesignNode>;
  selectedIds: Set<string>;
  hoveredId: string | null;
  activeTool: ToolType;
  zoom: number;
  panX: number;
  panY: number;

  // UI state
  darkMode: boolean;
  showGrid: boolean;
  showRulers: boolean;
  showLayers: boolean;
  showProperties: boolean;
  showAI: boolean;
  snapToGrid: boolean;
  rightPanelTab: 'properties' | 'layers' | 'assets' | 'ai' | 'creative' | 'components';

  // Progressive disclosure
  expertMode: boolean;

  // History
  past: HistoryCommand[];
  future: HistoryCommand[];

  // Memory state
  memoryReady: boolean;
  preferences: UserPreferences;
  patterns: DesignPattern[];
  brands: BrandGuideline[];
  recentActions: DesignAction[];
  suggestions: string[];
  brandViolations: BrandViolation[];
  activeBrandId: string | null;

  // CreativeDirector state
  creativeSuggestions: CreativeSuggestion[];
  creativeDirectorRunning: boolean;

  // Toast state
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], message: string, duration?: number) => void;
  removeToast: (id: string) => void;

  // Color history
  recentColors: string[];
  addRecentColor: (color: string) => void;

  // Canvas actions
  setTool: (tool: ToolType) => void;
  addNode: (node: DesignNode) => void;
  updateNode: (id: string, updates: Partial<DesignNode>) => void;
  removeNode: (id: string) => void;
  selectNode: (ids: string[]) => void;
  setHovered: (id: string | null) => void;
  toggleDarkMode: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleExpertMode: () => void;
  toggleSnapToGrid: () => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setRightPanelTab: (tab: KreathiefStore['rightPanelTab']) => void;
  pushCommand: (label: string, undoPatch: Partial<KreathiefStore>, redoPatch: Partial<KreathiefStore>) => void;
  undo: () => void;
  redo: () => void;

  // Memory actions
  initMemory: () => Promise<void>;
  recordMemoryAction: (type: string, data: Record<string, any>) => Promise<void>;
  refreshPreferences: () => Promise<void>;
  analyzePatterns: () => Promise<void>;
  getSuggestions: () => Promise<string[]>;
  createBrand: (name: string, projectId?: string) => Promise<BrandGuideline>;
  updateBrand: (id: string, updates: Partial<BrandGuideline>) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  setActiveBrand: (id: string | null) => void;
  checkNodeAgainstBrand: (node: any) => Promise<BrandViolation[]>;
  inferBrand: (name: string, nodes: any[]) => Promise<BrandGuideline>;
  getSkillLevel: () => Promise<SkillLevel>;
  getDesignStyle: () => Promise<DesignStyle>;
  getTopFonts: (count?: number) => Promise<any[]>;
  getTopColors: (count?: number) => Promise<any[]>;
  exportMemory: () => Promise<string>;
  importMemory: (json: string) => Promise<void>;
  clearMemory: () => Promise<void>;

  // CreativeDirector actions
  startCreativeDirector: () => Promise<void>;
  stopCreativeDirector: () => Promise<void>;
  analyzeCanvas: (trigger: string) => Promise<CreativeSuggestion[]>;
  acceptSuggestion: (suggestion: CreativeSuggestion) => Promise<void>;
  rejectSuggestion: (suggestion: CreativeSuggestion) => Promise<void>;
  dismissSuggestion: (id: string) => Promise<void>;
  clearSuggestions: () => void;

  // Workspace actions
  saveWorkspace: (name?: string) => void;
  loadWorkspace: (name?: string) => void;
  listWorkspaces: () => string[];
  deleteWorkspace: (name: string) => void;
  autoSave: () => void;
  lastSaved: number | null;
}

export const useKreathiefStore = create<KreathiefStore>((set, get) => ({
  nodes: new Map(),
  selectedIds: new Set(),
  hoveredId: null,
  activeTool: 'select',
  zoom: 1,
  panX: 0,
  panY: 0,

  darkMode: true,
  showGrid: true,
  showRulers: true,
  showLayers: true,
  showProperties: true,
  showAI: false,
  snapToGrid: false,
  rightPanelTab: 'properties',

  expertMode: false,

  past: [],
  future: [],

  memoryReady: false,
  preferences: {
    fonts: [],
    colors: [],
    layouts: [],
    spacing: { preferredGap: 16, consistentSpacing: false, usesGrid: false },
    alignment: { defaultAlign: 'left', usesSnap: false, usesGrid: false },
    toolFrequency: {},
    aiAcceptanceRate: 0,
    avgSessionDuration: 0,
    skillLevel: 'beginner',
    designStyle: { minimalism: 0.5, boldness: 0.5, complexity: 0.5, colorfulness: 0.5, symmetry: 0.5 },
  } satisfies UserPreferences,
  patterns: [],
  brands: [],
  recentActions: [],
  suggestions: [],
  brandViolations: [],
  activeBrandId: null,

  creativeSuggestions: [],
  creativeDirectorRunning: false,

  lastSaved: null,

  toasts: [],
  addToast: (type, message, duration) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }].slice(-5),
    }));
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  recentColors: [
    surface[3],
    content.inverse,
    semantic.info,
    content.primary,
    semantic.error,
    semantic.success,
    semantic.warning,
    semantic.info,
  ],
  addRecentColor: (color) =>
    set((state) => ({
      recentColors: [color, ...state.recentColors.filter((c) => c !== color)].slice(0, 12),
    })),

  setTool: (tool) => {
    set({ activeTool: tool });
    getDesignMemory().then((dm) =>
      dm.record(
        'tool_switch',
        { tool },
        {
          activeTool: tool,
          zoom: get().zoom,
          nodeCount: get().nodes.size,
          selectedCount: get().selectedIds.size,
        }
      )
    );
  },

  addNode: (node) =>
    set((state) => {
      const nodes = new Map(state.nodes);
      nodes.set(node.id, node);
      getDesignMemory().then((dm) =>
        dm.record(
          'node_create',
          {
            type: node.type,
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            fill: typeof node.fill === 'string' ? node.fill : undefined,
            fontFamily: node.fontFamily,
            fontSize: node.fontSize,
          },
          {
            activeTool: state.activeTool,
            zoom: state.zoom,
            nodeCount: nodes.size,
            selectedCount: state.selectedIds.size,
            hasText: node.type === 'text',
            hasImages: node.type === 'image',
          }
        )
      );
      return { nodes };
    }),

  updateNode: (id, updates) =>
    set((state) => {
      const nodes = new Map(state.nodes);
      const node = nodes.get(id);
      if (node) {
        nodes.set(id, { ...node, ...updates });
        if (updates.fill || updates.fontFamily || updates.fontSize || updates.stroke) {
          getDesignMemory().then((dm) =>
            dm.record(
              'node_style',
              {
                nodeId: id,
                color: typeof updates.fill === 'string' ? updates.fill : undefined,
                fontFamily: updates.fontFamily,
                fontSize: updates.fontSize,
                stroke: updates.stroke,
              },
              {
                activeTool: state.activeTool,
                zoom: state.zoom,
                nodeCount: nodes.size,
                selectedCount: state.selectedIds.size,
              }
            )
          );
        }
        if (
          updates.x !== undefined ||
          updates.y !== undefined ||
          updates.width !== undefined ||
          updates.height !== undefined
        ) {
          getDesignMemory().then((dm) =>
            dm.record(
              'node_transform',
              {
                nodeId: id,
                x: updates.x ?? node.x,
                y: updates.y ?? node.y,
                width: updates.width ?? node.width,
                height: updates.height ?? node.height,
              },
              {
                activeTool: state.activeTool,
                zoom: state.zoom,
                nodeCount: nodes.size,
                selectedCount: state.selectedIds.size,
              }
            )
          );
        }
      }
      return { nodes };
    }),

  removeNode: (id) =>
    set((state) => {
      const nodes = new Map(state.nodes);
      const node = nodes.get(id);
      nodes.delete(id);
      const selectedIds = new Set(state.selectedIds);
      selectedIds.delete(id);
      if (node) {
        getDesignMemory().then((dm) =>
          dm.record(
            'node_delete',
            {
              type: node.type,
              nodeId: id,
            },
            {
              activeTool: state.activeTool,
              zoom: state.zoom,
              nodeCount: nodes.size,
              selectedCount: selectedIds.size,
            }
          )
        );
      }
      return { nodes, selectedIds };
    }),

  selectNode: (ids) => set({ selectedIds: new Set(ids) }),
  setHovered: (id) => set({ hoveredId: id }),

  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setTheme: (theme: 'light' | 'dark' | 'system') => {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      set({ darkMode: prefersDark });
    } else {
      set({ darkMode: theme === 'dark' });
    }
  },
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleRulers: () => set((state) => ({ showRulers: !state.showRulers })),
  toggleExpertMode: () => set((state) => ({ expertMode: !state.expertMode })),
  toggleSnapToGrid: () => {
    set((state) => ({ snapToGrid: !state.snapToGrid }));
    const engine = (window as any).__kreathiefEngine;
    if (engine) engine.setSnapToGrid(!get().snapToGrid);
  },

  setZoom: (zoom) => {
    set({ zoom });
    getDesignMemory().then((dm) =>
      dm.record(
        'zoom_change',
        { zoom },
        {
          activeTool: get().activeTool,
          zoom,
          nodeCount: get().nodes.size,
          selectedCount: get().selectedIds.size,
        }
      )
    );
  },
  setPan: (x, y) => set({ panX: x, panY: y }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),

  pushCommand: (label, undoPatch, redoPatch) =>
    set((state) => {
      const command: HistoryCommand = {
        id: `cmd_${Date.now()}`,
        label,
        timestamp: Date.now(),
        undoPatch,
        redoPatch,
      };
      const past = [...state.past, command].slice(-500);
      return { past, future: [] };
    }),

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;
    const command = past[past.length - 1];
    getDesignMemory().then((dm) => dm.record('undo', { label: command.label }));
    set({
      ...command.undoPatch,
      past: past.slice(0, -1),
      future: [command, ...future],
    } as any);
    get().addToast('info', `Undid: ${command.label}`, 2000);
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;
    const command = future[0];
    getDesignMemory().then((dm) => dm.record('redo', { label: command.label }));
    set({
      ...command.redoPatch,
      past: [...past, command],
      future: future.slice(1),
    } as any);
    get().addToast('info', `Redid: ${command.label}`, 2000);
  },

  initMemory: async () => {
    const [dm, pa] = await Promise.all([getDesignMemory(), getPatternAnalyzer()]);
    await dm.init();
    pa.start(30000);

    dm.onAction((action) => {
      const state = get();
      const recent = [...state.recentActions, action].slice(-50);
      set({ recentActions: recent });
    });

    set({
      memoryReady: true,
      preferences: dm.getPreferences(),
      brands: dm.getBrandGuidelines(),
    });
  },

  recordMemoryAction: async (type: string, data: Record<string, any>) => {
    const state = get();
    const dm = await getDesignMemory();
    await dm.record(type as any, data, {
      activeTool: state.activeTool,
      zoom: state.zoom,
      nodeCount: state.nodes.size,
      selectedCount: state.selectedIds.size,
    });
  },

  refreshPreferences: async () => {
    const dm = await getDesignMemory();
    set({ preferences: dm.getPreferences() });
  },

  analyzePatterns: async () => {
    const pa = await getPatternAnalyzer();
    const patterns = pa.analyze();
    set({ patterns });
  },

  getSuggestions: async () => {
    const pa = await getPatternAnalyzer();
    const suggestions = pa.getSuggestions();
    set({ suggestions });
    return suggestions;
  },

  createBrand: async (name: string, projectId?: string) => {
    const [bm, dm] = await Promise.all([getBrandMemory(), getDesignMemory()]);
    const brand = await bm.createBrand(name, projectId);
    set({ brands: dm.getBrandGuidelines() });
    return brand;
  },

  updateBrand: async (id: string, updates: Partial<BrandGuideline>) => {
    const [bm, dm] = await Promise.all([getBrandMemory(), getDesignMemory()]);
    await bm.updateBrand(id, updates);
    set({ brands: dm.getBrandGuidelines() });
  },

  deleteBrand: async (id: string) => {
    const [bm, dm] = await Promise.all([getBrandMemory(), getDesignMemory()]);
    await bm.deleteBrand(id);
    const state = get();
    set({
      brands: dm.getBrandGuidelines(),
      activeBrandId: state.activeBrandId === id ? null : state.activeBrandId,
    });
  },

  setActiveBrand: (id: string | null) => {
    set({ activeBrandId: id });
  },

  checkNodeAgainstBrand: async (node: any) => {
    const state = get();
    if (!state.activeBrandId) return [];
    const bm = await getBrandMemory();
    return bm.checkNodeAgainstBrand(node, state.activeBrandId);
  },

  inferBrand: async (name: string, nodes: any[]) => {
    const [bm, dm] = await Promise.all([getBrandMemory(), getDesignMemory()]);
    const brand = await bm.inferBrandFromDesign(name, nodes);
    set({ brands: dm.getBrandGuidelines() });
    return brand;
  },

  getSkillLevel: async () => {
    const dm = await getDesignMemory();
    return dm.getSkillLevel();
  },
  getDesignStyle: async () => {
    const dm = await getDesignMemory();
    return dm.getDesignStyle();
  },
  getTopFonts: async (count = 5) => {
    const dm = await getDesignMemory();
    return dm.getTopFonts(count);
  },
  getTopColors: async (count = 10) => {
    const dm = await getDesignMemory();
    return dm.getTopColors(count);
  },

  exportMemory: async () => {
    const dm = await getDesignMemory();
    return dm.export();
  },
  importMemory: async (json: string) => {
    const dm = await getDesignMemory();
    return dm.import(json);
  },
  clearMemory: async () => {
    const dm = await getDesignMemory();
    await dm.clear();
    set({
      preferences: dm.getPreferences(),
      patterns: [],
      brands: [],
      recentActions: [],
      suggestions: [],
      activeBrandId: null,
    });
  },

  startCreativeDirector: async () => {
    const cd = await getCreativeDirector();
    cd.start();
    cd.onSuggestion((suggestion) => {
      const state = get();
      const existing = state.creativeSuggestions.find((s) => s.id === suggestion.id);
      if (!existing) {
        set({ creativeSuggestions: [...state.creativeSuggestions, suggestion].slice(-10) });
      }
    });
    set({ creativeDirectorRunning: true });
  },

  stopCreativeDirector: async () => {
    const cd = await getCreativeDirector();
    cd.stop();
    set({ creativeDirectorRunning: false });
  },

  analyzeCanvas: async (trigger: string) => {
    const cd = await getCreativeDirector();
    const state = get();
    const suggestions = cd.analyze(trigger as any, state.nodes, state.selectedIds);
    set({ creativeSuggestions: suggestions });
    return suggestions;
  },

  acceptSuggestion: async (suggestion: CreativeSuggestion) => {
    const cd = await getCreativeDirector();
    cd.acceptSuggestion(suggestion);
    set((state) => ({
      creativeSuggestions: state.creativeSuggestions.filter((s) => s.id !== suggestion.id),
    }));
  },

  rejectSuggestion: async (suggestion: CreativeSuggestion) => {
    const cd = await getCreativeDirector();
    cd.rejectSuggestion(suggestion);
    set((state) => ({
      creativeSuggestions: state.creativeSuggestions.filter((s) => s.id !== suggestion.id),
    }));
  },

  dismissSuggestion: async (id: string) => {
    const cd = await getCreativeDirector();
    cd.dismissSuggestion(id);
    set((state) => ({
      creativeSuggestions: state.creativeSuggestions.filter((s) => s.id !== id),
    }));
  },

  clearSuggestions: () => {
    set({ creativeSuggestions: [] });
  },

  saveWorkspace: (name = 'default') => {
    const state = get();
    const workspace = {
      nodes: Array.from(state.nodes.entries()),
      zoom: state.zoom,
      panX: state.panX,
      panY: state.panY,
      darkMode: state.darkMode,
      showGrid: state.showGrid,
      showRulers: state.showRulers,
      snapToGrid: state.snapToGrid,
      expertMode: state.expertMode,
      savedAt: Date.now(),
    };
    // Vault: wrap in try/catch — corrupted localStorage or quota exceeded
    // should not crash the app; user gets actionable feedback instead.
    try {
      const raw = localStorage.getItem('kreathief_workspaces');
      const workspaces = raw ? JSON.parse(raw) : {};
      workspaces[name] = workspace;
      localStorage.setItem('kreathief_workspaces', JSON.stringify(workspaces));
      set({ lastSaved: Date.now() });
      get().addToast('success', `Workspace "${name}" saved`);
    } catch (e) {
      get().addToast('error', `Failed to save workspace "${name}" — storage may be full or corrupted.`);
    }
  },

  loadWorkspace: (name = 'default') => {
    // Vault: wrap in try/catch — corrupted localStorage should not crash
    // the app; fall back to empty state with actionable error message.
    let workspaces: Record<string, any>;
    try {
      const raw = localStorage.getItem('kreathief_workspaces');
      workspaces = raw ? JSON.parse(raw) : {};
    } catch (e) {
      get().addToast('error', 'Workspace data is corrupted. Starting with empty canvas.');
      return;
    }
    const workspace = workspaces[name];
    if (!workspace) {
      get().addToast('error', `Workspace "${name}" not found`);
      return;
    }
    const nodes = new Map<string, DesignNode>(workspace.nodes);
    set({
      nodes,
      zoom: workspace.zoom || 1,
      panX: workspace.panX || 0,
      panY: workspace.panY || 0,
      darkMode: workspace.darkMode ?? true,
      showGrid: workspace.showGrid ?? true,
      showRulers: workspace.showRulers ?? true,
      snapToGrid: workspace.snapToGrid ?? false,
      expertMode: workspace.expertMode ?? false,
      past: [],
      future: [],
      selectedIds: new Set(),
    });
    get().addToast('success', `Workspace "${name}" loaded`);
  },

  listWorkspaces: () => {
    try {
      const raw = localStorage.getItem('kreathief_workspaces');
      const workspaces = raw ? JSON.parse(raw) : {};
      return Object.keys(workspaces);
    } catch {
      return [];
    }
  },

  deleteWorkspace: (name: string) => {
    try {
      const raw = localStorage.getItem('kreathief_workspaces');
      const workspaces = raw ? JSON.parse(raw) : {};
      delete workspaces[name];
      localStorage.setItem('kreathief_workspaces', JSON.stringify(workspaces));
      get().addToast('info', `Workspace "${name}" deleted`);
    } catch (e) {
      get().addToast('error', `Failed to delete workspace "${name}".`);
    }
  },

  autoSave: () => {
    const state = get();
    if (state.nodes.size === 0) return;
    const workspace = {
      nodes: Array.from(state.nodes.entries()),
      zoom: state.zoom,
      panX: state.panX,
      panY: state.panY,
      darkMode: state.darkMode,
      showGrid: state.showGrid,
      showRulers: state.showRulers,
      snapToGrid: state.snapToGrid,
      expertMode: state.expertMode,
      savedAt: Date.now(),
    };
    // Vault: wrap localStorage write in try/catch — quota exceeded or
    // private browsing can throw, and silent failure means user loses work.
    try {
      localStorage.setItem('kreathief_autosave', JSON.stringify(workspace));
      set({ lastSaved: Date.now() });
    } catch (e) {
      get().addToast('warning', 'Auto-save failed — storage may be full. Use File > Save to export your work.');
    }
  },
}));
