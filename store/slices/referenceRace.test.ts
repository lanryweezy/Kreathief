/**
 * Test 10 — a late report must not stamp the wrong reference.
 *
 * Sequence under test: upload A → start generating → immediately replace with B → A's
 * generation finishes. Without the `referenceId` guard, A's outcome would be written onto B and
 * the panel would describe B using A's result. The slice is driven directly with a minimal
 * store harness so the real guard runs rather than a re-implementation of it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAISlice, AISlice } from './aiSlice';
import * as geminiService from '../../services/geminiService';
import { generateImageWithModel } from '../../services/imageGenService';
import type { ExtractedReferenceStyle, ReferenceAppliedMode } from '../../types';

vi.mock('../../services/geminiService', () => ({
  analyzeReferenceImage: vi.fn(),
}));

vi.mock('../../services/imageGenService', () => ({
  generateImageWithModel: vi.fn(),
  composeGenerationPrompt: vi.fn(() => 'composed'),
}));

// Imported by the slice but irrelevant here; stubbed to keep heavy ML deps out of the run.
vi.mock('../../services/vectorizerService', () => ({ vectorizerService: {} }));
vi.mock('../../services/aiModelsService', () => ({ aiModelsService: {} }));
vi.mock('../../utils/imageProcessor', () => ({ removeBackground: vi.fn() }));
vi.mock('../../utils/booleanOperations', () => ({ performBooleanOnLayers: vi.fn() }));
vi.mock('../../utils/vectorUtils', () => ({ VectorUtils: {} }));

const EXTRACTED: ExtractedReferenceStyle = {
  summary: 'a summary',
  palette: ['#000000'],
  composition: 'centered',
  typography: 'none',
  textures: 'flat',
  mood: 'calm',
  lighting: 'soft',
  illustrationStyle: 'vector',
  cameraAngle: 'n/a',
};

/** Minimal zustand-shaped harness: enough for the slice's own set/get to behave normally. */
const makeStore = () => {
  let state: any = {};
  const set = (partial: any) => {
    state = { ...state, ...(typeof partial === 'function' ? partial(state) : partial) };
  };
  const get = () => state;
  state = createAISlice(set as any, get as any, {} as any);
  // Collaborators the slice calls on but that live in other slices.
  set({ addToast: vi.fn(), addImageLayer: vi.fn(), brandKits: [], activeBrandKitId: null });
  return { get: () => state as AISlice & Record<string, any>, set };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('setReferenceAppliedMode guard', () => {
  it('ignores a report addressed to a reference that has been replaced', async () => {
    const store = makeStore();
    vi.mocked(geminiService.analyzeReferenceImage).mockResolvedValue(EXTRACTED);

    await store.get().setStyleReference('data:image/png;base64,AAAA', 'Reference A');
    const referenceA = store.get().styleReference!;
    expect(referenceA.analysisStatus).toBe('ready');

    // Reference B replaces A while A's generation is still in flight.
    await store.get().setStyleReference('data:image/png;base64,BBBB', 'Reference B');
    const referenceB = store.get().styleReference!;
    expect(referenceB.id).not.toBe(referenceA.id);

    // A finishes late and reports its outcome.
    store.get().setReferenceAppliedMode('native', referenceA.id);

    expect(store.get().styleReference!.id).toBe(referenceB.id);
    expect(store.get().styleReference!.appliedMode).toBeUndefined();
  });

  it('applies a report that matches the current reference', async () => {
    const store = makeStore();
    vi.mocked(geminiService.analyzeReferenceImage).mockResolvedValue(EXTRACTED);

    await store.get().setStyleReference('data:image/png;base64,AAAA');
    const current = store.get().styleReference!;

    store.get().setReferenceAppliedMode('descriptor', current.id);

    expect(store.get().styleReference!.appliedMode).toBe('descriptor');
    expect(store.get().styleReference!.analysisStatus).toBe('ready');
  });

  it('is a no-op once the reference has been cleared', async () => {
    const store = makeStore();
    vi.mocked(geminiService.analyzeReferenceImage).mockResolvedValue(EXTRACTED);

    await store.get().setStyleReference('data:image/png;base64,AAAA');
    const current = store.get().styleReference!;
    store.get().clearStyleReference();

    expect(() => store.get().setReferenceAppliedMode('native', current.id)).not.toThrow();
    expect(store.get().styleReference).toBeNull();
  });
});

describe('generateImage reports against the reference it actually used', () => {
  it("does not attribute A's conditioning mode to B", async () => {
    const store = makeStore();
    vi.mocked(geminiService.analyzeReferenceImage).mockResolvedValue(EXTRACTED);

    await store.get().setStyleReference('data:image/png;base64,AAAA', 'A');
    const referenceA = store.get().styleReference!;
    store.get().setPrompt('a poster');

    // The swap happens between the call starting and the mode being reported — exactly the
    // window the guard exists for.
    let reportedFor: string | undefined;
    vi.mocked(generateImageWithModel).mockImplementation(async (_prompt, options) => {
      await store.get().setStyleReference('data:image/png;base64,BBBB', 'B');
      reportedFor = options?.styleReference?.id;
      options?.onReferenceApplied?.('native' as ReferenceAppliedMode);
      return 'https://img/out.png';
    });

    await store.get().generateImage();

    expect(reportedFor).toBe(referenceA.id);
    expect(store.get().styleReference!.name).toBe('B');
    expect(store.get().styleReference!.appliedMode).toBeUndefined();
  });

  it('records the mode when the reference is unchanged across the call', async () => {
    const store = makeStore();
    vi.mocked(geminiService.analyzeReferenceImage).mockResolvedValue(EXTRACTED);

    await store.get().setStyleReference('data:image/png;base64,AAAA', 'A');
    store.get().setPrompt('a poster');

    vi.mocked(generateImageWithModel).mockImplementation(async (_prompt, options) => {
      options?.onReferenceApplied?.('descriptor' as ReferenceAppliedMode);
      return 'https://img/out.png';
    });

    await store.get().generateImage();

    expect(store.get().styleReference!.appliedMode).toBe('descriptor');
    expect(store.get().isGenerating).toBe(false);
  });
});

describe('analysis result is also id-guarded', () => {
  it("does not let A's vision result overwrite B", async () => {
    const store = makeStore();
    let releaseA: (v: ExtractedReferenceStyle) => void = () => {};
    vi.mocked(geminiService.analyzeReferenceImage)
      .mockImplementationOnce(
        () =>
          new Promise<ExtractedReferenceStyle>((resolve) => {
            releaseA = resolve;
          })
      )
      .mockResolvedValueOnce({ ...EXTRACTED, summary: 'B summary' });

    const pendingA = store.get().setStyleReference('data:image/png;base64,AAAA', 'A');
    await store.get().setStyleReference('data:image/png;base64,BBBB', 'B');

    releaseA({ ...EXTRACTED, summary: 'A summary' });
    await pendingA;

    expect(store.get().styleReference!.name).toBe('B');
    expect(store.get().styleReference!.extracted?.summary).toBe('B summary');
  });

  it('marks analysis failed without discarding the reference itself', async () => {
    const store = makeStore();
    vi.mocked(geminiService.analyzeReferenceImage).mockRejectedValue(new Error('vision down'));

    await store.get().setStyleReference('data:image/png;base64,AAAA', 'A');

    const ref = store.get().styleReference!;
    expect(ref.analysisStatus).toBe('failed');
    expect(ref.image).toBe('data:image/png;base64,AAAA');
    expect(ref.analysisError).toBeTruthy();
    expect(store.get().addToast).toHaveBeenCalled();
  });
});
