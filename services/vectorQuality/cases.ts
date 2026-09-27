import { DesignNode } from '../../types/design';

/**
 * Canonical vector-design fixtures used by the output-quality benchmark.
 *
 * Each is passed through the real production serializer
 * (`services/exportService.exportToSvg`) — we do NOT hand-write SVG here, so the
 * metrics reflect what a customer actually downloads.
 *
 * `raster-trap` is a deliberate negative control: it feeds the serializer an
 * image-filled shape, which is exactly the "raster pretending to be a vector"
 * failure mode a critic would test for. The benchmark asserts the analyzer
 * catches it, so a green run means something.
 */
export interface BenchmarkCase {
  name: string;
  width: number;
  height: number;
  background: boolean | string;
  nodes: DesignNode[];
  /** True for negative controls that are *expected* to score poorly. */
  expectRaster?: boolean;
}

const base = (over: Partial<DesignNode>): DesignNode => ({
  id: 'n',
  type: 'rect',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  ...over,
});

export const BENCHMARK_CASES: BenchmarkCase[] = [
  {
    name: 'logo-mark',
    width: 240,
    height: 240,
    background: false,
    nodes: [
      base({
        id: 'drop',
        type: 'path',
        x: 20,
        y: 20,
        width: 200,
        height: 200,
        viewBox: '0 0 100 100',
        pathData: 'M50 6 C74 34 86 58 50 94 C14 58 26 34 50 6 Z',
        fill: '#7C3AED',
      }),
      base({ id: 'accent', type: 'ellipse', x: 96, y: 60, width: 48, height: 48, fill: '#F59E0B' }),
    ],
  },
  {
    name: 'wordmark',
    width: 480,
    height: 160,
    background: '#0B1020',
    nodes: [
      base({
        id: 'word',
        type: 'text',
        x: 40,
        y: 60,
        width: 400,
        height: 60,
        text: 'KREATHIEF',
        fontSize: 56,
        fontFamily: 'Inter',
        fontWeight: '800',
        fill: '#FFFFFF',
      }),
    ],
  },
  {
    name: 'boolean-badge',
    width: 200,
    height: 200,
    background: false,
    nodes: [
      base({
        id: 'ring',
        type: 'path',
        x: 10,
        y: 10,
        width: 180,
        height: 180,
        viewBox: '0 0 100 100',
        pathData: 'M50 4 A46 46 0 1 0 50 96 A46 46 0 1 0 50 4 Z M50 20 A30 30 0 1 1 50 80 A30 30 0 1 1 50 20 Z',
        fill: '#22D3EE',
      }),
      base({
        id: 'label',
        type: 'text',
        x: 60,
        y: 86,
        width: 80,
        height: 30,
        text: 'PRO',
        fontSize: 28,
        fontWeight: '700',
        fill: '#0F172A',
      }),
    ],
  },
  {
    name: 'icon-trio',
    width: 300,
    height: 120,
    background: false,
    nodes: [
      base({ id: 'sq', type: 'rect', x: 10, y: 20, width: 80, height: 80, cornerRadius: 12, fill: '#EF4444' }),
      base({ id: 'ci', type: 'ellipse', x: 110, y: 20, width: 80, height: 80, fill: '#10B981' }),
      base({
        id: 'tr',
        type: 'path',
        x: 210,
        y: 20,
        width: 80,
        height: 80,
        viewBox: '0 0 100 100',
        pathData: 'M50 5 L95 95 L5 95 Z',
        fill: '#3B82F6',
      }),
    ],
  },
  {
    name: 'raster-trap',
    width: 200,
    height: 200,
    background: false,
    expectRaster: true,
    nodes: [
      base({
        id: 'fake',
        type: 'path',
        x: 10,
        y: 10,
        width: 180,
        height: 180,
        viewBox: '0 0 100 100',
        pathData: 'M10 10 L90 10 L90 90 L10 90 Z',
        fill: '#111827',
        imageFill: { src: 'https://example.com/photo.png' },
      }),
    ],
  },
];
