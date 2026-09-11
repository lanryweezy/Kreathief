import { useStore } from '../../store/useStore';
import { haptics } from '../../utils/haptics';
import type { Layer } from '../../types';

interface ShortcutDef {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

/**
 * Builds the deduplicated keyboard shortcut list for the editor.
 * Extracted from Editor.tsx to reduce component size and avoid duplicate bindings.
 */
export function buildEditorShortcuts(
  selectedLayerIds: string[],
  selectedLayer: Layer | undefined,
  selectedLayerId: string | null,
  setShowExport: (v: boolean) => void
): ShortcutDef[] {
  return [
    // History
    {
      key: 'z',
      ctrl: true,
      action: () => { useStore.getState().undo(); haptics.light(); },
      description: 'Undo',
    },
    {
      key: 'y',
      ctrl: true,
      action: () => { useStore.getState().redo(); haptics.light(); },
      description: 'Redo',
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      action: () => { useStore.getState().redo(); haptics.light(); },
      description: 'Redo (Alt)',
    },

    // Clipboard
    {
      key: 'c',
      ctrl: true,
      action: () => {
        if (selectedLayerId) {
          useStore.getState().copyLayer(selectedLayerId);
          haptics.selection();
        }
      },
      description: 'Copy Layer',
    },
    {
      key: 'v',
      ctrl: true,
      action: () => { useStore.getState().pasteLayer(); haptics.medium(); },
      description: 'Paste Layer',
    },
    {
      key: 'd',
      ctrl: true,
      action: () => {
        if (selectedLayerIds.length > 0) {
          useStore.getState().duplicateSelected();
          haptics.medium();
        }
      },
      description: 'Duplicate Layer(s)',
    },

    // Delete
    {
      key: 'Delete',
      action: () => {
        if (selectedLayerIds.length > 0) {
          useStore.getState().deleteSelected();
          haptics.heavy();
        }
      },
      description: 'Delete Layer(s)',
    },
    {
      key: 'Backspace',
      action: () => {
        if (selectedLayerIds.length > 0) {
          useStore.getState().deleteSelected();
          haptics.heavy();
        }
      },
      description: 'Delete Layer(s)',
    },

    // Save & Export
    {
      key: 's',
      ctrl: true,
      action: () => { useStore.getState().saveProject(); haptics.light(); },
      description: 'Save Project',
    },
    {
      key: 'e',
      ctrl: true,
      action: () => { setShowExport(true); haptics.light(); },
      description: 'Export Design',
    },

    // Grouping
    {
      key: 'g',
      ctrl: true,
      action: () => {
        if (selectedLayerIds.length > 1) {
          useStore.getState().groupSelected();
          haptics.medium();
        }
      },
      description: 'Group Layers',
    },
    {
      key: 'g',
      ctrl: true,
      shift: true,
      action: () => {
        if (selectedLayerIds.length > 0) {
          useStore.getState().ungroupSelected();
          haptics.light();
        }
      },
      description: 'Ungroup Layers',
    },

    // Tool modes
    {
      key: 'v',
      action: () => {
        useStore.getState().setSelectedLayerIds([]);
        useStore.getState().setPenMode(false);
        useStore.getState().setActiveTab('templates' as any);
        haptics.light();
      },
      description: 'Select Tool',
    },
    {
      key: 't',
      action: () => { useStore.getState().addTextLayer(); haptics.light(); },
      description: 'Add Text',
    },
    {
      key: 'r',
      action: () => { useStore.getState().addShapeLayer('rectangle'); haptics.light(); },
      description: 'Add Rectangle',
    },
    {
      key: 'o',
      action: () => { useStore.getState().addShapeLayer('circle'); haptics.light(); },
      description: 'Add Circle',
    },
    {
      key: 'l',
      action: () => { useStore.getState().addShapeLayer('arrow'); haptics.light(); },
      description: 'Add Arrow',
    },
    {
      key: 'p',
      action: () => {
        useStore.getState().setPenMode(!useStore.getState().isPenMode);
        haptics.light();
      },
      description: 'Pen Tool',
    },

    // Selection
    {
      key: 'a',
      ctrl: true,
      action: () => {
        const state = useStore.getState();
        const abs = state.artboards || [];
        const ab = abs.find((a: any) => a.id === state.activeArtboardId);
        if (ab) {
          useStore.getState().setSelectedLayerIds(ab.layers.map((l: any) => l.id));
        }
        haptics.light();
      },
      description: 'Select All',
    },

    // Layer ordering
    {
      key: ']',
      ctrl: true,
      action: () => {
        if (selectedLayerId) {
          useStore.getState().moveLayer(selectedLayerId, 'front');
          haptics.light();
        }
      },
      description: 'Bring to Front',
    },
    {
      key: '[',
      ctrl: true,
      action: () => {
        if (selectedLayerId) {
          useStore.getState().moveLayer(selectedLayerId, 'back');
          haptics.light();
        }
      },
      description: 'Send to Back',
    },

    // Flip
    {
      key: 'h',
      action: () => {
        if (selectedLayer && selectedLayer.type !== 'text') {
          useStore.getState().updateLayer(selectedLayer.id, { flipX: !(selectedLayer as any).flipX });
        }
      },
      description: 'Flip Horizontal',
    },
    {
      key: 'j',
      action: () => {
        if (selectedLayer && selectedLayer.type !== 'text') {
          useStore.getState().updateLayer(selectedLayer.id, { flipY: !(selectedLayer as any).flipY });
        }
      },
      description: 'Flip Vertical',
    },

    // UI
    {
      key: 'k',
      ctrl: true,
      action: () => { useStore.getState().setCommandPaletteOpen(true); haptics.light(); },
      description: 'Command Palette',
    },
    {
      key: '?',
      shift: true,
      action: () => useStore.getState().setShowShortcuts(!useStore.getState().showShortcuts),
      description: 'Shortcuts',
    },

    // Alignment (Alt+1-6)
    {
      key: '1',
      alt: true,
      action: () => { if (selectedLayerIds.length >= 2) { useStore.getState().alignLayers('left'); haptics.light(); } },
      description: 'Align Left',
    },
    {
      key: '2',
      alt: true,
      action: () => { if (selectedLayerIds.length >= 2) { useStore.getState().alignLayers('center'); haptics.light(); } },
      description: 'Align Center H',
    },
    {
      key: '3',
      alt: true,
      action: () => { if (selectedLayerIds.length >= 2) { useStore.getState().alignLayers('right'); haptics.light(); } },
      description: 'Align Right',
    },
    {
      key: '4',
      alt: true,
      action: () => { if (selectedLayerIds.length >= 2) { useStore.getState().alignLayers('top'); haptics.light(); } },
      description: 'Align Top',
    },
    {
      key: '5',
      alt: true,
      action: () => { if (selectedLayerIds.length >= 2) { useStore.getState().alignLayers('middle'); haptics.light(); } },
      description: 'Align Middle V',
    },
    {
      key: '6',
      alt: true,
      action: () => { if (selectedLayerIds.length >= 2) { useStore.getState().alignLayers('bottom'); haptics.light(); } },
      description: 'Align Bottom',
    },
  ];
}
