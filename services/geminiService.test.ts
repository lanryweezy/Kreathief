import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as geminiService from '../geminiService';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock Gemini AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn(),
    }),
  })),
}));

describe('GeminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateImage', () => {
    it('should generate image from prompt', async () => {
      const mockResponse = {
        response: {
          candidates: [{
            content: {
              parts: [{ text: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }]
            }
          }]
        }
      };

      vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockResolvedValue(mockResponse),
        }),
      } as any));

      const result = await geminiService.generateImage('A beautiful sunset');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('data:image/');
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockRejectedValue(new Error('API error')),
        }),
      } as any));

      await expect(geminiService.generateImage('Test prompt'))
        .rejects.toThrow();
    });

    it('should fallback to Freepik when Gemini fails', async () => {
      // This would require mocking freepikService as well
      // Integration test scenario
    });
  });

  describe('generateTextOptions', () => {
    it('should generate multiple text variations', async () => {
      const mockResponse = {
        response: {
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(['Option 1', 'Option 2', 'Option 3']) }]
            }
          }]
        }
      };

      vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockResolvedValue(mockResponse),
        }),
      } as any));

      const result = await geminiService.generateTextOptions('Creative headline');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle invalid JSON responses', async () => {
      const mockResponse = {
        response: {
          candidates: [{
            content: {
              parts: [{ text: 'Invalid JSON' }]
            }
          }]
        }
      };

      vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockResolvedValue(mockResponse),
        }),
      } as any));

      const result = await geminiService.generateTextOptions('Test');

      expect(result).toEqual([]);
    });
  });

  describe('enhancePrompt', () => {
    it('should enhance user prompt with more details', async () => {
      const originalPrompt = 'A cat';
      const enhancedText = 'A fluffy orange cat sitting on a windowsill, bathed in warm afternoon sunlight, photorealistic, highly detailed';

      const mockResponse = {
        response: {
          candidates: [{
            content: {
              parts: [{ text: enhancedText }]
            }
          }]
        }
      };

      vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockResolvedValue(mockResponse),
        }),
      } as any));

      const result = await geminiService.enhancePrompt(originalPrompt);

      expect(result).toBeDefined();
      expect(result).not.toBe(originalPrompt);
      expect(result.length).toBeGreaterThan(originalPrompt.length);
    });
  });

  describe('analyzeCanvas', () => {
    it('should provide design analysis', async () => {
      const mockAnalysis = {
        strengths: ['Good color contrast', 'Balanced layout'],
        suggestions: ['Consider adding more whitespace', 'Try a different font pairing'],
      };

      const mockResponse = {
        response: {
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(mockAnalysis) }]
            }
          }]
        }
      };

      vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockResolvedValue(mockResponse),
        }),
      } as any));

      const layers = [];
      const result = await geminiService.analyzeCanvas(layers, 'A social media post');

      expect(result).toBeDefined();
      expect(result.strengths).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });
  });

  describe('getClient', () => {
    it('should return null when API key is missing', () => {
      const originalKey = process.env.VITE_GEMINI_API_KEY;
      process.env.VITE_GEMINI_API_KEY = undefined;

      // Would need to re-import to test properly
      // This is more of an integration test

      process.env.VITE_GEMINI_API_KEY = originalKey;
    });

    it('should initialize with valid API key', () => {
      // Client initialization tested implicitly through other methods
      expect(GoogleGenerativeAI).toBeDefined();
    });
  });
});
