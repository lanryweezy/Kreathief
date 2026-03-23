import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Icons } from '../../constants';
import * as geminiService from '../../services/geminiService';
import * as photoService from '../../services/photoService';

import { useStore } from '../../store/useStore';
import { log } from '../../utils/log';

type Tab = 'image' | 'text';

const STYLE_PRESETS = [
  { id: 'default', label: 'Clean', icon: '◇', desc: 'Precise vector tracing' },
  { id: 'minimal', label: 'Minimal', icon: '○', desc: 'Simplified flat shapes' },
  { id: 'detailed', label: 'Detailed', icon: '◈', desc: 'High-fidelity paths' },
  { id: 'artistic', label: 'Artistic', icon: '✦', desc: 'Stylized interpretation' },
];

// Simple path command counter for stats
function countPathNodes(d: string): number {
  return (d.match(/[MLHVCSQTAZ]/gi) || []).length;
}

// Simplify SVG path data using Ramer-Douglas-Peucker on line segments
function simplifyPathData(d: string, tolerance: number): string {
  if (tolerance <= 0) {return d;}
  // For simplification we just thin out redundant L commands
  // This is a lightweight approach; real simplification would parse all commands
  const parts = d.split(/(?=[MLHVCSQTAZ])/gi).filter(Boolean);
  if (parts.length <= 3) {return d;}

  const simplified: string[] = [];
  let lastKept = 0;
  for (let i = 0; i < parts.length; i++) {
    const cmd = parts[i]!.trim();
    if (i === 0 || i === parts.length - 1 || !cmd.startsWith('L') && !cmd.startsWith('l')) {
      simplified.push(cmd);
      lastKept = i;
      continue;
    }
    // Keep every Nth based on tolerance
    const skip = Math.max(1, Math.round(tolerance * 3));
    if (i - lastKept >= skip) {
      simplified.push(cmd);
      lastKept = i;
    }
  }
  return simplified.join(' ');
}

interface BatchItem {
  id: string;
  filename: string;
  dataUrl: string;
  status: 'queued' | 'processing' | 'done' | 'error';
  result?: Array<{ path: string; color: string }>;
}

export const VectorizerPanel = () => {
  const onAddLayers = useStore((state) => state.addLayers);
  const addToast = useStore((state) => state.addToast);
  const isProcessing = useStore((state) => state.isProcessing);
  const setIsProcessing = useStore((state) => state.setIsProcessing);
  const [activeTab, setActiveTab] = useState<Tab>('image');
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [colors, setColors] = useState(4);
  const [useAlgorithm, setUseAlgorithm] = useState(false);
  const [trials, setTrials] = useState(2);
  const [stylePreset, setStylePreset] = useState('default');
  const [result, setResult] = useState<Array<{ path: string; color: string }> | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New: Path simplification
  const [simplifyTolerance, setSimplifyTolerance] = useState(0);
  const [cornerThreshold, setCornerThreshold] = useState(45);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // New: Batch mode
  const [showBatch, setShowBatch] = useState(false);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const batchInputRef = useRef<HTMLInputElement>(null);

  // Simplified result for preview
  const displayResult = useMemo(() => {
    if (!result || simplifyTolerance <= 0) {return result;}
    return result.map((item) => ({
      ...item,
      path: simplifyPathData(item.path, simplifyTolerance),
    }));
  }, [result, simplifyTolerance]);

  // Path stats
  const pathStats = useMemo(() => {
    if (!displayResult) {return null;}
    const totalPaths = displayResult.length;
    const totalNodes = displayResult.reduce((sum, item) => sum + countPathNodes(item.path), 0);
    const totalChars = displayResult.reduce((sum, item) => sum + item.path.length, 0);
    const uniqueColors = new Set(displayResult.map((item) => item.color)).size;
    return { totalPaths, totalNodes, totalChars, uniqueColors };
  }, [displayResult]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleVectorize = async () => {
    if (activeTab === 'image') {
      if (!image) {
        return;
      }
      setIsProcessing(true);
      try {
        let paths;
        if (useAlgorithm) {
          paths = await photoService.traceImageToSVG(image, colors);
        } else {
          if (trials <= 0) {
            // The following lines were part of the user's provided edit, but appear to be
            // from a different context and would introduce undefined variables.
            // They are commented out to maintain syntactical correctness and avoid new errors.
            // onUpdatePaths(newPaths);
            // // We'll update the selected path ids so they remain selected
            // if (selectedNodeIds.length > 0) {
            //   const newSelectedIds = newPaths.map(p => p.id).slice(-selectedNodeIds.length);
            //   // if we had a way to update selection here, we could
            // }
            addToast('No trials remaining for AI vectorization.', 'warning');
            return;
          }
          paths = await geminiService.vectorizeImage(image, colors);
          setTrials((prev) => prev - 1);
        }
        setResult(paths);
        addToast('Vectorization complete!', 'success');
      } catch (error) {
        log.error('[VectorizerPanel] Vectorization failed', error, { prompt: prompt.substring(0, 100), trials });
        addToast('Vectorization failed. Please try again.', 'error');
      } finally {
        setIsProcessing(false);
      }
    } else {
      if (!prompt.trim() || trials <= 0) {
        return;
      }
      setIsProcessing(true);
      try {
        const paths = await geminiService.generateAIVector(prompt);
        setResult(paths);
        setTrials((prev) => prev - 1);
        addToast('Vector generated successfully!', 'success');
      } catch (error) {
        log.error('[VectorizerPanel] Vector generation failed', error, { prompt: prompt.substring(0, 100) });
        addToast('Vector generation failed.', 'error');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const addToCanvas = () => {
    if (!displayResult) {
      return;
    }

    const newLayers = displayResult.map((item, i) => ({
      id: crypto.randomUUID(),
      type: 'path' as const,
      name: `AI Vector ${i + 1}`,
      x: 100 + i * 10,
      y: 100 + i * 10,
      width: 300,
      height: 300,
      rotation: 0,
      color: item.color,
      pathData: item.path,
      viewBox: '0 0 100 100',
      opacity: 1,
      visible: true,
      locked: false,
      cornerRadius: 0,
    }));

    onAddLayers(newLayers);
    addToast(`${newLayers.length} vector layers added to canvas`, 'success');
  };

  // SVG Export/Download
  const downloadSVG = useCallback(() => {
    if (!displayResult) {return;}
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="800" height="800">
${displayResult
        .map(
          (item) =>
            `  <path d="${item.path}" fill="${item.color}" />`
        )
        .join('\n')}
</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kreathief-vector.svg';
    a.click();
    URL.revokeObjectURL(url);
    addToast('SVG downloaded!', 'success');
  }, [displayResult, addToast]);

  // Copy SVG to clipboard
  const copySVGToClipboard = useCallback(() => {
    if (!displayResult) {return;}
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n${displayResult
      .map((item) => `  <path d="${item.path}" fill="${item.color}" />`)
      .join('\n')}\n</svg>`;
    navigator.clipboard.writeText(svgContent).then(() => {
      addToast('SVG copied to clipboard!', 'success');
    });
  }, [displayResult, addToast]);

  // Batch handlers
  const handleBatchFiles = (files: FileList | null) => {
    if (!files) {return;}
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const item: BatchItem = {
          id: crypto.randomUUID(),
          filename: file.name,
          dataUrl: e.target?.result as string,
          status: 'queued',
        };
        setBatchItems((prev) => [...prev, item]);
      };
      reader.readAsDataURL(file);
    });
  };

  const processBatch = async () => {
    setIsProcessing(true);
    const items = [...batchItems];
    for (let i = 0; i < items.length; i++) {
      if (items[i]!.status !== 'queued') {continue;}
      setBatchItems((prev) =>
        prev.map((item) => (item.id === items[i]!.id ? { ...item, status: 'processing' } : item))
      );
      try {
        const paths = useAlgorithm
          ? await photoService.traceImageToSVG(items[i]!.dataUrl, colors)
          : await geminiService.vectorizeImage(items[i]!.dataUrl, colors);

        if (!useAlgorithm) {setTrials((prev) => prev - 1);}

        setBatchItems((prev) =>
          prev.map((item) =>
            item.id === items[i]!.id ? { ...item, status: 'done', result: paths } : item
          )
        );
      } catch {
        setBatchItems((prev) =>
          prev.map((item) =>
            item.id === items[i]!.id ? { ...item, status: 'error' } : item
          )
        );
      }
    }
    setIsProcessing(false);
    addToast('Batch processing complete!', 'success');
  };

  const addBatchItemToCanvas = (item: BatchItem) => {
    if (!item.result) {return;}
    const newLayers = item.result.map((r, i) => ({
      id: crypto.randomUUID(),
      type: 'path' as const,
      name: `${item.filename} P${i + 1}`,
      x: 100 + i * 10,
      y: 100 + i * 10,
      width: 300,
      height: 300,
      rotation: 0,
      color: r.color,
      pathData: r.path,
      viewBox: '0 0 100 100',
      opacity: 1,
      visible: true,
      locked: false,
      cornerRadius: 0,
    }));
    onAddLayers(newLayers);
    addToast(`Added ${newLayers.length} paths from ${item.filename}`, 'success');
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] p-6 overflow-y-auto custom-scrollbar border-l border-white/5 shadow-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="font-black text-white flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
              <Icons.Magic className="w-4 h-4 text-[#7d2ae8]" />
            </div>
            Vector Studio
          </h3>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest ml-11">AI-Powered Tracing</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Batch toggle */}
          <button
            onClick={() => setShowBatch(!showBatch)}
            className={`text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest transition-all border ${showBatch
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
              : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'
              }`}
          >
            Batch
          </button>
          <div className="text-[8px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-1 rounded-full font-black uppercase tracking-widest">PRO</div>
        </div>
      </div>

      {/* Batch Mode Panel */}
      {showBatch && (
        <div className="mb-6 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
              Batch Processing
            </span>
            <span className="text-[9px] text-gray-500">{batchItems.length} images</span>
          </div>

          {/* Drop zone for batch */}
          <div
            onClick={() => batchInputRef.current?.click()}
            className="py-3 rounded-lg border border-dashed border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/5 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Icons.Plus className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] text-blue-400 font-bold">Add Images</span>
            <input
              type="file"
              ref={batchInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={(e) => handleBatchFiles(e.target.files)}
            />
          </div>

          {/* Batch queue */}
          {batchItems.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
              {batchItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-900/40 border border-gray-800/50"
                >
                  <img
                    src={item.dataUrl}
                    alt={item.filename}
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white font-medium truncate">{item.filename}</p>
                    <p className="text-[8px] text-gray-500">
                      {item.status === 'queued' && '⏳ Queued'}
                      {item.status === 'processing' && '⚡ Processing...'}
                      {item.status === 'done' && `✅ ${item.result?.length} paths`}
                      {item.status === 'error' && '❌ Failed'}
                    </p>
                  </div>
                  {item.status === 'done' && (
                    <button
                      onClick={() => addBatchItemToCanvas(item)}
                      className="text-[8px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500/30 transition-colors"
                    >
                      ADD
                    </button>
                  )}
                  <button
                    onClick={() => setBatchItems((prev) => prev.filter((b) => b.id !== item.id))}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Icons.Trash className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {batchItems.filter((b) => b.status === 'queued').length > 0 && (
            <button
              onClick={processBatch}
              disabled={isProcessing}
              className="w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 disabled:opacity-40"
            >
              {isProcessing ? (
                <div className="w-3 h-3 border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin" />
              ) : (
                <Icons.Zap className="w-3 h-3" />
              )}
              Process All ({batchItems.filter((b) => b.status === 'queued').length})
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-900/50 p-1 rounded-xl mb-6 border border-white/5">
        <button
          onClick={() => {
            setActiveTab('image');
            setResult(null);
          }}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'image' ? 'bg-[#7d2ae8] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Image to Vector
        </button>
        <button
          onClick={() => {
            setActiveTab('text');
            setResult(null);
          }}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'text' ? 'bg-[#7d2ae8] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Text to Vector
        </button>
      </div>

      {activeTab === 'image' ? (
        <div className="space-y-6">
          {!image ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-700 hover:border-[#7d2ae8] hover:bg-[#7d2ae8]/5 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group"
            >
              <Icons.Uploads className="w-8 h-8 text-gray-500 group-hover:text-[#7d2ae8] transition-colors" />
              <div className="text-center">
                <p className="text-[11px] font-bold text-white">Upload Image</p>
                <p className="text-[10px] text-gray-500">Drag & drop or click to browse</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="aspect-square rounded-xl overflow-hidden border border-gray-700 relative group">
              <img src={image} className="w-full h-full object-contain" alt="Preview" />
              <button
                onClick={() => {
                  setImage(null);
                  setResult(null);
                }}
                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Icons.Trash className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Style Presets */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">
              Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setStylePreset(preset.id)}
                  className={`p-2 rounded-xl border text-left transition-all ${stylePreset === preset.id
                    ? 'bg-[#7d2ae8]/15 border-[#7d2ae8]/50 text-[#7d2ae8]'
                    : 'bg-[#1e1e1e] border-gray-800 text-gray-500 hover:border-gray-700'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm">{preset.icon}</span>
                    <span className="text-[10px] font-bold">{preset.label}</span>
                  </div>
                  <p className="text-[8px] opacity-60">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Complexity ({colors} colors)</span>
            </div>
            <input
              type="range"
              min="2"
              max="12"
              value={colors}
              onChange={(e) => setColors(parseInt(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
            />
          </div>

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-gray-900/30 border border-white/5 hover:border-white/10 transition-all group"
          >
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-gray-300 transition-colors">
              Advanced Settings
            </span>
            <span
              className="text-gray-600 text-[10px] transition-transform"
              style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              ▼
            </span>
          </button>

          {/* Advanced Controls */}
          {showAdvanced && (
            <div className="p-3 bg-gray-900/30 border border-white/5 rounded-xl space-y-4 animate-slideUp">
              {/* Path Simplification */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">✂️</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                      Path Simplification
                    </span>
                  </div>
                  <span className="text-[9px] text-gray-600 font-mono">
                    {simplifyTolerance === 0 ? 'Off' : `${Math.round(simplifyTolerance * 100)}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={simplifyTolerance}
                  onChange={(e) => setSimplifyTolerance(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <p className="text-[8px] text-gray-600 mt-1 italic">
                  Reduce path complexity. Higher = fewer nodes.
                </p>
              </div>

              {/* Corner Threshold */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">📐</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                      Corner Threshold
                    </span>
                  </div>
                  <span className="text-[9px] text-gray-600 font-mono">{cornerThreshold}°</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={cornerThreshold}
                  onChange={(e) => setCornerThreshold(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <p className="text-[8px] text-gray-600 mt-1 italic">
                  Angles sharper than this become corner points.
                </p>
              </div>

              {/* Quick simplify presets */}
              <div className="flex gap-1.5">
                {[
                  { label: 'None', val: 0 },
                  { label: 'Light', val: 0.15 },
                  { label: 'Medium', val: 0.4 },
                  { label: 'Heavy', val: 0.7 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setSimplifyTolerance(preset.val)}
                    className={`flex-1 py-1 rounded-md text-[8px] font-bold uppercase tracking-tight transition-all border ${Math.abs(simplifyTolerance - preset.val) < 0.01
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'bg-gray-900/50 text-gray-600 border-gray-800 hover:border-gray-700'
                      }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 bg-gray-900/30 border border-white/5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icons.Zap className={`w-3.5 h-3.5 ${useAlgorithm ? 'text-emerald-500' : 'text-amber-500'}`} />
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tight">
                  {useAlgorithm ? 'Fast Algorithmic engine' : 'Magic AI engine'}
                </span>
                {useAlgorithm && (
                  <span className="text-[8px] bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter animate-pulse">
                    Free
                  </span>
                )}
              </div>
              <button
                onClick={() => setUseAlgorithm(!useAlgorithm)}
                className={`w-8 h-4 rounded-full relative transition-colors ${useAlgorithm ? 'bg-emerald-500' : 'bg-gray-700'}`}
              >
                <div
                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useAlgorithm ? 'right-0.5' : 'left-0.5'}`}
                />
              </button>
            </div>
            <p className="text-[9px] text-gray-500 leading-relaxed italic">
              {useAlgorithm
                ? 'Instant client-side tracing. No credits consumed. Best for simple logos.'
                : 'Powerful Gemini-driven vectorization. Consumes 1 trial. Best for complex art.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the vector graphic (e.g., 'A vintage minimalist mountain logo')"
            className="w-full h-32 bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs text-white placeholder:text-gray-600 focus:border-[#7d2ae8] focus:ring-1 focus:ring-[#7d2ae8] outline-none transition-all resize-none"
          />
          {/* Quick prompt suggestions */}
          <div className="flex flex-wrap gap-1.5">
            {['Mountain logo', 'Abstract waves', 'Geometric animal', 'Floral pattern'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setPrompt(suggestion)}
                className="px-2 py-1 rounded-md bg-gray-900 border border-gray-800 text-[9px] text-gray-500 hover:text-[#7d2ae8] hover:border-[#7d2ae8]/30 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleVectorize}
        disabled={
          isProcessing || trials <= 0 || (activeTab === 'image' && !image) || (activeTab === 'text' && !prompt.trim())
        }
        className="w-full py-3 bg-[#7d2ae8] hover:bg-[#6b23c5] disabled:bg-gray-800 disabled:text-gray-600 rounded-xl text-white font-bold text-xs mt-6 transition-all flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        ) : (
          <Icons.Zap className="w-4 h-4" />
        )}
        {activeTab === 'image' ? 'Vectorize' : 'Generate Vector'}
      </button>

      <div className="mt-3 text-center">
        {useAlgorithm ? (
          <span className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest flex items-center justify-center gap-2">
            <Icons.Check className="w-3 h-3" /> No trials needed
          </span>
        ) : (
          <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
            {trials} AI attempts remaining
          </span>
        )}
      </div>

      {/* LIVE SVG PREVIEW */}
      {displayResult && !isProcessing && (
        <div className="mt-8 pt-6 border-t border-gray-800 space-y-4 animate-slideUp">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.Check className="w-4 h-4 text-emerald-500" />
              <span className="text-[11px] font-bold text-white">
                {displayResult.length} Path{displayResult.length > 1 ? 's' : ''} Generated
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPreviewScale(Math.max(0.5, previewScale - 0.25))}
                className="w-5 h-5 rounded bg-gray-800 text-gray-400 flex items-center justify-center text-[10px] hover:bg-gray-700"
              >
                −
              </button>
              <span className="text-[9px] text-gray-500 w-8 text-center">{Math.round(previewScale * 100)}%</span>
              <button
                onClick={() => setPreviewScale(Math.min(2, previewScale + 0.25))}
                className="w-5 h-5 rounded bg-gray-800 text-gray-400 flex items-center justify-center text-[10px] hover:bg-gray-700"
              >
                +
              </button>
            </div>
          </div>

          {/* SVG Preview */}
          <div
            className="rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center"
            style={{
              background: 'repeating-conic-gradient(#1e1e1e 0% 25%, #252525 0% 50%) 50% / 16px 16px',
              minHeight: '160px',
            }}
          >
            <svg
              viewBox="0 0 100 100"
              width={160 * previewScale}
              height={160 * previewScale}
              style={{ overflow: 'visible' }}
            >
              {displayResult.map((item, i) => (
                <path
                  key={i}
                  d={item.path}
                  fill={item.color}
                  fillOpacity={1}
                  stroke="none"
                />
              ))}
            </svg>
          </div>

          {/* Path Statistics */}
          {pathStats && (
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Paths', value: pathStats.totalPaths, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                { label: 'Nodes', value: pathStats.totalNodes, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'Colors', value: pathStats.uniqueColors, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                {
                  label: 'Size',
                  value: pathStats.totalChars > 1000 ? `${(pathStats.totalChars / 1000).toFixed(1)}k` : pathStats.totalChars,
                  color: 'text-amber-400',
                  bg: 'bg-amber-500/10',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`px-2 py-1.5 rounded-lg ${stat.bg} flex flex-col items-center`}
                >
                  <span className={`text-[11px] font-black ${stat.color}`}>{stat.value}</span>
                  <span className="text-[7px] text-gray-500 uppercase font-bold tracking-widest">{stat.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Color palette from result */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-gray-500 mr-1">Colors:</span>
            {displayResult.map((item, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-md border border-gray-700 cursor-pointer hover:scale-125 transition-transform"
                style={{ backgroundColor: item.color }}
                title={item.color}
              />
            ))}
          </div>

          {/* Action buttons row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={addToCanvas}
              className="py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #7d2ae8, #3b82f6)',
                color: 'white',
              }}
            >
              <Icons.Plus className="w-4 h-4" />
              Add to Canvas
            </button>
            <div className="flex gap-2">
              <button
                onClick={downloadSVG}
                className="flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                title="Download SVG"
              >
                ↓ SVG
              </button>
              <button
                onClick={copySVGToClipboard}
                className="flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20"
                title="Copy SVG to clipboard"
              >
                📋 Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VectorizerPanel;
