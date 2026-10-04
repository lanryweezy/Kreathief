import { applyAutoLayout } from '../layout/autoLayout';

self.onmessage = (e: MessageEvent) => {
  const { type, payload, id } = e.data;
  
  try {
    if (type === 'APPLY_AUTO_LAYOUT') {
      const { layers } = payload;
      // Perform heavy layout math on the worker thread
      const processedLayers = applyAutoLayout(layers);
      self.postMessage({ id, type: 'SUCCESS', payload: processedLayers });
    }
  } catch (error: any) {
    self.postMessage({ id, type: 'ERROR', error: error.message });
  }
};
