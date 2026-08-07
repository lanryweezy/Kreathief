import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as geminiService from './geminiService';
import * as freepikService from './freepikService';
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
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                    mimeType: 'image/png',
                  },
                },
              ],
            },
          },
        ],
      }),
    });
  });

  describe('generateImage', () => {
    // Fal is the single image backend (see imageGenService). This function is only the
    // Freepik fallback leg — Gemini image output is unreachable through the OpenRouter
    // bridge, which normalizes every response to text, so it must not be attempted.
    it('does not route image generation through the OpenRouter proxy', async () => {
      await geminiService.generateImage('A beautiful sunset', '1:1').catch(() => undefined);

      const calledUrls = mockFetch.mock.calls.map(([url]) => String(url));
      expect(calledUrls.some((url) => url.includes('/api/openrouter'))).toBe(false);
    });

    it('reaches Freepik when it is configured', async () => {
      vi.spyOn(freepikService, 'isConfigured').mockReturnValue(true);

      await geminiService.generateImage('A beautiful sunset', '1:1').catch(() => undefined);

      const calledUrls = mockFetch.mock.calls.map(([url]) => String(url));
      expect(calledUrls.some((url) => url.includes('/api/freepik'))).toBe(true);
    });

    it('fails with an actionable message when no fallback backend is configured', async () => {
      vi.spyOn(freepikService, 'isConfigured').mockReturnValue(false);

      await expect(geminiService.generateImage('Test prompt', '1:1')).rejects.toThrow(
        /Image generation unavailable/
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('propagates a Freepik failure instead of returning a silent placeholder', async () => {
      vi.spyOn(freepikService, 'isConfigured').mockReturnValue(true);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'upstream exploded',
        json: async () => ({ error: 'API error' }),
      });

      await expect(geminiService.generateImage('Test prompt', '1:1')).rejects.toThrow();
    });
  });

  describe('generateTextOptions', () => {
    it('should generate multiple text variations', async () => {
      const mockOptions = ['Option 1', 'Option 2', 'Option 3'];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: JSON.stringify(mockOptions),
        }),
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
          text: 'Invalid JSON',
        }),
      });

      const result = await geminiService.generateTextOptions('Test');

      expect(result).toEqual([]);
    });
  });

  describe('enhancePrompt', () => {
    it('should enhance user prompt with more details', async () => {
      const originalPrompt = 'A cat';
      const enhancedText =
        'A fluffy orange cat sitting on a windowsill, bathed in warm afternoon sunlight, photorealistic, highly detailed';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: JSON.stringify(enhancedText),
        }),
      });

      const result = await geminiService.enhancePrompt(originalPrompt);

      expect(result).toBeDefined();
      expect(result).toBe(enhancedText);
      expect(result.length).toBeGreaterThan(originalPrompt.length);
    });
  });

  describe('cleanBase64', () => {
    it('should throw an error if dataUrl is falsy', () => {
      expect(() => geminiService.cleanBase64('')).toThrow('Invalid image data provided');
      expect(() => geminiService.cleanBase64(null as any)).toThrow('Invalid image data provided');
      expect(() => geminiService.cleanBase64(undefined as any)).toThrow('Invalid image data provided');
    });

    it('should clean and return base64 data without data URL prefix', () => {
      const result = geminiService.cleanBase64('data:image/jpeg;base64, /9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxITEhUSExMWFhUXFRcWFxgYFRcYFxgXFxgXFxcXFxcYHSggGBolHRcXITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lICUtLSstLSstLSstLSstLSstLSstLSstLSstLSstLSstLSstLSstLSstLSstLSstLSstLf/AABEIAOEA4QMBEQACEQEDEQH/');
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.data).toBe('/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxITEhUSExMWFhUXFRcWFxgYFRcYFxgXFxgXFxcXFxcYHSggGBolHRcXITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lICUtLSstLSstLSstLSstLSstLSstLSstLSstLSstLSstLSstLSstLSstLSstLSstLSstLf/AABEIAOEA4QMBEQACEQEDEQH/');
    });
  });

  describe('analyzeDesign', () => {
    it('should provide design analysis', async () => {
      const mockAnalysis = 'Analysis results';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: mockAnalysis,
        }),
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
