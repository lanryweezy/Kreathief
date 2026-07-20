import { describe, it, expect, vi } from 'vitest';

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn((selector) => {
    const state = {
      addToast: vi.fn(),
      reset: vi.fn(),
      recentColors: ['#ff0000', '#00ff00', '#0000ff'],
      addRecentColor: vi.fn(),
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

describe('ColorPicker', () => {
  it('module can be imported', async () => {
    const mod = await import('../../components/ColorPicker');
    expect(mod).toBeDefined();
  });
});
