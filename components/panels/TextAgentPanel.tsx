import React, { useState } from 'react';
import { Icons } from '../../constants';
import { TextLayer } from '../../types';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '../Button';

interface TextAgentPanelProps {
  selectedLayer?: TextLayer;
}

export const TextAgentPanel = React.memo(({ selectedLayer }: TextAgentPanelProps) => {
  const { handleToneRewrite, suggestFontPairing, isGenerating } = useStore(
    useShallow((state) => ({
      handleToneRewrite: state.handleToneRewrite,
      suggestFontPairing: state.suggestFontPairing,
      isGenerating: state.isGenerating,
    }))
  );

  const [customPrompt, setCustomPrompt] = useState('');

  if (!selectedLayer) {
    return (
      <div className="bg-surface-dark-3 rounded-xl border border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icons.Wand className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Text AI Agent</h3>
        </div>
        <p className="text-[10px] text-gray-500 text-center py-4">
          Select a text layer to use AI typography & rewrite tools
        </p>
      </div>
    );
  }

  const isLayerProcessing = (selectedLayer as any).isProcessing;
  const disableTools = isLayerProcessing || isGenerating;

  return (
    <div className="bg-surface-dark-3 rounded-xl border border-gray-700 p-4 space-y-5">
      <div className="flex items-center gap-2 border-b border-gray-700 pb-3">
        <Icons.Wand className="w-4 h-4 text-purple-400" />
        <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Text AI Agent</h3>
      </div>

      <div className="space-y-2">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tone & Context (Magic Rewrite)</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="w-full text-[10px] justify-start py-2 h-auto flex items-center gap-2"
            onClick={() => handleToneRewrite(selectedLayer.id, 'Make it Punchy & Bold')}
            disabled={disableTools}
          >
            <Icons.Zap className="w-3 h-3 text-orange-400" />
            Punchy & Bold
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="w-full text-[10px] justify-start py-2 h-auto flex items-center gap-2"
            onClick={() => handleToneRewrite(selectedLayer.id, 'Make it highly Professional')}
            disabled={disableTools}
          >
            <Icons.Briefcase className="w-3 h-3 text-blue-400" />
            Professional
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="w-full text-[10px] justify-start py-2 h-auto flex items-center gap-2"
            onClick={() =>
              handleToneRewrite(
                selectedLayer.id,
                'Rewrite this for an African/Nigerian demographic using local contextual slang (Naija) but keeping it premium.'
              )
            }
            disabled={disableTools}
          >
            <Icons.Globe className="w-3 h-3 text-green-400" />
            African Context
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="w-full text-[10px] justify-start py-2 h-auto flex items-center gap-2"
            onClick={() => handleToneRewrite(selectedLayer.id, 'Make it Gen-Z and social media ready')}
            disabled={disableTools}
          >
            <Icons.Smartphone className="w-3 h-3 text-pink-400" />
            Gen-Z Social
          </Button>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-gray-700">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Format</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="w-full text-[10px] justify-start py-2 h-auto flex items-center gap-2"
            onClick={() =>
              handleToneRewrite(
                selectedLayer.id,
                'Fix all grammar and spelling mistakes. Do not change the length significantly.'
              )
            }
            disabled={disableTools}
          >
            <Icons.Check className="w-3 h-3 text-green-400" />
            Fix Grammar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full text-[10px] justify-start py-2 h-auto flex items-center gap-2"
            onClick={() => handleToneRewrite(selectedLayer.id, 'Make this significantly shorter and punchier')}
            disabled={disableTools}
          >
            <Icons.Minimize className="w-3 h-3 text-gray-400" />
            Shorten
          </Button>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-gray-700">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Typography Engine</h4>
        <p className="text-[9px] text-gray-500 mb-2 leading-tight">
          Let AI analyze your text and apply a beautiful font pairing that matches the intent.
        </p>
        <Button
          variant="primary"
          size="sm"
          className="w-full text-[10px] justify-center py-2 h-auto flex items-center gap-2"
          onClick={() => suggestFontPairing(selectedLayer.id)}
          disabled={disableTools}
        >
          {isGenerating ? <Icons.RefreshCw className="w-3 h-3 animate-spin" /> : <Icons.Wand className="w-3 h-3" />}
          Auto-Select Premium Font
        </Button>
      </div>

      <div className="space-y-2 pt-2 border-t border-gray-700">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Custom Prompt</h4>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Translate to Pidgin English"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            disabled={disableTools}
            className="flex-1 bg-surface-dark-4 border border-gray-600 rounded-lg px-2 py-1.5 text-[10px] text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customPrompt.trim()) {
                handleToneRewrite(selectedLayer.id, customPrompt);
                setCustomPrompt('');
              }
            }}
          />
          <Button
            variant="primary"
            size="sm"
            className="px-3 flex items-center justify-center"
            onClick={() => {
              if (customPrompt.trim()) {
                handleToneRewrite(selectedLayer.id, customPrompt);
                setCustomPrompt('');
              }
            }}
            disabled={!customPrompt.trim() || disableTools}
          >
            <Icons.Send className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
});

TextAgentPanel.displayName = 'TextAgentPanel';
