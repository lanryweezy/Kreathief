import React, { memo, useCallback } from 'react';
import { GraphNode } from '../../types/nodes';
import { getNodeDefinition } from '../../data/nodeDefinitions';
import { useNodeGraph } from '../../hooks/useNodeGraph';
import NodePort from './NodePort';
import * as Icons from '../icons';

interface NodeProps {
  node: GraphNode;
  isSelected: boolean;
  output?: Record<string, any>;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onPortMouseDown: (e: React.MouseEvent, nodeId: string, portId: string, side: 'input' | 'output') => void;
  onPortMouseUp: (e: React.MouseEvent, nodeId: string, portId: string, side: 'input' | 'output') => void;
  onDelete?: () => void;
  onSettingsChange?: (key: string, value: any) => void;
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
  onMouseDown,
  onPortMouseDown,
  onPortMouseUp,
  onSettingsChange,
}: NodeProps) {
  const removeNode = useNodeGraph((s) => s.removeNode);
  const nodeOutputs = useNodeGraph((s) => s.nodeOutputs);
  const executeGraph = useNodeGraph((s) => s.executeGraph);
  const isExecuting = useNodeGraph((s) => s.isExecuting);
  const def = getNodeDefinition(node.type);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onMouseDown(e, node.id);
    },
    [onMouseDown, node.id]
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

  return (
    <div
      className={`absolute select-none cursor-grab active:cursor-grabbing transition-shadow duration-200 ${
        isSelected ? `ring-2 ring-brand-500 shadow-2xl ${glowColor}` : 'shadow-xl'
      }`}
      style={{ left: node.x, top: node.y, width: node.width || defaultNodeWidth }}
      onMouseDown={handleMouseDown}
    >
      <div className={`bg-surface-dark-3/90 backdrop-blur-md rounded-xl border ${borderColor} overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`bg-gradient-to-r ${headerGradient} px-3 py-2 flex items-center gap-2 border-b border-white/10`}>
          {(() => {
            const NodeIcon = (Icons as any)[def.icon] || Icons.Box;
            return <NodeIcon className="w-3.5 h-3.5 text-white/90" />;
          })()}
          <span className="text-xs font-medium text-white truncate flex-1">{def.label}</span>
          {isSelected && (
            <button
              onClick={handleDelete}
              className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white/70 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>

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
        <div className="px-3 pb-3 space-y-2.5">
          {/* TEXT PROMPT NODE */}
          {node.type === 'text-prompt' && (
            <div className="space-y-2 pt-1 border-t border-white/5" onMouseDown={(e) => e.stopPropagation()}>
              <div>
                <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">Prompt</label>
                <textarea
                  className="w-full bg-surface-dark-1/80 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-500 transition-colors resize-none"
                  rows={2}
                  placeholder="Describe what to generate..."
                  value={node.settings.prompt || ''}
                  onChange={(e) => onSettingsChange?.('prompt', e.target.value)}
                />
              </div>
              <div>
                <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">Negative Prompt</label>
                <input
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
                  <img
                    src={node.settings.src}
                    alt="Uploaded reference"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSettingsChange?.('src', '');
                    }}
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
                    <span className="font-mono font-bold text-brand-400">{(node.settings.strength ?? 0.7).toFixed(1)}</span>
                  </div>
                  <input
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
              <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block">Palette Colors</label>
              <div className="flex flex-wrap gap-1">
                {(node.settings.colors || []).map((color: string, idx: number) => (
                  <div key={idx} className="relative group flex items-center gap-1 bg-surface-dark-1/50 border border-white/5 rounded-full pl-0.5 pr-1 py-0.5">
                    <input
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
                  <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">Dimensions</label>
                  <select
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
                    <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">Model</label>
                    <select
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
                    <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">Steps</label>
                    <input
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
                  <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">Gemini Model</label>
                  <select
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
                  <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">Art Style</label>
                  <select
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
                  <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-1">Prompt Override</label>
                  <input
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
              <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block">Filters & adjustments</label>
              {['brightness', 'contrast', 'saturation'].map((adj) => (
                <div key={adj} className="space-y-0.5">
                  <div className="flex justify-between text-[8px] text-white/40">
                    <span className="capitalize">{adj}</span>
                    <span className="font-mono">{node.settings[adj] ?? 100}%</span>
                  </div>
                  <input
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
              <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block">Upscale Factor</label>
              <select
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
              <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block">Text Overlay</label>
              <input
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
        </div>

        {/* Output Previews */}
        {hasOutput && imageOutput?.src && (
          <div className="px-3 pb-3">
            <div className="w-full h-24 rounded-lg bg-surface-dark-2 border border-white/5 overflow-hidden flex items-center justify-center">
              <img
                src={imageOutput.src}
                alt=""
                className="w-full h-full object-cover opacity-70"
              />
            </div>
          </div>
        )}

        {hasOutput && !imageOutput?.src && (
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
