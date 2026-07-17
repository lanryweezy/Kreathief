import { describe, it, expect, vi } from 'vitest';
import { MoveCommand } from '../../commands/move';
import { DeleteCommand } from '../../commands/delete';
import { Layer } from '../../types';

function makeLayer(id: string, x = 0, y = 0): Layer {
  return {
    id,
    type: 'shape',
    name: `Layer ${id}`,
    x,
    y,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    color: '#ff0000',
    cornerRadius: 0,
  } as Layer;
}

function makeStore(layers: Layer[]) {
  let currentLayers = [...layers];
  const updateLayer = vi.fn((id: string, props: Partial<Layer>) => {
    currentLayers = currentLayers.map((l) => (l.id === id ? { ...l, ...props } : l));
  });
  const deleteLayer = vi.fn((id: string) => {
    currentLayers = currentLayers.filter((l) => l.id !== id);
  });
  const setLayers = vi.fn((l: Layer[]) => {
    currentLayers = l;
  });
  const setSelectedLayerIds = vi.fn();
  return {
    getState: () => ({
      artboards: [{ id: 'ab1', name: 'AB', x: 0, y: 0, width: 800, height: 600, layers: currentLayers }],
      activeArtboardId: 'ab1',
      updateLayer,
      deleteLayer,
      setLayers,
      setSelectedLayerIds,
      beginBatch: vi.fn(),
      endBatch: vi.fn(),
      saveToHistory: vi.fn(),
    }),
    _layers: () => currentLayers,
    updateLayer,
    deleteLayer,
    setLayers,
    setSelectedLayerIds,
  };
}

describe('MoveCommand', () => {
  it('has description', () => {
    expect(new MoveCommand(makeStore([]), 'l1', 10, 20).description).toContain('Move');
  });

  it('execute changes position, undo restores', () => {
    const store = makeStore([makeLayer('l1', 50, 60)]);
    const cmd = new MoveCommand(store, 'l1', 10, 20);
    cmd.execute();
    expect(store.updateLayer).toHaveBeenCalledWith('l1', { x: 60, y: 80 });
    cmd.undo();
    expect(store.updateLayer).toHaveBeenCalledWith('l1', { x: 50, y: 60 });
  });

  it('does not move locked layer', () => {
    const l = makeLayer('l1', 50, 60);
    (l as any).locked = true;
    const store = makeStore([l]);
    new MoveCommand(store, 'l1', 10, 20).execute();
    expect(store.updateLayer).not.toHaveBeenCalled();
  });
});

describe('DeleteCommand', () => {
  it('has description', () => {
    expect(new DeleteCommand(makeStore([]), 'l1').description).toContain('Delete');
  });

  it('execute removes layer, undo restores and selects', () => {
    const store = makeStore([makeLayer('l1'), makeLayer('l2')]);
    const cmd = new DeleteCommand(store, 'l1');
    cmd.execute();
    expect(store.deleteLayer).toHaveBeenCalledWith('l1');
    cmd.undo();
    expect(store.setLayers).toHaveBeenCalled();
    expect(store._layers().find((l) => l.id === 'l1')).toBeDefined();
    expect(store.setSelectedLayerIds).toHaveBeenCalledWith(['l1']);
  });
});
