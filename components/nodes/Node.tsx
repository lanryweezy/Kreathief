import React, { memo, useCallback, useState } from 'react';
import { GraphNode } from '../../types/nodes';
import { getNodeDefinition } from '../../data/nodeDefinitions';
import { useNodeGraph } from '../../hooks/useNodeGraph';
import NodePort from './NodePort';
import * as Icons from '../icons';

interface NodeProps {
  node: GraphNode;
  isSelected: boolean;
  isVisible?: boolean; // LOD Optimization
  output?: Record<string, any>;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onPortMouseDown: (e: React.MouseEvent, nodeId: string, portId: string, side: 'input' | 'output') => void;
  onPortMouseUp: (e: React.MouseEvent, nodeId: string, portId: string, side: 'input' | 'output') => void;
  onDelete?: () => void;
  onSettingsChange?: (key: string, value: any) => void;
  onInspect?: (nodeId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  input: 'from-blue-600 to-blue-500',
  ai: 'from-purple-600 to-purple-500',
  edit: 'from-green-600 to-green-500',
  layout: 'from-orange-600 to-orange-500',
  mockup: 'from-pink-600 to-pink-500',
  composite: 'from-cyan-600 to-cyan-500',
  export: 'from-red-600 to-red-500',
};

const CATEGORY_BORDER_COLORS: Record<string, string> = {
  input: 'border-blue-500/50',
  ai: 'border-purple-500/50',
  edit: 'border-green-500/50',
  layout: 'border-orange-500/50',
  mockup: 'border-pink-500/50',
  composite: 'border-cyan-500/50',
  export: 'border-red-500/50',
};

const CATEGORY_GLOWS: Record<string, string> = {
  input: 'shadow-blue-500/20',
  ai: 'shadow-purple-500/20',
  edit: 'shadow-green-500/20',
  layout: 'shadow-orange-500/20',
  mockup: 'shadow-pink-500/20',
  composite: 'shadow-cyan-500/20',
  export: 'shadow-red-500/20',
};

/**
 * Quality Gap: The node workflow UI felt detached from the main app's high-fidelity aesthetic,
 * using static emojis and flat designs. Improved with glassmorphism, category-specific
 * gradients, and professional SVG iconography to match 'Pro' creative tool standards.
 */
export function Node({
  node,
  isSelected,
  isVisible = true,
  onMouseDown,
  onPortMouseDown,
  onPortMouseUp,
  onSettingsChange,
  onInspect,
}: NodeProps) {
  const [activeScenicId, setActiveScenicId] = useState<string>('tshirt');
  const removeNode = useNodeGraph((s) => s.removeNode);
  const nodeOutputs = useNodeGraph((s) => s.nodeOutputs);
  const executeGraph = useNodeGraph((s) => s.executeGraph);
  const isExecuting = useNodeGraph((s) => s.isExecuting);
  const executingNodeId = useNodeGraph((s) => s.executingNodeId);
  const nodeProgress = useNodeGraph((s) => s.nodeProgress);
  const nodeProgressStep = useNodeGraph((s) => s.nodeProgressStep);
  const def = getNodeDefinition(node.type);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onMouseDown(e, node.id);
    },
    [onMouseDown, node.id]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onInspect?.(node.id);
    },
    [onInspect, node.id]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      removeNode(node.id);
    },
    [removeNode, node.id]
  );

  if (!def) {
    return null;
  }

  const outputs = nodeOutputs[node.id];
  const hasOutput = outputs && Object.keys(outputs).length > 0;
  const imageOutput = outputs?.image as { src?: string } | undefined;

  const headerGradient = CATEGORY_COLORS[def.category] || 'from-gray-600 to-gray-500';
  const borderColor = CATEGORY_BORDER_COLORS[def.category] || 'border-white/10';
  const glowColor = CATEGORY_GLOWS[def.category] || 'shadow-white/5';
  const defaultNodeWidth = 220;

  const isExecutingNode = node.id === executingNodeId;

  return (
    <div
      className={`absolute select-none cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isSelected ? `ring-2 ring-brand-500 shadow-2xl ${glowColor}` : 'shadow-xl'
      } ${isExecutingNode ? 'ring-2 ring-green-500 shadow-2xl shadow-green-500/30 animate-pulse scale-[1.01]' : ''}`}
      style={{ left: node.x, top: node.y, width: node.width || defaultNodeWidth }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className={`bg-surface-dark-3/90 backdrop-blur-md rounded-xl border ${borderColor} overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div
          className={`bg-gradient-to-r ${headerGradient} px-3 py-2 flex items-center gap-2 border-b border-white/10`}
        >
          {(() => {
            const NodeIcon = (Icons as any)[def.icon] || Icons.Box;
            return <NodeIcon className="w-3.5 h-3.5 text-white/90" />;
          })()}
          <span className="text-xs font-medium text-white truncate flex-1">{def.label}</span>
          {isExecutingNode && (
            <div className="flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
              <Icons.Loader className="w-2.5 h-2.5 animate-spin" />
              <span>Running</span>
            </div>
          )}
          {isSelected && !isExecutingNode && (
            <button
              onClick={handleDelete}
              aria-label="Delete node"
              className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white/70 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Progress Bar Loader */}
        {isExecutingNode &&
          nodeProgress?.[node.id] !== undefined &&
          nodeProgress[node.id] > 0 &&
          nodeProgress[node.id] < 100 && (
            <div className="bg-surface-dark-2 px-3 py-1.5 border-b border-white/5 space-y-1">
              <div className="flex justify-between text-[8px] font-mono font-bold text-zinc-400">
                <span className="uppercase tracking-wider">{nodeProgressStep?.[node.id] || 'Generating'}</span>
                <span className="text-brand-400">{nodeProgress[node.id]}%</span>
              </div>
              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-500 to-purple-500 h-full transition-all duration-300"
                  style={{ width: `${nodeProgress[node.id]}%` }}
                />
              </div>
            </div>
          )}

        {/* Ports Container */}
        <div className="relative px-3 py-2">
          <div className="space-y-2">
            {def.inputs.map((port) => (
              <NodePort
                key={port.id}
                port={port}
                side="input"
                nodeId={node.id}
                color={headerGradient.split(' ')[0].replace('from-', 'bg-')}
                onMouseDown={onPortMouseDown}
                onMouseUp={onPortMouseUp}
              />
            ))}
          </div>

          <div className="space-y-2 absolute right-3 top-2">
            {def.outputs.map((port) => (
              <NodePort
                key={port.id}
                port={port}
                side="output"
                nodeId={node.id}
                color={headerGradient.split(' ')[0].replace('from-', 'bg-')}
                onMouseDown={onPortMouseDown}
                onMouseUp={onPortMouseUp}
              />
            ))}
          </div>
        </div>

        {/* Custom Interactive Settings Inputs */}
        {isVisible && (
          <div className="px-3 pb-3 space-y-2.5">
            {/* TEXT PROMPT NODE */}
            {node.type === 'text-prompt' && (
              <div className="space-y-2 pt-1 border-t border-white/5" onMouseDown={(e) => e.stopPropagation()}>
                <div>
                  <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">
                    Prompt
                  </label>
                  <textarea
                    aria-label="Prompt"
                    className="w-full bg-surface-dark-1/80 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-500 transition-colors resize-none"
                    rows={2}
                    placeholder="Describe what to generate..."
                    value={node.settings.prompt || ''}
                    onChange={(e) => onSettingsChange?.('prompt', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">
                    Negative Prompt
                  </label>
                  <input
                    aria-label="Negative prompt"
                    type="text"
                    className="w-full bg-surface-dark-1/80 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white placeholder-white/30 focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="Ugly, low quality, etc..."
                    value={node.settings.negativePrompt || ''}
                    onChange={(e) => onSettingsChange?.('negativePrompt', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* IMAGE UPLOAD & STYLE REFERENCE NODES */}
            {(node.type === 'image-upload' || node.type === 'style-reference') && (
              <div className="space-y-2 pt-1 border-t border-white/5" onMouseDown={(e) => e.stopPropagation()}>
                <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">
                  {node.type === 'image-upload' ? 'Upload Image' : 'Style Reference'}
                </label>
                {node.settings.src ? (
                  <div className="relative group rounded-lg overflow-hidden border border-white/10 aspect-video bg-surface-dark-2 flex items-center justify-center">
                    <img src={node.settings.src} alt="Uploaded reference" className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSettingsChange?.('src', '');
                      }}
                      aria-label="Clear image"
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-red-600 text-white/80 hover:text-white transition-colors"
                      title="Clear Image"
                    >
                      <Icons.X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border border-dashed border-white/15 hover:border-brand-500/50 rounded-lg py-4 px-2 cursor-pointer bg-white/[0.01] hover:bg-brand-500/[0.02] transition-all group">
                    <Icons.Upload className="w-4 h-4 text-white/30 group-hover:text-brand-400 transition-colors mb-1" />
                    <span className="text-[9px] text-white/40 group-hover:text-white/70">Click to upload image</span>
                    <input
                      aria-label="Upload image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              onSettingsChange?.('src', reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}

                {node.type === 'style-reference' && (
                  <div className="pt-1">
                    <div className="flex justify-between text-[8px] text-white/40 mb-1">
                      <span className="uppercase font-black tracking-wider">Strength</span>
                      <span className="font-mono font-bold text-brand-400">
                        {(node.settings.strength ?? 0.7).toFixed(1)}
                      </span>
                    </div>
                    <input
                      aria-label="Filter strength"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      className="w-full h-1 bg-surface-dark-1 rounded-lg appearance-none cursor-pointer accent-brand-500 focus:outline-none"
                      value={node.settings.strength ?? 0.7}
                      onChange={(e) => onSettingsChange?.('strength', parseFloat(e.target.value))}
                    />
                  </div>
                )}
              </div>
            )}

            {/* COLOR PALETTE NODE */}
            {node.type === 'color-palette' && (
              <div className="space-y-1.5 pt-1 border-t border-white/5" onMouseDown={(e) => e.stopPropagation()}>
                <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block">
                  Palette Colors
                </label>
                <div className="flex flex-wrap gap-1">
                  {(node.settings.colors || []).map((color: string, idx: number) => (
                    <div
                      key={idx}
                      className="relative group flex items-center gap-1 bg-surface-dark-1/50 border border-white/5 rounded-full pl-0.5 pr-1 py-0.5"
                    >
                      <input
                        aria-label={`Color ${idx + 1}`}
                        type="color"
                        value={color}
                        onChange={(e) => {
                          const newColors = [...(node.settings.colors || [])];
                          newColors[idx] = e.target.value;
                          onSettingsChange?.('colors', newColors);
                        }}
                        className="w-3.5 h-3.5 rounded-full border-0 cursor-pointer bg-transparent overflow-hidden"
                        style={{ padding: 0 }}
                      />
                      <span className="text-[8px] font-mono font-bold text-white/50">{color.toUpperCase()}</span>
                      <button
                        onClick={() => {
                          const newColors = (node.settings.colors || []).filter((_: any, i: number) => i !== idx);
                          onSettingsChange?.('colors', newColors);
                        }}
                        aria-label="Remove color"
                        className="text-white/30 hover:text-red-400 text-[8px] ml-0.5"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newColors = [...(node.settings.colors || []), '#FFFFFF'];
                      onSettingsChange?.('colors', newColors);
                    }}
                    aria-label="Add color"
                    className="w-5 h-5 rounded-full border border-dashed border-white/20 hover:border-brand-500/50 flex items-center justify-center text-[10px] text-white/40 hover:text-brand-400 bg-white/[0.01]"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* AI MODEL NODES (Flux, Gemini, Recraft, Seedream) */}
            {def.category === 'ai' && (
              <div className="space-y-2 pt-1 border-t border-white/5" onMouseDown={(e) => e.stopPropagation()}>
                {node.settings.width !== undefined && node.settings.height !== undefined && (
                  <div>
                    <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">
                      Dimensions
                    </label>
                    <select
                      aria-label="Dimensions"
                      value={`${node.settings.width}x${node.settings.height}`}
                      onChange={(e) => {
                        const [w, h] = e.target.value.split('x').map(Number);
                        onSettingsChange?.('width', w);
                        onSettingsChange?.('height', h);
                      }}
                      className="w-full bg-surface-dark-1 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white/80 focus:outline-none focus:border-brand-500"
                    >
                      <option value="1024x1024">Square (1024x1024)</option>
                      <option value="1024x768">Landscape (1024x768)</option>
                      <option value="768x1024">Portrait (768x1024)</option>
                      <option value="512x512">Square Low (512x512)</option>
                    </select>
                  </div>
                )}

                {node.type === 'ai-flux' && (
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">
                        Model
                      </label>
                      <select
                        aria-label="Model"
                        value={node.settings.model || 'flux-schnell'}
                        onChange={(e) => onSettingsChange?.('model', e.target.value)}
                        className="w-full bg-surface-dark-1 border border-white/10 rounded-lg px-1.5 py-1 text-[9px] text-white/80 focus:outline-none focus:border-brand-500"
                      >
                        <option value="flux-schnell">Schnell (Fast)</option>
                        <option value="flux-dev">Dev (Quality)</option>
                        <option value="flux-pro">Pro (Ultra)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">
                        Steps
                      </label>
                      <input
                        aria-label="Steps"
                        type="number"
                        min="1"
                        max="100"
                        value={node.settings.steps ?? 20}
                        onChange={(e) => onSettingsChange?.('steps', parseInt(e.target.value) || 20)}
                        className="w-full bg-surface-dark-1 border border-white/10 rounded-lg px-1.5 py-1 text-[9px] text-white/80 focus:outline-none focus:border-brand-500 font-mono"
                      />
                    </div>
                  </div>
                )}

                {node.type === 'ai-gemini' && (
                  <div>
                    <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">
                      Gemini Model
                    </label>
                    <select
                      aria-label="Gemini model"
                      value={node.settings.model || 'nano-banana-2'}
                      onChange={(e) => onSettingsChange?.('model', e.target.value)}
                      className="w-full bg-surface-dark-1 border border-white/10 rounded-lg px-1.5 py-1 text-[9px] text-white/80 focus:outline-none focus:border-brand-500"
                    >
                      <option value="nano-banana-2">Nano Banana v2</option>
                      <option value="gemini-pro-vision">Gemini Pro Vision</option>
                    </select>
                  </div>
                )}

                {node.type === 'ai-recraft' && (
                  <div>
                    <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">
                      Art Style
                    </label>
                    <select
                      aria-label="Art style"
                      value={node.settings.style || 'digital_illustration'}
                      onChange={(e) => onSettingsChange?.('style', e.target.value)}
                      className="w-full bg-surface-dark-1 border border-white/10 rounded-lg px-1.5 py-1 text-[9px] text-white/80 focus:outline-none focus:border-brand-500"
                    >
                      <option value="digital_illustration">Digital Illustration</option>
                      <option value="vector_graphic">Vector Graphic</option>
                      <option value="line_art">Line Art</option>
                    </select>
                  </div>
                )}

                {/* Prompt Override Input inside AI Node itself */}
                {node.settings.prompt !== undefined && (
                  <div>
                    <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">
                      Prompt Override
                    </label>
                    <input
                      aria-label="Prompt override"
                      type="text"
                      className="w-full bg-surface-dark-1 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-brand-500"
                      placeholder="Optional inline prompt..."
                      value={node.settings.prompt || ''}
                      onChange={(e) => onSettingsChange?.('prompt', e.target.value)}
                    />
                  </div>
                )}

                {/* GORGEOUS GENERATE ACTION BUTTON */}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await executeGraph();
                  }}
                  disabled={isExecuting}
                  className="w-full mt-2 py-1.5 px-3 text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExecuting ? (
                    <>
                      <Icons.Loader className="w-3 h-3 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Icons.Sparkles className="w-3 h-3" />
                      <span>Generate Image</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* EDIT FILTER NODE */}
            {node.type === 'filter' && (
              <div className="space-y-1.5 pt-1 border-t border-white/5" onMouseDown={(e) => e.stopPropagation()}>
                <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block">
                  Filters & adjustments
                </label>
                {['brightness', 'contrast', 'saturation'].map((adj) => (
                  <div key={adj} className="space-y-0.5">
                    <div className="flex justify-between text-[8px] text-white/40">
                      <span
                        className="capitalize cursor-pointer hover:text-white transition-colors"
                        title="Double-click to reset to 100%"
                        onDoubleClick={() => onSettingsChange?.(adj, 100)}
                      >
                        {adj}
                      </span>
                      <span className="font-mono">{node.settings[adj] ?? 100}%</span>
                    </div>
                    <input
                      aria-label={adj}
                      type="range"
                      min="0"
                      max="200"
                      className="w-full h-1 bg-surface-dark-1 rounded-lg appearance-none cursor-pointer accent-brand-500 focus:outline-none"
                      value={node.settings[adj] ?? 100}
                      onChange={(e) => onSettingsChange?.(adj, parseInt(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* EDIT UPSCALE NODE */}
            {node.type === 'upscale' && (
              <div className="space-y-1.5 pt-1 border-t border-white/5" onMouseDown={(e) => e.stopPropagation()}>
                <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block">
                  Upscale Factor
                </label>
                <select
                  aria-label="Upscale factor"
                  value={node.settings.scale || 2}
                  onChange={(e) => onSettingsChange?.('scale', parseInt(e.target.value))}
                  className="w-full bg-surface-dark-1 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-brand-500"
                >
                  <option value={2}>2x Scale</option>
                  <option value={4}>4x Ultra High</option>
                </select>
              </div>
            )}

            {/* EDIT TEXT OVERLAY NODE */}
            {node.type === 'text-overlay' && (
              <div className="space-y-1.5 pt-1 border-t border-white/5" onMouseDown={(e) => e.stopPropagation()}>
                <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block">
                  Text Overlay
                </label>
                <input
                  aria-label="Text overlay"
                  type="text"
                  className="w-full bg-surface-dark-1 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-brand-500"
                  placeholder="Overlay text..."
                  value={node.settings.text || ''}
                  onChange={(e) => onSettingsChange?.('text', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[8px] text-white/40">Font Size</label>
                    <input
                      aria-label="Font size"
                      type="number"
                      className="w-full bg-surface-dark-1 border border-white/10 rounded-lg px-1.5 py-0.5 text-[9px] text-white focus:outline-none focus:border-brand-500"
                      value={node.settings.fontSize ?? 72}
                      onChange={(e) => onSettingsChange?.('fontSize', parseInt(e.target.value) || 72)}
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-white/40 block">Color</label>
                    <div className="flex items-center gap-1 mt-0.5">
                      <input
                        aria-label="Text color"
                        type="color"
                        className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                        value={node.settings.color || '#FFFFFF'}
                        onChange={(e) => onSettingsChange?.('color', e.target.value)}
                      />
                      <span className="text-[8px] font-mono">{node.settings.color || '#FFFFFF'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BRAND KIT NODE */}
            {node.type === 'brand-kit' && (
              <div className="space-y-2 pt-1 border-t border-white/5" onMouseDown={(e) => e.stopPropagation()}>
                <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">
                  Brand Swatches
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['primaryColor', 'secondaryColor', 'tertiaryColor'].map((key) => {
                    const label = key.replace('Color', '');
                    const color =
                      node.settings[key] ||
                      (key === 'primaryColor' ? '#7D2AE8' : key === 'secondaryColor' ? '#00C4CC' : '#FFFFFF');
                    return (
                      <div
                        key={key}
                        className="flex flex-col items-center bg-surface-dark-1/40 border border-white/5 p-1.5 rounded-lg gap-1"
                      >
                        <span className="text-[8px] font-mono text-zinc-500 font-bold capitalize">{label}</span>
                        <input
                          aria-label={`${label} color`}
                          type="color"
                          value={color}
                          onChange={(e) => onSettingsChange?.(key, e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-white/10 bg-transparent overflow-hidden"
                          style={{ padding: 0 }}
                        />
                        <span className="text-[7px] font-mono text-zinc-400 font-bold">{color.toUpperCase()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CANVAS LAYER NODE */}
            {node.type === 'canvas-layer' && (
              <div className="space-y-2 pt-1 border-t border-white/5" onMouseDown={(e) => e.stopPropagation()}>
                <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">
                  Active Target Layer
                </label>
                <select
                  aria-label="Active target layer"
                  value={node.settings.layerId || 'layer_1'}
                  onChange={(e) => {
                    const names: Record<string, string> = {
                      layer_1: 'Vector Path 1',
                      layer_2: 'Headline Brand Text',
                      layer_3: 'Product Cutout Mask',
                    };
                    onSettingsChange?.('layerId', e.target.value);
                    onSettingsChange?.('layerName', names[e.target.value] || 'Canvas Layer');
                  }}
                  className="w-full bg-surface-dark-1 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-brand-500 font-bold"
                >
                  <option value="layer_1 font-bold">Vector Path 1 (Pen Tool)</option>
                  <option value="layer_2">Headline Brand Text (Text Tool)</option>
                  <option value="layer_3">Product Cutout Mask (Mask Tool)</option>
                </select>
                <div className="flex items-center gap-1.5 mt-2 bg-brand-500/5 px-2 py-1 border border-brand-500/10 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                  <span className="text-[8px] font-mono text-brand-300 font-bold uppercase tracking-wider">
                    Listening live...
                  </span>
                </div>
              </div>
            )}

            {/* TYPOGRAPHIC STYLE NODE */}
            {node.type === 'typographic-style' && (
              <div className="space-y-2 pt-1 border-t border-white/5" onMouseDown={(e) => e.stopPropagation()}>
                <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">
                  Text Style Settings
                </label>
                <input
                  aria-label="Text style input"
                  type="text"
                  className="w-full bg-surface-dark-1 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none"
                  placeholder="Enter stylized text..."
                  value={node.settings.text || ''}
                  onChange={(e) => onSettingsChange?.('text', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[8px] text-white/40 block mb-0.5">Font Family</label>
                    <select
                      aria-label="Font family"
                      value={node.settings.fontFamily || 'Inter'}
                      onChange={(e) => onSettingsChange?.('fontFamily', e.target.value)}
                      className="w-full bg-surface-dark-1 border border-white/10 rounded-lg px-1.5 py-0.5 text-[9px] text-white focus:outline-none"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Bebas Neue">Bebas Neue</option>
                      <option value="Lobster">Lobster</option>
                      <option value="Pacifico">Pacifico</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] text-white/40 block mb-0.5">Color</label>
                    <div className="flex items-center gap-1 mt-0.5">
                      <input
                        aria-label="Style text color"
                        type="color"
                        value={node.settings.color || '#7D2AE8'}
                        onChange={(e) => onSettingsChange?.('color', e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border border-white/10 bg-transparent overflow-hidden"
                        style={{ padding: 0 }}
                      />
                      <span className="text-[8px] font-mono font-bold text-zinc-400">
                        {node.settings.color || '#7D2A'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[8px] text-white/40 mb-1">
                    <span className="uppercase font-black tracking-wider">Curvature</span>
                    <span className="font-mono font-bold text-brand-400">{node.settings.curvature ?? 50}%</span>
                  </div>
                  <input
                    aria-label="Curvature"
                    type="range"
                    min="0"
                    max="100"
                    className="w-full h-1 bg-surface-dark-1 rounded-lg appearance-none cursor-pointer accent-brand-500"
                    value={node.settings.curvature ?? 50}
                    onChange={(e) => onSettingsChange?.('curvature', parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* MOCKUP SCENIC PRESET NODE */}
            {node.type === 'mockup-scenic-preset' && (
              <div className="space-y-2 pt-1 border-t border-white/5" onMouseDown={(e) => e.stopPropagation()}>
                <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">
                  Scenic Renders (10 Concurrent)
                </label>
                {outputs?.images ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-5 gap-1">
                      {outputs.images.map((img: any) => {
                        const isActive = img.id === activeScenicId;
                        return (
                          <button
                            key={img.id}
                            title={img.name}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveScenicId(img.id);
                            }}
                            className={`aspect-square rounded border overflow-hidden bg-surface-dark-2 transition-all ${
                              isActive
                                ? 'border-brand-500 scale-105 ring-1 ring-brand-500'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            <img src={img.src} alt="" className="w-full h-full object-cover" />
                          </button>
                        );
                      })}
                    </div>
                    {(() => {
                      const featured = outputs.images.find((x: any) => x.id === activeScenicId) || outputs.images[0];
                      return (
                        <div className="rounded-lg overflow-hidden border border-white/10 aspect-video relative bg-surface-dark-3 flex flex-col justify-end">
                          <img src={featured.src} alt="" className="w-full h-full object-cover opacity-80" />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                            <span className="text-[8px] font-bold text-white uppercase tracking-wider">
                              {featured.name}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="py-3 px-2 rounded-lg border border-dashed border-white/10 bg-white/[0.01] text-center">
                    <span className="text-[9px] text-zinc-500">Run graph to render 10 mockups concurrently</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Output Previews */}
        {isVisible && node.type !== 'mockup-scenic-preset' && hasOutput && imageOutput?.src && (
          <div className="px-3 pb-3">
            <div className="w-full h-24 rounded-lg bg-surface-dark-2 border border-white/5 overflow-hidden flex items-center justify-center">
              <img src={imageOutput.src} alt="" className="w-full h-full object-cover opacity-70" />
            </div>
          </div>
        )}

        {isVisible && hasOutput && !imageOutput?.src && (
          <div className="px-3 pb-2">
            <div className="text-[10px] text-white/40 truncate">
              {Object.keys(outputs)
                .filter((k) => k !== 'image')
                .slice(0, 2)
                .join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(Node);
