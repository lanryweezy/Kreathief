import React from 'react';
import { Toggle } from '../../Toggle';

interface PrintOptionsProps {
  isPrintMode: boolean;
  setIsPrintMode: (val: boolean) => void;
  colorProfile: any; // Using any for now to avoid circular dependency until exportService is split
  setColorProfile: (val: any) => void;
  cropMarks: boolean;
  setCropMarks: (val: boolean) => void;
  bleed: number;
  setBleed: (val: number) => void;
  autoUpscale: boolean;
  setAutoUpscale: (val: boolean) => void;
  outOfGamutCount: number;
  lowResImagesCount: number;
}

export const PrintOptions: React.FC<PrintOptionsProps> = ({
  isPrintMode,
  setIsPrintMode,
  colorProfile,
  setColorProfile,
  cropMarks,
  setCropMarks,
  bleed,
  setBleed,
  autoUpscale,
  setAutoUpscale,
  outOfGamutCount,
  lowResImagesCount,
}) => {
  if (!isPrintMode) return null;

  return (
    <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-brand-500/20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-brand-500" />
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          CMYK Print Settings
        </h3>
        <Toggle checked={isPrintMode} onChange={setIsPrintMode} />
      </div>
      
      {outOfGamutCount > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg flex gap-3 text-sm">
          <div className="text-yellow-400 font-black shrink-0">!</div>
          <div className="text-yellow-200 leading-tight">
            <span className="font-bold text-white block mb-0.5">CMYK Gamut Warning</span>
            {outOfGamutCount} layer(s) use colors outside the printable CMYK gamut. They will be shifted to the nearest safe color.
          </div>
        </div>
      )}

      {lowResImagesCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex gap-3 text-sm">
          <div className="text-red-400 font-black shrink-0">!</div>
          <div className="text-red-200 leading-tight">
            <span className="font-bold text-white block mb-0.5">Low-Res Images Detected</span>
            {lowResImagesCount} image(s) are below 300 DPI at their current print size. Expect blurriness in the final print.
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 block">Color Profile</label>
          <select 
            className="w-full bg-surface-dark-4 border-white/5 rounded-lg text-sm text-white p-2.5 outline-none focus:border-brand-500"
            value={colorProfile}
            onChange={(e) => setColorProfile(e.target.value)}
          >
            <option value="FOGRA39">FOGRA39 (Coated)</option>
            <option value="GRACoL">GRACoL 2006</option>
            <option value="SWOP">US Web Coated (SWOP)</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 block">Bleed (mm)</label>
          <input 
            type="number"
            min="0"
            max="25"
            className="w-full bg-surface-dark-4 border-white/5 rounded-lg text-sm text-white p-2.5 outline-none focus:border-brand-500"
            value={bleed}
            onChange={(e) => setBleed(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <label className="text-xs font-medium text-gray-300">Include Crop Marks</label>
        <Toggle checked={cropMarks} onChange={setCropMarks} />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <label className="text-xs font-medium text-gray-300">AI Upscale Low-Res Assets (Pro)</label>
        <Toggle checked={autoUpscale} onChange={setAutoUpscale} />
      </div>
    </div>
  );
};
