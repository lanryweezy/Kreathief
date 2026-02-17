import { LayerFilters, CanvasFilters } from '../../types';

export const FILTER_PRESETS: { name: string, filters: Partial<LayerFilters> }[] = [
    { name: 'Normal', filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0, sepia: 0, hueRotate: 0, vignette: 0 } },
    { name: 'B&W', filters: { brightness: 100, contrast: 110, saturation: 0, grayscale: 100, blur: 0, sepia: 0, hueRotate: 0, vignette: 20 } },
    { name: 'Sepia', filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0, sepia: 100, hueRotate: 0, vignette: 30 } },
    { name: 'Vintage', filters: { brightness: 110, contrast: 80, saturation: 70, grayscale: 0, blur: 0, sepia: 40, hueRotate: 0, vignette: 40 } },
    { name: 'Cyber', filters: { brightness: 110, contrast: 120, saturation: 150, grayscale: 0, blur: 0, sepia: 0, hueRotate: 180, vignette: 0 } },
    { name: 'Fade', filters: { brightness: 120, contrast: 90, saturation: 80, grayscale: 0, blur: 1, sepia: 10, hueRotate: 0, vignette: 10 } },
];

export const CANVAS_EFFECT_PRESETS: { name: string; description: string; filters: Partial<CanvasFilters> }[] = [
    {
        name: 'Clean',
        description: 'Subtle contrast boost',
        filters: { brightness: 105, contrast: 110, saturation: 105, sepia: 0, grayscale: 0, blur: 0, vignette: 0, opacity: 1 }
    },
    {
        name: 'Bold',
        description: 'High contrast & punch',
        filters: { brightness: 105, contrast: 130, saturation: 120, sepia: 0, grayscale: 0, blur: 0, vignette: 10, opacity: 1 }
    },
    {
        name: 'Vintage',
        description: 'Soft, slightly faded',
        filters: { brightness: 110, contrast: 90, saturation: 85, sepia: 30, grayscale: 0, blur: 0.5, vignette: 20, opacity: 1 }
    },
    {
        name: 'Noir',
        description: 'Classic B&W film',
        filters: { brightness: 100, contrast: 130, saturation: 0, sepia: 0, grayscale: 100, blur: 0, vignette: 40, opacity: 1 }
    },
    {
        name: 'Retro',
        description: '70s warm vibe',
        filters: { brightness: 100, contrast: 90, saturation: 120, sepia: 20, grayscale: 0, blur: 0, vignette: 20, opacity: 1 }
    }
];
