import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../store/useStore';
import { GroupLayer, TextLayer } from '../../types';

describe('Real-Time Auto-Layout Store Integration', () => {
  beforeEach(() => {
    const parentGroup: GroupLayer = {
      id: 'group-auto-1',
      type: 'group',
      name: 'Auto-Layout Container',
      x: 50,
      y: 50,
      width: 400,
      height: 200,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      children: ['child-1', 'child-2'],
      autoLayout: {
        direction: 'row',
        padding: 10,
        spacing: 20,
        alignment: 'start',
      },
    };

    const child1: TextLayer = {
      id: 'child-1',
      groupId: 'group-auto-1',
      type: 'text',
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      text: 'First Item',
      fontSize: 16,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    };

    const child2: TextLayer = {
      id: 'child-2',
      groupId: 'group-auto-1',
      type: 'text',
      x: 0,
      y: 0,
      width: 150,
      height: 40,
      text: 'Second Item',
      fontSize: 16,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    };

    useStore.setState({
      artboards: [
        {
          id: 'ab-1',
          name: 'Artboard 1',
          x: 0,
          y: 0,
          width: 1080,
          height: 1080,
          layers: [parentGroup, child1, child2],
        },
      ],
      activeArtboardId: 'ab-1',
    });
  });

  it('re-positions child layers when a child layer width changes', () => {
    const initialLayers = useStore.getState().artboards[0].layers;
    const c1Before = initialLayers.find((l) => l.id === 'child-1')!;
    const c2Before = initialLayers.find((l) => l.id === 'child-2')!;

    // Trigger real-time update of child-1 width
    useStore.getState().updateLayer('child-1', { width: 200 });

    const updatedLayers = useStore.getState().artboards[0].layers;
    const c1After = updatedLayers.find((l) => l.id === 'child-1')!;
    const c2After = updatedLayers.find((l) => l.id === 'child-2')!;

    // Child 1 starts at parent.x + padding = 50 + 10 = 60
    expect(c1After.x).toBe(60);
    // Child 2 starts at Child1.x + Child1.width + spacing = 60 + 200 + 20 = 280
    expect(c2After.x).toBe(280);
  });
});
