export const runExportWorker = async (action: string, artboards: any[], options: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/export.worker.ts', import.meta.url), { type: 'module' });
    const jobId = crypto.randomUUID();

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.id === jobId) {
        if (e.data.status === 'SUCCESS') {
          resolve(e.data.payload);
        } else {
          reject(new Error(e.data.error));
        }
        worker.terminate();
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
    };

    worker.postMessage({
      id: jobId,
      action,
      artboards,
      options,
    });
  });
};
