import * as ort from 'onnxruntime-web/webgpu';

// Specify wasm paths if needed
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/';

let session: ort.InferenceSession | null = null;
let isReady = false;

// We will use Carve/LaMa-ONNX fp32 model
const MODEL_URL = 'https://huggingface.co/Carve/LaMa-ONNX/resolve/main/lama_fp32.onnx';

async function initSession() {
  if (isReady && session) return;

  try {
    postMessage({ type: 'STATUS', status: 'Downloading LaMa Inpainting model (200MB)... This only happens once.' });

    // Create session with webgpu backend, fallback to wasm
    session = await ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ['webgpu', 'wasm'],
    });

    isReady = true;
    postMessage({ type: 'READY' });
  } catch (error: any) {
    postMessage({ type: 'ERROR', error: error.message });
  }
}

/**
 * Preprocess image and mask to [1, 3, 512, 512] and [1, 1, 512, 512] tensors.
 * We expect the ImageData and MaskData to already be exactly 512x512.
 */
function preprocess(imageData: ImageData, maskData: ImageData) {
  const width = 512;
  const height = 512;

  const imageFloat32 = new Float32Array(1 * 3 * width * height);
  const maskFloat32 = new Float32Array(1 * 1 * width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Image normalization (assumes LaMa expects 0-1 range or normalized RGB)
      // Usually LaMa takes 0-1 range for image and mask
      const r = imageData.data[idx] / 255.0;
      const g = imageData.data[idx + 1] / 255.0;
      const b = imageData.data[idx + 2] / 255.0;

      imageFloat32[y * width + x] = r;
      imageFloat32[width * height + y * width + x] = g;
      imageFloat32[2 * width * height + y * width + x] = b;

      // Mask: binary mask (0 or 1) - using red channel assuming it's grayscale
      const maskVal = maskData.data[idx] > 127 ? 1.0 : 0.0;
      maskFloat32[y * width + x] = maskVal;
    }
  }

  const imageTensor = new ort.Tensor('float32', imageFloat32, [1, 3, height, width]);
  const maskTensor = new ort.Tensor('float32', maskFloat32, [1, 1, height, width]);

  return { imageTensor, maskTensor };
}

/**
 * Postprocess the [1, 3, 512, 512] tensor back into ImageData
 */
function postprocess(outputTensor: ort.Tensor): ImageData {
  const width = 512;
  const height = 512;
  const data = outputTensor.data as Float32Array;

  const outputClamped = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = data[y * width + x] * 255.0;
      const g = data[width * height + y * width + x] * 255.0;
      const b = data[2 * width * height + y * width + x] * 255.0;

      const idx = (y * width + x) * 4;
      outputClamped[idx] = Math.max(0, Math.min(255, Math.round(r)));
      outputClamped[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      outputClamped[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      outputClamped[idx + 3] = 255; // Alpha
    }
  }

  return new ImageData(outputClamped, width, height);
}

self.onmessage = async (e: MessageEvent) => {
  const { type, data } = e.data;

  if (type === 'INIT') {
    await initSession();
  } else if (type === 'INPAINT') {
    if (!isReady || !session) {
      postMessage({ type: 'ERROR', error: 'Model not initialized' });
      return;
    }

    try {
      postMessage({ type: 'STATUS', status: 'Preprocessing tensors...' });
      const { imageData, maskData } = data; // Expected to be 512x512
      const { imageTensor, maskTensor } = preprocess(imageData, maskData);

      postMessage({ type: 'STATUS', status: 'Running LaMa WebGPU...' });

      // The input names vary by export. For Carve/LaMa-ONNX it is usually "image" and "mask"
      const inputNames = session.inputNames;
      const inputs: Record<string, ort.Tensor> = {};

      // Attempt to automatically map inputs
      if (inputNames.includes('image')) inputs['image'] = imageTensor;
      else if (inputNames[0]) inputs[inputNames[0]] = imageTensor;

      if (inputNames.includes('mask')) inputs['mask'] = maskTensor;
      else if (inputNames[1]) inputs[inputNames[1]] = maskTensor;

      const results = await session.run(inputs);

      const outputName = session.outputNames[0];
      const outputTensor = results[outputName];

      postMessage({ type: 'STATUS', status: 'Postprocessing tensors...' });
      const resultImageData = postprocess(outputTensor);

      postMessage({ type: 'INPAINT_RESULT', data: resultImageData });
    } catch (err: any) {
      postMessage({ type: 'ERROR', error: err.message });
    }
  }
};
