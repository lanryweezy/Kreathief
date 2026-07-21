// Stub for creativeDirector — no-op implementations to prevent runtime crashes
export const creativeDirector = {
  start: () => {},
  stop: () => {},
  onSuggestion: (_callback: (suggestion: any) => void) => {},
  analyze: (_trigger: string, _nodes: any, _selectedIds: any) => ({ suggestions: [], score: 0 }),
  acceptSuggestion: (_suggestion: any) => {},
  rejectSuggestion: (_suggestion: any) => {},
  dismissSuggestion: (_id: string) => {},
  getSuggestions: () => [],
  generateSuggestions: async () => [],
};
