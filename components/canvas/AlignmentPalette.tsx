import React from 'react';
import { useStore } from '../../store/useStore';
import { Layer } from '../../types';
import { GeometryOracle } from '../../utils/geometryOracle';
import { Icons } from '../../constants';

interface AlignmentPaletteProps {
  selectedLayerIds: string[];
  layers: Layer[];
  zoom: number;
}

const DistributeH = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="3" x2="3" y2="21" /><line x1="21" y1="3" x2="21" y2="21" />
    <rect x="8" y="7" width="8" height="10" rx="1" fill="currentColor" opacity="0.3" />
  </svg>
);

const DistributeV = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="3" x2="21" y2="3" /><line x1="3" y1="21" x2="21" y2="21" />
    <rect x="7" y="8" width="10" height="8" rx="1" fill="currentColor" opacity="0.3" />
  </svg>
);

export const AlignmentPalette: React.FC<AlignmentPaletteProps> = React.memo(
  ({ selectedLayerIds, layers, zoom }) => {
    const alignLayers = useStore((s) => s.alignLayers);
    const distributeLayers = useStore((s) => s.distributeLayers);
    const saveToHistory = useStore((s) => s.saveToHistory);

    const selected = layers.filter((l) => selectedLayerIds.includes(l.id));
    if (selected.length < 2) return null;

    const bounds = GeometryOracle.getGroupBounds(selected);
    const top = bounds.y - 38 / zoom;
    const left = bounds.x + bounds.width / 2;

    const act = (fn: () => void) => (e: React.MouseEvent) => {
      e.stopPropagation();
      saveToHistory();
      fn();
    };

    return (
      <div
        className="absolute flex items-center gap-0.5 bg-surface-dark-3/80 backdrop-blur-xl border border-white/10 rounded-lg px-1.5 py-1 shadow-xl z-[90] pointer-events-auto"
        style={{ left, top, transform: 'translateX(-50%)' }}
      >
        <Btn icon={<Icons.AlignLeft className="w-3.5 h-3.5" />} tip="Align Left" onClick={act(() => alignLayers('left'))} />
        <Btn icon={<Icons.AlignCenter className="w-3.5 h-3.5" />} tip="Align Center" onClick={act(() => alignLayers('center'))} />
        <Btn icon={<Icons.AlignRight className="w-3.5 h-3.5" />} tip="Align Right" onClick={act(() => alignLayers('right'))} />
        <div className="w-px h-4 bg-white/10 mx-0.5" />
        <Btn icon={<Icons.AlignTop className="w-3.5 h-3.5" />} tip="Align Top" onClick={act(() => alignLayers('top'))} />
        <Btn icon={<Icons.AlignMiddle className="w-3.5 h-3.5" />} tip="Align Middle" onClick={act(() => alignLayers('middle'))} />
        <Btn icon={<Icons.AlignBottom className="w-3.5 h-3.5" />} tip="Align Bottom" onClick={act(() => alignLayers('bottom'))} />
        <div className="w-px h-4 bg-white/10 mx-0.5" />
        <Btn icon={<DistributeH className="w-3.5 h-3.5" />} tip="Distribute H" onClick={act(() => distributeLayers('horizontal'))} disabled={selected.length < 3} />
        <Btn icon={<DistributeV className="w-3.5 h-3.5" />} tip="Distribute V" onClick={act(() => distributeLayers('vertical'))} disabled={selected.length < 3} />
      </div>
    );
  }
);
AlignmentPalette.displayName = 'AlignmentPalette';

const Btn = ({ icon, tip, onClick, disabled }: { icon: React.ReactNode; tip: string; onClick: (e: React.MouseEvent) => void; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-1.5 rounded-md transition-all ${disabled ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
    title={tip}
  >
    {icon}
  </button>
);
