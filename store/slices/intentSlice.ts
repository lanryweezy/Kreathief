import { StateCreator } from 'zustand';
import type { StoreState } from '../useStore';


export interface IntentSlice {
  selectedIntent: string | null;
  intentCanvasSize: { width: number; height: number } | null;
  setIntent: (intent: string, width: number, height: number) => void;
  clearIntent: () => void;
}

export const createIntentSlice: StateCreator<StoreState, [], [], IntentSlice> = (set) => ({
  selectedIntent: null,
  intentCanvasSize: null,
  setIntent: (intent, width, height) =>
    set({ selectedIntent: intent, intentCanvasSize: { width, height } }),
  clearIntent: () =>
    set({ selectedIntent: null, intentCanvasSize: null }),
});
