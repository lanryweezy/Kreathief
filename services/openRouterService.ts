import { log } from '../utils/log';
import { retryWithBackoff, safeParseJSON } from '../utils/errorHandling';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GenerateImageParams {
  prompt: string;
  model: string;
  aspectRatio?: string;
}

export interface GenerateTextParams {
  prompt: string;
  model: string;
  systemPrompt?: string;
  maxTokens?: number;
}

/**
 * Call OpenRouter API for text generation
 */
export async function generateText(params: GenerateTextParams): Promise<string> {
  const { prompt, model, systemPrompt, maxTokens = 4096 } = params;

  return retryWithBackoff(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const messages: OpenRouterMessage[] = [];
        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await fetch('/api/openrouter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: maxTokens,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
        }

        const data: OpenRouterResponse = await response.json();
        return data.choices[0]?.message?.content || '';
      } catch (e: any) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') {
          throw new Error('OpenRouter API request timed out');
        }
        throw e;
      }
    },
    3,
    1000
  );
}

/**
 * Generate an image using AI through OpenRouter
 * Uses the model to generate a detailed prompt, then generates the image
 */
export async function generateImage(params: GenerateImageParams): Promise<string> {
  const { prompt, model, aspectRatio = '1:1' } = params;

  // Step 1: Use the selected model to enhance the prompt
  const enhancedPrompt = await generateText({
    prompt: `Generate a detailed, professional image generation prompt for: "${prompt}". Return ONLY the enhanced prompt text, nothing else. Make it specific, visual, and suitable for a professional design tool. Include style, lighting, composition details.`,
    model,
    systemPrompt: 'You are an expert prompt engineer for AI image generation. Return only the enhanced prompt, no explanations.',
    maxTokens: 200,
  });

  // Step 2: Generate the image via the backend Gemini endpoint (with Freepik fallback)
  const geminiService = await import('./geminiService');
  return geminiService.generateImage(enhancedPrompt.trim(), aspectRatio, 'standard');
}

/**
 * Generate structured JSON response from AI
 */
export async function generateJSON<T>(
  params: GenerateTextParams & { schema?: any }
): Promise<T> {
  const { prompt, model, systemPrompt, maxTokens = 4096, schema } = params;

  const schemaContext = schema ? `\n\nEnsure the JSON matches this schema:\n${JSON.stringify(schema, null, 2)}` : '';

  const content = await generateText({
    prompt: `${prompt}\n\nRespond with valid JSON only. No markdown, no explanations.${schemaContext}`,
    model,
    systemPrompt: systemPrompt || 'You are a JSON response generator. Return only valid JSON.',
    maxTokens,
  });

  // Strip markdown code fences if present
  const cleaned = content.replace(/```json?\s*\n?/g, '').replace(/```\s*$/g, '').trim();

  const parsed = safeParseJSON<T | null>(cleaned, null);
  if (parsed === null) {
    log.error('[OpenRouter] Failed to parse JSON response', { content });
    throw new Error('Invalid JSON response from AI model');
  }
  return parsed;
}

function getApiKey(): string {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY || '';
  if (!key) {
    log.warn('[OpenRouter] No API key configured. Set VITE_OPENROUTER_API_KEY in .env');
  }
  return key;
}

export function isConfigured(): boolean {
  return !!import.meta.env.VITE_OPENROUTER_API_KEY;
}
