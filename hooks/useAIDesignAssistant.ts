import { useState, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Layer, TextLayer, ShapeLayer, ImageLayer } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../utils/log';
import { useShallow } from 'zustand/react/shallow';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIAction {
  type: 'modify' | 'create' | 'delete' | 'restyle' | 'arrange' | 'generate';
  target?: string;
  changes?: Record<string, any>;
  description: string;
}

/**
 * Feature 1: AI Design Assistant (Chat-to-Canvas)
 * User selects objects → types natural language → AI modifies the design.
 */
export function useAIDesignAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  const { artboards, activeArtboardId, selectedLayerIds, updateLayers, addLayer, deleteLayer, updateLayer, addToast } =
    useStore(useShallow((state) => ({
      artboards: state.artboards,
      activeArtboardId: state.activeArtboardId,
      selectedLayerIds: state.selectedLayerIds,
      updateLayers: state.updateLayers,
      addLayer: state.addLayer,
      deleteLayer: state.deleteLayer,
      updateLayer: state.updateLayer,
      addToast: state.addToast,
    })));

  const getSelectedLayers = useCallback((): Layer[] => {
    const ab = artboards.find((a) => a.id === activeArtboardId);
    if (!ab) {
      return [];
    }
    return ab.layers.filter((l) => selectedLayerIds.includes(l.id));
  }, [artboards, activeArtboardId, selectedLayerIds]);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsProcessing(true);

      try {
        const selectedLayers = getSelectedLayers();
        const context = buildDesignContext(selectedLayers, artboards, activeArtboardId);

        // Parse intent from the message
        const actions = await parseDesignIntent(text, context, selectedLayers);

        // Execute actions
        const results: string[] = [];
        for (const action of actions) {
          const result = await executeAction(action);
          results.push(result);
        }

        const assistantMsg: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: results.join('\n'),
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Generate follow-up suggestions
        const newSuggestions = generateSuggestions(actions, selectedLayers);
        setSuggestions(newSuggestions);
      } catch (err) {
        log.error('[AIDesignAssistant] Error', err);
        const errorMsg: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: "Sorry, I couldn't process that request. Try rephrasing or selecting different layers.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsProcessing(false);
      }
    },
    [getSelectedLayers, artboards, activeArtboardId]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setSuggestions([]);
  }, []);

  return {
    messages,
    isProcessing,
    suggestions,
    sendMessage,
    clearChat,
    chatRef,
  };
}

function buildDesignContext(layers: Layer[], artboards: any[], activeArtboardId: string): string {
  const ab = artboards.find((a: any) => a.id === activeArtboardId);
  if (!ab) {
    return 'No artboard selected';
  }

  const layerDescriptions = layers.map((l) => {
    const type = l.type;
    const name = l.name || `${type} layer`;
    const pos = `(${Math.round(l.x)}, ${Math.round(l.y)})`;
    const size = `${Math.round((l as any).width || 100)}x${Math.round((l as any).height || 100)}`;
    const opacity = Math.round((l.opacity || 1) * 100);

    if (type === 'text') {
      const tl = l as TextLayer;
      return `${name}: text "${tl.text?.substring(0, 30)}" in ${tl.fontFamily} ${tl.fontSize}px, color ${tl.color}, ${pos}, ${size}, opacity ${opacity}%`;
    }
    if (type === 'image') {
      return `${name}: image ${pos}, ${size}, opacity ${opacity}%`;
    }
    if (
      [
        'rectangle',
        'circle',
        'triangle',
        'star',
        'hexagon',
        'diamond',
        'arrow',
        'heart',
        'speech_bubble',
        'ribbon',
        'shield',
        'banner',
        'pentagon',
        'octagon',
        'plus',
        'star_4',
        'star_8',
        'path',
      ].includes(type)
    ) {
      const sl = l as ShapeLayer;
      return `${name}: ${sl.type} shape, color ${sl.color}, ${pos}, ${size}, opacity ${opacity}%`;
    }
    return `${name}: ${type} ${pos}, ${size}`;
  });

  return `Artboard: ${ab.width}x${ab.height}, bg: ${ab.backgroundColor || '#ffffff'}\nSelected layers (${layers.length}):\n${layerDescriptions.join('\n')}`;
}

async function parseDesignIntent(text: string, context: string, layers: Layer[]): Promise<AIAction[]> {
  const lower = text.toLowerCase();
  const actions: AIAction[] = [];

  // Color changes
  if (lower.match(/color|colour|paint|recolor/)) {
    const colorMatch = text.match(
      /#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|red|blue|green|yellow|purple|orange|pink|black|white|gray|grey/i
    );
    if (colorMatch) {
      const color = normalizeColor(colorMatch[0]);
      actions.push({
        type: 'modify',
        changes: { color },
        description: `Changed color to ${color}`,
      });
    }
  }

  // Size changes
  if (lower.match(/bigger|larger|scale up|increase size/)) {
    actions.push({
      type: 'modify',
      changes: { width: '120%', height: '120%' },
      description: 'Made selection 20% larger',
    });
  }
  if (lower.match(/smaller|scale down|reduce size|shrink/)) {
    actions.push({
      type: 'modify',
      changes: { width: '80%', height: '80%' },
      description: 'Made selection 20% smaller',
    });
  }

  // Position changes
  if (lower.match(/center|centre/)) {
    actions.push({
      type: 'arrange',
      changes: { alignment: 'center' },
      description: 'Centered selection on artboard',
    });
  }
  if (lower.match(/move left|shift left/)) {
    actions.push({ type: 'modify', changes: { x: -50 }, description: 'Moved 50px left' });
  }
  if (lower.match(/move right|shift right/)) {
    actions.push({ type: 'modify', changes: { x: 50 }, description: 'Moved 50px right' });
  }
  if (lower.match(/move up|shift up/)) {
    actions.push({ type: 'modify', changes: { y: -50 }, description: 'Moved 50px up' });
  }
  if (lower.match(/move down|shift down/)) {
    actions.push({ type: 'modify', changes: { y: 50 }, description: 'Moved 50px down' });
  }

  // Opacity
  if (lower.match(/fade|transparent|opacity/)) {
    const numMatch = text.match(/(\d+)%?/);
    const opacity = numMatch ? parseInt(numMatch[1]) / 100 : 0.5;
    actions.push({ type: 'modify', changes: { opacity }, description: `Set opacity to ${Math.round(opacity * 100)}%` });
  }

  // Delete
  if (lower.match(/delete|remove|erase/)) {
    actions.push({ type: 'delete', description: 'Deleted selected layers' });
  }

  // Duplicate
  if (lower.match(/duplicate|copy|clone/)) {
    actions.push({ type: 'create', description: 'Duplicated selection' });
  }

  // Rotate
  if (lower.match(/rotate|turn|spin/)) {
    const angleMatch = text.match(/(-?\d+)/);
    const angle = angleMatch ? parseInt(angleMatch[1]) : 45;
    actions.push({ type: 'modify', changes: { rotation: angle }, description: `Rotated ${angle}°` });
  }

  // Text changes
  if (layers.some((l) => l.type === 'text')) {
    if (lower.match(/bold|make.*bold/)) {
      actions.push({ type: 'modify', changes: { fontWeight: 'bold' }, description: 'Made text bold' });
    }
    if (lower.match(/italic|make.*italic/)) {
      actions.push({ type: 'modify', changes: { fontStyle: 'italic' }, description: 'Made text italic' });
    }
    if (lower.match(/bigger.*font|increase.*font|larger.*text/)) {
      actions.push({ type: 'modify', changes: { fontSize: '+8' }, description: 'Increased font size' });
    }
    if (lower.match(/smaller.*font|decrease.*font|smaller.*text/)) {
      actions.push({ type: 'modify', changes: { fontSize: '-8' }, description: 'Decreased font size' });
    }
  }

  // Add shape
  if (lower.match(/add.*circle|draw.*circle/)) {
    actions.push({
      type: 'create',
      changes: { type: 'circle', width: 100, height: 100, color: '#7d2ae8' },
      description: 'Added a purple circle',
    });
  }
  if (lower.match(/add.*rectangle|draw.*rect|add.*box/)) {
    actions.push({
      type: 'create',
      changes: { type: 'rectangle', width: 150, height: 100, color: '#7d2ae8' },
      description: 'Added a purple rectangle',
    });
  }

  // Add text
  if (lower.match(/add.*text|write.*text|insert.*text/)) {
    const textContent = text.replace(/add|write|insert|text|label/gi, '').trim() || 'Hello';
    actions.push({
      type: 'create',
      changes: { type: 'text', text: textContent, fontSize: 32, color: '#ffffff', fontFamily: 'Inter' },
      description: `Added text: "${textContent}"`,
    });
  }

  // If no actions matched, provide a helpful response
  if (actions.length === 0) {
    actions.push({
      type: 'modify',
      description: `I can help with: changing colors, resizing, repositioning, rotating, adjusting opacity, adding shapes/text, duplicating, or deleting. Try: "make it blue", "center it", "add a circle", or "delete this".`,
    });
  }

  return actions;
}

async function executeAction(action: AIAction): Promise<string> {
  const store = useStore.getState();
  const selectedIds = store.selectedLayerIds;
  const ab = store.artboards.find((a: any) => a.id === store.activeArtboardId);
  if (!ab) {
    return 'No artboard found';
  }

  switch (action.type) {
    case 'modify': {
      if (action.changes && selectedIds.length > 0) {
        const updates: Record<string, any> = {};
        for (const id of selectedIds) {
          const layer = ab.layers.find((l: any) => l.id === id);
          if (!layer) {
            continue;
          }
          const changes: any = {};
          for (const [key, val] of Object.entries(action.changes)) {
            if (typeof val === 'string' && val.startsWith('+')) {
              changes[key] = (layer as any)[key] + parseInt(val.substring(1));
            } else if (typeof val === 'string' && val.startsWith('-')) {
              changes[key] = (layer as any)[key] + parseInt(val);
            } else if (typeof val === 'string' && val.endsWith('%')) {
              const pct = parseInt(val) / 100;
              changes.width = Math.round(((layer as any).width || 100) * pct);
              changes.height = Math.round(((layer as any).height || 100) * pct);
            } else {
              changes[key] = val;
            }
          }
          updates[id] = changes;
        }
        store.updateLayers(updates);
      }
      return action.description;
    }
    case 'delete': {
      for (const id of selectedIds) {
        store.deleteLayer(id);
      }
      return action.description;
    }
    case 'create': {
      if (action.changes?.type === 'text') {
        store.addTextLayer({
          text: action.changes.text,
          fontSize: action.changes.fontSize || 32,
          color: action.changes.color || '#ffffff',
          fontFamily: action.changes.fontFamily || 'Inter',
        } as any);
      } else if (action.changes?.type === 'circle' || action.changes?.type === 'rectangle') {
        store.addShapeLayer(action.changes.type, {
          width: action.changes.width || 100,
          height: action.changes.height || 100,
          color: action.changes.color || '#7d2ae8',
        });
      } else if (selectedIds.length > 0) {
        // Duplicate
        for (const id of selectedIds) {
          store.duplicateLayer(id);
        }
      }
      return action.description;
    }
    case 'arrange': {
      if (action.changes?.alignment === 'center' && selectedIds.length > 0) {
        const updates: Record<string, any> = {};
        for (const id of selectedIds) {
          const layer = ab.layers.find((l: any) => l.id === id);
          if (layer) {
            updates[id] = {
              x: (ab.width - ((layer as any).width || 100)) / 2,
              y: (ab.height - ((layer as any).height || 100)) / 2,
            };
          }
        }
        store.updateLayers(updates);
      }
      return action.description;
    }
    default:
      return action.description;
  }
}

function normalizeColor(input: string): string {
  const colorMap: Record<string, string> = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#eab308',
    purple: '#a855f7',
    orange: '#f97316',
    pink: '#ec4899',
    black: '#000000',
    white: '#ffffff',
    gray: '#6b7280',
    grey: '#6b7280',
  };
  if (colorMap[input.toLowerCase()]) {
    return colorMap[input.toLowerCase()];
  }
  if (input.startsWith('#') || input.startsWith('rgb')) {
    return input;
  }
  return input;
}

function generateSuggestions(actions: AIAction[], layers: Layer[]): string[] {
  const suggestions: string[] = [];
  if (layers.some((l) => l.type === 'text')) {
    suggestions.push('Make text bold');
  }
  if (layers.some((l) => l.type === 'image')) {
    suggestions.push('Remove background');
  }
  suggestions.push('Center on artboard', 'Add a circle', 'Change to purple');
  return suggestions.slice(0, 4);
}
