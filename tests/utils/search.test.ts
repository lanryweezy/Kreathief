import { describe, it, expect } from 'vitest';
import { getLevenshteinDistance, fuzzyMatch } from '../../utils/search';

describe('search utilities', () => {
  describe('getLevenshteinDistance', () => {
    it('returns the length of the other string when one is empty', () => {
      expect(getLevenshteinDistance('', 'hello')).toBe(5);
      expect(getLevenshteinDistance('world', '')).toBe(5);
      expect(getLevenshteinDistance('', '')).toBe(0);
    });

    it('returns 0 for identical strings', () => {
      expect(getLevenshteinDistance('kitten', 'kitten')).toBe(0);
    });

    it('calculates the correct distance for single character changes', () => {
      expect(getLevenshteinDistance('kitten', 'sitten')).toBe(1); // substitution
      expect(getLevenshteinDistance('kitten', 'kittens')).toBe(1); // insertion
      expect(getLevenshteinDistance('kitten', 'kitte')).toBe(1); // deletion
    });

    it('calculates the correct distance for multiple character changes', () => {
      expect(getLevenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(getLevenshteinDistance('flitten', 'sitting')).toBe(4);
    });

    it('is case-sensitive', () => {
      expect(getLevenshteinDistance('hello', 'Hello')).toBe(1);
    });
  });

  describe('fuzzyMatch', () => {
    it('returns true when query is empty', () => {
      expect(fuzzyMatch('', 'any target')).toBe(true);
      expect(fuzzyMatch('   ', 'any target')).toBe(true);
    });

    it('returns true when query is an exact substring (case-insensitive)', () => {
      expect(fuzzyMatch('ello', 'Hello World')).toBe(true);
      expect(fuzzyMatch('world', 'Hello World')).toBe(true);
    });

    it('returns true for single-word queries with typo tolerance', () => {
      expect(fuzzyMatch('hxllo', 'Hello World')).toBe(true);
      expect(fuzzyMatch('helo', 'Hello World')).toBe(true);

      expect(fuzzyMatch('kitXen', 'Kitten')).toBe(true);
      expect(fuzzyMatch('kiXten', 'Kitten')).toBe(true);
      expect(fuzzyMatch('kiXXen', 'Kitten')).toBe(true);
    });

    it('returns false when typo exceeds max distance threshold', () => {
      expect(fuzzyMatch('ho', 'hi there')).toBe(false);
      expect(fuzzyMatch('hxlxx', 'Hello World')).toBe(false);
      expect(fuzzyMatch('kiXXXn', 'Kitten')).toBe(false);
    });

    it('handles multi-word queries requiring all query words to match', () => {
      expect(fuzzyMatch('quick fox', 'The quick brown fox')).toBe(true);

      expect(fuzzyMatch('qick', 'The quick brown fox')).toBe(true);
      expect(fuzzyMatch('foxx', 'The quick brown fox')).toBe(true);
      expect(fuzzyMatch('qick foxx', 'The quick brown fox')).toBe(true);

      expect(fuzzyMatch('quick dog', 'The quick brown fox')).toBe(false);
    });

    it('splits words correctly ignoring punctuation in target', () => {
      expect(fuzzyMatch('apple', 'banana, apple; orange!')).toBe(true);
      expect(fuzzyMatch('appl', 'banana, apple; orange!')).toBe(true);
    });
  });
});
