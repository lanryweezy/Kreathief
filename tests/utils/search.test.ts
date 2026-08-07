import { describe, it, expect } from 'vitest';
import { getLevenshteinDistance, fuzzyMatch } from '../../utils/search';

describe('search utils', () => {
  describe('getLevenshteinDistance', () => {
    it('returns 0 for identical strings', () => {
      expect(getLevenshteinDistance('', '')).toBe(0);
      expect(getLevenshteinDistance('hello', 'hello')).toBe(0);
    });

    it('returns the length of the other string if one is empty', () => {
      expect(getLevenshteinDistance('', 'abc')).toBe(3);
      expect(getLevenshteinDistance('abcd', '')).toBe(4);
    });

    it('calculates correct distance for substitutions', () => {
      expect(getLevenshteinDistance('kitten', 'sitten')).toBe(1);
      expect(getLevenshteinDistance('flaw', 'lawn')).toBe(2);
    });

    it('calculates correct distance for insertions/deletions', () => {
      expect(getLevenshteinDistance('book', 'back')).toBe(2);
      expect(getLevenshteinDistance('elephant', 'elefant')).toBe(2);
    });

    it('handles completely different strings', () => {
      expect(getLevenshteinDistance('abc', 'def')).toBe(3);
    });
  });

  describe('fuzzyMatch', () => {
    it('returns true for empty query', () => {
      expect(fuzzyMatch('', 'any target string')).toBe(true);
      expect(fuzzyMatch('   ', 'any target string')).toBe(true);
    });

    it('returns true for exact substring match', () => {
      expect(fuzzyMatch('hello', 'say hello to the world')).toBe(true);
      expect(fuzzyMatch('world', 'hello world')).toBe(true);
    });

    it('is case-insensitive for exact matches', () => {
      expect(fuzzyMatch('HeLlO', 'hello world')).toBe(true);
      expect(fuzzyMatch('WORLD', 'hello world')).toBe(true);
    });

    it('handles exact substring match with spaces', () => {
      expect(fuzzyMatch('hello w', 'hello world')).toBe(true);
    });

    it('fuzzy matches words with length <= 2 with 0 errors allowed', () => {
      // "hi" must exactly match a word if not an exact substring.
      // But if it's an exact substring, it returns early.
      // Let's test a word that is NOT an exact substring but we want to see if it fuzzy matches.
      // Actually, if it's not an exact substring, and it's length <=2, maxDist is 0.
      // So it MUST match exactly as a word.
      expect(fuzzyMatch('ha', 'ha-ha')).toBe(true);
      // "ha" in "hello world" -> false
      expect(fuzzyMatch('he', 'hallo world')).toBe(false);
    });

    it('fuzzy matches words with length 3-5 with 1 error allowed', () => {
      // query: "helo", target: "hello world" (target doesn't include "helo")
      expect(fuzzyMatch('helo', 'hello world')).toBe(true);

      // "wrold" has length 5. maxDist is 1.
      // Distance between "wrold" and "world" is 2 (substitute o for r, and r for o).
      // Since 2 > 1, this should actually be false!
      expect(fuzzyMatch('wrold', 'hello world')).toBe(false);

      // Distance 1: "worl" and "world" (1 insertion), "wqrld" and "world" (1 substitution).
      expect(fuzzyMatch('wqrld', 'hello world')).toBe(true);

      // Too many errors for length 5 (max 1 error)
      expect(fuzzyMatch('wlrod', 'hello world')).toBe(false);
    });

    it('fuzzy matches words with length > 5 with 2 errors allowed', () => {
      // query: "elefant", target: "the elephant is big"
      expect(fuzzyMatch('elefant', 'the elephant is big')).toBe(true);

      // query: "aligator", target: "the alligator is big"
      expect(fuzzyMatch('aligator', 'the alligator is big')).toBe(true);

      // Too many errors for length > 5
      expect(fuzzyMatch('aligaterr', 'the alligator is big')).toBe(false);
    });

    it('matches multi-word queries', () => {
      // "say helo" -> "say" matches exactly, "helo" fuzzy matches "hello"
      expect(fuzzyMatch('say helo', 'say hello to him')).toBe(true);

      // "helo wrold" -> "helo" matches "hello" (dist 1), "wrold" matches "world" (dist 2)
      // wait, "wrold" and "world": length 5. maxDist=1.
      // distance("wrold", "world") = 2 (substitute o with r, r with o).
      // So distance is 2. Wait, maxDist for length 5 is 1! So "wrold" won't match "world".
      expect(fuzzyMatch('helo wrold', 'hello world')).toBe(false);

      // let's do distance 1: "wordl" and "world". distance is 2 (substitute d with l, l with d).
      // distance 1: "worl" and "world" (insert d), "wqrld" and "world" (substitute o with q).
      expect(fuzzyMatch('helo wqrld', 'hello world')).toBe(true);
    });

    it('returns false for completely non-matching queries', () => {
      expect(fuzzyMatch('cat', 'dog')).toBe(false);
      expect(fuzzyMatch('elephant', 'tiger')).toBe(false);
    });

    it('ignores punctuation when splitting target words', () => {
      // query: "helo", target "hello,world!"
      expect(fuzzyMatch('helo', 'hello,world!')).toBe(true);
    });
  });
});
