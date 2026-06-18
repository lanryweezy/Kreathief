import { CanvasSize, HistoryState } from '../types';
import { StarterTemplate } from './templates';

const baseState = (_size: CanvasSize): Omit<HistoryState, 'canvasSize'> => ({
  artboards: [],
  canvasBackgroundColor: '#ffffff',
  canvasFilters: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    opacity: 1,
    vignette: 0,
    sepia: 0,
    grayscale: 0,
    hueRotate: 0,
  },
});

const generateTemplates = (): StarterTemplate[] => {
  const templates: StarterTemplate[] = [];
  const categories: ('Social' | 'Video' | 'Business' | 'Personal')[] = ['Social', 'Video', 'Business', 'Personal'];
  const sizes: CanvasSize[] = [
    { width: 1080, height: 1080, name: 'Instagram Post' },
    { width: 1920, height: 1080, name: 'YouTube Thumbnail' },
    { width: 1080, height: 1920, name: 'TikTok/Reels' },
    { width: 1200, height: 630, name: 'Twitter/X Post' },
    { width: 820, height: 312, name: 'Facebook Cover' },
  ];

  const palettes = [
    { bg: '#0f172a', accent: '#3b82f6', text: '#ffffff' },
    { bg: '#fef3c7', accent: '#f59e0b', text: '#78350f' },
    { bg: '#faf5ff', accent: '#a855f7', text: '#4c1d95' },
    { bg: '#ecfdf5', accent: '#10b981', text: '#064e3b' },
    { bg: '#fef2f2', accent: '#ef4444', text: '#7f1d1d' },
  ];

  for (let i = 1; i <= 15; i++) {
    const size = sizes[i % sizes.length];
    const cat = categories[i % categories.length];
    const palette = palettes[i % palettes.length];

    templates.push({
      id: `extra_tmpl_${Date.now()}_${i}`,
      name: `Dynamic ${cat} Template ${i}`,
      category: cat,
      description: `A highly engaging ${cat} template designed for professional creators.`,
      size,
      state: {
        ...baseState(size),
        canvasBackgroundColor: palette.bg,
        canvasFilters: {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          blur: 0,
          opacity: 1,
          vignette: 0,
          sepia: 0,
          grayscale: 0,
          hueRotate: 0,
        },
        canvasSize: size,
        artboards: [
          {
            id: 'default',
            name: 'Artboard 1',
            x: 0,
            y: 0,
            width: size.width,
            height: size.height,
            layers: [
              {
                id: `bg_shape_${i}`,
                type: 'rectangle',
                name: 'Background Accent',
                x: size.width * 0.1,
                y: size.height * 0.1,
                width: size.width * 0.8,
                height: size.height * 0.8,
                rotation: i * 2,
                color: palette.accent,
                cornerRadius: 48,
                opacity: 0.05,
                locked: true,
                visible: true,
                skewX: 0,
                skewY: 0,
              },
              {
                id: `bg_circle_${i}`,
                type: 'circle',
                name: 'Design Element',
                x: -size.width * 0.2,
                y: size.height * 0.6,
                width: size.width * 0.6,
                height: size.width * 0.6,
                rotation: 0,
                color: palette.accent,
                cornerRadius: size.width * 0.3,
                opacity: 0.1,
                locked: false,
                visible: true,
                skewX: 0,
                skewY: 0,
              },
              {
                id: `text_header_${i}`,
                text: `Unleash Your\n${cat} Potential`,
                x: size.width * 0.1,
                y: size.height * 0.4,
                width: size.width * 0.8,
                height: 160,
                fontSize: size.width > 1200 ? 96 : 72,
                fontWeight: '900',
                fontFamily: 'Inter, sans-serif',
                color: palette.text,
                textAlign: 'center',
                type: 'text',
                rotation: 0,
                fontStyle: 'normal',
                textDecoration: 'none',
                lineHeight: 1.1,
                letterSpacing: -2,
                textTransform: 'uppercase',
                opacity: 1,
                locked: false,
                visible: true,
                blendMode: 'normal',
                curve: 0,
                skewX: 0,
                skewY: 0,
                name: 'Header Text',
              },
              {
                id: `text_sub_${i}`,
                text: 'Discover the new standard of design with Kreathief.',
                x: size.width * 0.2,
                y: size.height * 0.4 + 200,
                width: size.width * 0.6,
                height: 60,
                fontSize: size.width > 1200 ? 32 : 24,
                fontWeight: '500',
                fontFamily: 'Inter, sans-serif',
                color: palette.text,
                textAlign: 'center',
                type: 'text',
                rotation: 0,
                fontStyle: 'normal',
                textDecoration: 'none',
                lineHeight: 1.5,
                letterSpacing: 0,
                textTransform: 'none',
                opacity: 0.8,
                locked: false,
                visible: true,
                blendMode: 'normal',
                curve: 0,
                skewX: 0,
                skewY: 0,
                name: 'Subheadline',
              },
            ],
          },
        ],
      },
    });
  }
  return templates;
};

export const EXTRA_TEMPLATES = generateTemplates();
