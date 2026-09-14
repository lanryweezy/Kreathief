import React, { useState } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { Button } from '../Button';
import { Icons } from '../../constants';
import { generateTemplateWithAI } from '../../services/aiTemplateService';
import { MarketplaceTemplate, templateMarketplace } from '../../services/templateMarketplace';

interface AITemplateGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate?: (template: MarketplaceTemplate) => void;
  onSuccess?: () => void;
}

const CATEGORIES = ['Social', 'Posters', 'Corporate', 'Branding', 'UI/UX', 'Print', 'Illustration'];

const INSPIRATION_PROMPTS = [
  'Cyberpunk DJ Music Festival Flyer with neon glow and geometric accents',
  'Modern Minimalist B2B SaaS Hero Section with bold typography and pill badges',
  'Luxury Artisan Coffee Brand Instagram Post in warm terracotta tones',
  'Retro Vaporwave Synthwave Sunset Poster with gradient grid',
  'E-commerce Flash Sale Promotional Banner with 50% discount badge',
];

export const AITemplateGeneratorModal: React.FC<AITemplateGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
  onSuccess,
}) => {
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('Social');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<MarketplaceTemplate | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please provide a design description or click an inspiration prompt');
      return;
    }

    setError('');
    setIsGenerating(true);
    setStatusMessage('Consulting Gemini Art Director...');

    try {
      const template = await generateTemplateWithAI({
        prompt: prompt.trim(),
        category,
      });

      setGeneratedTemplate(template);
      setStatusMessage('Template generated successfully!');
    } catch (err: any) {
      setError(err?.message || 'Failed to generate template. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedTemplate && onApplyTemplate) {
      onApplyTemplate(generatedTemplate);
      onClose();
    }
  };

  const handlePublish = async () => {
    if (!generatedTemplate) return;
    setIsPublishing(true);
    try {
      await templateMarketplace.submitTemplate({
        title: generatedTemplate.title,
        description: generatedTemplate.description,
        category: generatedTemplate.category,
        tags: generatedTemplate.tags,
        templateData: generatedTemplate.templateData,
      });
      setStatusMessage('Published to Community Marketplace!');
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to publish to marketplace.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReset = () => {
    setGeneratedTemplate(null);
    setStatusMessage('');
    setError('');
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        {/* Subtitle / Header info */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Icons.Magic className="w-5 h-5 text-purple-400" />
              Generate Templates with Gemini
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Describe your design vision and Gemini will generate a production-ready, multi-layer template structure.
            </p>
          </div>
          <div className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-[10px] font-bold text-purple-300">
            Gemini 2.5 Flash
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        {statusMessage && !error && (
          <div className="p-3 bg-brand-500/20 border border-brand-500/30 rounded-xl text-xs text-brand-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            {statusMessage}
          </div>
        )}

        {!generatedTemplate ? (
          <>
            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Design Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      category === cat
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Design Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Cyberpunk festival flyer with neon typography and geometric glow orbs..."
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-all resize-none placeholder:text-gray-600"
              />
            </div>

            {/* Quick Inspiration Chips */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Quick Inspiration
              </span>
              <div className="flex flex-wrap gap-1.5">
                {INSPIRATION_PROMPTS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(sample)}
                    className="text-[11px] text-left px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all border border-white/5"
                  >
                    ✨ {sample}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose} disabled={isGenerating}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="min-w-[140px]"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <Icons.Refresh className="w-4 h-4 animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Icons.Magic className="w-4 h-4" />
                    Generate Template
                  </span>
                )}
              </Button>
            </div>
          </>
        ) : (
          /* Generated Template Preview Card */
          <div className="space-y-6">
            <div className="p-5 bg-black/40 border border-white/10 rounded-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-white">{generatedTemplate.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">{generatedTemplate.description}</p>
                </div>
                <span className="px-2.5 py-1 bg-brand-600/20 text-brand-300 border border-brand-500/30 rounded-lg text-xs font-semibold">
                  {generatedTemplate.category}
                </span>
              </div>

              {/* Template Specs */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-white/5 rounded-xl text-center">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">Canvas Size</span>
                  <span className="text-xs font-bold text-gray-200">
                    {generatedTemplate.templateData?.width} × {generatedTemplate.templateData?.height}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">Layer Count</span>
                  <span className="text-xs font-bold text-gray-200">
                    {generatedTemplate.templateData?.artboard?.layers?.length ?? 0} Layers
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">Generated By</span>
                  <span className="text-xs font-bold text-purple-400">Gemini AI</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {generatedTemplate.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 rounded text-gray-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5"
              >
                <Icons.Refresh className="w-3.5 h-3.5" />
                Generate Another
              </button>

              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={handlePublish} disabled={isPublishing}>
                  {isPublishing ? 'Publishing...' : 'Publish to Marketplace'}
                </Button>
                <Button onClick={handleApply} className="bg-brand-600 hover:bg-brand-500">
                  Apply to Canvas →
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};

export default AITemplateGeneratorModal;
