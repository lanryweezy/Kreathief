import { env, AutoModel, AutoProcessor, RawImage } from '@xenova/transformers';

// Configure transformers.js for browser environment
env.allowLocalModels = false;
env.useBrowserCache = true;
// Disable multithreading if it causes issues, but try leaving it on for performance
// env.backends.onnx.wasm.numThreads = 1;

let model: any = null;
let processor: any = null;
let isReady = false;
let currentImageEmbeddings: any = null;

self.onmessage = async (e) => {
  const { type, data } = e.data;

  try {
    switch (type) {
      case 'INIT':
        await initializeModel();
        break;

      case 'PROCESS_IMAGE':
        await processImage(data.imageData, data.width, data.height);
        break;

      case 'INFER_MASK': {
        const mask = await inferMask(data.x, data.y);
        self.postMessage({ type: 'MASK_RESULT', data: mask });
        break;
      }
    }
  } catch (err: any) {
    self.postMessage({ type: 'ERROR', error: err.message || 'Worker error' });
  }
};

async function initializeModel() {
  if (isReady) {
    self.postMessage({ type: 'READY' });
    return;
  }

  try {
    self.postMessage({ type: 'STATUS', status: 'Loading SAM model...' });

    // Xenova/slimsam-77-uniform is a highly compressed version of SAM for the web
    model = await AutoModel.from_pretrained('Xenova/slimsam-77-uniform', {
      quantized: true,
    });
    processor = await AutoProcessor.from_pretrained('Xenova/slimsam-77-uniform');

    isReady = true;
    self.postMessage({ type: 'READY' });
  } catch (e: any) {
    console.error('Failed to load SAM model', e);
    throw new Error('Failed to load SAM model: ' + e.message);
  }
}

async function processImage(imageData: ImageData, width: number, height: number) {
  if (!isReady) throw new Error('Model not initialized');

  self.postMessage({ type: 'STATUS', status: 'Generating image embeddings...' });

  const rawImage = new RawImage(new Uint8ClampedArray(imageData.data), width, height, 4);

  // Pre-process image
  const inputs = await processor(rawImage);

  // Generate embeddings
  const image_embeddings = await model.get_image_embeddings(inputs.pixel_values);

  currentImageEmbeddings = image_embeddings;

  self.postMessage({ type: 'EMBEDDINGS_READY' });
}

async function inferMask(x: number, y: number) {
  if (!isReady || !currentImageEmbeddings) {
    throw new Error('Model or embeddings not ready');
  }

  // Define input point
  const input_points = [[[x, y]]];
  const input_labels = [[1]]; // 1 indicates a positive point

  // Prepare inputs for the mask decoder
  // Note: we spread the image embeddings and add our points
  const inputs = {
    ...currentImageEmbeddings,
    input_points: input_points,
    input_labels: input_labels,
  };

  // Generate masks
  const outputs = await model(inputs);

  // Extract the best mask
  const mask = outputs.pred_masks[0][0];
  const score = outputs.iou_scores[0][0];

  return {
    mask: Array.from(mask.data), // Convert to regular array for postMessage
    dimensions: mask.dims,
    score: Array.from(score.data)[0],
  };
}
