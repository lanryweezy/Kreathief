import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHeroCutout, clearCutoutCache, prewarmHeroCutout } from '../../services/heroCutoutPipeline';
import { heavyService } from '../../services/heavyService';

describe('heroCutoutPipeline', () => {
  beforeEach(() => {
    clearCutoutCache();
    vi.restoreAllMocks();
  });

  it('returns transparent data URI directly without calling background removal', async () => {
    const spy = vi.spyOn(heavyService, 'removeBackground');
    const dataUri =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const res = await getHeroCutout(dataUri);
    expect(res.isCutout).toBe(true);
    expect(res.src).toBe(dataUri);
    expect(spy).not.toHaveBeenCalled();
  });

  it('calls heavyService.removeBackground and caches the resulting cutout', async () => {
    const fakeDataUrl = 'data:image/png;base64,FAKE_CUTOUT_DATA_FOR_TESTING_123456789012345678901234567890';
    const spy = vi.spyOn(heavyService, 'removeBackground').mockResolvedValue(fakeDataUrl);

    const testUrl = 'https://example.com/test-photo.jpg';
    const res1 = await getHeroCutout(testUrl);
    expect(res1.isCutout).toBe(true);
    expect(res1.src).toBe(fakeDataUrl);
    expect(spy).toHaveBeenCalledTimes(1);

    // Second call should return from cache without re-invoking worker
    const res2 = await getHeroCutout(testUrl);
    expect(res2.isCutout).toBe(true);
    expect(res2.src).toBe(fakeDataUrl);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('gracefully falls back to original photo when worker throws or fails', async () => {
    vi.spyOn(heavyService, 'removeBackground').mockRejectedValue(new Error('WASM ONNX init failure'));

    const testUrl = 'https://example.com/fallback-test.jpg';
    const res = await getHeroCutout(testUrl);
    expect(res.isCutout).toBe(false);
    expect(res.src).toBe(testUrl);
  });

  it('skips cutout when preferCutout is false', async () => {
    const spy = vi.spyOn(heavyService, 'removeBackground');
    const testUrl = 'https://example.com/prefer-false.jpg';

    const res = await getHeroCutout(testUrl, { preferCutout: false });
    expect(res.isCutout).toBe(false);
    expect(res.src).toBe(testUrl);
    expect(spy).not.toHaveBeenCalled();
  });

  it('prewarms cutout in background without throwing', () => {
    const spy = vi
      .spyOn(heavyService, 'removeBackground')
      .mockResolvedValue('data:image/png;base64,MOCK_DATA_123456789012345678901234567890');
    expect(() => prewarmHeroCutout('https://example.com/prewarm.jpg')).not.toThrow();
  });
});
