export function cacheHeaders(ttl?: number): Record<string, string> {
  const maxAge = ttl ?? 60;
  return {
    'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 5}`,
  };
}

export function noStoreHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-store',
  };
}
