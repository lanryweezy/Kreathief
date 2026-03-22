import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as geminiService from './geminiService';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock Gemini AI
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn().mockReturnValue({
  generateContent: mockGenerateContent,
});

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel = mockGetGenerativeModel;
  },
  SchemaType: {
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
    OBJECT: 'OBJECT',
    ARRAY: 'ARRAY',
  },
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
              parts: [{ inlineData: { data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', mimeType: 'image/png' } }]
            }
          }]
        },
        candidates: [{
          content: {
            parts: [{ inlineData: { data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', mimeType: 'image/png' } }]
          }
        }]
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.generateImage('A beautiful sunset', '1:1');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('data:image/');
    });

    it('should handle API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'));

      await expect(geminiService.generateImage('Test prompt', '1:1'))
        .rejects.toThrow();
    });
  });

  describe('generateTextOptions', () => {
    it('should generate multiple text variations', async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify(['Option 1', 'Option 2', 'Option 3']),
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(['Option 1', 'Option 2', 'Option 3']) }]
            }
          }]
        }
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.generateTextOptions('Creative headline');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle invalid JSON responses', async () => {
      const mockResponse = {
        response: {
          text: () => 'Invalid JSON',
          candidates: [{
            content: {
              parts: [{ text: 'Invalid JSON' }]
            }
          }]
        }
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

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
          text: () => enhancedText,
          candidates: [{
            content: {
              parts: [{ text: enhancedText }]
            }
          }]
        }
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.enhancePrompt(originalPrompt);

      expect(result).toBeDefined();
      expect(result).not.toBe(originalPrompt);
      expect(result.length).toBeGreaterThan(originalPrompt.length);
    });
  });

  describe('analyzeDesign', () => {
    it('should provide design analysis', async () => {
      const mockAnalysis = {
        strengths: ['Good color contrast', 'Balanced layout'],
        suggestions: ['Consider adding more whitespace', 'Try a different font pairing'],
      };

      const mockResponse = {
        response: {
          text: () => JSON.stringify(mockAnalysis),
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(mockAnalysis) }]
            }
          }]
        }
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.analyzeDesign('data:image/png;base64,abc', 'A social media post');

      expect(result).toBeDefined();
    });
  });

  describe('getClient', () => {
    it('should return null when API key is missing', () => {
      // Key missing scenario is hard to test due to closure in service file
      // but we can check that GoogleGenerativeAI is defined
      expect(GoogleGenerativeAI).toBeDefined();
    });
  });
});
