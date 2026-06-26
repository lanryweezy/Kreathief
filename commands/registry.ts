import { useStore } from '../store/useStore';

export interface Command {
  id: string;
  label: string;
  shortcut?: string;
  category: string;
  icon: string;
  action: () => void;
}

const commands: Command[] = [];
let recentIds: string[] = [];

export function registerCommand(cmd: Command): void {
  if (!commands.find((c) => c.id === cmd.id)) commands.push(cmd);
}

export function searchCommands(query: string): Command[] {
  const q = query.toLowerCase();
  return commands.filter(
    (c) => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q),
  );
}

export function getRecentCommands(): Command[] {
  return recentIds.map((id) => commands.find((c) => c.id === id)).filter(Boolean) as Command[];
}

export function getAllCommands(): Command[] {
  return [...commands];
}

function trackRecent(id: string): void {
  recentIds = [id, ...recentIds.filter((r) => r !== id)].slice(0, 5);
}

function run(id: string): void {
  const cmd = commands.find((c) => c.id === id);
  if (cmd) {
    cmd.action();
    trackRecent(id);
  }
}

// Pre-register built-in commands
const builtins: Command[] = [
  { id: 'generate', label: 'Generate Image', shortcut: 'Ctrl+G', category: 'AI', icon: '✨', action: () => {} },
  { id: 'export', label: 'Export Design', shortcut: 'Ctrl+E', category: 'File', icon: '📤', action: () => (useStore.getState() as any).setIsExporting?.(true) },
  { id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z', category: 'Edit', icon: '↩', action: () => (useStore.getState() as any).undo?.() },
  { id: 'redo', label: 'Redo', shortcut: 'Ctrl+Shift+Z', category: 'Edit', icon: '↪', action: () => (useStore.getState() as any).redo?.() },
  { id: 'toggle-grid', label: 'Toggle Grid', shortcut: "Ctrl+'", category: 'View', icon: '⊞', action: () => (useStore.getState() as any).toggleGrid?.() },
  { id: 'toggle-rulers', label: 'Toggle Rulers', shortcut: 'Ctrl+R', category: 'View', icon: '📏', action: () => (useStore.getState() as any).toggleRulers?.() },
  { id: 'add-text', label: 'Add Text Layer', category: 'Layers', icon: 'T', action: () => (useStore.getState() as any).addTextLayer?.('Text', 100, 100) },
  { id: 'add-shape', label: 'Add Shape', category: 'Layers', icon: '□', action: () => (useStore.getState() as any).addShapeLayer?.('rectangle', {}) },
  { id: 'add-image', label: 'Add Image', category: 'Layers', icon: '🖼', action: () => {} },
  { id: 'group', label: 'Group Selection', shortcut: 'Ctrl+G', category: 'Edit', icon: '📁', action: () => (useStore.getState() as any).groupSelected?.() },
  { id: 'ungroup', label: 'Ungroup Selection', shortcut: 'Ctrl+Shift+G', category: 'Edit', icon: '📂', action: () => (useStore.getState() as any).ungroupSelected?.() },
  { id: 'duplicate', label: 'Duplicate Layer', shortcut: 'Ctrl+D', category: 'Edit', icon: '⧉', action: () => (useStore.getState() as any).duplicateSelected?.() },
  { id: 'delete', label: 'Delete Layer', shortcut: 'Del', category: 'Edit', icon: '🗑', action: () => (useStore.getState() as any).deleteSelected?.() },
  { id: 'bring-front', label: 'Bring to Front', shortcut: 'Ctrl+]', category: 'Layers', icon: '⬆', action: () => (useStore.getState() as any).bringToFront?.() },
  { id: 'send-back', label: 'Send to Back', shortcut: 'Ctrl+[', category: 'Layers', icon: '⬇', action: () => (useStore.getState() as any).sendToBack?.() },
  { id: 'lock', label: 'Toggle Lock', category: 'Layers', icon: '🔒', action: () => (useStore.getState() as any).toggleLockSelected?.() },
  { id: 'hide', label: 'Toggle Visibility', category: 'Layers', icon: '👁', action: () => (useStore.getState() as any).toggleVisibilitySelected?.() },
  { id: 'zoom-fit', label: 'Zoom to Fit', shortcut: 'Ctrl+0', category: 'View', icon: '🔍', action: () => (useStore.getState() as any).zoomToFit?.() },
  { id: 'zoom-100', label: 'Zoom to 100%', shortcut: 'Ctrl+1', category: 'View', icon: '100', action: () => (useStore.getState() as any).setZoom?.(1) },
  { id: 'save', label: 'Save Project', shortcut: 'Ctrl+S', category: 'File', icon: '💾', action: () => (useStore.getState() as any).saveProject?.() },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', shortcut: 'Ctrl+/', category: 'Help', icon: '⌨', action: () => (useStore.getState() as any).toggleShortcuts?.() },
  { id: 'vectorize', label: 'Vectorize Selection', category: 'AI', icon: '🔀', action: () => {} },
  { id: 'brand-kit', label: 'Apply Brand Kit', category: 'Brand', icon: '🎨', action: () => {} },
  { id: 'magic-resize', label: 'Magic Resize', category: 'AI', icon: '📐', action: () => (useStore.getState() as any).magicResize?.(1080, 1080) },
];

builtins.forEach(registerCommand);

// Wrap action to track recents
const origRun = run;
Object.defineProperty(globalThis, '__cmdRegistry', { value: { run: origRun } });
