import { describe, it, expect } from 'vitest';
import { cacheHeaders, noStoreHeaders } from '../../../utils/cacheHeaders';

describe('cacheHeaders', () => {
  it('returns default cache headers when no ttl is provided', () => {
    const result = cacheHeaders();
    expect(result).toEqual({
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    });
  });

  it('returns custom cache headers when a ttl is provided', () => {
    const result = cacheHeaders(120);
    expect(result).toEqual({
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
    const result = noStoreHeaders();
    expect(result).toEqual({
      'Cache-Control': 'no-store',
    });
  });
});
