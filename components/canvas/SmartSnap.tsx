import React from 'react';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Layer } from '../../types';

interface SmartSnapProps {
  layers: Layer[];
  selectedIds: string[];
  zoom: number;
}

interface SnapIndicator {
  type: 'vertical' | 'horizontal';
  x1: number; y1: number; x2: number; y2: number;
  label?: string;
}

export const SmartSnap: React.FC<SmartSnapProps> = ({ layers, selectedIds, zoom }) => {
  const { snapToGrid, snapToObjects } = useStore(
    useShallow((state) => ({ snapToGrid: state.snapToGrid, snapToObjects: state.snapToObjects }))
  );

  const selectedLayers = layers.filter(l => selectedIds.includes(l.id));
  const otherLayers = layers.filter(l => !selectedIds.includes(l.id) && !l.locked && l.visible);

  if (selectedLayers.length === 0 || (!snapToGrid && !snapToObjects)) return null;

  const indicators: SnapIndicator[] = [];
  const threshold = 5 / zoom;

  if (selectedLayers.length >= 1 && otherLayers.length >= 1) {
    const xs = selectedLayers.map(l => l.x);
    const ys = selectedLayers.map(l => l.y);
    const xws = selectedLayers.map(l => l.x + (l.width || 0));
    const yhs = selectedLayers.map(l => l.y + (l.height || 0));
    if (!xs.every(Number.isFinite) || !ys.every(Number.isFinite) || !xws.every(Number.isFinite) || !yhs.every(Number.isFinite)) return null;
    const bounds = {
      left: Math.min(...xs),
      right: Math.max(...xws),
      top: Math.min(...ys),
      bottom: Math.max(...yhs),
      centerX: (Math.min(...xs) + Math.max(...xws)) / 2,
      centerY: (Math.min(...ys) + Math.max(...yhs)) / 2,
    };

    otherLayers.forEach(layer => {
      const lb = { left: layer.x, right: layer.x + layer.width, top: layer.y, bottom: layer.y + layer.height, centerX: layer.x + layer.width / 2, centerY: layer.y + layer.height / 2 };
      if (Math.abs(bounds.left - lb.left) < threshold) indicators.push({ type: 'vertical', x1: lb.left, y1: Math.min(bounds.top, lb.top), x2: lb.left, y2: Math.max(bounds.bottom, lb.bottom), label: 'Align left' });
      if (Math.abs(bounds.centerX - lb.centerX) < threshold) indicators.push({ type: 'vertical', x1: lb.centerX, y1: Math.min(bounds.top, lb.top), x2: lb.centerX, y2: Math.max(bounds.bottom, lb.bottom), label: 'Align center' });
      if (Math.abs(bounds.right - lb.right) < threshold) indicators.push({ type: 'vertical', x1: lb.right, y1: Math.min(bounds.top, lb.top), x2: lb.right, y2: Math.max(bounds.bottom, lb.bottom), label: 'Align right' });
      if (Math.abs(bounds.top - lb.top) < threshold) indicators.push({ type: 'horizontal', x1: Math.min(bounds.left, lb.left), y1: lb.top, x2: Math.max(bounds.right, lb.right), y2: lb.top, label: 'Align top' });
      if (Math.abs(bounds.centerY - lb.centerY) < threshold) indicators.push({ type: 'horizontal', x1: Math.min(bounds.left, lb.left), y1: lb.centerY, x2: Math.max(bounds.right, lb.right), y2: lb.centerY, label: 'Align middle' });
      if (Math.abs(bounds.bottom - lb.bottom) < threshold) indicators.push({ type: 'horizontal', x1: Math.min(bounds.left, lb.left), y1: lb.bottom, x2: Math.max(bounds.right, lb.right), y2: lb.bottom, label: 'Align bottom' });
    });
  }

  if (selectedLayers.length >= 3 && otherLayers.length === 0) {
    const sorted = [...selectedLayers].sort((a, b) => a.x - b.x);
    const spacing = sorted[1].x - (sorted[0].x + sorted[0].width);
    const isEqualSpacing = sorted.every((l, i) => i === 0 || Math.abs((l.x - (sorted[i - 1].x + sorted[i - 1].width)) - spacing) < 2);
    if (isEqualSpacing) {
      const first = sorted[0], last = sorted[sorted.length - 1];
      indicators.push({ type: 'horizontal', x1: first.x, y1: first.y + first.height + 10, x2: last.x + last.width, y2: last.y + last.height + 10, label: 'Equal spacing' });
    }
  }

  if (indicators.length === 0) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none z-40" style={{ width: '100%', height: '100%' }}>
      <defs><filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      {indicators.map((ind, i) => (
        <line key={i} x1={ind.x1} y1={ind.y1} x2={ind.x2} y2={ind.y2} stroke="#3b82f6" strokeWidth="1" filter="url(#glow)" opacity="0.8" />
      ))}
    </svg>
  );
};