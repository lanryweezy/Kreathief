import React from 'react';
import { Icons } from '../../../constants';
import { StaticLayerRenderer } from '../../StaticLayerRenderer';

interface ExportPreviewProps {
  activeArtboard: any;
  currentSize: { width: number; height: number };
}

export const ExportPreview: React.FC<ExportPreviewProps> = ({ activeArtboard, currentSize }) => {
  return (
    <div className="md:w-[28%] bg-surface-dark-2 p-10 border-r border-white/5 hidden md:flex flex-col select-none relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent pointer-events-none" />
      <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-purple-900/40 relative z-10">
        <Icons.Download className="w-8 h-8 text-white" />
      </div>
      <h2
        id="export-modal-title"
        className="text-2xl font-black text-white mb-4 tracking-tighter italic relative z-10 uppercase"
      >
        Export Design
      </h2>
      <p className="text-muted-light text-[11px] leading-relaxed mb-10 font-medium relative z-10">
        Download your creation in professional formats. Choose a preset or maintain your native canvas coordinates.
      </p>

      {activeArtboard && activeArtboard.layers?.length > 0 && (
        <div className="relative z-10 mb-6">
          <h4 className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em] mb-2">Preview</h4>
          <div className="rounded-xl border border-white/10 bg-black/30 p-2 checkerboard-bg flex items-center justify-center">
            <div
              style={{
                width: `${activeArtboard.width || currentSize.width || 1080}px`,
                height: `${activeArtboard.height || currentSize.height || 1080}px`,
                transform: `scale(${Math.min(
                  200 / (activeArtboard.width || currentSize.width || 1080),
                  160 / (activeArtboard.height || currentSize.height || 1080)
                )})`,
                transformOrigin: 'center',
                backgroundColor: activeArtboard.backgroundColor || '#ffffff',
              }}
              className="shadow-xl rounded border border-white/5 overflow-hidden relative shrink-0"
            >
              <StaticLayerRenderer
                layers={activeArtboard.layers}
                scale={1}
                width={activeArtboard.width || currentSize.width || 1080}
                height={activeArtboard.height || currentSize.height || 1080}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto p-6 bg-white/5 border border-white/5 rounded-2xl relative z-10 backdrop-blur-md">
        <h4 className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em] mb-2">
          Neural Optimization
        </h4>
        <p className="text-[10px] text-muted-light font-medium leading-relaxed">
          Our export engine automatically optimizes PNG buffers for maximum compatibility with Adobe Creative Cloud.
        </p>
      </div>
    </div>
  );
};
