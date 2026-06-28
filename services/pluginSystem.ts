import { Layer, Artboard } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Feature 9: Plugin System — basic extension architecture.
 * Plugins run in sandboxed iframes with a message-based API.
 */

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  icon?: string;
  entry: string; // URL to plugin iframe
  permissions: PluginPermission[];
}

export type PluginPermission =
  | 'read:layers'
  | 'write:layers'
  | 'read:artboard'
  | 'write:artboard'
  | 'read:selection'
  | 'write:selection'
  | 'read:canvas'
  | 'ui:panel'
  | 'ui:toolbar'
  | 'ui:context-menu';

export interface PluginMessage {
  type: string;
  payload: any;
  pluginId: string;
}

export interface PluginAPI {
  /** Get all layers */
  getLayers: () => Layer[];
  /** Get selected layers */
  getSelectedLayers: () => Layer[];
  /** Update layer properties */
  updateLayer: (id: string, changes: Partial<Layer>) => void;
  /** Add a new layer */
  addLayer: (layer: Partial<Layer>) => void;
  /** Delete a layer */
  deleteLayer: (id: string) => void;
  /** Get artboard info */
  getArtboard: () => Artboard | null;
  /** Update artboard */
  updateArtboard: (changes: Partial<Artboard>) => void;
  /** Show a toast notification */
  showToast: (message: string, type?: string) => void;
  /** Register a toolbar button */
  registerToolbar: (config: { id: string; label: string; icon?: string; onClick: () => void }) => void;
  /** Register a context menu item */
  registerContextMenu: (config: { id: string; label: string; onClick: (layerId: string) => void }) => void;
}

// Plugin registry
const plugins = new Map<string, { manifest: PluginManifest; iframe: HTMLIFrameElement; api: PluginAPI }>();

/**
 * Register a plugin from a manifest.
 */
export function registerPlugin(manifest: PluginManifest): boolean {
  if (plugins.has(manifest.id)) {
    console.warn(`[PluginSystem] Plugin ${manifest.id} already registered`);
    return false;
  }

  // Create sandboxed iframe
  const iframe = document.createElement('iframe');
  iframe.src = manifest.entry;
  iframe.sandbox.add('allow-scripts');
  iframe.sandbox.add('allow-same-origin');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  // Build API
  const api = buildPluginAPI(manifest);

  plugins.set(manifest.id, { manifest, iframe, api });
  console.log(`[PluginSystem] Registered plugin: ${manifest.name} v${manifest.version}`);
  return true;
}

/**
 * Unregister a plugin.
 */
export function unregisterPlugin(pluginId: string): void {
  const plugin = plugins.get(pluginId);
  if (plugin) {
    plugin.iframe.remove();
    plugins.delete(pluginId);
    console.log(`[PluginSystem] Unregistered plugin: ${pluginId}`);
  }
}

/**
 * Get all registered plugins.
 */
export function getRegisteredPlugins(): PluginManifest[] {
  return Array.from(plugins.values()).map((p) => p.manifest);
}

/**
 * Send a message to a plugin.
 */
export function sendToPlugin(pluginId: string, message: PluginMessage): void {
  const plugin = plugins.get(pluginId);
  if (plugin && plugin.iframe.contentWindow) {
    plugin.iframe.contentWindow.postMessage({ ...message, pluginId }, '*');
  }
}

/**
 * Listen for messages from plugins.
 */
export function onPluginMessage(callback: (pluginId: string, message: PluginMessage) => void): () => void {
  const handler = (event: MessageEvent) => {
    const { pluginId, type, payload } = event.data;
    if (pluginId && plugins.has(pluginId)) {
      callback(pluginId, { type, payload, pluginId });
    }
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}

function buildPluginAPI(manifest: PluginManifest): PluginAPI {
  const store = (window as any).__zustand_store__ || null;

  return {
    getLayers: () => {
      if (!store) {
        return [];
      }
      const state = store.getState();
      const ab = state.artboards.find((a: any) => a.id === state.activeArtboardId);
      return ab?.layers || [];
    },

    getSelectedLayers: () => {
      if (!store) {
        return [];
      }
      const state = store.getState();
      const ab = state.artboards.find((a: any) => a.id === state.activeArtboardId);
      if (!ab) {
        return [];
      }
      return ab.layers.filter((l: any) => state.selectedLayerIds.includes(l.id));
    },

    updateLayer: (id, changes) => {
      store?.getState().updateLayer(id, changes);
    },

    addLayer: (layer) => {
      store?.getState().addLayer({ id: uuidv4(), ...layer } as any);
    },

    deleteLayer: (id) => {
      store?.getState().deleteLayer(id);
    },

    getArtboard: () => {
      if (!store) {
        return null;
      }
      const state = store.getState();
      return state.artboards.find((a: any) => a.id === state.activeArtboardId) || null;
    },

    updateArtboard: (changes) => {
      if (!store) {
        return;
      }
      const state = store.getState();
      store.getState().updateArtboard(state.activeArtboardId, changes);
    },

    showToast: (message, type = 'info') => {
      store?.getState().addToast(message, type as any);
    },

    registerToolbar: (config) => {
      // Toolbar registration is handled by the Editor component
      console.log(`[PluginSystem] Toolbar registered: ${config.label}`);
    },

    registerContextMenu: (config) => {
      // Context menu registration is handled by the ContextMenu component
      console.log(`[PluginSystem] Context menu registered: ${config.label}`);
    },
  };
}

/**
 * Expose plugin API to window for E2E testing.
 */
if (typeof window !== 'undefined') {
  (window as any).__pluginSystem__ = {
    registerPlugin,
    unregisterPlugin,
    getRegisteredPlugins,
    sendToPlugin,
    onPluginMessage,
  };
}
