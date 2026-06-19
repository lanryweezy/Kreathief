import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from '../store/useStore';
import { act } from '@testing-library/react';

// Mock storage service to avoid IndexedDB errors in Node environment
vi.mock('../services/storageService', () => ({
  storageService: {
    saveSnapshot: vi.fn(),
    getSnapshots: vi.fn().mockResolvedValue([]),
    deleteSnapshot: vi.fn(),
    saveComment: vi.fn(),
    getComments: vi.fn().mockResolvedValue([]),
    saveProject: vi.fn(),
    saveSessionMirror: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Collaboration Features Store', () => {
  beforeEach(() => {
    useStore.setState({
      snapshots: [],
      comments: [],
      artboards: [
        {
          id: 'default',
          name: 'Artboard 1',
          x: 0,
          y: 0,
          width: 1080,
          height: 1080,
          layers: [],
        },
      ],
      activeArtboardId: 'default',
      projectId: 'test-project',
    });
  });

  it('should create a snapshot', async () => {
    const { createSnapshot } = useStore.getState();

    await act(async () => {
      await createSnapshot('Test Snapshot');
    });

    const { snapshots } = useStore.getState();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].name).toBe('Test Snapshot');
    expect(snapshots[0].id).toBeDefined();
    expect(snapshots[0].timestamp).toBeDefined();
    expect(snapshots[0].state.artboards).toBeDefined();
  });

  it('should restore a snapshot', async () => {
    const { createSnapshot, restoreSnapshot, addLayer } = useStore.getState();

    // Create initial state
    const initialLayer = {
      id: 'layer1',
      type: 'rectangle',
      name: 'Rect',
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      color: 'red',
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    } as any;

    act(() => {
      addLayer(initialLayer);
    });

    // Create snapshot
    await act(async () => {
      await createSnapshot('Snapshot 1');
    });

    // Modify state (delete layer)
    act(() => {
      useStore.getState().deleteLayer('layer1');
    });

    const activeArtboardBefore = useStore
      .getState()
      .artboards.find((a) => a.id === useStore.getState().activeArtboardId);
    expect(activeArtboardBefore?.layers).toHaveLength(0);

    // Restore snapshot
    const snapshotId = useStore.getState().snapshots[0].id;
    await act(async () => {
      await restoreSnapshot(snapshotId);
    });

    // Verify state restored
    const activeArtboardAfter = useStore
      .getState()
      .artboards.find((a) => a.id === useStore.getState().activeArtboardId);
    expect(activeArtboardAfter?.layers).toHaveLength(1);
    expect(activeArtboardAfter?.layers[0].id).toBe('layer1');
  });

  it('should add a comment', async () => {
    const { addComment } = useStore.getState();
    const user = { id: 'u1', name: 'Tester', avatar: '' };

    await act(async () => {
      await addComment('Hello World', user);
    });

    const { comments } = useStore.getState();
    expect(comments).toHaveLength(1);
    expect(comments[0].text).toBe('Hello World');
    expect(comments[0].userId).toBe('u1');
    expect(comments[0].userName).toBe('Tester');
  });

  it('should add tags', async () => {
    const { addTag, removeTag } = useStore.getState();

    act(() => {
      addTag('design');
      addTag('v1');
    });

    expect(useStore.getState().tags).toEqual(['design', 'v1']);

    act(() => {
      removeTag('design');
    });

    expect(useStore.getState().tags).toEqual(['v1']);
  });
});
