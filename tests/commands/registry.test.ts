import { describe, it, expect } from 'vitest';
import { searchCommands, getAllCommands } from '../../commands/registry';

describe('searchCommands', () => {
  it('returns all commands when query is empty', () => {
    const all = getAllCommands();
    expect(searchCommands('').length).toBe(all.length);
  });

  it('finds commands by exact match', () => {
    const results = searchCommands('Generate Image');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('generate');
  });

  it('finds commands by typo/fuzzy match in label', () => {
    // "Geneate" instead of "Generate"
    const results = searchCommands('Geneate Imge');
    expect(results.length).toBeGreaterThan(0);
    expect(results.find(r => r.id === 'generate')).toBeDefined();
  });

  it('finds commands by category', () => {
    const results = searchCommands('File');
    expect(results.length).toBeGreaterThan(0);
    // Should find 'export' and 'save'
    expect(results.some(r => r.id === 'export')).toBe(true);
    expect(results.some(r => r.id === 'save')).toBe(true);
  });

  it('finds commands by typo/fuzzy match in category', () => {
    // "Fyle" instead of "File"
    const results = searchCommands('Fyle');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.id === 'export')).toBe(true);
  });
});
