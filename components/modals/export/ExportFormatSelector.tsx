import React from 'react';
import { Icons } from '../../../constants';
import { ExportFormatType } from './types';

interface ExportFormatSelectorProps {
  format: ExportFormatType;
  setFormat: (format: ExportFormatType) => void;
  isPrintMode: boolean;
  setIsPrintMode: (val: boolean) => void;
}

export const ExportFormatSelector: React.FC<ExportFormatSelectorProps> = ({
  format,
  setFormat,
  isPrintMode,
  setIsPrintMode,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">Format</h3>
      <div className="grid grid-cols-4 gap-2">
        <button
          data-testid="export-png-btn"
          onClick={() => {
            setFormat('png');
            setIsPrintMode(false);
          }}
          className={`py-3 rounded-lg border text-sm font-bold transition-all ${
            format === 'png' && !isPrintMode
              ? 'bg-brand-600 border-brand-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
              : 'bg-surface-dark-4 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          PNG
        </button>
        <button
          data-testid="export-jpeg-btn"
          onClick={() => {
            setFormat('jpeg');
            setIsPrintMode(false);
          }}
          className={`py-3 rounded-lg border text-sm font-bold transition-all ${
            format === 'jpeg'
              ? 'bg-brand-600 border-brand-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
              : 'bg-surface-dark-4 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          JPG
        </button>
        <button
          data-testid="export-webp-btn"
          onClick={() => {
            setFormat('webp');
            setIsPrintMode(false);
          }}
          className={`py-3 rounded-lg border text-sm font-bold transition-all ${
            format === 'webp'
              ? 'bg-brand-600 border-brand-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
              : 'bg-surface-dark-4 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          WEBP
        </button>
        <button
          data-testid="export-svg-btn"
          onClick={() => {
            setFormat('svg');
            setIsPrintMode(false);
          }}
          className={`py-3 rounded-lg border text-sm font-bold transition-all ${
            format === 'svg'
              ? 'bg-brand-600 border-brand-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
              : 'bg-surface-dark-4 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          SVG
        </button>
        <button
          data-testid="export-pdf-btn"
          onClick={() => {
            setFormat('pdf');
            setIsPrintMode(true);
          }}
          className={`py-3 rounded-lg border text-sm font-bold transition-all ${
            format === 'pdf'
              ? 'bg-brand-600 border-brand-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
              : 'bg-surface-dark-4 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          PDF
        </button>
        <button
          data-testid="export-psd-btn"
          onClick={() => {
            setFormat('psd');
            setIsPrintMode(false);
          }}
          className={`py-3 rounded-lg border text-sm font-bold transition-all ${
            format === 'psd'
              ? 'bg-brand-600 border-brand-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
              : 'bg-surface-dark-4 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          PSD
        </button>
        <button
          data-testid="export-mp4-btn"
          onClick={() => {
            setFormat('mp4');
            setIsPrintMode(false);
          }}
          className={`py-3 rounded-lg border text-sm font-bold transition-all ${
            format === 'mp4'
              ? 'bg-brand-600 border-brand-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
              : 'bg-surface-dark-4 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          MP4
        </button>
      </div>
    </div>
  );
};
