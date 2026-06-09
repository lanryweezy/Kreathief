import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../../../utils/debounce';

describe('Debounce', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should execute only once after the wait time', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc();
    debouncedFunc();
    debouncedFunc();

    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledTimes(1);
  });
});
