import React, { useState } from 'react';
import * as geminiService from '../services/geminiService';
import { Icons } from '../constants';

type ContentType = 'headline' | 'body' | 'cta' | 'caption';
type Tone = 'professional' | 'casual' | 'playful' | 'urgent';

interface GeneratedContent {
  id: string;
  type: ContentType;
  tone: Tone;
  content: string;
  timestamp: number;
}

interface SmartContentGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContent?: (content: string) => void;
  designContext?: string;
}

export const SmartContentGenerator: React.FC<SmartContentGeneratorProps> = ({
  isOpen,
  onClose,
  onSelectContent,
  designContext = 'social media post',
}) => {
  const [contentType, setContentType] = useState<ContentType>('headline');
  const [tone, setTone] = useState<Tone>('professional');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const contentTypes: { value: ContentType; label: string; description: string }[] = [
    { value: 'headline', label: 'Headline', description: 'Catchy main title' },
    { value: 'body', label: 'Body Text', description: 'Main message' },
    { value: 'cta', label: 'Call-to-Action', description: 'Action button text' },
    { value: 'caption', label: 'Caption', description: 'Social media caption' },
  ];

  const tones: { value: Tone; label: string }[] = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'playful', label: 'Playful' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const generateContent = async () => {
    setIsLoading(true);
    try {
      const prompt = `Generate 3 unique ${contentType} options for a ${designContext} with a ${tone} tone. 
      Make them concise, impactful, and suitable for design use.
      Return as a simple list with one option per line.`;

      const response = await geminiService.generateText(designContext, prompt);

      const options = response
        .split('\n')
        .filter((line) => line.trim())
        .slice(0, 3)
        .map((content, index) => ({
          id: `content_${Date.now()}_${index}`,
          type: contentType,
          tone,
          content: content.replace(/^\d+\.\s*/, '').trim(),
          timestamp: Date.now(),
        }));

      setGeneratedContent(options);
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectContent = (content: string) => {
    onSelectContent?.(content);
    setGeneratedContent([]);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Icons.Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">Smart Content Generator</h2>
              <p className="text-xs text-gray-400">AI-powered text for your design</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Content Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">Content Type</label>
            <div className="grid grid-cols-2 gap-2">
              {contentTypes.map(({ value, label, description }) => (
                <button
                  key={value}
                  onClick={() => setContentType(value)}
                  className={`p-3 rounded-lg border-2 transition-colors text-left ${
                    contentType === value
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium text-white text-sm">{label}</div>
                  <div className="text-xs text-gray-400">{description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tone Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">Tone</label>
            <div className="grid grid-cols-4 gap-2">
              {tones.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTone(value)}
                  className={`p-2 rounded-lg border-2 transition-colors text-sm font-medium ${
                    tone === value
                      ? 'border-green-500 bg-green-500/10 text-green-300'
                      : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Content */}
          {generatedContent.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">Generated Options</label>
              <div className="space-y-2">
                {generatedContent.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectContent(item.content)}
                    className="w-full text-left p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-green-500/50 hover:bg-gray-800 transition-colors group"
                  >
                    <p className="text-white text-sm group-hover:text-green-300 transition-colors">{item.content}</p>
                    <p className="text-xs text-gray-500 mt-1">Click to use</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateContent}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Icons.Sparkles className="w-4 h-4" />
                Generate Content
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
