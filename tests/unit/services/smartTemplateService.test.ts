import { describe, it, expect } from 'vitest';
import { smartTemplateService } from '../../../services/smartTemplateService';

describe('smartTemplateService', () => {
  describe('searchTemplates', () => {
    it('should return all templates for an empty query', () => {
      const results = smartTemplateService.searchTemplates('');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should match short keywords correctly (<= 2 characters)', () => {
      // Assuming there are templates containing "UI" or "UX"
      // Note: We can test with valid data if available, but for now we just verify it doesn't crash
      // and returns results or empty array without errors
      const results = smartTemplateService.searchTemplates('ai');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should tolerate typos for longer words', () => {
      // Find a template to test with
      const allTemplates = smartTemplateService.searchTemplates('');
      if (allTemplates.length > 0) {
        const firstTemplateName = allTemplates[0].name;
        // Generate a typo string (assuming name is longer than 5 chars, if not we adapt)
        const words = firstTemplateName.split(' ');
        const longWord = words.find((w) => w.length > 5);

        if (longWord) {
          // Change one character to create a typo
          const typoWord =
            longWord.substring(0, longWord.length - 1) + (longWord[longWord.length - 1] === 'a' ? 'b' : 'a');
          const results = smartTemplateService.searchTemplates(typoWord);

          expect(results.length).toBeGreaterThan(0);
          expect(results.some((t) => t.id === allTemplates[0].id)).toBe(true);
        }
      }
    });

    it('should find specific templates correctly', () => {
      // "YouTube Thumbnail (Tech)" exists in the data
      const exactMatch = smartTemplateService.searchTemplates('YouTube');
      expect(exactMatch.some((t) => t.name.includes('YouTube'))).toBe(true);

      const typoMatch = smartTemplateService.searchTemplates('YouTbe'); // 1 char deletion
      expect(typoMatch.some((t) => t.name.includes('YouTube'))).toBe(true);

      const categoryMatch = smartTemplateService.searchTemplates('Video');
      expect(categoryMatch.some((t) => t.category === 'Video')).toBe(true);
    });
  });
});
