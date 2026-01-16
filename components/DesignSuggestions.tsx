import React, { useState } from 'react';
import * as geminiService from '../services/geminiService';
import { Icons } from '../constants';
import { DesignTheme } from '../types';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  action: 'theme' | 'text' | 'layout' | 'colors';
  data?: any;
  isApplying?: boolean;
}

interface DesignSuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySuggestion?: (suggestion: Suggestion) => void;
  designContext?: string;
}

export const DesignSuggestions: React.FC<DesignSuggestionsProps> = ({
  isOpen,
  onClose,
  onApplySuggestion,
  designContext = 'modern poster'
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const generateSuggestions = async () => {
    setIsLoading(true);
    try {
      const suggestionPrompts = [
        'Suggest a color palette improvement for this design',
        'Suggest a typography improvement for this design',
        'Suggest a layout improvement for this design',
        'Suggest a visual hierarchy improvement for this design'
      ];

      const newSuggestions: Suggestion[] = [];

      for (let i = 0; i < suggestionPrompts.length; i++) {
        const response = await geminiService.generateText(
          designContext,
          suggestionPrompts[i]
        );

        newSuggestions.push({
          id: `suggestion_${Date.now()}_${i}`,
          title: suggestionPrompts[i].replace('Suggest a ', '').replace(' for this design', ''),
          description: response,
          action: ['colors', 'text', 'layout', 'theme'][i] as any,
          isApplying: false
        });
      }

      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = async (suggestion: Suggestion) => {
    if (appliedSuggestions.has(suggestion.id)) return;

    setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
    onApplySuggestion?.(suggestion);

    // Visual feedback
    setTimeout(() => {
      setSuggestions(prev =>
        prev.filter(s => s.id !== suggestion.id)
      );
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1e1e1e] flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Icons.Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">Design Suggestions</h2>
              <p className="text-xs text-gray-400">AI-powered improvements for your design</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {suggestions.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <Icons.Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Get AI-powered suggestions to improve your design</p>
              <button
                onClick={generateSuggestions}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                Generate Suggestions
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">Analyzing your design...</p>
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
                        <h3 className="font-semibold text-white capitalize mb-1">
                          {suggestion.title}
                        </h3>
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {suggestion.description}
                        </p>
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
              Refresh Suggestions
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
