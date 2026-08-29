/**
 * Runtime verification of the reference-conditioning pipeline.
 *
 * These cover the parts of the sprint that are deterministic — prompt composition, the
 * capability router, and appliedMode reporting — so a live-API failure can be attributed to
 * the endpoint schema rather than to our own logic. The outbound Fal layer is mocked; what is
 * asserted is exactly what we hand it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AspectRatio, ExtractedReferenceStyle, ReferenceAppliedMode, ReferenceAspect, StyleReference } from '../types';
import { IMAGE_GEN_MODELS, supportsReferenceImage, buildSizePayload } from '../config/imageModels';
import { buildStyleReferenceSuffix, composeGenerationPrompt, generateImageWithModel } from './imageGenService';
import { aiModelsService } from './aiModelsService';
import { analyticsService } from './analyticsService';
import * as geminiService from './geminiService';

vi.mock('./aiModelsService', () => ({
  aiModelsService: {
    generateImageWithReference: vi.fn(),
    generateImageFromEndpoint: vi.fn(),
    generateVectorRecraft: vi.fn(),
  },
}));

vi.mock('./analyticsService', () => ({
  analyticsService: { track: vi.fn() },
}));

vi.mock('./geminiService', () => ({
  generateImage: vi.fn(),
}));

// Distinct sentinels per facet so a leaked clause is detectable rather than plausible.
const EXTRACTED: ExtractedReferenceStyle = {
  summary: 'SENTINEL_SUMMARY',
  palette: ['#SENTINELPALETTE', '#222222'],
  composition: 'SENTINEL_COMPOSITION',
  typography: 'SENTINEL_TYPOGRAPHY',
  textures: 'SENTINEL_TEXTURES',
  mood: 'SENTINEL_MOOD',
  lighting: 'SENTINEL_LIGHTING',
  illustrationStyle: 'SENTINEL_ILLUSTRATION',
  cameraAngle: 'SENTINEL_CAMERA',
};

const ALL_SENTINELS = [
  'SENTINEL_SUMMARY',
  '#SENTINELPALETTE',
  'SENTINEL_COMPOSITION',
  'SENTINEL_TYPOGRAPHY',
  'SENTINEL_TEXTURES',
  'SENTINEL_MOOD',
  'SENTINEL_LIGHTING',
  'SENTINEL_ILLUSTRATION',
  'SENTINEL_CAMERA',
];

const makeRef = (over: Partial<StyleReference> = {}): StyleReference => ({
  id: 'ref-1',
  image: 'data:image/png;base64,AAAA',
  aspects: ['style'],
  extracted: EXTRACTED,
  analysisStatus: 'ready',
  ...over,
});

/** A model with native conditioning, and one genuinely without — no config edit needed. */
const NATIVE_MODEL = 'nano-banana-2';
const TEXT_ONLY_MODEL = 'flux-schnell';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('capability router', () => {
  it('routes only models that declare both the flag and an edit endpoint', () => {
    expect(supportsReferenceImage(NATIVE_MODEL)).toBe(true);
    expect(supportsReferenceImage(TEXT_ONLY_MODEL)).toBe(false);
    expect(supportsReferenceImage(undefined)).toBe(false);
    expect(supportsReferenceImage('does-not-exist')).toBe(false);
  });

  it('never claims native support without a route to send the image to', () => {
    for (const model of IMAGE_GEN_MODELS) {
      if (model.capabilities.referenceImage) {
        expect(model.editEndpoint, `${model.id} claims referenceImage`).toBeTruthy();
      }
      if (model.imageInputField) {
        expect(model.editEndpoint, `${model.id} declares an image field`).toBeTruthy();
      }
    }
  });
});

describe('Test 5 — the selected aspect controls what is borrowed', () => {
  const cases: Array<[ReferenceAspect, string[]]> = [
    ['style', ['SENTINEL_SUMMARY', 'SENTINEL_TEXTURES']],
    ['palette', ['#SENTINELPALETTE']],
    ['mood', ['SENTINEL_MOOD']],
    ['composition', ['SENTINEL_COMPOSITION']],
    ['typography', ['SENTINEL_TYPOGRAPHY']],
    ['lighting', ['SENTINEL_LIGHTING']],
    ['layout', ['SENTINEL_COMPOSITION']],
    ['illustrationStyle', ['SENTINEL_ILLUSTRATION']],
    ['cameraAngle', ['SENTINEL_CAMERA']],
  ];

  it.each(cases)('%s borrows only its own facet', (aspect, expected) => {
    const suffix = buildStyleReferenceSuffix(makeRef({ aspects: [aspect] }));
    for (const sentinel of expected) {
      expect(suffix).toContain(sentinel);
    }
    for (const sentinel of ALL_SENTINELS.filter((s) => !expected.includes(s))) {
      expect(suffix, `${aspect} leaked ${sentinel}`).not.toContain(sentinel);
    }
  });

  // Identity aspects deliberately carry no extracted text — they are instructions that
  // depend on native conditioning, so leaking a description sentinel would be wrong.
  it.each(['character', 'product', 'logo'] as ReferenceAspect[])(
    '%s emits a preservation instruction and borrows no description',
    (aspect) => {
      const suffix = buildStyleReferenceSuffix(makeRef({ aspects: [aspect] }));
      expect(suffix.length).toBeGreaterThan(0);
      for (const sentinel of ALL_SENTINELS) {
        expect(suffix).not.toContain(sentinel);
      }
    }
  );

  it('produces nothing when analysis failed or no aspect is selected', () => {
    expect(buildStyleReferenceSuffix(makeRef({ aspects: [] }))).toBe('');
    expect(buildStyleReferenceSuffix(makeRef({ extracted: undefined, analysisStatus: 'failed' }))).toBe('');
    expect(buildStyleReferenceSuffix(null)).toBe('');
  });
});

describe('Test 4 — brand constraints precede reference characteristics', () => {
  const brandKit = {
    id: 'bk1',
    name: 'Acme',
    colors: ['#BRANDCOLOR'],
    fonts: ['BrandFont'],
  } as any;

  it('states the brand identity before the reference, and creative intent first', () => {
    const composed = composeGenerationPrompt({
      prompt: 'A product hero shot',
      brandKit,
      styleReference: makeRef({ aspects: ['palette'] }),
      campaignGoal: 'drive signups',
      canvasSize: { width: 1080, height: 1350 },
    });

    const intent = composed.indexOf('A product hero shot');
    const goal = composed.indexOf('drive signups');
    const brand = composed.indexOf('Acme');
    const reference = composed.indexOf('#SENTINELPALETTE');
    const canvas = composed.indexOf('1080x1350');

    expect(intent).toBe(0);
    expect(goal).toBeGreaterThan(intent);
    expect(brand).toBeGreaterThan(goal);
    expect(reference).toBeGreaterThan(brand);
    expect(canvas).toBeGreaterThan(reference);
  });

  it('keeps the brand palette present even when the reference contributes its own', () => {
    const composed = composeGenerationPrompt({
      prompt: 'poster',
      brandKit,
      styleReference: makeRef({ aspects: ['palette'] }),
    });
    expect(composed).toContain('#BRANDCOLOR');
    expect(composed).toContain('#SENTINELPALETTE');
  });

  it('omits absent context instead of emitting empty clauses', () => {
    expect(composeGenerationPrompt({ prompt: 'just a prompt' })).toBe('just a prompt');
  });
});

describe('Test 1 — descriptor fallback on a model without native conditioning', () => {
  it('reports descriptor and never touches the edit route', async () => {
    vi.mocked(aiModelsService.generateImageFromEndpoint).mockResolvedValue('https://img/out.png');
    const modes: ReferenceAppliedMode[] = [];

    const result = await generateImageWithModel('prompt with descriptor already folded in', {
      modelId: TEXT_ONLY_MODEL,
      styleReference: makeRef({ aspects: ['style', 'palette', 'mood'] }),
      onReferenceApplied: (m) => modes.push(m),
    });

    expect(result).toBe('https://img/out.png');
    expect(aiModelsService.generateImageWithReference).not.toHaveBeenCalled();
    expect(aiModelsService.generateImageFromEndpoint).toHaveBeenCalledTimes(1);
    expect(modes).toEqual(['descriptor']);
  });

  it('reports none when there is no descriptor and no native support', async () => {
    vi.mocked(aiModelsService.generateImageFromEndpoint).mockResolvedValue('https://img/out.png');
    const modes: ReferenceAppliedMode[] = [];

    await generateImageWithModel('prompt', {
      modelId: TEXT_ONLY_MODEL,
      styleReference: makeRef({ extracted: undefined, analysisStatus: 'failed', aspects: [] }),
      onReferenceApplied: (m) => modes.push(m),
    });

    expect(modes).toEqual(['none']);
  });

  it('reports none when a reference is analyzed but every aspect was deselected', async () => {
    vi.mocked(aiModelsService.generateImageFromEndpoint).mockResolvedValue('https://img/out.png');
    const modes: ReferenceAppliedMode[] = [];

    await generateImageWithModel('prompt', {
      modelId: TEXT_ONLY_MODEL,
      styleReference: makeRef({ aspects: [] }),
      onReferenceApplied: (m) => modes.push(m),
    });

    expect(modes).toEqual(['none']);
  });

  it('reports none when no reference was supplied at all', async () => {
    vi.mocked(aiModelsService.generateImageFromEndpoint).mockResolvedValue('https://img/out.png');
    const modes: ReferenceAppliedMode[] = [];

    await generateImageWithModel('prompt', {
      modelId: TEXT_ONLY_MODEL,
      onReferenceApplied: (m) => modes.push(m),
    });

    expect(modes).toEqual(['none']);
  });
});

describe('Test 2 — native conditioning', () => {
  it('sends the reference to the edit endpoint with the model-declared field', async () => {
    vi.mocked(aiModelsService.generateImageWithReference).mockResolvedValue('https://img/native.png');
    const modes: ReferenceAppliedMode[] = [];

    const result = await generateImageWithModel('composed prompt', {
      modelId: NATIVE_MODEL,
      aspectRatio: AspectRatio.SQUARE,
      styleReference: makeRef(),
      onReferenceApplied: (m) => modes.push(m),
    });

    expect(result).toBe('https://img/native.png');
    expect(aiModelsService.generateImageWithReference).toHaveBeenCalledWith(
      'https://fal.run/fal-ai/nano-banana-2/edit',
      'composed prompt',
      'data:image/png;base64,AAAA',
      'image_urls',
      { aspect_ratio: '1:1' }
    );
    expect(modes).toEqual(['native']);
    expect(aiModelsService.generateImageFromEndpoint).not.toHaveBeenCalled();
  });

  it('honors a model that expects the singular image_url field', async () => {
    vi.mocked(aiModelsService.generateImageWithReference).mockResolvedValue('https://img/native.png');

    await generateImageWithModel('p', { modelId: 'qwen-image', styleReference: makeRef() });

    expect(aiModelsService.generateImageWithReference).toHaveBeenCalledWith(
      'https://fal.run/fal-ai/qwen-image-edit',
      'p',
      'data:image/png;base64,AAAA',
      'image_url',
      { image_size: 'square' }
    );
  });

  it('still conditions natively when vision analysis failed — the raw image is enough', async () => {
    vi.mocked(aiModelsService.generateImageWithReference).mockResolvedValue('https://img/native.png');
    const modes: ReferenceAppliedMode[] = [];

    await generateImageWithModel('p', {
      modelId: NATIVE_MODEL,
      styleReference: makeRef({ extracted: undefined, analysisStatus: 'failed', aspects: [] }),
      onReferenceApplied: (m) => modes.push(m),
    });

    expect(aiModelsService.generateImageWithReference).toHaveBeenCalled();
    expect(modes).toEqual(['native']);
  });

  it('degrades to the descriptor — and says so — when the edit route rejects the call', async () => {
    vi.mocked(aiModelsService.generateImageWithReference).mockRejectedValue(
      new Error('Reference-conditioned generation failed: 422 Unprocessable Entity')
    );
    vi.mocked(aiModelsService.generateImageFromEndpoint).mockResolvedValue('https://img/text.png');
    const modes: ReferenceAppliedMode[] = [];

    const result = await generateImageWithModel('p', {
      modelId: NATIVE_MODEL,
      styleReference: makeRef({ aspects: ['style'] }),
      onReferenceApplied: (m) => modes.push(m),
    });

    expect(result).toBe('https://img/text.png');
    expect(modes).toEqual(['descriptor']);
  });

  it('propagates the failure instead of silently degrading when fallback is disabled', async () => {
    vi.mocked(aiModelsService.generateImageWithReference).mockRejectedValue(new Error('422'));

    await expect(
      generateImageWithModel('p', {
        modelId: NATIVE_MODEL,
        styleReference: makeRef(),
        allowFallback: false,
      })
    ).rejects.toThrow('422');
  });
});

describe('Test 9 — analytics payload shape', () => {
  it.each([
    ['native', NATIVE_MODEL, ['style', 'mood'] as ReferenceAspect[], 2],
    ['descriptor', TEXT_ONLY_MODEL, ['style', 'mood'] as ReferenceAspect[], 2],
    ['none', TEXT_ONLY_MODEL, [] as ReferenceAspect[], 0],
  ])('reports reference=%s', async (expectedMode, modelId, aspects, expectedAspects) => {
    vi.mocked(aiModelsService.generateImageWithReference).mockResolvedValue('https://img/a.png');
    vi.mocked(aiModelsService.generateImageFromEndpoint).mockResolvedValue('https://img/b.png');

    await generateImageWithModel('p', { modelId, styleReference: makeRef({ aspects }) });

    expect(analyticsService.track).toHaveBeenCalledWith(
      'generate_image',
      expect.objectContaining({
        model: modelId,
        reference: expectedMode,
        reference_aspects: expectedAspects,
      })
    );
  });

  it('reports reference=none when no reference is present', async () => {
    vi.mocked(aiModelsService.generateImageFromEndpoint).mockResolvedValue('https://img/b.png');
    await generateImageWithModel('p', { modelId: TEXT_ONLY_MODEL });
    expect(analyticsService.track).toHaveBeenCalledWith(
      'generate_image',
      expect.objectContaining({ reference: 'none', reference_aspects: 0 })
    );
  });
});

describe('Test 7 pre-flight — proxy allowlist covers every reachable endpoint', () => {
  // A missing allowlist entry surfaces as HTTP 403 from our own proxy, which looks nothing
  // like a schema problem. Catching it here keeps the live edit tests interpretable.
  const proxySource = readFileSync(resolve(__dirname, '../api/fal.ts'), 'utf8');
  const allowlisted = new Set(Array.from(proxySource.matchAll(/'(https:\/\/fal\.run\/[^']+)'/g)).map((m) => m[1]));

  it.each(IMAGE_GEN_MODELS.map((m) => [m.id, m] as const))('%s endpoints are allowlisted', (_id, model) => {
    expect(allowlisted.has(model.falEndpoint), model.falEndpoint).toBe(true);
    if (model.editEndpoint) {
      expect(allowlisted.has(model.editEndpoint), model.editEndpoint).toBe(true);
    }
  });

  it('covers the endpoints hardcoded outside the model config too', () => {
    // Upscaling and generative fill call Fal directly rather than through a model entry, so
    // they are invisible to the check above — and a 403 there looks like a broken feature.
    const serviceSource = readFileSync(resolve(__dirname, './aiModelsService.ts'), 'utf8');
    const used = Array.from(serviceSource.matchAll(/'(https:\/\/fal\.run\/[^']+)'/g)).map((m) => m[1]);

    expect(used.length).toBeGreaterThan(0);
    for (const endpoint of used) {
      expect(allowlisted.has(endpoint), `${endpoint} is not allowlisted in api/fal.ts`).toBe(true);
    }
  });
});

describe('sizing vocabulary is per-endpoint data, not a global assumption', () => {
  // Fal ignores a sizing field it does not declare, so sending the wrong one loses the user's
  // chosen aspect ratio with no error anywhere. These values were read off Fal's OpenAPI specs.
  const EXPECTED_FIELD: Record<string, 'image_size' | 'aspect_ratio' | 'none'> = {
    'nano-banana': 'aspect_ratio',
    'nano-banana-2': 'aspect_ratio',
    'nano-banana-pro': 'aspect_ratio',
  };

  it.each(IMAGE_GEN_MODELS.map((m) => [m.id, m] as const))(
    '%s sends its declared generate-time sizing field',
    (id, model) => {
      const payload = buildSizePayload(model, '16:9', 'generate');
      const expected = EXPECTED_FIELD[id] ?? 'image_size';

      if (expected === 'none') {
        expect(payload).toEqual({});
      } else {
        expect(Object.keys(payload)).toEqual([expected]);
      }
    }
  );

  it('passes our aspect ratio through untranslated for aspect_ratio endpoints', () => {
    const model = IMAGE_GEN_MODELS.find((m) => m.id === 'nano-banana-2');
    expect(buildSizePayload(model, AspectRatio.PORTRAIT, 'generate')).toEqual({
      aspect_ratio: '9:16',
    });
    expect(buildSizePayload(model, AspectRatio.PORTRAIT, 'edit')).toEqual({
      aspect_ratio: '9:16',
    });
  });

  it("translates to Fal's named presets for image_size endpoints", () => {
    const model = IMAGE_GEN_MODELS.find((m) => m.id === 'flux-schnell');
    expect(buildSizePayload(model, '1:1')).toEqual({ image_size: 'square' });
    expect(buildSizePayload(model, '16:9')).toEqual({ image_size: 'landscape_hd' });
    expect(buildSizePayload(model, '9:16')).toEqual({ image_size: 'portrait_hd' });
  });

  it('sends nothing to an edit route that declares no sizing field', () => {
    const model = IMAGE_GEN_MODELS.find((m) => m.id === 'flux-dev');
    // The text route still takes image_size; only image-to-image inherits its dimensions.
    expect(buildSizePayload(model, '16:9', 'generate')).toEqual({ image_size: 'landscape_hd' });
    expect(buildSizePayload(model, '16:9', 'edit')).toEqual({});
  });

  it('every AspectRatio value is a ratio Fal accepts verbatim', () => {
    // aspect_ratio is a closed enum on Fal's side; a value outside it is a hard 422.
    const FAL_RATIOS = new Set(['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16']);
    for (const ratio of Object.values(AspectRatio)) {
      expect(FAL_RATIOS.has(ratio), `${ratio} is not a Fal aspect_ratio`).toBe(true);
    }
  });

  it('every sizing field we can emit survives the proxy allowlist', () => {
    // The proxy strips unknown body fields, so an un-allowlisted sizing key is dropped
    // silently — the same class of invisible failure this milestone exists to remove.
    const proxySource = readFileSync(resolve(__dirname, '../api/fal.ts'), 'utf8');
    const emitted = new Set<string>();
    for (const model of IMAGE_GEN_MODELS) {
      for (const target of ['generate', 'edit'] as const) {
        Object.keys(buildSizePayload(model, '1:1', target)).forEach((k) => emitted.add(k));
      }
    }
    expect(emitted.size).toBeGreaterThan(0);
    for (const field of emitted) {
      expect(proxySource.includes(`'${field}'`), `${field} is not allowlisted in api/fal.ts`).toBe(true);
    }
  });
});

describe('vector output path', () => {
  it('reports the fallback mode rather than pretending the reference was conditioned', async () => {
    vi.mocked(aiModelsService.generateVectorRecraft).mockResolvedValue('<svg></svg>');
    const modes: ReferenceAppliedMode[] = [];

    await generateImageWithModel('p', {
      modelId: 'recraft-vector',
      styleReference: makeRef({ aspects: ['style'] }),
      onReferenceApplied: (m) => modes.push(m),
    });

    expect(modes).toEqual(['descriptor']);
    expect(geminiService.generateImage).not.toHaveBeenCalled();
  });
});
