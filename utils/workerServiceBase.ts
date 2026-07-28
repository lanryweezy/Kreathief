import { log } from './log';

export abstract class WorkerServiceBase {
  protected worker: Worker | null = null;
  protected callbacks: Map<string, { resolve: (val: any) => void; reject: (err: any) => void; timer?: any }> =
    new Map();
  protected serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  protected abstract createWorker(): Worker;

  protected initializeWorker() {
    if (this.worker || typeof window === 'undefined') {
      return;
    }

    try {
      this.worker = this.createWorker();

      this.worker.onmessage = (e) => {
        const { type, id, payload, error } = e.data;
        const callback = this.callbacks.get(id);

        if (callback) {
          if (callback.timer) {
            clearTimeout(callback.timer);
          }
          if (type === 'SUCCESS') {
            callback.resolve(payload);
          } else {
            callback.reject(new Error(error || 'Worker task failed'));
          }
          this.callbacks.delete(id);
        }
      };

      this.worker.onerror = (e) => {
        log.error(`${this.serviceName} Error:`, e);
        // Reject all pending callbacks so UI promises don't hang indefinitely
        for (const [id, callback] of this.callbacks.entries()) {
          if (callback.timer) {
            clearTimeout(callback.timer);
          }
          callback.reject(new Error(`${this.serviceName} crashed: ${e.message || 'Worker error'}`));
        }
        this.callbacks.clear();
        this.worker = null;
      };
    } catch (err) {
      log.error(`Failed to initialize ${this.serviceName}:`, err);
    }
  }

  protected postMessage(
    type: string,
    payload: any,
    transfer?: Transferable[],
    timeoutMs: number = 20000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.initializeWorker();

      if (!this.worker) {
        reject(
          new Error(
            `${this.serviceName} could not be initialized. This might be due to your browser or a network issue.`
          )
        );
        return;
      }
      const id = crypto.randomUUID();

      let timer: any = null;
      if (timeoutMs > 0 && typeof setTimeout !== 'undefined') {
        timer = setTimeout(() => {
          if (this.callbacks.has(id)) {
            this.callbacks.delete(id);
            log.warn(`${this.serviceName} task '${type}' timed out after ${timeoutMs}ms, terminating worker`);
            this.terminate();
            reject(new Error(`${this.serviceName} task '${type}' timed out after ${timeoutMs}ms`));
          }
        }, timeoutMs);
      }

      this.callbacks.set(id, { resolve, reject, timer });

      if (transfer) {
        this.worker.postMessage({ type, payload, id }, transfer);
      } else {
        this.worker.postMessage({ type, payload, id });
      }
    });
  }

  public terminate() {
    for (const [id, callback] of this.callbacks.entries()) {
      if (callback.timer) {
        clearTimeout(callback.timer);
      }
      callback.reject(new Error(`${this.serviceName} terminated`));
    }
    this.callbacks.clear();
    this.worker?.terminate();
    this.worker = null;
  }
}
