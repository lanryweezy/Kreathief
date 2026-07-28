import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { smartTemplateService, SmartTemplateSuggestion, TemplateContext } from '../../services/smartTemplateService';
import { AspectRatio } from '../../types';
import { PanelErrorBoundary } from './PanelErrorBoundary';

interface SmartTemplatesPanelProps {
  onApplyTemplate?: (templateId: string, variables: Record<string, string>) => void;
  onBack?: () => void;
}

export const SmartTemplatesPanel: React.FC<SmartTemplatesPanelProps> = ({ onApplyTemplate, onBack }) => {
  const [suggestions, setSuggestions] = useState<SmartTemplateSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SmartTemplateSuggestion | null>(null);
  const [editedVariables, setEditedVariables] = useState<Record<string, string>>({});
  const [context, setContext] = useState<TemplateContext>({});
  const [activeView, setActiveView] = useState<'suggestions' | 'customize' | 'search'>('suggestions');

  const brandKits = useStore((state) => state.brandKits);
  const activeBrandKitId = useStore((state) => state.activeBrandKitId);

  // Auto-analyze on mount
  useEffect(() => {
    analyzeContext();
  }, []);

  // Get active brand kit
  const activeBrandKit = brandKits?.find((kit: any) => kit.id === activeBrandKitId);

  const analyzeContext = useCallback(() => {
    setIsAnalyzing(true);

    // Build context from current state
    const newContext: TemplateContext = {
      brandKit: activeBrandKit,
      purpose: 'social_media', // Could infer from recent projects
      aspectRatio: AspectRatio.SQUARE, // Could get from canvas size
      tone: 'bold',
    };

    setContext(newContext);

    const results = smartTemplateService.suggestTemplates(newContext);
    setSuggestions(results);
    setIsAnalyzing(false);
  }, [activeBrandKit]);

  const handleApplySuggestion = (suggestion: SmartTemplateSuggestion) => {
    setSelectedSuggestion(suggestion);
    setEditedVariables(suggestion.variables);
    setActiveView('customize');
  };

  const handleVariableChange = (key: string, value: string) => {
    setEditedVariables((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfirmApply = () => {
    if (selectedSuggestion && onApplyTemplate) {
      onApplyTemplate(selectedSuggestion.templateId, editedVariables);
    }
  };

  const handleQuickApply = (suggestion: SmartTemplateSuggestion) => {
    if (onApplyTemplate) {
      onApplyTemplate(suggestion.templateId, suggestion.variables);
    }
  };

  const handleRegenerate = () => {
    analyzeContext();
  };

  return (
    <div className="flex flex-col h-full bg-[#13161a]">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-brand-600/10 to-accent/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                aria-label="Go back"
                className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <Icons.ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h3 className="text-white font-bold flex items-center gap-2">
                <Icons.Magic className="w-5 h-5 text-purple-400" />
                Smart Templates
              </h3>
              <p className="text-xs text-gray-400">AI-powered template recommendations</p>
            </div>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={isAnalyzing}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Get new suggestions"
          >
            <Icons.RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex gap-1 p-0.5 bg-black/20 rounded-lg border border-white/5">
          <button
            onClick={() => setActiveView('suggestions')}
            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${
              activeView === 'suggestions' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            For You
          </button>
          <button
            onClick={() => setActiveView('search')}
            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${
              activeView === 'search' ? 'bg-accent text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Search
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mb-4" />
            <p className="text-gray-400 text-sm font-medium">Analyzing your brand...</p>
            <p className="text-gray-600 text-xs mt-1">Finding perfect templates</p>
          </div>
        ) : activeView === 'suggestions' ? (
          <div className="space-y-4">
            {/* Context Summary */}
            {activeBrandKit && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <Icons.Palette className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-xs font-bold">Using Brand: {activeBrandKit.name}</p>
                  <p className="text-gray-500 text-[10px]">{activeBrandKit.colors.length} colors detected</p>
                </div>
                <div className="flex gap-1">
                  {activeBrandKit.colors.slice(0, 3).map((color: string, i: number) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full border border-white/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recommended for You</h4>

              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className="bg-surface-dark-3 border border-gray-700 hover:border-purple-500/50 rounded-xl overflow-hidden transition-all group cursor-pointer"
                  onClick={() => handleApplySuggestion(suggestion)}
                >
                  {/* Preview Placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-purple-600/20 flex items-center justify-center">
                        <span className="text-2xl font-black text-purple-400">#{index + 1}</span>
                      </div>
                    </div>

                    {/* Match Score Badge */}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
                      <span className="text-[10px] font-black text-green-400">{suggestion.matchScore}% match</span>
                    </div>

                    {/* Quick Apply Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickApply(suggestion);
                      }}
                      className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0"
                    >
                      Quick Apply
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="text-white font-bold text-sm">{suggestion.templateName}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          {suggestion.purpose && (
                            <span className="text-[9px] font-medium text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded">
                              {suggestion.purpose}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-white">{suggestion.matchScore}%</div>
                        <div className="text-[9px] text-gray-500">match</div>
                      </div>
                    </div>

                    <p className="text-gray-500 text-[10px] leading-relaxed">{suggestion.reasoning}</p>
                  </div>
                </div>
              ))}
            </div>

            {suggestions.length === 0 && (
              <div className="text-center py-8 px-4">
                <Icons.Magic className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">No suggestions yet</p>
                <p className="text-gray-600 text-xs mt-1">Try adjusting your brand settings</p>
              </div>
            )}
          </div>
        ) : activeView === 'customize' && selectedSuggestion ? (
          <div className="space-y-4">
            {/* Back to suggestions */}
            <button
              onClick={() => setActiveView('suggestions')}
              className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"
            >
              <Icons.ArrowLeft className="w-4 h-4" />
              Back to suggestions
            </button>

            {/* Template Name */}
            <div className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-xl p-4 border border-white/10">
              <h4 className="text-white font-bold text-lg">{selectedSuggestion.templateName}</h4>
              <p className="text-gray-400 text-sm mt-1">{selectedSuggestion.reasoning}</p>
            </div>

            {/* Variable Editor */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customize Content</h5>

              {Object.entries(editedVariables).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleVariableChange(key, e.target.value)}
                    className="w-full bg-surface-dark-3 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              ))}

              {/* Brand Colors */}
              {activeBrandKit && (
                <div className="space-y-2 pt-3 border-t border-gray-800">
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Brand Colors</label>
                  <div className="flex gap-2 flex-wrap">
                    {activeBrandKit.colors.map((color: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => handleVariableChange('brandColor', color)}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          editedVariables.brandColor === color
                            ? 'border-white scale-110'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        title={`Apply ${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Apply Button */}
            <button
              onClick={handleConfirmApply}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Icons.Check className="w-5 h-5" />
              Apply Template
            </button>
          </div>
        ) : (
          <SearchView onSelectTemplate={handleApplySuggestion} />
        )}
      </div>
    </div>
  );
};

// Search View Component
const SearchView: React.FC<{ onSelectTemplate: (s: SmartTemplateSuggestion) => void }> = ({ onSelectTemplate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      const results = smartTemplateService.searchTemplates(query);
      setSearchResults(
        results.map((t) => ({
          id: t.id,
          templateId: t.id,
          templateName: t.name,
          matchScore: 80,
          reasoning: `${t.category} template • ${t.size.width}×${t.size.height}`,
          variables: {},
          purpose: smartTemplateService.inferPurpose(t) as any,
        }))
      );
    } else {
      setSearchResults([]);
    }
  };

  const aspectRatios = [
    { id: AspectRatio.SQUARE, label: '1:1 Square', icon: '⬜' },
    { id: AspectRatio.LANDSCAPE, label: '16:9 Landscape', icon: '▭' },
    { id: AspectRatio.PORTRAIT, label: '9:16 Portrait', icon: '▯' },
  ];

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full bg-surface-dark-3 border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-accent"
        />
      </div>

      {/* Quick Filters */}
      <div className="space-y-2">
        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Filters</h5>
        <div className="grid grid-cols-3 gap-2">
          {aspectRatios.map((ratio) => (
            <button
              key={ratio.id}
              onClick={() => handleSearch(ratio.label)}
              className="bg-surface-dark-3 hover:bg-surface-dark-4 border border-gray-700 hover:border-cyan-500 rounded-lg p-3 text-center transition-all"
            >
              <div className="text-lg mb-1">{ratio.icon}</div>
              <div className="text-[9px] text-gray-400 font-medium">{ratio.label.split(' ')[0]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Search Results</h5>
          {searchResults.map((result) => (
            <button
              key={result.templateId}
              onClick={() => onSelectTemplate(result)}
              className="w-full bg-surface-dark-3 hover:bg-surface-dark-4 border border-gray-700 hover:border-cyan-500 rounded-lg p-3 text-left transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-white font-medium text-sm">{result.templateName}</div>
                <div className="text-gray-500 text-[10px] mt-0.5">{result.reasoning}</div>
              </div>
              <Icons.ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          ))}
        </div>
      )}

      {/* Popular Templates */}
      {searchQuery.length === 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Popular Templates</h5>
          {smartTemplateService
            .getAllTemplatesWithMetadata()
            .filter((t) => t.isPopular)
            .map((template) => (
              <button
                key={template.id}
                onClick={() =>
                  onSelectTemplate({
                    id: template.id,
                    templateId: template.id,
                    templateName: template.name,
                    matchScore: 90,
                    reasoning: `${template.category} template • ${template.size.width}×${template.size.height}`,
                    variables: {},
                    purpose: template.purpose as any,
                  })
                }
                className="w-full bg-surface-dark-3 hover:bg-surface-dark-4 border border-gray-700 hover:border-cyan-500 rounded-lg p-3 text-left transition-all flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg flex items-center justify-center">
                  <Icons.Layout className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">{template.name}</div>
                  <div className="text-gray-500 text-[10px]">
                    {template.size.width}×{template.size.height} • {template.category}
                  </div>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

export default function SmartTemplatesPanelWrapped(props: React.ComponentProps<typeof SmartTemplatesPanel>) {
  return (
    <PanelErrorBoundary panelName="SmartTemplates">
      <SmartTemplatesPanel {...props} />
    </PanelErrorBoundary>
  );
}
