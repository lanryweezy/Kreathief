import { useState, useEffect, useCallback, useRef } from 'react';
import { Layer, TextLayer, ShapeLayer, ImageLayer } from '../types';

export interface SmartSuggestion {
  id: string;
  type: string;
  label: string;
  icon: string;
  action: () => void;
}

export interface SnapPoint {
  type: 'vertical' | 'horizontal';
  value: number;
  origin: number;
  extent: number;
}

export function useSmartInteraction(layers: Layer[], selectedIds: string[]) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [snapPoints, setSnapPoints] = useState<SnapPoint[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const selectedLayers = layers.filter(l => selectedIds.includes(l.id));

  useEffect(() => {
    if (!selectedLayers.length) { setSuggestions([]); return; }
    const s: SmartSuggestion[] = [];
    if (selectedLayers.length >= 2) {
      s.push(
        { id: 'align', type: 'multi', label: 'Align', icon: 'AlignCenter', action: () => {} },
        { id: 'spacing', type: 'multi', label: 'Equal spacing', icon: 'Spacing', action: () => {} },
        { id: 'group', type: 'multi', label: 'Group', icon: 'Group', action: () => {} },
        { id: 'component', type: 'multi', label: 'Make component', icon: 'Layers', action: () => {} }
      );
    }
    const text = selectedLayers.find(l => l.type === 'text') as TextLayer | undefined;
    if (text && text.width !== text.height) {
      s.push({ id: 'font-size', type: 'text', label: `Recommended: ${Math.round(text.fontSize / 2) * 2}px`, icon: 'Text', action: () => {} });
    }
    const shape = selectedLayers.find(l => l.type !== 'text' && l.type !== 'image') as ShapeLayer | undefined;
    if (shape && !shape.lockProportions) {
      s.push({ id: 'lock-ratio', type: 'shape', label: 'Lock ratio', icon: 'Lock', action: () => {} });
    }
    const img = selectedLayers.find(l => l.type === 'image') as ImageLayer | undefined;
    if (img) {
      s.push(
        { id: 'remove-bg', type: 'image', label: 'Remove background', icon: 'Scissors', action: () => {} },
        { id: 'match-colors', type: 'image', label: 'Match brand colors', icon: 'EyeDropper', action: () => {} }
      );
    }
    setSuggestions(s);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setSuggestions([]), 5000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [selectedLayers, layers]);

  const applySuggestion = useCallback((s: SmartSuggestion) => { s.action(); setSuggestions([]); }, []);
  const dismissSuggestion = useCallback((id: string) => { setSuggestions(prev => prev.filter(s => s.id !== id)); }, []);
  return { suggestions, snapPoints, applySuggestion, dismissSuggestion };
}