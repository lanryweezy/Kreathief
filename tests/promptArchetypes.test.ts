import { describe, it, expect } from 'vitest';
import { promptArchetypeStrategies, registerPromptArchetypeStrategy } from '../services/promptArchetypes';

// We need to test the guidance retrieval from geminiService but getArchetypeGuidance is not exported.
// Since the promptArchetypes.ts registry is the single source of truth now,
// we can test the registry directly to ensure extensibility works correctly.

describe('Prompt Archetype Strategy Registry', () => {
  it('should allow registering and retrieving a new archetype strategy', () => {
    const mockStrategy = {
      id: 'mock_fantasy',
      label: 'Fantasy Art',
      icon: 'Sword',
      guidance: 'Emphasize high fantasy: magical glowing runes, mythical creatures, dramatic lighting.',
      localSuffix: ', epic fantasy illustration, magical elements, highly detailed'
    };

    registerPromptArchetypeStrategy(mockStrategy);

    expect(promptArchetypeStrategies.has('mock_fantasy')).toBe(true);
    expect(promptArchetypeStrategies.get('mock_fantasy')).toEqual(mockStrategy);
  });
});