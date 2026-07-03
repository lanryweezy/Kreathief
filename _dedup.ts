const inflight = new Map<string, Promise<any>>();

export function dedupRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (inflight.has(key)) {
    return inflight.get(key)!;
  }
  const promise = fn().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}
