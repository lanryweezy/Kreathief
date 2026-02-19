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
  },
}));

describe('Collaboration Features Store', () => {
  beforeEach(() => {
    useStore.setState({
      snapshots: [],
      comments: [],
      layers: [], // Reset layers
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
  });

  it('should restore a snapshot', async () => {
    const { createSnapshot, restoreSnapshot } = useStore.getState();

    // Create initial state
    const initialLayer = {
      id: 'layer1',
      type: 'rectangle',
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      color: 'red',
    } as any;
    useStore.setState({ layers: [initialLayer] });

    // Create snapshot
    await act(async () => {
      await createSnapshot('Snapshot 1');
    });

    // Modify state (delete layer)
    useStore.setState({ layers: [] });
    expect(useStore.getState().layers).toHaveLength(0);

    // Restore snapshot
    const snapshotId = useStore.getState().snapshots[0].id;
    await act(async () => {
      await restoreSnapshot(snapshotId);
    });

    // Verify state restored
    const { layers } = useStore.getState();
    expect(layers).toHaveLength(1);
    expect(layers[0].id).toBe('layer1');
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
