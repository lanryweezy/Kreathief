import React, { useState, useCallback, useEffect } from 'react';
import { Layer } from '../../types';
import { useStore } from '../../store/useStore';

interface DimensionInputsProps {
  layer: Layer;
  zoom: number;
}

export const DimensionInputs: React.FC<DimensionInputsProps> = React.memo(({ layer, zoom }) => {
  const updateLayer = useStore((s) => s.updateLayer);
  const saveToHistory = useStore((s) => s.saveToHistory);

  const w = Math.round(Number((layer as any).width) || 0);
  const h = Math.round(Number((layer as any).height) || 0);
  const r = Math.round(layer.rotation || 0);
  const cr = Math.round((layer as any).cornerRadius || 0);

  const commit = useCallback(() => { saveToHistory(); }, [saveToHistory]);

  const Field = ({
    label, value, field, suffix = 'px',
  }: {
    label: string; value: number; field: string; suffix?: string;
  }) => {
    const [local, setLocal] = useState(String(value));
    const [editing, setEditing] = useState(false);
    useEffect(() => { if (!editing) setLocal(String(value)); }, [value, editing]);
    const parse = (v: string) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
    const handleBlur = () => {
      setEditing(false);
      const parsed = parse(local);
      if (parsed !== value) {
        updateLayer(layer.id, { [field]: parsed } as any);
      }
      commit();
    };
    return (
      <label className="flex items-center gap-1 text-[10px] text-gray-400">
        <span className="text-gray-500 font-medium w-3">{label}</span>
        <input
          type="number"
          value={local}
          onFocus={() => setEditing(true)}
          onBlur={handleBlur}
          onChange={(e) => setLocal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          className="w-12 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px] text-gray-200 font-mono focus:border-brand-600 focus:outline-none"
        />
        <span className="text-gray-600">{suffix}</span>
      </label>
    );
  };

  return (
    <div
      className="absolute flex items-center gap-2 bg-surface-dark-3/90 backdrop-blur-xl border border-white/10 rounded-lg px-2 py-1.5 shadow-xl z-[90] pointer-events-auto"
      style={{ left: layer.x + w / 2, top: layer.y + h + 20 / zoom, transform: 'translateX(-50%)' }}
    >
      <Field label="X" value={Math.round(layer.x)} field="x" />
      <Field label="Y" value={Math.round(layer.y)} field="y" />
      <Field label="W" value={w} field="width" />
      <Field label="H" value={h} field="height" />
      <div className="w-px h-4 bg-white/10" />
      <Field label="R" value={r} field="rotation" suffix="°" />
      <Field label="Rad" value={cr} field="cornerRadius" />
    </div>
  );
});
DimensionInputs.displayName = 'DimensionInputs';
