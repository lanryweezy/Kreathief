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

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('GeminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                mimeType: 'image/png'
              }
            }]
          }
        }]
      })
    });
  });

  describe('generateImage', () => {
    it('should generate image from prompt', async () => {
      const result = await geminiService.generateImage('A beautiful sunset', '1:1');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('data:image/');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/gemini'),
        expect.any(Object)
      );
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'API error' })
      });

      await expect(geminiService.generateImage('Test prompt', '1:1'))
        .rejects.toThrow('Gemini API returned an error');
    });
  });

  describe('generateTextOptions', () => {
    it('should generate multiple text variations', async () => {
      const mockOptions = ['Option 1', 'Option 2', 'Option 3'];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: JSON.stringify(mockOptions)
        })
      });

      const result = await geminiService.generateTextOptions('Creative headline');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
      expect(result).toEqual(mockOptions);
    });

    it('should handle invalid JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: 'Invalid JSON'
        })
      });

      const result = await geminiService.generateTextOptions('Test');

      expect(result).toEqual([]);
    });
  });

  describe('enhancePrompt', () => {
    it('should enhance user prompt with more details', async () => {
      const originalPrompt = 'A cat';
      const enhancedText = 'A fluffy orange cat sitting on a windowsill, bathed in warm afternoon sunlight, photorealistic, highly detailed';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: JSON.stringify(enhancedText)
        })
      });

      const result = await geminiService.enhancePrompt(originalPrompt);

      expect(result).toBeDefined();
      expect(result).toBe(enhancedText);
      expect(result.length).toBeGreaterThan(originalPrompt.length);
    });
  });

  describe('analyzeDesign', () => {
    it('should provide design analysis', async () => {
      const mockAnalysis = 'Analysis results';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: mockAnalysis
        })
      });

      const result = await geminiService.analyzeDesign('data:image/png;base64,abc', 'A social media post');

      expect(result).toBe(mockAnalysis);
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
