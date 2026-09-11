export interface ShapeDefinition {
  name: string;
  type: string;
  pathData: string;
  viewBox: string;
  category: 'basic' | 'geometric' | 'decorative' | 'ui' | 'arrows' | 'stars' | 'frames' | 'blobs' | 'badges';
}

export const SHAPE_LIBRARY: ShapeDefinition[] = [
  // --- BASIC ---
  {
    name: 'Square',
    type: 'path',
    pathData: 'M 0,0 H 100 V 100 H 0 Z',
    viewBox: '0 0 100 100',
    category: 'basic',
  },
  {
    name: 'Circle',
    type: 'path',
    pathData: 'M 50,0 A 50,50 0 1,1 50,100 A 50,50 0 1,1 50,0',
    viewBox: '0 0 100 100',
    category: 'basic',
  },
  {
    name: 'Triangle',
    type: 'path',
    pathData: 'M 50,0 L 100,100 L 0,100 Z',
    viewBox: '0 0 100 100',
    category: 'basic',
  },
  {
    name: 'Line',
    type: 'path',
    pathData: 'M 0,48 H 100 V 52 H 0 Z',
    viewBox: '0 0 100 100',
    category: 'basic',
  },

  // --- GEOMETRIC ---
  {
    name: 'Pentagon',
    type: 'path',
    pathData: 'M 50,0 L 98,35 L 80,91 L 20,91 L 2,35 Z',
    viewBox: '0 0 100 100',
    category: 'geometric',
  },
  {
    name: 'Hexagon',
    type: 'path',
    pathData: 'M 25,0 L 75,0 L 100,43 L 75,86 L 25,86 L 0,43 Z',
    viewBox: '0 0 100 86',
    category: 'geometric',
  },
  // --- GOLDEN RATIO ---
  {
    name: 'Golden Rect',
    type: 'path',
    pathData: 'M 0,19.1 H 100 V 80.9 H 0 Z',
    viewBox: '0 0 100 100',
    category: 'geometric',
  },
  {
    name: 'Golden Spiral',
    type: 'path',
    pathData:
      'M 100 61.8 A 61.8 61.8 0 0 0 38.2 0 A 38.2 38.2 0 0 0 0 38.2 A 23.6 23.6 0 0 0 23.6 61.8 A 14.6 14.6 0 0 0 38.2 47.2',
    viewBox: '0 0 100 100',
    category: 'geometric',
  },
  {
    name: 'Heptagon', // Assuming this was the intended name for the malformed object
    type: 'path',
    pathData: 'M 25,0 H 75 L 100,50 L 75,100 H 25 L 0,50 Z',
    viewBox: '0 0 100 100',
    category: 'geometric',
  },
  {
    name: 'Octagon',
    type: 'path',
    pathData: 'M 29,0 H 71 L 100,29 V 71 L 71,100 H 29 L 0,71 V 29 Z',
    viewBox: '0 0 100 100',
    category: 'geometric',
  },
  {
    name: 'Diamond',
    type: 'path',
    pathData: 'M 50,0 L 100,50 L 50,100 L 0,50 Z',
    viewBox: '0 0 100 100',
    category: 'geometric',
  },
  {
    name: 'Rhombus',
    type: 'path',
    pathData: 'M 50,0 L 90,50 L 50,100 L 10,50 Z',
    viewBox: '0 0 100 100',
    category: 'geometric',
  },

  // --- STARS ---
  {
    name: 'Star 4',
    type: 'path',
    pathData: 'M 50,0 L 60,40 L 100,50 L 60,60 L 50,100 L 40,60 L 0,50 L 40,40 Z',
    viewBox: '0 0 100 100',
    category: 'stars',
  },
  {
    name: 'Star 5',
    type: 'path',
    pathData: 'M 50,0 L 61,35 H 98 L 68,57 L 79,91 L 50,70 L 21,91 L 32,57 L 2,35 H 39 Z',
    viewBox: '0 0 100 100',
    category: 'stars',
  },
  {
    name: 'Star 6',
    type: 'path',
    pathData: 'M 50,0 L 65,25 H 95 L 80,50 L 95,75 H 65 L 50,100 L 35,75 H 5 L 20,50 L 5,25 H 35 Z',
    viewBox: '0 0 100 100',
    category: 'stars',
  },
  {
    name: 'Star 8',
    type: 'path',
    pathData: 'M 50,0 L 58,35 L 91,25 L 75,50 L 91,75 L 58,65 L 50,100 L 42,65 L 9,75 L 25,50 L 9,25 L 42,35 Z',
    viewBox: '0 0 100 100',
    category: 'stars',
  },
  {
    name: 'Star 12',
    type: 'path',
    pathData:
      'M 50,0 L 56,30 L 75,13 L 75,40 L 97,35 L 87,55 L 100,75 L 75,75 L 70,100 L 50,85 L 30,100 L 25,75 L 0,75 L 13,55 L 3,35 L 25,40 L 25,13 L 44,30 Z',
    viewBox: '0 0 100 100',
    category: 'stars',
  },

  // --- ARROWS ---
  {
    name: 'Arrow Right',
    type: 'path',
    pathData: 'M 0,35 H 65 V 15 L 100,50 L 65,85 V 65 H 0 Z',
    viewBox: '0 0 100 100',
    category: 'arrows',
  },
  {
    name: 'Two Sided Arrow',
    type: 'path',
    pathData: 'M 0,50 L 25,25 V 40 H 75 V 25 L 100,50 L 75,75 V 60 H 25 V 75 Z',
    viewBox: '0 0 100 100',
    category: 'arrows',
  },
  {
    name: 'Curved Arrow',
    type: 'path',
    pathData: 'M 20,80 C 20,40 50,20 80,40 V 20 L 100,50 L 80,80 V 60 C 60,50 40,65 40,80 Z',
    viewBox: '0 0 100 100',
    category: 'arrows',
  },

  // --- DECORATIVE ---
  {
    name: 'Heart',
    type: 'path',
    pathData:
      'M 50,88 C 50,88 15,65 15,38 C 15,22 28,12 40,12 C 45,12 50,15 50,15 C 50,15 55,12 60,12 C 72,12 85,22 85,38 C 85,65 50,88 50,88 Z',
    viewBox: '0 0 100 100',
    category: 'decorative',
  },
  {
    name: 'Speech Bubble',
    type: 'path',
    pathData: 'M 10,10 H 90 V 70 H 60 L 40,90 L 30,70 H 10 Z',
    viewBox: '0 0 100 100',
    category: 'decorative',
  },
  {
    name: 'Rounded Bubble',
    type: 'path',
    pathData:
      'M 10,10 A 10,10 0 0,1 20,0 H 80 A 10,10 0 0,1 90,10 V 60 A 10,10 0 0,1 80,70 H 50 L 30,90 L 30,70 H 20 A 10,10 0 0,1 10,60 Z',
    viewBox: '0 0 100 100',
    category: 'decorative',
  },
  {
    name: 'Pill',
    type: 'path',
    pathData: 'M 25,25 H 75 A 25,25 0 0,1 75,75 H 25 A 25,25 0 0,1 25,25 Z',
    viewBox: '0 0 100 100',
    category: 'decorative',
  },
  {
    name: 'Ribbon',
    type: 'path',
    pathData: 'M 0,20 H 100 V 60 L 85,50 L 100,40 V 80 H 0 V 40 L 15,50 L 0,60 Z',
    viewBox: '0 0 100 100',
    category: 'decorative',
  },
  {
    name: 'Cloud',
    type: 'path',
    pathData: 'M 25,60 C 12,60 12,45 25,45 C 25,25 50,25 50,40 C 60,25 85,25 85,45 C 98,45 98,60 85,60 Z',
    viewBox: '0 0 100 100',
    category: 'decorative',
  },
  {
    name: 'Cross',
    type: 'path',
    pathData: 'M 40,0 H 60 V 40 H 100 V 60 H 60 V 100 H 40 V 60 H 0 V 40 H 40 Z',
    viewBox: '0 0 100 100',
    category: 'decorative',
  },
  {
    name: 'Shield',
    type: 'path',
    pathData: 'M 50,0 L 90,15 V 60 C 90,80 50,100 50,100 C 50,100 10,80 10,60 V 15 Z',
    viewBox: '0 0 100 100',
    category: 'decorative',
  },

  // --- UI ---
  {
    name: 'Rounded Square',
    type: 'path',
    pathData:
      'M 10,10 H 90 A 10,10 0 0 1 100,20 V 80 A 10,10 0 0 1 90,90 H 10 A 10,10 0 0 1 0,80 V 20 A 10,10 0 0 1 10,10 Z',
    viewBox: '0 0 100 100',
    category: 'ui',
  },
  // --- NATURE & ICONS ---
  {
    name: 'Sun',
    type: 'path',
    pathData:
      'M50 0L50 20M50 80L50 100M0 50L20 50M80 50L100 50M14.6 14.6L28.8 28.8M71.2 71.2L85.4 85.4M14.6 85.4L28.8 71.2M71.2 28.8L85.4 14.6M50 30A20 20 0 1 0 50 70A20 20 0 1 0 50 30Z',
    viewBox: '0 0 100 100',
    category: 'decorative',
  },
  {
    name: 'Moon',
    type: 'path',
    pathData: 'M 75,10 A 35,35 0 1,0 75,90 A 25,25 0 1,1 75,10 Z',
    viewBox: '0 0 100 100',
    category: 'decorative',
  },
  {
    name: 'Lightning',
    type: 'path',
    pathData: 'M 45,0 L 75,0 L 50,45 L 75,45 L 25,100 L 40,55 L 20,55 L 45,0 Z',
    viewBox: '0 0 100 100',
    category: 'decorative',
  },
  {
    name: 'Water Drop',
    type: 'path',
    pathData: 'M 50,0 C 50,0 15,40 15,65 A 35,35 0 0,0 85,65 C 85,40 50,0 50,0 Z',
    viewBox: '0 0 100 100',
    category: 'decorative',
  },
  {
    name: 'Flame',
    type: 'path',
    pathData:
      'M 50,100 C 50,100 20,75 20,50 C 20,25 40,10 50,0 C 60,10 80,25 80,50 C 80,75 50,100 50,100 M 50,85 C 50,85 65,65 65,50 C 65,35 55,25 50,20 C 45,25 35,35 35,50 C 35,65 50,85 50,85 Z',
    viewBox: '0 0 100 100',
    category: 'decorative',
  },
  {
    name: 'Flower',
    type: 'path',
    pathData:
      'M 50,35 A 15,15 0 1,0 50,65 A 15,15 0 1,0 50,35 M 50,20 A 15,15 0 0,1 65,35 A 15,15 0 0,1 80,50 A 15,15 0 0,1 65,65 A 15,15 0 0,1 50,80 A 15,15 0 0,1 35,65 A 15,15 0 0,1 20,50 A 15,15 0 0,1 35,35 A 15,15 0 0,1 50,20 Z',
    viewBox: '0 0 100 100',
    category: 'decorative',
  },
  {
    name: 'Leaf',
    type: 'path',
    pathData:
      'M 50,100 C 50,100 0,60 0,30 C 0,10 20,0 50,0 C 80,0 100,10 100,30 C 100,60 50,100 50,100 M 50,100 L 50,20',
    viewBox: '0 0 100 100',
    category: 'decorative',
  },
  {
    name: 'Puzzle',
    type: 'path',
    pathData:
      'M 20,20 H 40 A 10,10 0 0,0 60,20 H 80 V 40 A 10,10 0 0,0 80,60 V 80 H 60 A 10,10 0 0,1 40,80 H 20 V 60 A 10,10 0 0,1 20,40 V 20 Z',
    viewBox: '0 0 100 100',
    category: 'ui',
  },
  {
    name: 'Crown',
    type: 'path',
    pathData: 'M 10,80 L 10,30 L 30,50 L 50,10 L 70,50 L 90,30 L 90,80 H 10 Z',
    viewBox: '0 0 100 100',
    category: 'decorative',
  },
  {
    name: 'Checkmark',
    type: 'path',
    pathData: 'M 10,50 L 35,80 L 90,20 L 80,10 L 35,60 L 20,40 Z',
    viewBox: '0 0 100 100',
    category: 'ui',
  },
  {
    name: 'X Mark',
    type: 'path',
    pathData: 'M 20,10 L 50,40 L 80,10 L 90,20 L 60,50 L 90,80 L 80,90 L 50,60 L 20,90 L 10,80 L 40,50 L 10,20 Z',
    viewBox: '0 0 100 100',
    category: 'ui',
  },
  {
    name: 'Play',
    type: 'path',
    pathData: 'M 20,10 L 90,50 L 20,90 Z',
    viewBox: '0 0 100 100',
    category: 'ui',
  },
  {
    name: 'Pause',
    type: 'path',
    pathData: 'M 25,15 H 40 V 85 H 25 Z M 60,15 H 75 V 85 H 60 Z',
    viewBox: '0 0 100 100',
    category: 'ui',
  },
  {
    name: 'Blob',
    type: 'path',
    pathData: 'M 50,10 C 70,10 90,30 90,50 C 90,70 70,100 50,90 C 20,80 10,60 10,50 C 10,30 30,10 50,10 Z',
    viewBox: '0 0 100 100',
    category: 'decorative',
  },
  {
    name: 'Burst',
    type: 'path',
    pathData: 'M 50,0 L 60,30 L 90,20 L 75,50 L 100,75 L 70,80 L 50,100 L 30,80 L 0,75 L 25,50 L 10,20 L 40,30 Z',
    viewBox: '0 0 100 100',
    category: 'stars',
  },
  {
    name: 'Cloud Filled',
    type: 'path',
    pathData: 'M 25,65 C 10,65 5,50 15,40 C 15,20 40,15 50,30 C 65,15 90,20 90,45 C 100,50 95,65 85,65 Z',
    viewBox: '0 0 100 100',
    category: 'decorative',
  },

  // --- PHOTO FRAMES & MASKS ---
  {
    name: 'Arch Window Frame',
    type: 'path',
    pathData: 'M 10,100 V 50 A 40,40 0 0,1 90,50 V 100 Z',
    viewBox: '0 0 100 100',
    category: 'frames',
  },
  {
    name: 'Polaroid Frame',
    type: 'path',
    pathData: 'M 5,5 H 95 V 95 H 5 Z M 15,15 V 70 H 85 V 15 Z',
    viewBox: '0 0 100 100',
    category: 'frames',
  },
  {
    name: 'Stamp Cutout Frame',
    type: 'path',
    pathData: 'M 10,10 H 90 V 90 H 10 Z',
    viewBox: '0 0 100 100',
    category: 'frames',
  },
  {
    name: 'Smartphone Frame',
    type: 'path',
    pathData: 'M 20,5 H 80 A 15,15 0 0,1 95,20 V 80 A 15,15 0 0,1 80,95 H 20 A 15,15 0 0,1 5,80 V 20 A 15,15 0 0,1 20,5 Z',
    viewBox: '0 0 100 100',
    category: 'frames',
  },
  {
    name: 'Browser Window Frame',
    type: 'path',
    pathData: 'M 5,10 H 95 A 5,5 0 0,1 100,15 V 85 A 5,5 0 0,1 95,90 H 5 A 5,5 0 0,1 0,85 V 15 A 5,5 0 0,1 5,10 Z',
    viewBox: '0 0 100 100',
    category: 'frames',
  },
  {
    name: 'Scalloped Badge Frame',
    type: 'path',
    pathData: 'M 50,0 A 12,12 0 0,1 68,5 A 12,12 0 0,1 85,15 A 12,12 0 0,1 95,32 A 12,12 0 0,1 100,50 A 12,12 0 0,1 95,68 A 12,12 0 0,1 85,85 A 12,12 0 0,1 68,95 A 12,12 0 0,1 50,100 A 12,12 0 0,1 32,95 A 12,12 0 0,1 15,85 A 12,12 0 0,1 5,68 A 12,12 0 0,1 0,50 A 12,12 0 0,1 5,32 A 12,12 0 0,1 15,15 A 12,12 0 0,1 32,5 A 12,12 0 0,1 50,0 Z',
    viewBox: '0 0 100 100',
    category: 'frames',
  },

  // --- ORGANIC FLUID BLOBS ---
  {
    name: 'Fluid Blob 1',
    type: 'path',
    pathData: 'M 50,5 C 75,5 95,25 90,50 C 85,75 70,95 45,95 C 20,95 5,75 10,45 C 15,15 25,5 50,5 Z',
    viewBox: '0 0 100 100',
    category: 'blobs',
  },
  {
    name: 'Fluid Blob 2',
    type: 'path',
    pathData: 'M 50,10 C 80,5 95,35 90,65 C 85,95 55,90 35,85 C 15,80 5,60 10,35 C 15,10 20,15 50,10 Z',
    viewBox: '0 0 100 100',
    category: 'blobs',
  },
  {
    name: 'Fluid Blob 3',
    type: 'path',
    pathData: 'M 40,5 C 70,-5 95,20 95,50 C 95,80 75,95 45,90 C 15,85 0,70 5,40 C 10,10 10,15 40,5 Z',
    viewBox: '0 0 100 100',
    category: 'blobs',
  },
  {
    name: 'Wavy Pebble',
    type: 'path',
    pathData: 'M 30,10 C 65,0 90,20 95,50 C 100,80 75,95 40,95 C 15,95 0,75 5,45 C 10,15 0,20 30,10 Z',
    viewBox: '0 0 100 100',
    category: 'blobs',
  },

  // --- BADGES, SEALS & RIBBONS ---
  {
    name: '16-Point Sale Burst',
    type: 'path',
    pathData: 'M 50,0 L 58,15 L 75,7 L 78,25 L 95,25 L 90,42 L 100,56 L 88,68 L 92,85 L 75,88 L 70,100 L 54,93 L 42,100 L 35,88 L 18,88 L 20,70 L 5,60 L 15,45 L 8,28 L 25,25 L 28,8 L 45,15 Z',
    viewBox: '0 0 100 100',
    category: 'badges',
  },
  {
    name: 'Rosette Award Badge',
    type: 'path',
    pathData: 'M 50,5 A 45,45 0 0,1 95,50 A 45,45 0 0,1 50,95 A 45,45 0 0,1 5,50 A 45,45 0 0,1 50,5 Z',
    viewBox: '0 0 100 100',
    category: 'badges',
  },
  {
    name: 'Price Tag Badge',
    type: 'path',
    pathData: 'M 10,10 H 55 L 90,45 L 55,80 L 10,80 Z',
    viewBox: '0 0 100 100',
    category: 'badges',
  },
  {
    name: 'Ribbon Banner',
    type: 'path',
    pathData: 'M 0,25 H 100 L 85,50 L 100,75 H 0 L 15,50 Z',
    viewBox: '0 0 100 100',
    category: 'badges',
  },

  // --- LINES & DIVIDERS ---
  {
    name: 'Wave Divider',
    type: 'path',
    pathData: 'M 0,50 Q 25,20 50,50 T 100,50',
    viewBox: '0 0 100 100',
    category: 'arrows',
  },
  {
    name: 'Zigzag Divider',
    type: 'path',
    pathData: 'M 0,50 L 20,30 L 40,70 L 60,30 L 80,70 L 100,50',
    viewBox: '0 0 100 100',
    category: 'arrows',
  },
  {
    name: 'Callout Arrow Right',
    type: 'path',
    pathData: 'M 0,30 H 60 V 10 L 100,50 L 60,90 V 70 H 0 Z',
    viewBox: '0 0 100 100',
    category: 'arrows',
  },
];
