import { describe, it, expect } from 'vitest';
import { getLevenshteinDistance, fuzzyMatch } from '../../../utils/search';

describe('searchUtils', () => {
  describe('getLevenshteinDistance', () => {
    it('returns the distance between two strings', () => {
      expect(getLevenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(getLevenshteinDistance('', 'a')).toBe(1);
      expect(getLevenshteinDistance('a', '')).toBe(1);
      expect(getLevenshteinDistance('', '')).toBe(0);
      expect(getLevenshteinDistance('abc', 'abc')).toBe(0);
    });
  });

  describe('fuzzyMatch', () => {
    it('returns true when query is empty', () => {
      expect(fuzzyMatch('', 'hello world')).toBe(true);
      expect(fuzzyMatch('   ', 'hello world')).toBe(true);
    });

    it('returns true when query is an exact substring', () => {
      expect(fuzzyMatch('lo wor', 'hello world')).toBe(true);
    });

    it('matches words with length <= 2 with exactly distance 0', () => {
      // Distance 0: query length 2 ('ab'), must match exactly 'ab'
      expect(fuzzyMatch('ab', 'ab cd')).toBe(true);
      // Distance 1: query length 2 ('ab'), target 'ac' (distance 1) should fail
      expect(fuzzyMatch('ab', 'ac cd')).toBe(false);
      // Distance 1: query length 2 ('ab'), target 'a' (distance 1) should fail
      expect(fuzzyMatch('ab', 'a cd')).toBe(false);
    });

    it('matches words with length <= 5 with up to distance 1', () => {
      // Distance 1: query length 5 ('apple') matching target 'aple' (distance 1)
      expect(fuzzyMatch('apple', 'aple tree')).toBe(true);
      // Distance 2: query length 5 ('apple') matching target 'ap' (distance 3) should fail
      expect(fuzzyMatch('apple', 'ap tree')).toBe(false);
      // Distance 2: query length 4 ('pear') matching target 'pe' (distance 2) should fail
      expect(fuzzyMatch('pear', 'pe tree')).toBe(false);
      // Distance 1: query length 4 ('pear') matching target 'pearr' (distance 1)
      expect(fuzzyMatch('pear', 'pearr tree')).toBe(true);
    });

    it('matches words with length > 5 with up to distance 2', () => {
      // Distance 1: query length 6 ('banana') matching target 'banan' (distance 1)
      expect(fuzzyMatch('banana', 'banan tree')).toBe(true);
      // Distance 2: query length 6 ('banana') matching target 'banna' (distance 2)
      expect(fuzzyMatch('banana', 'banna tree')).toBe(true);
      // Distance 3: query length 6 ('banana') matching target 'ban' (distance 3) should fail
      expect(fuzzyMatch('banana', 'ban tree')).toBe(false);
    });

    it('matches multiple words in query', () => {
      // Query "red aple" (distance 0 for 'red', distance 1 for 'aple' vs 'apple')
      expect(fuzzyMatch('red aple', 'big red apple')).toBe(true);
      // One word matches, one fails
      expect(fuzzyMatch('red ban', 'big red apple')).toBe(false);
    });
  });
});
