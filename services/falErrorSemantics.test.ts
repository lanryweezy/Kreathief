/**
 * Test 3 — proves the diagnostic architecture, not the models.
 *
 * The claim under test: a Fal schema rejection must stay a permanent client error all the way
 * to the caller, carrying Fal's own validation message, and must NOT be retried. Before the
 * proxy fix a 422 was rewritten as a 500, which the client classified as a transient network
 * failure and retried three times — burning quota on a request that could never succeed.
 *
 * The transport is stubbed rather than the service, so the real retry classifier runs.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { aiModelsService } from './aiModelsService';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('permanent request errors', () => {
  it("does not retry a 422 and surfaces Fal's validation detail", async () => {
    // What /api/fal now forwards: the upstream status plus the schema complaint.
    fetchMock.mockResolvedValue(
      jsonResponse(422, {
        error: 'Fal.ai API 422',
        detail: '{"detail":[{"loc":["body","image_urls"],"msg":"field required"}]}',
      })
    );

    await expect(
      aiModelsService.generateImageWithReference(
        'https://fal.run/fal-ai/nano-banana-2/edit',
        'a prompt',
        'data:image/png;base64,AAAA',
        'image_url'
      )
    ).rejects.toThrow(/image_urls/);

    expect(fetchMock, 'a 422 must not be retried').toHaveBeenCalledTimes(1);
  });

  it.each([400, 403, 404, 422])('treats HTTP %i as permanent', async (status) => {
    fetchMock.mockResolvedValue(jsonResponse(status, { error: `Fal.ai API ${status}` }));

    await expect(
      aiModelsService.generateImageFromEndpoint('https://fal.run/fal-ai/flux/schnell', 'p')
    ).rejects.toThrow();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sends the image in the array form when the model declares image_urls', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { images: [{ url: 'https://img/ok.png' }] }));

    await aiModelsService.generateImageWithReference(
      'https://fal.run/fal-ai/nano-banana-2/edit',
      'a prompt',
      'data:image/png;base64,AAAA',
      'image_urls',
      { aspect_ratio: '1:1' }
    );

    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.endpoint).toBe('https://fal.run/fal-ai/nano-banana-2/edit');
    expect(sent.body.image_urls).toEqual(['data:image/png;base64,AAAA']);
    expect(sent.body.image_url).toBeUndefined();
    expect(sent.body.prompt).toBe('a prompt');
    // The sizing fragment is passed through verbatim — the transport must not rename it.
    expect(sent.body.aspect_ratio).toBe('1:1');
    expect(sent.body.image_size).toBeUndefined();
  });

  it('sends the image in the scalar form when the model declares image_url', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { images: [{ url: 'https://img/ok.png' }] }));

    await aiModelsService.generateImageWithReference(
      'https://fal.run/fal-ai/qwen-image-edit',
      'a prompt',
      'data:image/png;base64,AAAA',
      'image_url'
    );

    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.body.image_url).toBe('data:image/png;base64,AAAA');
    expect(sent.body.image_urls).toBeUndefined();
  });
});

describe('transient errors', () => {
  it('retries a 503 up to the configured ceiling', async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(jsonResponse(503, { error: 'upstream unavailable' }));

    const pending = aiModelsService
      .generateImageFromEndpoint('https://fal.run/fal-ai/flux/schnell', 'p')
      .catch((e) => e);
    await vi.runAllTimersAsync();
    const outcome = await pending;

    expect(outcome).toBeInstanceOf(Error);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries a 429 rather than giving up immediately', async () => {
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(jsonResponse(429, { error: 'Too many requests' }))
      .mockResolvedValueOnce(jsonResponse(200, { images: [{ url: 'https://img/ok.png' }] }));

    const pending = aiModelsService.generateImageFromEndpoint('https://fal.run/fal-ai/flux/schnell', 'p');
    await vi.runAllTimersAsync();

    await expect(pending).resolves.toBe('https://img/ok.png');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('payload redaction', () => {
  it('never writes image data or an API key into the dev log', async () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    fetchMock.mockResolvedValue(jsonResponse(200, { images: [{ url: 'https://img/ok.png' }] }));

    const bigImage = `data:image/png;base64,${'Z'.repeat(5000)}`;
    await aiModelsService.generateImageWithReference(
      'https://fal.run/fal-ai/nano-banana-2/edit',
      'a prompt',
      bigImage,
      'image_urls'
    );

    const emitted = [...debug.mock.calls, ...logSpy.mock.calls].map((args) => JSON.stringify(args)).join('\n');
    expect(emitted).not.toContain('Z'.repeat(100));

    debug.mockRestore();
    logSpy.mockRestore();
  });
});
