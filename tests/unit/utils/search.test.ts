import { describe, it, expect } from 'vitest';
import { getLevenshteinDistance, fuzzyMatch } from '../../../utils/search';

describe('search utils', () => {
  describe('getLevenshteinDistance', () => {
    it('returns 0 for identical strings', () => {
      expect(getLevenshteinDistance('hello', 'hello')).toBe(0);
      expect(getLevenshteinDistance('', '')).toBe(0);
    });

    it('returns the length of the other string when one is empty', () => {
      expect(getLevenshteinDistance('', 'hello')).toBe(5);
      expect(getLevenshteinDistance('world', '')).toBe(5);
    });

    it('calculates correct distance for single character changes (substitution)', () => {
      expect(getLevenshteinDistance('hello', 'hallo')).toBe(1);
      expect(getLevenshteinDistance('test', 'text')).toBe(1);
    });

    it('calculates correct distance for character additions (insertion)', () => {
      expect(getLevenshteinDistance('hello', 'hellos')).toBe(1);
      expect(getLevenshteinDistance('cat', 'cart')).toBe(1);
    });

    it('calculates correct distance for character deletions', () => {
      expect(getLevenshteinDistance('hello', 'hell')).toBe(1);
      expect(getLevenshteinDistance('start', 'star')).toBe(1);
    });

    it('calculates correct distance for completely different strings', () => {
      expect(getLevenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(getLevenshteinDistance('flaw', 'lawn')).toBe(2);
    });
  });

  describe('fuzzyMatch', () => {
    it('returns true for exact matches', () => {
      expect(fuzzyMatch('hello', 'hello world')).toBe(true);
      expect(fuzzyMatch('WORLD', 'hello world')).toBe(true);
    });

    it('returns true when query is empty', () => {
      expect(fuzzyMatch('', 'hello world')).toBe(true);
      expect(fuzzyMatch('   ', 'hello world')).toBe(true);
    });

    it('returns true for exact word matches regardless of case', () => {
      expect(fuzzyMatch('Hello', 'hello world')).toBe(true);
      expect(fuzzyMatch('WORLD', 'hello world')).toBe(true);
    });

    it('handles query length <= 2 with 0 distance tolerance', () => {
      // Query "hi" (length 2): requires exactly 0 distance
      expect(fuzzyMatch('hi', 'hi there')).toBe(true);
      expect(fuzzyMatch('hi', 'ho there')).toBe(false); // dist 1 (substitution) not allowed
      expect(fuzzyMatch('it', 'at home')).toBe(false);
    });

    it('handles query length <= 5 with 1 distance tolerance', () => {
      // Query "test" (length 4): allows 1 typo
      expect(fuzzyMatch('test', 'tets cases')).toBe(false); // dist 2 (swap) not allowed
      expect(fuzzyMatch('test', 'text cases')).toBe(true); // dist 1 (substitution) allowed
      expect(fuzzyMatch('hello', 'hallo world')).toBe(true); // dist 1 (substitution) allowed
      expect(fuzzyMatch('hello', 'helo world')).toBe(true); // dist 1 (deletion) allowed
      expect(fuzzyMatch('hello', 'hellos world')).toBe(true); // dist 1 (insertion) allowed
      expect(fuzzyMatch('hello', 'haloo world')).toBe(false); // dist 2 (substitution x2) not allowed
    });

    it('handles query length > 5 with 2 distance tolerance', () => {
      // Query "testing" (length 7): allows 2 typos
      expect(fuzzyMatch('testing', 'testign code')).toBe(true); // dist 2 (swap) allowed
      expect(fuzzyMatch('testing', 'tetsing code')).toBe(true); // dist 2 (swap) allowed
      expect(fuzzyMatch('testing', 'texting code')).toBe(true); // dist 1 (substitution) allowed
      expect(fuzzyMatch('testing', 'tsting code')).toBe(true); // dist 1 (deletion) allowed
      expect(fuzzyMatch('testing', 'tstng code')).toBe(true); // dist 2 (deletion x2) allowed
      expect(fuzzyMatch('testing', 'tatng code')).toBe(false); // dist 3 (sub + del x2) not allowed
    });

    it('returns true if direct substring inclusion works before word splitting', () => {
      // Exact substring match avoids the word-by-word fuzzy logic
      expect(fuzzyMatch('lo wor', 'hello world')).toBe(true);
    });

    it('matches multiple query words against target words', () => {
      // "worid" (length 5) allows dist 1. "worid" vs "world" is dist 1 (substitution).
      expect(fuzzyMatch('hallo worid', 'hello world')).toBe(true);

      // "word" (length 4) allows dist 1. "word" vs "work" is dist 1 (substitution).
      expect(fuzzyMatch('hallo work', 'hello word')).toBe(true);
    });

    it('fails if one query word does not match any target word', () => {
      // "universe" is not in "hello world" and exceeds distance threshold for any target word
      expect(fuzzyMatch('hello universe', 'hello world')).toBe(false);
    });
  });
});
