import React, { useState } from 'react';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';

interface ExportModalProps {
  onClose: () => void;
  onExport: (
    format: 'png' | 'jpeg' | 'webp' | 'svg' | 'pdf' | 'psd',
    quality: number,
    size?: { width: number; height: number },
    transparentBg?: boolean
  ) => Promise<void>;
  onGetPngBlob?: () => Promise<Blob | null>;
  currentSize: { width: number; height: number; name: string };
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose, onExport, onGetPngBlob, currentSize }) => {
  const { addToast } = useStore();
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp' | 'svg' | 'pdf' | 'psd'>('png');
  const [quality, setQuality] = useState(0.95);
  const [activePreset, setActivePreset] = useState<string>('current');
  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [exportStage, setExportStage] = useState<string>('');
  const [highDPI, setHighDPI] = useState(false);

  // Transparent background (PNG only)
  const [transparentBg, setTransparentBg] = useState(false);

  const presets = [
    {
      id: 'current',
      name: `Current (${currentSize.width}x${currentSize.height})`,
      width: currentSize.width,
      height: currentSize.height,
    },
    { id: 'ig_post', name: 'Instagram Post', width: 1080, height: 1080 },
    { id: 'ig_story', name: 'Instagram Story', width: 1080, height: 1920 },
    { id: 'fb_cover', name: 'Facebook Cover', width: 820, height: 312 },
    { id: 'twitter_header', name: 'Twitter Header', width: 1500, height: 500 },
    { id: 'hd_video', name: 'HD Video (1080p)', width: 1920, height: 1080 },
    { id: '4k_wallpaper', name: '4K Ultra HD', width: 3840, height: 2160 },
  ];

  const handleExportClick = async () => {
    setIsExporting(true);
    setExportStage('Preparing assets...');

    try {
      const preset = presets.find((p) => p.id === activePreset);
      const scale = highDPI ? 3 : 1;
      const size = preset
        ? { width: preset.width * scale, height: preset.height * scale }
        : { width: currentSize.width * scale, height: currentSize.height * scale };

      setExportStage('Rendering design...');
      await new Promise((r) => setTimeout(r, 500));

      await onExport(format, quality, size, transparentBg && format === 'png');

      setExportStage('Complete!');
      addToast(`Exported as ${format.toUpperCase()}!`, 'success');
      setTimeout(() => onClose(), 300);
    } catch (e) {
      console.error(e);
      addToast('Export failed. Please try again.', 'error');
      setExportStage('');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    setIsCopying(true);
    try {
      // Try using the provided blob getter first
      if (onGetPngBlob) {
        const blob = await onGetPngBlob();
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          addToast('Copied to clipboard!', 'success');
          setIsCopying(false);
          return;
        }
      }
      // Fallback: export as PNG then copy
      await onExport('png', 0.95, { width: currentSize.width, height: currentSize.height });
      addToast('Image downloaded — clipboard copy requires a modern browser.', 'info');
    } catch (e) {
      console.error(e);
      addToast('Could not copy to clipboard. Try downloading instead.', 'error');
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1e1e1e] border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col md:flex-row relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-2">
          <div className="text-2xl leading-none">&times;</div>
        </button>

        {/* Info/Preview Side */}
        <div className="md:w-1/3 bg-[#13161a] p-8 border-r border-gray-700 hidden md:flex flex-col">
          <div className="w-12 h-12 bg-[#7d2ae8] rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-900/20">
            <Icons.Download className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Export Design</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Download your creation in professional formats. Choose a preset or stick with your current canvas size.
          </p>

          <div className="mt-auto p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl">
            <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Pro Tip</h4>
            <p className="text-[10px] text-gray-400">
              For the best quality on Instagram, use PNG format and the Instagram Post preset.
            </p>
          </div>
        </div>

        {/* Controls Side */}
        <div className="flex-1 p-8">
          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Format</label>
              <div className="grid grid-cols-3 gap-2">
                {(['png', 'jpeg', 'webp', 'svg', 'pdf', 'psd'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all border ${format === f ? 'bg-[#7d2ae8] border-[#7d2ae8] text-white' : 'bg-[#252627] border-gray-700 text-gray-400 hover:border-gray-500'}`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider */}
            {true && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quality</label>
                  <span className="text-xs font-medium text-[#00c4cc]">{Math.round(quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#00c4cc]"
                />
              </div>
            )}

            {/* Transparent Background (PNG only) */}
            {format === 'png' && (
              <div className="flex items-center justify-between p-4 bg-[#13161a] border border-gray-700 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Transparent Background</h4>
                  <p className="text-[10px] text-gray-500 italic">Export with alpha channel</p>
                </div>
                <button
                  onClick={() => setTransparentBg(!transparentBg)}
                  className={`w-10 h-5 rounded-full transition-all relative ${transparentBg ? 'bg-[#7d2ae8]' : 'bg-gray-700'}`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${transparentBg ? 'left-6' : 'left-1'}`}
                  />
                </button>
              </div>
            )}

            {/* High DPI Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#13161a] border border-gray-700 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-white mb-0.5">High Fidelity (300 DPI)</h4>
                <p className="text-[10px] text-gray-500 italic">Best for printing. Increases file size.</p>
              </div>
              <button
                onClick={() => setHighDPI(!highDPI)}
                className={`w-10 h-5 rounded-full transition-all relative ${highDPI ? 'bg-emerald-500' : 'bg-gray-700'}`}
              >
                <div
                  className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${highDPI ? 'left-6' : 'left-1'}`}
                />
              </button>
            </div>

            {/* Presets */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">
                Size Presets
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePreset(p.id)}
                    className={`flex flex-col items-start p-3 rounded-xl border transition-all ${activePreset === p.id ? 'bg-[#7d2ae8]/10 border-[#7d2ae8] ring-1 ring-[#7d2ae8]' : 'bg-[#13161a] border-gray-700 hover:border-gray-600'}`}
                  >
                    <span className={`text-xs font-bold ${activePreset === p.id ? 'text-white' : 'text-gray-300'}`}>
                      {p.name}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {p.width} x {p.height} px
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              {/* Copy to Clipboard */}
              <button
                onClick={handleCopyToClipboard}
                disabled={isCopying || isExporting}
                className="flex-1 py-3 rounded-xl font-bold border border-gray-600 bg-[#252627] hover:bg-[#2e2e2e] hover:border-gray-500 text-gray-300 text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                title="Copy PNG to clipboard"
              >
                {isCopying ? (
                  <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                ) : (
                  <Icons.Copy className="w-4 h-4" />
                )}
                <span>{isCopying ? 'Copying…' : 'Copy PNG'}</span>
              </button>

              {/* Download */}
              <button
                onClick={handleExportClick}
                disabled={isExporting || isCopying}
                className={`flex-[2] py-3 rounded-xl font-bold shadow-lg transform transition-all flex flex-col items-center justify-center gap-1 ${isExporting ? 'bg-gray-800' : 'bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] hover:scale-[1.02] active:scale-[0.98] shadow-purple-900/40'}`}
              >
                {isExporting ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-[#00c4cc] border-t-transparent rounded-full"></div>
                      <span className="text-sm font-black uppercase tracking-widest text-[#00c4cc]">{exportStage}</span>
                    </div>
                    <div className="w-48 h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] animate-progress-ind"></div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">Download {format.toUpperCase()}</span>
                    <Icons.Download className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
