import { describe, it, expect } from 'vitest';
import { fuzzyMatch, getLevenshteinDistance } from '../../../utils/search';

describe('search utils', () => {
  describe('getLevenshteinDistance', () => {
    it('calculates the exact edit distance between two strings', () => {
      expect(getLevenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(getLevenshteinDistance('hello', 'hello')).toBe(0);
      expect(getLevenshteinDistance('', 'abc')).toBe(3);
      expect(getLevenshteinDistance('abc', '')).toBe(3);
    });
  });

  describe('fuzzyMatch', () => {
    it('matches empty or whitespace-only queries to anything', () => {
      expect(fuzzyMatch('', 'target')).toBe(true);
      expect(fuzzyMatch('   ', 'target')).toBe(true);
    });

    it('matches exact substrings gracefully', () => {
      expect(fuzzyMatch('hello', 'hello world')).toBe(true);
      expect(fuzzyMatch('WORLD', 'hello world')).toBe(true);
    });

    it('enforces distance 0 for query words of length <= 2', () => {
      // Max permissible distance: 0 for query length <= 2
      // distance 0: exact match
      expect(fuzzyMatch('hi', 'hi there')).toBe(true);
      // distance 1: one character difference ('i' to 'o')
      expect(fuzzyMatch('ho', 'hi there')).toBe(false);
    });

    it('allows up to distance 1 for query words of length <= 5', () => {
      // Max permissible distance: 1 for query length <= 5
      // distance 1: one character difference ('e' to 'a')
      expect(fuzzyMatch('hello', 'hallo there')).toBe(true);
      // distance 2: two character differences ('e' to 'a', 'o' to 'i')
      expect(fuzzyMatch('hello', 'halli there')).toBe(false);
    });

    it('allows up to distance 2 for query words of length > 5', () => {
      // Max permissible distance: 2 for query length > 5
      // distance 2: two character differences ('e' to 'a', 'e' to 'i')
      expect(fuzzyMatch('elephant', 'aliphant in the room')).toBe(true);
      // distance 3: three character differences ('e' to 'a', 'e' to 'i', 't' to 'd')
      expect(fuzzyMatch('elephant', 'aliphand in the room')).toBe(false);
    });

    it('requires all words in the query to find a match in the target', () => {
      // "hi" requires distance 0, "hello" requires distance 1 (e->a)
      expect(fuzzyMatch('hi hallo', 'hi hello world')).toBe(true);
      // "tiger" has length 5, max distance 1. "world" has distance > 1
      expect(fuzzyMatch('hi tiger', 'hi hello world')).toBe(false);
    });
  });
});
