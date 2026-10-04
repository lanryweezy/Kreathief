import { log } from './log';
import { useStore } from '../store/useStore';
import { v4 as uuidv4 } from 'uuid';
import { Layer, ShapeLayer } from '../types';

export function generateStressTestLayers(count: number, canvasWidth: number, canvasHeight: number): Layer[] {
  const newLayers: Layer[] = [];
  const colors = ['#7c3aed', '#00c4cc', '#f87171', '#34d399', '#fbbf24', '#000000', '#ffffff'];

  for (let i = 0; i < count; i++) {
    const isText = Math.random() > 0.8;
    const x = Math.random() * (canvasWidth - 50);
    const y = Math.random() * (canvasHeight - 50);
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    if (isText) {
      newLayers.push({
        id: uuidv4(),
        type: 'text',
        name: `Text ${i}`,
        x,
        y,
        width: 100,
        height: 40,
        text: 'Benchmark',
        fontFamily: 'Inter',
        fontSize: 16,
        color,
        fontWeight: 'normal',
        textAlign: 'left',
        rotation: Math.random() * 360,
        opacity: 100,
        blendMode: 'normal',
        locked: false,
        hidden: false,
      } as any);
    } else {
      newLayers.push({
        id: uuidv4(),
        type: 'rectangle',
        name: `Shape ${i}`,
        x,
        y,
        width: Math.random() * 100 + 20,
        height: Math.random() * 100 + 20,
        color,
        rotation: Math.random() * 360,
        opacity: 100,
        blendMode: 'normal',
        locked: false,
        hidden: false,
      } as any);
    }
  }

  return newLayers;
}

export async function runFpsBenchmark(durationMs: number = 2000): Promise<number> {
  return new Promise((resolve) => {
    let frameCount = 0;
    let startTime = performance.now();

    function frame(time: number) {
      if (time - startTime < durationMs) {
        frameCount++;
        requestAnimationFrame(frame);
      } else {
        const elapsed = time - startTime;
        const fps = (frameCount / elapsed) * 1000;
        resolve(fps);
      }
    }

    requestAnimationFrame((time) => {
      startTime = time;
      requestAnimationFrame(frame);
    });
  });
}

export async function executeFullBenchmarkSuite() {
  const store = useStore.getState();
  const artboards = store.artboards;
  const activeArtboardId = store.activeArtboardId;
  const currentArtboard = artboards.find(a => a.id === activeArtboardId);
  
  if (!currentArtboard) {
    log.error('No active artboard to run benchmarks');
    return;
  }

  log.info('--- Starting Kreathief FPS Benchmark ---');
  const thresholds = [100, 500, 1000, 5000];
  const results: Record<number, number> = {};

  // Preserve existing layers to restore later
  const originalLayers = [...currentArtboard.layers];

  for (const count of thresholds) {
    log.info(`Generating ${count} layers...`);
    
    // Clear canvas
    store.updateArtboard(activeArtboardId, { layers: [] });
    
    // Generate new stress layers
    const stressLayers = generateStressTestLayers(count, currentArtboard.width, currentArtboard.height);
    
    // Add all layers
    store.addLayers(stressLayers);
    
    // Wait a brief moment for React to finish rendering the DOM nodes
    await new Promise(r => setTimeout(r, 500));
    
    log.info(`Measuring FPS for ${count} layers...`);
    const fps = await runFpsBenchmark(2000); // Sample over 2 seconds
    
    results[count] = Math.round(fps);
    log.info(`Result: ${count} layers -> ${results[count]} FPS`);
  }

  // Restore original layers
  store.updateArtboard(activeArtboardId, { layers: originalLayers });
  
  log.info('--- Benchmark Complete ---', results);
  store.addToast(`Benchmark complete: 1K layers @ ${results[1000]} FPS`, 'success');
}
