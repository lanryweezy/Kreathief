import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkerServiceBase } from '../../utils/workerServiceBase';
import { log } from '../../utils/log';

vi.mock('../../utils/log', () => ({
  log: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

class MockWorker {
  onmessage: ((e: any) => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
}

class TestWorkerService extends WorkerServiceBase {
  public mockWorkerInstance: MockWorker;

  constructor() {
    super('TestService');
    this.mockWorkerInstance = new MockWorker();
  }

  protected createWorker(): Worker {
    return this.mockWorkerInstance as unknown as Worker;
  }

  public send(type: string, payload: any, timeoutMs?: number) {
    return this.postMessage(type, payload, undefined, timeoutMs);
  }

  public getCallbacksMap() {
    return this.callbacks;
  }

  public getWorkerInstance() {
    return this.worker;
  }
}

describe('WorkerServiceBase', () => {
  let service: TestWorkerService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new TestWorkerService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should initialize worker on first postMessage', () => {
    expect(service.getWorkerInstance()).toBeNull();
    service.send('TEST_TASK', { data: 123 }, 1000);
    expect(service.getWorkerInstance()).toBe(service.mockWorkerInstance);
  });

  it('should handle SUCCESS response', async () => {
    const promise = service.send('TEST_TASK', { data: 123 }, 1000);

    // Get the ID that was generated
    const id = service.mockWorkerInstance.postMessage.mock.calls[0][0].id;

    // Simulate worker success response
    if (service.mockWorkerInstance.onmessage) {
      service.mockWorkerInstance.onmessage({
        data: {
          type: 'SUCCESS',
          id: id,
          payload: 'success result',
        },
      });
    }

    const result = await promise;
    expect(result).toBe('success result');
    expect(service.getCallbacksMap().size).toBe(0);
  });

  it('should handle ERROR response', async () => {
    const promise = service.send('TEST_TASK', { data: 123 }, 1000);

    const id = service.mockWorkerInstance.postMessage.mock.calls[0][0].id;

    if (service.mockWorkerInstance.onmessage) {
      service.mockWorkerInstance.onmessage({
        data: {
          type: 'ERROR',
          id: id,
          error: 'Something went wrong',
        },
      });
    }

    await expect(promise).rejects.toThrow('Something went wrong');
    expect(service.getCallbacksMap().size).toBe(0);
  });

  it('should timeout if no response received', async () => {
    const promise = service.send('TEST_TASK', { data: 123 }, 1000);

    // Advance time by 1000ms
    vi.advanceTimersByTime(1000);

    await expect(promise).rejects.toThrow("TestService task 'TEST_TASK' timed out after 1000ms");
    expect(service.getCallbacksMap().size).toBe(0);
    expect(log.warn).toHaveBeenCalled();
  });

  it('should handle worker onerror event', async () => {
    const promise = service.send('TEST_TASK', { data: 123 }, 1000);

    if (service.mockWorkerInstance.onerror) {
      service.mockWorkerInstance.onerror({ message: 'Fatal crash' });
    }

    await expect(promise).rejects.toThrow('TestService crashed: Fatal crash');
    expect(service.getCallbacksMap().size).toBe(0);
    expect(service.getWorkerInstance()).toBeNull();
    expect(log.error).toHaveBeenCalled();
  });

  it('should terminate worker and reject pending callbacks', async () => {
    const promise = service.send('TEST_TASK', { data: 123 }, 1000);

    service.terminate();

    await expect(promise).rejects.toThrow('TestService terminated');
    expect(service.getCallbacksMap().size).toBe(0);
    expect(service.mockWorkerInstance.terminate).toHaveBeenCalled();
    expect(service.getWorkerInstance()).toBeNull();
  });
});
