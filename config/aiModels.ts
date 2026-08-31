export interface AIModel {
  id: string;
  name: string;
  provider: string;
  category: 'fast' | 'quality' | 'creative';
  maxTokens: number;
  supportsImages: boolean;
  icon: string;
}

export const AI_MODELS: AIModel[] = [
  // Fast models — quick generation, lower cost
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    category: 'fast',
    maxTokens: 8192,
    supportsImages: true,
    icon: '⚡',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    category: 'fast',
    maxTokens: 16384,
    supportsImages: true,
    icon: '⚡',
  },
  {
    id: 'meta-llama/llama-4-scout',
    name: 'Llama 4 Scout',
    provider: 'Meta',
    category: 'fast',
    maxTokens: 16384,
    supportsImages: true,
    icon: '⚡',
  },

  // Quality models — balanced speed and quality
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    category: 'quality',
    maxTokens: 16384,
    supportsImages: true,
    icon: '🎯',
  },
  {
    id: 'google/gemini-2.5-flash-preview',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    category: 'quality',
    maxTokens: 65536,
    supportsImages: true,
    icon: '🎯',
  },
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    category: 'quality',
    maxTokens: 16384,
    supportsImages: true,
    icon: '🎯',
  },

  // Creative models — best for design tasks
  {
    id: 'openai/o3',
    name: 'o3',
    provider: 'OpenAI',
    category: 'creative',
    maxTokens: 100000,
    supportsImages: true,
    icon: '✨',
  },
  {
    id: 'google/gemini-2.5-pro-preview',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    category: 'creative',
    maxTokens: 65536,
    supportsImages: true,
    icon: '✨',
  },
  {
    id: 'anthropic/claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    category: 'creative',
    maxTokens: 32000,
    supportsImages: true,
    icon: '✨',
  },
];

export const DEFAULT_MODEL = 'google/gemini-2.5-flash';

export const MODEL_CATEGORIES = {
  fast: { label: 'Fast', description: 'Quick generation' },
  quality: { label: 'Quality', description: 'Balanced' },
  creative: { label: 'Creative', description: 'Best for design' },
} as const;
