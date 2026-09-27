import { z } from 'zod';
import { agentRegistry } from './agentRegistry';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../store/useStore';
import { Layer } from '../types';

/**
 * Seeds the Capability Registry with deterministic design tools.
 * In a real environment, the execution logic directly updates the Zustand store AST.
 */

// 1. Create Text Block
agentRegistry.register({
  name: 'create_text_block',
  version: '1.0.0',
  description: 'Creates a highly configurable typography block on the canvas.',
  permissionLevel: 'safe',
  baseCostEstimate: 0,
  
  inputSchema: z.object({
    text: z.string(),
    x: z.number(),
    y: z.number(),
    fontSize: z.number().default(32),
    fontFamily: z.string().default('Inter'),
    color: z.string().default('#FFFFFF'),
    fontWeight: z.string().default('bold'),
    alignment: z.enum(['left', 'center', 'right']).default('left'),
  }),
  
  outputSchema: z.object({
    layerId: z.string()
  }),

  execute: async (input, context) => {
    // In production, this would dispatch to Zustand:
    // useStore.getState().addLayer(context.activeArtboardId, newLayer);
    
    return {
      success: true,
      data: { layerId: uuidv4() },
      costIncurred: 0,
      timestamp: Date.now()
    };
  },

  undo: async (input, output, context) => {
    // Revert logic: delete the layer we just created
    if (output?.layerId) {
       // useStore.getState().deleteLayer(output.layerId);
    }
  }
});

// 2. Apply Brand Rules
agentRegistry.register({
  name: 'apply_brand_rules',
  version: '1.0.0',
  description: 'Scans the current AST and maps all colors/fonts to the specified brand kit constraints.',
  permissionLevel: 'destructive', // Alters many layers at once
  baseCostEstimate: 0,
  
  inputSchema: z.object({
    brandColors: z.array(z.string()),
    headingFont: z.string(),
    bodyFont: z.string(),
  }),
  
  outputSchema: z.object({
    layersModified: z.number()
  }),

  execute: async (input, context) => {
    // Logic: Traverse all layers in activeArtboard, update fills and fonts.
    return {
      success: true,
      data: { layersModified: 5 },
      costIncurred: 0,
      timestamp: Date.now()
    };
  }
});

// 3. Generate Image (External AI)
agentRegistry.register({
  name: 'generate_image',
  version: '2.0.0',
  description: 'Calls a VLM/Diffusion model to generate a raster image asset and places it on the canvas.',
  permissionLevel: 'cost_incurring',
  baseCostEstimate: 5, // e.g., 5 credits
  
  inputSchema: z.object({
    prompt: z.string(),
    width: z.number(),
    height: z.number(),
    style: z.string().optional()
  }),
  
  outputSchema: z.object({
    layerId: z.string(),
    assetUrl: z.string()
  }),

  execute: async (input, context) => {
    // Wait for AI generation, upload to Supabase storage, append layer
    return {
      success: true,
      data: { layerId: uuidv4(), assetUrl: 'https://cdn.placeholder.com/gen_xyz.png' },
      costIncurred: 5,
      timestamp: Date.now()
    };
  }
});

// 4. Inspect Render (Visual Critic)
agentRegistry.register({
  name: 'inspect_render',
  version: '1.0.0',
  description: 'Takes a headless snapshot of the AST and evaluates it for overlapping layers, low contrast, and typography issues.',
  permissionLevel: 'external_api',
  baseCostEstimate: 1, // Cheap VLM or local heuristic call
  
  inputSchema: z.object({
    checkContrast: z.boolean().default(true),
    checkOverlap: z.boolean().default(true),
  }),
  
  outputSchema: z.object({
    passed: z.boolean(),
    critiques: z.array(z.object({
      layerId: z.string().optional(),
      issue: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      suggestedFix: z.string().optional()
    }))
  }),

  execute: async (input, context) => {
    // Fire off visual critique logic
    return {
      success: true,
      data: {
        passed: false,
        critiques: [
          { issue: 'Headline contrast is too low against background image', severity: 'high', suggestedFix: 'Darken background image by 20% or change text color to #FFFFFF' }
        ]
      },
      costIncurred: 1,
      timestamp: Date.now()
    };
  }
});

// 5. Create Campaign Variants (Multi-format)
agentRegistry.register({
  name: 'create_variant',
  version: '1.0.0',
  description: 'Duplicates the current artboard and resizes/reflows the AST for a different channel.',
  permissionLevel: 'safe',
  baseCostEstimate: 0,
  
  inputSchema: z.object({
    targetChannel: z.enum(['instagram', 'whatsapp', 'story', 'landscape']),
  }),
  
  outputSchema: z.object({
    newArtboardId: z.string()
  }),

  execute: async (input, context) => {
    return {
      success: true,
      data: { newArtboardId: uuidv4() },
      costIncurred: 0,
      timestamp: Date.now()
    };
  }
});
