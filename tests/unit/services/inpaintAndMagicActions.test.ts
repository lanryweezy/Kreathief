import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiRemoveObject, aiRemoveObjectWithCanvas } from '../../../services/inpaintService';
import { removeBackground } from '../../../utils/imageProcessor';
import { useStore } from '../../../store/useStore';
import { ImageLayer } from '../../../types';

vi.mock('../../../services/aiModelsService', () => ({
  aiModelsService: {
    generativeFillSDXL: vi.fn().mockResolvedValue('data:image/png;base64,mockInpaintedResult'),
  },
}));

vi.mock('../../../services/heavyService', () => ({
  heavyService: {
    removeBackground: vi.fn().mockResolvedValue('data:image/png;base64,mockCutoutResult'),
  },
}));

vi.mock('../../../services/onDeviceAI', () => ({
  removeBackgroundOnDevice: vi.fn().mockResolvedValue({
    imageData: new ImageData(10, 10),
  }),
}));

describe('AI Magic Eraser & Background Removal Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removeBackground successfully calls heavyService for cutout', async () => {
    const result = await removeBackground('data:image/png;base64,sampleSrc');
    expect(result).toBe('data:image/png;base64,mockCutoutResult');
  });

  it('onRmBg store action correctly updates layer with transparent cutout', async () => {
    const layer: ImageLayer = {
      id: 'img-1',
      type: 'image',
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      src: 'data:image/png;base64,originalImage',
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
          layers: [layer],
        },
      ],
      activeArtboardId: 'ab-1',
      isGenerating: false,
      isRemovingBg: false,
    });

    await useStore.getState().onRmBg('img-1');

    const updatedArtboard = useStore.getState().artboards[0];
    const updatedLayer = updatedArtboard.layers[0] as ImageLayer;

    expect(updatedLayer.src).toBe('data:image/png;base64,mockCutoutResult');
    expect(updatedLayer.isProcessing).toBe(false);
  });
});
