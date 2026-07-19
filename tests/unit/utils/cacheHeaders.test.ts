import { describe, it, expect } from 'vitest';
import { cacheHeaders, noStoreHeaders } from '../../../utils/cacheHeaders';

describe('cacheHeaders', () => {
  it('returns default cache headers when no ttl is provided', () => {
    const headers = cacheHeaders();
    expect(headers).toEqual({
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    });
  });

  it('returns cache headers based on the provided ttl', () => {
    const headers = cacheHeaders(120);
    expect(headers).toEqual({
      'Cache-Control': 'public, max-age=120, stale-while-revalidate=600',
    });
  });

  it('handles a ttl of 0 correctly', () => {
    const result = cacheHeaders(0);
    expect(result).toEqual({
      'Cache-Control': 'public, max-age=0, stale-while-revalidate=0',
    });
  });
});

describe('noStoreHeaders', () => {
  it('returns no-store cache headers', () => {
    const headers = noStoreHeaders();
    expect(headers).toEqual({
      'Cache-Control': 'no-store',
    });
  });
});
