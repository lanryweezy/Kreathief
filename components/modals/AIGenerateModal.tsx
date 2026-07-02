import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WORKFLOW_PRESETS } from '../../data/workflowPresets';
import { getNodeDefinition } from '../../data/nodeDefinitions';
import { useNodeGraph } from '../../hooks/useNodeGraph';

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (result: { image?: string; text?: string; layers?: any[] }) => void;
}

type GenerateState = 'idle' | 'generating' | 'preview';

export const AIGenerateModal: React.FC<AIGenerateModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [state, setState] = useState<GenerateState>('idle');
  const [result, setResult] = useState<{ image?: string; text?: string; layers?: any[] } | null>(null);
  const { loadGraph, executeGraph } = useNodeGraph();

  const presets = Object.values(WORKFLOW_PRESETS);

  const handleGenerate = useCallback(async () => {
    if (!selectedPreset || !prompt.trim()) return;

    setState('generating');
    try {
      const preset = WORKFLOW_PRESETS[selectedPreset];
      if (!preset) return;

      await loadGraph(preset.workflowId);
      const output = await executeGraph({ prompt: prompt.trim() });

      const finalNode = output?.finalOutput ?? output;
      const generated: { image?: string; text?: string; layers?: any[] } = {};

      if (finalNode?.image) generated.image = finalNode.image;
      if (finalNode?.text) generated.text = finalNode.text;
      if (finalNode?.layers) generated.layers = finalNode.layers;

      setResult(generated);
      setState('preview');
    } catch (err) {
      setState('idle');
    }
  }, [selectedPreset, prompt, loadGraph, executeGraph]);

  const handleAddToCanvas = useCallback(() => {
    if (result) {
      onGenerate(result);
      handleClose();
    }
  }, [result, onGenerate]);

  const handleClose = useCallback(() => {
    setPrompt('');
    setSelectedPreset(null);
    setState('idle');
    setResult(null);
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

          <motion.div
            className="relative w-full max-w-2xl mx-4 bg-surface-dark-2 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">AI Generate</h2>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="relative mb-6">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="What do you want to create?"
                  className="w-full h-32 px-4 py-3 bg-surface-dark-3 border border-white/10 rounded-xl text-white placeholder-gray-500 text-lg resize-none focus:outline-none focus:border-[#7D2AE8]/50 focus:ring-1 focus:ring-[#7D2AE8]/30 transition-all"
                  disabled={state === 'generating'}
                />
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-3">Quick start</p>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset.id)}
                      disabled={state === 'generating'}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedPreset === preset.id
                          ? 'bg-[#7D2AE8]/10 border-[#7D2AE8]/50 text-white'
                          : 'bg-surface-dark-3 border-white/5 text-gray-300 hover:bg-surface-dark-3/80 hover:border-white/10'
                      }`}
                    >
                      <span className="text-2xl mb-1 block">{preset.icon}</span>
                      <span className="text-sm font-medium">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {state === 'generating' && (
                <div className="mb-6 flex items-center justify-center gap-3 py-8">
                  <div className="w-5 h-5 border-2 border-[#7D2AE8] border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-300">Generating your design...</span>
                </div>
              )}

              {state === 'preview' && result && (
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-3">Preview</p>
                  <div className="bg-surface-dark-3 border border-white/10 rounded-xl p-4 flex items-center justify-center min-h-[160px]">
                    {result.image ? (
                      <img
                        src={result.image}
                        alt="Generated"
                        className="max-h-40 max-w-full object-contain rounded-lg"
                      />
                    ) : result.text ? (
                      <p className="text-white text-sm whitespace-pre-wrap max-h-40 overflow-auto">{result.text}</p>
                    ) : (
                      <p className="text-gray-500">Design ready</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {state === 'preview' && (
                  <button
                    onClick={() => {
                      setState('idle');
                      setResult(null);
                    }}
                    className="flex-1 py-3 px-4 bg-surface-dark-3 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-surface-dark-3/80 transition-all font-medium"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={state === 'preview' ? handleAddToCanvas : handleGenerate}
                  disabled={state === 'generating' || (!prompt.trim() && state !== 'preview')}
                  className="flex-1 py-3 px-4 bg-[#7D2AE8] hover:bg-[#6B21D6] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all font-medium"
                >
                  {state === 'preview' ? 'Add to Canvas' : 'Generate'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
