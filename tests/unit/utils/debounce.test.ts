import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, throttle } from '../../../utils/debounce';

describe('Debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
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

  it('should pass arguments to the debounced function', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc('test', 123);
    vi.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledWith('test', 123);
  });

  it('should cancel the debounced execution', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc();
    debouncedFunc.cancel();

    vi.advanceTimersByTime(100);

    expect(func).not.toHaveBeenCalled();
  });
});

describe('Throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should execute immediately on the first call', () => {
    const func = vi.fn();
    const throttledFunc = throttle(func, 100);

    throttledFunc();

    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should ignore calls during the throttle period', () => {
    const func = vi.fn();
    const throttledFunc = throttle(func, 100);

    throttledFunc();
    throttledFunc();
    throttledFunc();

    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should allow calls after the throttle period has passed', () => {
    const func = vi.fn();
    const throttledFunc = throttle(func, 100);

    throttledFunc();
    vi.advanceTimersByTime(100);
    throttledFunc();

    expect(func).toHaveBeenCalledTimes(2);
  });

  it('should cancel the throttle period', () => {
    const func = vi.fn();
    const throttledFunc = throttle(func, 100);

    throttledFunc();
    throttledFunc.cancel();
    throttledFunc();

    expect(func).toHaveBeenCalledTimes(2);
  });
});
