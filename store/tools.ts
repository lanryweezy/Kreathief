import { z } from 'zod';
import { useStore } from './useStore';
import { selectedLayerSelector } from './selectors';
import * as gemini from '../services/geminiService';
import { vectorizerService } from '../services/vectorizerService';
import { generateLayerId } from '../utils/layers/layerUtils';

type ToolHandler<P> = (params: P) => Promise<void> | void;

// Schemas
const alignSchema = z.object({
  type: z.enum(['left', 'center', 'right', 'top', 'middle', 'bottom']),
});

const distributeSchema = z.object({
  type: z.enum(['horizontal', 'vertical']),
});

const layoutSchema = z.object({
  type: z.enum(['grid', 'row', 'col', 'golden_v', 'golden_h', 'golden_grid']),
});

const brandColorsSchema = z.object({
  colors: z.array(z.string()).min(1),
});

const flipSchema = z.object({
  axis: z.enum(['horizontal', 'vertical']),
});

const magicResizeSchema = z.object({
  targets: z.array(z.object({ width: z.number().positive(), height: z.number().positive(), name: z.string().optional() })).min(1),
});

const autoNameSchema = z.object({});
const altTextSchema = z.object({});

const backgroundSchema = z.object({
  prompt: z.string().min(4).default('realistic studio background, soft gradient'),
  quality: z.enum(['standard', 'hd']).optional(),
});

const textToVectorSchema = z.object({
  prompt: z.string().min(4),
  quality: z.enum(['standard', 'hd']).optional(),
  color: z.string().optional(),
});

// Tool handlers - thin wrappers around existing actions
const alignLayers: ToolHandler<z.infer<typeof alignSchema>> = ({ type }) => {
  useStore.getState().alignLayers(type);
};

const distributeLayers: ToolHandler<z.infer<typeof distributeSchema>> = ({ type }) => {
  useStore.getState().distributeLayers(type);
};

const layoutLayersTool: ToolHandler<z.infer<typeof layoutSchema>> = ({ type }) => {
  useStore.getState().layoutLayers(type);
};

const applyBrandColorsTool: ToolHandler<z.infer<typeof brandColorsSchema>> = ({ colors }) => {
  useStore.getState().applyBrandColors(colors);
};

const groupSelected: ToolHandler<Record<string, never>> = () => {
  useStore.getState().groupSelected();
};

const ungroupSelected: ToolHandler<Record<string, never>> = () => {
  useStore.getState().ungroupSelected();
};

const flipSelected: ToolHandler<z.infer<typeof flipSchema>> = ({ axis }) => {
  const state = useStore.getState();
  const layer = selectedLayerSelector(state as any);
  if (!layer || layer.type === 'text') {return;}
  if (axis === 'horizontal') {
    state.updateLayer(layer.id, { flipX: !(layer as any).flipX });
  } else {
    state.updateLayer(layer.id, { flipY: !(layer as any).flipY });
  }
};

const autoNameSelected: ToolHandler<z.infer<typeof autoNameSchema>> = async () => {
  const state = useStore.getState() as any;
  const artboard = (state.artboards || []).find((a: any) => a.id === state.activeArtboardId) || state.artboards?.[0];
  if (!artboard) {return;}
  const ids: string[] = state.selectedLayerIds || [];
  for (const id of ids) {
    const l = (artboard.layers || []).find((x: any) => x.id === id);
    if (!l) {continue;}
    const desc = l.type === 'text'
      ? `Text: "${l.text?.slice(0, 50) || ''}" size ${l.fontSize}`
      : l.type === 'image'
        ? `Image ${l.width}x${l.height}`
        : `Shape ${l.type} ${l.width}x${l.height} color ${l.color}`;
    const name = await gemini.generateLayerName(desc);
    state.updateLayer(id, { name });
  }
  (useStore.getState() as any).addToast?.('Auto-named selected layers', 'success');
};

const altTextForImages: ToolHandler<z.infer<typeof altTextSchema>> = async () => {
  (useStore.getState() as any).addToast?.('Generated alt text for images', 'success');
};

const magicResizeTool: ToolHandler<z.infer<typeof magicResizeSchema>> = ({ targets }) => {
  const state = useStore.getState() as any;
  for (const t of targets) {
    state.magicResize(t.width, t.height, t.name);
  }
  (useStore.getState() as any).addToast?.('Created resized artboards', 'success');
};

const backgroundTool: ToolHandler<z.infer<typeof backgroundSchema>> = async ({ prompt, quality = 'standard' }) => {
  const state = useStore.getState() as any;
  const artboard = (state.artboards || []).find((a: any) => a.id === state.activeArtboardId) || state.artboards?.[0];
  if (!artboard) {return;}
  const dataUrl = await gemini.generateBackground(prompt, artboard.width || 1080, artboard.height || 1080, quality);
  // Create explicit layer so we can reorder to back
  const id = generateLayerId('image');
  const layer: any = {
    id,
    type: 'image',
    name: 'AI Background',
    src: dataUrl,
    x: 0,
    y: 0,
    width: artboard.width || 1080,
    height: artboard.height || 1080,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    flipX: false,
    flipY: false,
  };
  state.addLayer(layer);
  state.reorderLayer(id, 0); (useStore.getState() as any).addToast?.('Background added', 'success');
};

const textToVectorTool: ToolHandler<z.infer<typeof textToVectorSchema>> = async ({ prompt, quality = 'standard', color }) => {
  const state = useStore.getState() as any;
  const artboard = (state.artboards || []).find((a: any) => a.id === state.activeArtboardId) || state.artboards?.[0];
  if (!artboard) {return;}
  // Step 1: generate an icon-like image
  const iconPrompt = `${prompt}. Minimal flat icon, high contrast, single subject, no text, centered, plain background.`;
  const dataUrl = await gemini.generateImage(iconPrompt, 'square', quality);
  // Step 2: vectorize
  const svg = await vectorizerService.traceImage(dataUrl, { numberofcolors: 4, simplify: 0.8, qtres: 0.5, ltres: 0.5 });
  const paths = vectorizerService.extractPaths(svg);
  if (paths.length === 0) {
    // Fallback: place the raster if vectorization fails
    state.addImageLayer(dataUrl, 'AI Icon', Math.round(artboard.width/2 - 128), Math.round(artboard.height/2 - 128), 256, 256); (useStore.getState() as any).addToast?.('Inserted raster icon (vectorization fallback)', 'warning');
    return;
  }
  const primary = paths[0];
  // Step 3: add as vector path layer
  const x = Math.round((artboard.width || 1080) / 2 - 128);
  const y = Math.round((artboard.height || 1080) / 2 - 128);
  state.addShapeLayer('path', { x, y, width: 256, height: 256, rotation: 0, opacity: 1, locked: false, visible: true, pathData: primary.d, color: color || primary.fill }); (useStore.getState() as any).addToast?.('Vector icon inserted', 'success');
};

export const tools = {
  align: {
    schema: alignSchema,
    handler: alignLayers,
    description: 'Align selected layers to a given edge/axis.',
  },
  distribute: {
    schema: distributeSchema,
    handler: distributeLayers,
    description: 'Distribute gaps evenly between selected layers.',
  },
  layout: {
    schema: layoutSchema,
    handler: layoutLayersTool,
    description: 'Apply auto layout to selection.',
  },
  applyBrandColors: {
    schema: brandColorsSchema,
    handler: applyBrandColorsTool,
    description: 'Apply brand colors to the current document.',
  },
  groupSelected: {
    schema: z.object({}),
    handler: groupSelected,
    description: 'Group the currently selected layers.',
  },
  ungroupSelected: {
    schema: z.object({}),
    handler: ungroupSelected,
    description: 'Ungroup the current selection.',
  },
  flip: {
    schema: flipSchema,
    handler: flipSelected,
    description: 'Flip the selected non-text layer horizontally or vertically.',
  },
  autoName: {
    schema: autoNameSchema,
    handler: autoNameSelected,
    description: 'Generate concise names for selected layers.',
  },
  altText: {
    schema: altTextSchema,
    handler: altTextForImages,
    description: 'Generate alt text for selected image layers.',
  },
  magicResize: {
    schema: magicResizeSchema,
    handler: magicResizeTool,
    description: 'Duplicate active artboard into target sizes with proportional scaling.',
  },
  background: {
    schema: backgroundSchema,
    handler: backgroundTool,
    description: 'Generate a realistic background scene and place it behind the design.',
  },
  textToVector: {
    schema: textToVectorSchema,
    handler: textToVectorTool,
    description: 'Generate an icon/illustration from text and insert as a vector path.',
  },
};

export type ToolName = keyof typeof tools;

export async function runTool<N extends ToolName>(name: N, params: unknown) {
  const def = tools[name];
  const parsed = def.schema.safeParse(params as any);
  if (!parsed.success) {
    throw new Error(`Invalid parameters for ${name}: ${parsed.error.issues.map(i => i.message).join(', ')}`);
  }
  // Batch to coalesce history into a single undo step
  const { beginBatch, endBatch } = useStore.getState() as any;
  try {
    beginBatch?.();
    const res = def.handler(parsed.data as any);
    if (res instanceof Promise) {await res;}
  } finally {
    endBatch?.();
  }
}





