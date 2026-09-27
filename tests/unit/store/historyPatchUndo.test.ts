import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../../store/useStore';

describe('History Slice Patch Undo & Redo', () => {
  beforeEach(() => {
    useStore.setState({
      artboards: [
        {
          id: 'ab-1',
          name: 'Artboard 1',
          x: 0,
          y: 0,
          width: 1080,
          height: 1080,
          layers: [
            {
              id: 'layer-1',
              type: 'text',
              x: 10,
              y: 10,
              width: 100,
              height: 40,
              text: 'Step 0',
              fontSize: 16,
              color: '#000000',
              rotation: 0,
              opacity: 1,
              locked: false,
              visible: true,
            },
          ],
        },
      ],
      activeArtboardId: 'ab-1',
      past: [],
      future: [],
      __lastStateSnapshot: null,
    });
  });

  it('correctly reverts through multiple patch steps on undo', () => {
    const store = useStore.getState();

    // Step 0 -> Save initial snapshot S0
    store.saveToHistory();

    // Step 1 -> Modify layer text to 'Step 1' & save patch
    useStore.setState((state) => ({
      artboards: [
        {
          ...state.artboards[0],
          layers: [{ ...state.artboards[0].layers[0], text: 'Step 1' }],
        },
      ],
    }));
    useStore.getState().saveToHistory();

    // Step 2 -> Modify layer text to 'Step 2' & save patch
    useStore.setState((state) => ({
      artboards: [
        {
          ...state.artboards[0],
          layers: [{ ...state.artboards[0].layers[0], text: 'Step 2' }],
        },
      ],
    }));
    useStore.getState().saveToHistory();

    expect((useStore.getState().artboards[0].layers[0] as any).text).toBe('Step 2');

    // 1st Undo -> Should revert to Step 1
    useStore.getState().undo();
    expect((useStore.getState().artboards[0].layers[0] as any).text).toBe('Step 1');

    // 2nd Undo -> Should revert to Step 0
    useStore.getState().undo();
    expect((useStore.getState().artboards[0].layers[0] as any).text).toBe('Step 0');

    // 1st Redo -> Should re-apply to Step 1
    useStore.getState().redo();
    expect((useStore.getState().artboards[0].layers[0] as any).text).toBe('Step 1');

    // 2nd Redo -> Should re-apply to Step 2
    useStore.getState().redo();
    expect((useStore.getState().artboards[0].layers[0] as any).text).toBe('Step 2');
  });
});
