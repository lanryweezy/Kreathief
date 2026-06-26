import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createIntentSlice, IntentSlice } from '../../../store/slices/intentSlice';

type TestStore = IntentSlice;

const useTestStore = create<TestStore>()((...args) => ({
  ...createIntentSlice(...args),
}));

beforeEach(() => {
  useTestStore.setState({
    selectedIntent: null,
    intentCanvasSize: null,
  });
});

describe('intentSlice', () => {
  it('initial state has null selectedIntent and null intentCanvasSize', () => {
    const state = useTestStore.getState();
    expect(state.selectedIntent).toBeNull();
    expect(state.intentCanvasSize).toBeNull();
  });

  it('setIntent sets both selectedIntent and intentCanvasSize', () => {
    const { setIntent } = useTestStore.getState();
    setIntent('social', 1080, 1080);
    const state = useTestStore.getState();
    expect(state.selectedIntent).toBe('social');
    expect(state.intentCanvasSize).toEqual({ width: 1080, height: 1080 });
  });

  it('clearIntent resets to null', () => {
    const { setIntent, clearIntent } = useTestStore.getState();
    setIntent('flyer', 2550, 3300);
    clearIntent();
    const state = useTestStore.getState();
    expect(state.selectedIntent).toBeNull();
    expect(state.intentCanvasSize).toBeNull();
  });

  it('multiple setIntent calls overwrite previous values', () => {
    const { setIntent } = useTestStore.getState();
    setIntent('social', 1080, 1080);
    setIntent('poster', 7200, 10800);
    const state = useTestStore.getState();
    expect(state.selectedIntent).toBe('poster');
    expect(state.intentCanvasSize).toEqual({ width: 7200, height: 10800 });
  });
});
