import { log } from '../utils/log';

import React, { useState } from 'react';
import * as geminiService from '../services/geminiService';
import { Icons } from '../constants';

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  action: 'theme' | 'typography' | 'layout';
  data?: any;
  isApplying?: boolean;
}

interface DesignSuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySuggestion?: (suggestion: Suggestion) => void;
  designContext?: string;
  layers?: any[];
  canvasSize?: { width: number; height: number };
}

export const DesignSuggestions: React.FC<DesignSuggestionsProps> = ({
  isOpen,
  onClose,
  onApplySuggestion,
  designContext = 'modern poster',
  layers = [],
  canvasSize = { width: 1080, height: 1080 },
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const generateSuggestions = async () => {
    setIsLoading(true);
    try {
      const newSuggestions: Suggestion[] = [];

      // 1. Layout Optimization (only if we have layers)
      if (layers.length > 0) {
        newSuggestions.push({
          id: `suggestion_layout_${Date.now()}`,
          title: 'Magic Layout',
          description: 'Automatically optionalize layer positions for better balance and hierarchy.',
          action: 'layout',
          data: {
            /* data fetched on apply for now, or pre-fetched? Better to pre-fetch if fast, but layout optimizes strictly on *current* state. 
                   Actually, let's pre-fetch "Layout" implies we change state. 
                   If user moves things while menu is open, pre-fetched layout is stale. 
                   Let's make "Magic Layout" an action that calls API immediately when clicked? 
                   BUT the current UI pattern is "Generate" -> "List" -> "Apply".
                   So we must generate the "Plan" or just a placeholder 'action'.
                   Let's stick to the "Action" pattern where the suggestion *contains* the data.
                   So we must fetch layout now. */
          },
        });
        // We will fetch the actual data in parallel below
      }

      // 2. Color Theme
      newSuggestions.push({
        id: `suggestion_theme_${Date.now()}`,
        title: 'Smart Color Remediation',
        description: 'Apply a harmonious color palette based on your design context.',
        action: 'theme',
      });

      // 3. Typography
      newSuggestions.push({
        id: `suggestion_typo_${Date.now()}`,
        title: 'Typography Polish',
        description: 'Update fonts to a more professional pairing.',
        action: 'typography',
      });

      // Parallel Fetching for Data
      const [layoutData, themeData, typoData] = await Promise.all([
        // Layout
        layers.length > 0
          ? geminiService.optimizeLayout(layers, canvasSize.width, canvasSize.height)
          : Promise.resolve(null),
        // Theme
        geminiService.generateDesignTheme(designContext + ' color palette only'),
        // Typo
        geminiService.generateDesignTheme(designContext + ' typography only'),
      ]);

      // Assign Data
      if (layoutData && newSuggestions[0].action === 'layout') {
        newSuggestions[0].data = layoutData;
      }
      const themeIdx = newSuggestions.findIndex((s) => s.action === 'theme');
      if (themeIdx !== -1 && themeData) {
        newSuggestions[themeIdx].data = themeData;
        newSuggestions[themeIdx].description = `Apply ${themeData.name} palette.`;
      }
      const typoIdx = newSuggestions.findIndex((s) => s.action === 'typography');
      if (typoIdx !== -1 && typoData) {
        newSuggestions[typoIdx].data = typoData;
        newSuggestions[typoIdx].description = `Switch to ${typoData.headingFont} & ${typoData.bodyFont}.`;
      }

      setSuggestions(newSuggestions);
    } catch (error) {
      log.error('Error generating suggestions', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = async (suggestion: Suggestion) => {
    if (appliedSuggestions.has(suggestion.id)) {
      return;
    }

    setAppliedSuggestions((prev) => new Set([...prev, suggestion.id]));
    onApplySuggestion?.(suggestion);

    // Visual feedback
    setTimeout(() => {
      //   setSuggestions(prev =>
      //     prev.filter(s => s.id !== suggestion.id)
      //   );
    }, 500);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1e1e1e] flex items-center justify-between p-6 border-b border-gray-700 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Icons.Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">AI Design Director</h2>
              <p className="text-xs text-gray-400">Actionable improvements for your masterpiece</p>
            </div>
          </div>
          <button
            aria-label="Close panel"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {suggestions.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <Icons.Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Let AI analyze your layout, colors, and fonts.</p>
              <button
                onClick={generateSuggestions}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                Analyze & Suggest
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">Analyzing composition and style...</p>
                  </div>
                </div>
              ) : (
                suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-indigo-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white capitalize">{suggestion.title}</h3>
                          {suggestion.action === 'layout' && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 rounded uppercase font-bold">
                              Layout
                            </span>
                          )}
                          {suggestion.action === 'theme' && (
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 rounded uppercase font-bold">
                              Color
                            </span>
                          )}
                          {suggestion.action === 'typography' && (
                            <span className="text-[10px] bg-green-500/20 text-green-300 px-1.5 rounded uppercase font-bold">
                              Font
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2">{suggestion.description}</p>
                      </div>
                      <button
                        onClick={() => handleApplySuggestion(suggestion)}
                        disabled={appliedSuggestions.has(suggestion.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-green-600 text-white px-4 py-2 rounded font-medium text-sm transition-colors whitespace-nowrap disabled:cursor-default"
                      >
                        {appliedSuggestions.has(suggestion.id) ? '✓ Applied' : 'Apply'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {suggestions.length > 0 && !isLoading && (
          <div className="sticky bottom-0 bg-[#1e1e1e] border-t border-gray-700 p-4 flex gap-2">
            <button
              onClick={generateSuggestions}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Re-Analyze
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
