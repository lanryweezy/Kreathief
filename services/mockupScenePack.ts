// Multi-Angle Social Pack Generator
// Generates 3 composited slides for a social media carousel:
// 1. Front Hero (default placement, full lighting)
// 2. Close-Up Detail (zoomed, angled, boosted contrast)
// 3. Lifestyle Scene (contextual background swap)

import { MockupPlacement, getMockupById } from './enhancedMockupsLibrary';

export interface ScenePackResult {
  slides: SceneSlide[];
  mockupName: string;
}

export interface SceneSlide {
  label: string;
  blobUrl: string;
  description: string;
}

// Lifestyle scene backgrounds by category
const LIFESTYLE_BACKGROUNDS: Record<string, string> = {
  Apparel: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
  Streetwear: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
  Digital: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80',
  '3D Clay Devices': 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80',
  Packaging: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
  'Sustainable Packaging': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
  Print: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80',
};

/**
 * Load an image from a URL into an ImageBitmap
 */
async function loadBitmap(url: string): Promise<ImageBitmap> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
  });
  return createImageBitmap(img);
}

/**
 * Composite a design onto a background with given settings
 */
function compositeSlide(
  bgBitmap: ImageBitmap,
  designBitmap: ImageBitmap,
  placement: MockupPlacement,
  brightnessFilter: number,
  contrastFilter: number
): OffscreenCanvas {
  const canvas = new OffscreenCanvas(bgBitmap.width, bgBitmap.height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;

  ctx.drawImage(bgBitmap, 0, 0);

  const w = bgBitmap.width;
  const h = bgBitmap.height;
  const dw = (placement.width / 100) * w;
  const dh = dw / (designBitmap.width / designBitmap.height);
  const dx = (placement.left / 100) * w;
  const dy = (placement.top / 100) * h;

  ctx.save();
  ctx.globalAlpha = placement.opacity || 0.9;
  ctx.globalCompositeOperation = (placement.blendMode || 'multiply') as GlobalCompositeOperation;
  ctx.filter = `brightness(${brightnessFilter}%) contrast(${contrastFilter}%)`;
  ctx.drawImage(designBitmap, dx, dy, dw, dh);
  ctx.restore();

  return canvas;
}

/**
 * Generate a 3-slide multi-angle social pack for a given mockup and design.
 *
 * Slide 1: Front Hero - default placement, standard lighting
 * Slide 2: Close-Up Detail - zoomed 60% into the design area, boosted contrast
 * Slide 3: Lifestyle Scene - background swapped to contextual environment image
 *
 * @param designUrl The data URL or object URL of the rendered design
 * @param mockupId The ID from ENHANCED_MOCKUPS
 * @returns Array of blob URLs for each slide, or empty array on failure
 */
export async function generateScenePack(
  designUrl: string,
  mockupId: string
): Promise<ScenePackResult | null> {
  const mockup = getMockupById(mockupId);
  if (!mockup) return null;

  try {
    const [bgBitmap, designBitmap] = await Promise.all([
      loadBitmap(mockup.bg),
      loadBitmap(designUrl),
    ]);

    const slides: SceneSlide[] = [];

    // --- Slide 1: Front Hero ---
    const heroCanvas = compositeSlide(
      bgBitmap,
      designBitmap,
      mockup.defaultPlacement,
      100,
      105
    );
    const heroBlob = await heroCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
    slides.push({
      label: '1 - Front Hero',
      blobUrl: URL.createObjectURL(heroBlob),
      description: 'Primary hero view with centered placement',
    });

    // --- Slide 2: Close-Up Detail ---
    // Zoom into the design placement area by scaling coordinates
    const zoomFactor = 1.7;
    const dp = mockup.defaultPlacement;
    const zoomedPlacement: MockupPlacement = {
      ...dp,
      top: dp.top * 0.5,
      left: dp.left * 0.5,
      width: dp.width * zoomFactor,
    };
    const closeCanvas = compositeSlide(
      bgBitmap,
      designBitmap,
      zoomedPlacement,
      108,
      115
    );
    const closeBlob = await closeCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
    slides.push({
      label: '2 - Close-Up Detail',
      blobUrl: URL.createObjectURL(closeBlob),
      description: 'Zoomed detail view with boosted contrast',
    });

    // --- Slide 3: Lifestyle Scene ---
    const lifestyleBgUrl =
      LIFESTYLE_BACKGROUNDS[mockup.category] ?? LIFESTYLE_BACKGROUNDS['default'];
    try {
      const lifestyleBg = await loadBitmap(lifestyleBgUrl);
      const lifestyleCanvas = compositeSlide(
        lifestyleBg,
        designBitmap,
        {
          ...dp,
          opacity: 0.85,
          blendMode: 'source-over',
        },
        95,
        100
      );
      const lifestyleBlob = await lifestyleCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
      slides.push({
        label: '3 - Lifestyle Scene',
        blobUrl: URL.createObjectURL(lifestyleBlob),
        description: 'Contextual lifestyle environment placement',
      });
    } catch {
      // If lifestyle bg fails to load, duplicate slide 1 with slight adjustments
      const fallbackCanvas = compositeSlide(bgBitmap, designBitmap, dp, 92, 98);
      const fallbackBlob = await fallbackCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
      slides.push({
        label: '3 - Scene View',
        blobUrl: URL.createObjectURL(fallbackBlob),
        description: 'Alternate scene view',
      });
    }

    bgBitmap.close();
    designBitmap.close();

    return { slides, mockupName: mockup.name };
  } catch {
    return null;
  }
}
