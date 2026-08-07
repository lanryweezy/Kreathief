import { describe, it, expect } from 'vitest';
import { cacheHeaders, noStoreHeaders } from '../../utils/cacheHeaders';

describe('cacheHeaders', () => {
  it('should return default cache headers when no ttl is provided', () => {
    const headers = cacheHeaders();
    expect(headers).toEqual({
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    });
  });

  it('should return cache headers with custom ttl', () => {
    const headers = cacheHeaders(120);
    expect(headers).toEqual({
      'Cache-Control': 'public, max-age=120, stale-while-revalidate=600',
    });
  });
});

describe('noStoreHeaders', () => {
  it('should return no-store cache headers', () => {
    const headers = noStoreHeaders();
    expect(headers).toEqual({
      'Cache-Control': 'no-store',
    });
  });
});
