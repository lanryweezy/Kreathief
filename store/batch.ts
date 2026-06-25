import { useStore } from './useStore';

/**
 * Run a function within a single history batch.
 * Ensures multiple state updates coalesce into one undo step.
 */
export function runBatched<T>(fn: () => T | Promise<T>): Promise<T> | T {
  const { beginBatch, endBatch } = useStore.getState() as any;
  beginBatch?.();
  const res = fn();
  if (res instanceof Promise) {
    return res.finally(() => endBatch?.()) as Promise<T>;
  }
  endBatch?.();
  return res;
}
