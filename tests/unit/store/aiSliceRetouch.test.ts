import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAISlice } from '../../../store/slices/aiSlice';
import * as geminiService from '../../../services/geminiService';

vi.mock('../../../services/geminiService', () => ({
  retouchImage: vi.fn(),
}));

describe('aiSlice onRetouch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupSlice = (layers: any[]) => {
    let state: any = {
      activeArtboardId: 'artboard-1',
      artboards: [{ id: 'artboard-1', layers }],
      isGenerating: false,
      updateLayer: vi.fn(),
      saveToHistory: vi.fn(),
      addToast: vi.fn(),
    };

    const set = (partial: any) => {
      const next = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...next };
    };
    const get = () => state;

    const slice = (createAISlice as any)(set, get, {});
    state = { ...state, ...slice };
    return { getState: () => state };
  };

  it('calls geminiService.retouchImage, saves history, and updates layer src', async () => {
    vi.mocked(geminiService.retouchImage).mockResolvedValue('data:image/png;base64,retouched');
    const { getState } = setupSlice([{ id: 'img-1', type: 'image', src: 'data:image/png;base64,original' }]);

    await getState().onRetouch('img-1');

    expect(geminiService.retouchImage).toHaveBeenCalledWith('data:image/png;base64,original');
    expect(getState().updateLayer).toHaveBeenNthCalledWith(1, 'img-1', { isProcessing: true });
    expect(getState().saveToHistory).toHaveBeenCalledTimes(1);
    expect(getState().updateLayer).toHaveBeenNthCalledWith(2, 'img-1', {
      src: 'data:image/png;base64,retouched',
      isProcessing: false,
    });
    expect(getState().addToast).toHaveBeenCalledWith('Retouch applied', 'success');
    expect(getState().isGenerating).toBe(false);
  });

  it('ignores non-image or missing layers', async () => {
    const { getState } = setupSlice([{ id: 'txt-1', type: 'text', text: 'Hello' }]);

    await getState().onRetouch('txt-1');
    await getState().onRetouch('missing-id');

    expect(geminiService.retouchImage).not.toHaveBeenCalled();
    expect(getState().updateLayer).not.toHaveBeenCalled();
    expect(getState().saveToHistory).not.toHaveBeenCalled();
  });

  it('resets processing and generating flags and shows error toast on failure', async () => {
    vi.mocked(geminiService.retouchImage).mockRejectedValue(new Error('API timeout'));
    const { getState } = setupSlice([{ id: 'img-1', type: 'image', src: 'data:image/png;base64,original' }]);

    await getState().onRetouch('img-1');

    expect(getState().saveToHistory).not.toHaveBeenCalled();
    expect(getState().updateLayer).toHaveBeenNthCalledWith(1, 'img-1', { isProcessing: true });
    expect(getState().updateLayer).toHaveBeenNthCalledWith(2, 'img-1', { isProcessing: false });
    expect(getState().addToast).toHaveBeenCalledWith(expect.stringContaining('Retouch failed:'), 'error');
    expect(getState().isGenerating).toBe(false);
  });
});
