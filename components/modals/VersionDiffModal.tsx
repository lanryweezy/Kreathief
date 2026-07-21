import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { StaticLayerRenderer } from '../StaticLayerRenderer';
import { DesignSnapshot } from '../../types';

export const VersionDiffModal: React.FC = () => {
  const show = useStore((s) => s.showVersionDiff);
  const setShow = useStore((s) => s.setShowVersionDiff);
  const snapshots = useStore((s) => s.snapshots) as DesignSnapshot[];
  const artboards = useStore((s) => s.artboards);
  const fetchSnapshots = useStore((s) => s.fetchSnapshots);
  const projectId = useStore((s) => s.projectId);

  const [leftId, setLeftId] = useState<string | 'live'>('live');
  const [rightId, setRightId] = useState<string | null>(null);
  const [leftAbIndex] = useState(0);
  const [rightAbIndex] = useState(0);

  useEffect(() => {
    if (show && projectId) {
      fetchSnapshots();
    }
  }, [show, projectId, fetchSnapshots]);

  const leftSnapshot = useMemo(
    () => (leftId === 'live' ? null : snapshots?.find((s) => s.id === leftId) || null),
    [snapshots, leftId]
  );
  const rightSnapshot = useMemo(() => snapshots?.find((s) => s.id === rightId) || snapshots?.[0], [snapshots, rightId]);

  const leftState: any = leftSnapshot ? leftSnapshot.state : { artboards };
  const rightState: any = rightSnapshot?.state;
  const leftAb = leftState?.artboards?.[leftAbIndex] || leftState?.artboards?.[0];
  const rightAb = rightState?.artboards?.[rightAbIndex] || rightState?.artboards?.[0];

  const diffs = useMemo(() => {
    if (!leftAb || !rightAb) {
      return [];
    }
    const leftLayers = (leftAb?.layers || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      type: l.type,
      w: l.width,
      h: l.height,
      x: l.x,
      y: l.y,
    }));
    const rightLayers = (rightAb?.layers || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      type: l.type,
      w: l.width,
      h: l.height,
      x: l.x,
      y: l.y,
      rot: l.rotation,
      op: l.opacity,
      col: l.color || l.fill || '',
      vis: l.visible,
    }));
    const leftMap = new Map(leftLayers.map((l: any) => [l.id, l]));
    const rightMap = new Map(rightLayers.map((l: any) => [l.id, l]));
    const results: string[] = [];
    leftLayers.forEach((l: any) => {
      if (!rightMap.has(l.id)) {
        results.push(`Removed: ${l.name || l.type}`);
      }
    });
    rightLayers.forEach((r: any) => {
      if (!leftMap.has(r.id)) {
        results.push(`Added: ${r.name || r.type}`);
      }
    });
    leftLayers.forEach((l: any) => {
      const r = rightMap.get(l.id) as any;
      if (r) {
        if (l.x !== r.x || l.y !== r.y) {
          results.push(`Moved: ${l.name || l.type}`);
        }
        if (l.w !== r.w || l.h !== r.h) {
          results.push(`Resized: ${l.name || l.type}`);
        }
      }
    });
    return results.slice(0, 24);
  }, [leftAb, rightAb]);

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[2100] bg-black/90 text-white" onClick={() => setShow(false)}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="font-bold">Version Comparison</div>
        <button className="text-gray-400 hover:text-white" aria-label="Close" onClick={() => setShow(false)}>
          ×
        </button>
      </div>
      <div className="flex gap-6 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex-1 bg-[#0f1216] rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm opacity-70">Left</div>
            <select
              className="bg-[#14181d] border border-white/10 rounded px-2 py-1 text-sm"
              value={leftId}
              onChange={(e) => setLeftId(e.target.value as any)}
            >
              <option value="live">Current (Live)</option>
              {snapshots?.map((s) => (
                <option key={s.id} value={s.id}>{s.name || `Snapshot ${new Date(s.timestamp).toLocaleString()}`}</option>
              ))}
            </select>
          </div>
          {leftAb ? (
            <div style={{ width: leftAb.width, height: leftAb.height }} className="overflow-hidden">
              <StaticLayerRenderer
                layers={leftAb.layers}
                scale={Math.min(1, Math.min(window.innerWidth / 2 - 96, 640) / Math.max(1, leftAb.width))}
              />
            </div>
          ) : (
            <div className="text-gray-500">No artboard</div>
          )}
        </div>
        <div className="flex-1 bg-[#0f1216] rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm opacity-70">Snapshot</div>
            <select
              className="bg-[#14181d] border border-white/10 rounded px-2 py-1 text-sm"
              value={rightId || rightSnapshot?.id || ''}
              onChange={(e) => setRightId(e.target.value)}
            >
              {snapshots?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || new Date(s.timestamp).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          {rightAb ? (
            <div style={{ width: rightAb.width, height: rightAb.height }} className="overflow-hidden">
              <StaticLayerRenderer
                layers={rightAb.layers}
                scale={Math.min(1, Math.min(window.innerWidth / 2 - 96, 640) / Math.max(1, rightAb.width))}
              />
            </div>
          ) : (
            <div className="text-gray-500">No snapshot artboard</div>
          )}
        </div>
        <div className="w-72 bg-[#0f1216] rounded-xl p-4 border border-white/10">
          <div className="text-sm mb-2 opacity-70">Changes</div>
          {diffs.length ? (
            <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
              {diffs.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500 text-xs">No obvious changes detected</div>
          )}
        </div>
      </div>
    </div>
  );
};
