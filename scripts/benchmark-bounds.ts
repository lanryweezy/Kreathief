import { GeometryOracle } from '../utils/geometryOracle';
import { Layer } from '../types';

const numLayers = 10000;
const layers: Layer[] = [];

for (let i = 0; i < numLayers; i++) {
  layers.push({
    id: `layer-${i}`,
    type: 'text',
    x: Math.random() * 1000,
    y: Math.random() * 1000,
    width: Math.random() * 100 + 10,
    height: Math.random() * 100 + 10,
    rotation: Math.random() * 360,
    fontSize: 12,
    text: 'Test',
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    color: '#000',
    opacity: 1,
    visible: true,
    locked: false,
  } as any);
}

// Restore unoptimized method for baseline
const unoptimizedMethod = function(layers: Layer[]) {
    if (layers.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const bounds = layers.map((l) => GeometryOracle.getTransformationBounds(l));

    const minX = Math.min(...bounds.map((b) => b.x));
    const minY = Math.min(...bounds.map((b) => b.y));
    const maxX = Math.max(...bounds.map((b) => b.x + b.width));
    const maxY = Math.max(...bounds.map((b) => b.y + b.height));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
}

const start = performance.now();
for (let i = 0; i < 100; i++) {
  unoptimizedMethod(layers);
}
const end = performance.now();

console.log(`Baseline time taken: ${(end - start).toFixed(2)}ms`);

const startOpt = performance.now();
for (let i = 0; i < 100; i++) {
  GeometryOracle.getGroupBounds(layers);
}
const endOpt = performance.now();

console.log(`Optimized time taken: ${(endOpt - startOpt).toFixed(2)}ms`);

// Calculate percentage improvement
const improvement = ((end - start) - (endOpt - startOpt)) / (end - start) * 100;
console.log(`Improvement: ${improvement.toFixed(2)}%`);
