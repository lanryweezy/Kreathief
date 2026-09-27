import { useStore } from '../store/useStore';
import { log } from '../utils/log';
import { callBackendGeminiAPI } from './geminiService';
import { SpatialPin } from './spatialContextEngine';
import { generateLayerId } from '../utils/layers/layerUtils';
import { lintArtboardDesign } from './canvasDesignLinter';

export interface AgenticAction {
  action: 'UPDATE_LAYER' | 'DELETE_LAYER' | 'ADD_TEXT' | 'ADD_SHAPE' | 'GROUP_SELECTED' | 'ALIGN_LAYERS' | 'APPLY_LINT_FIX';
  payload: any;
}

export class AgenticCopilot {
  
  /**
   * Captures the current application state (selected layers, canvas size, and optional spatial pin)
   * and serializes it into a compact Markdown summary for the LLM context.
   */
  public buildContextSnapshot(spatialPin?: SpatialPin | null): string {
    const state = useStore.getState();
    const activeArtboard = state.artboards.find(a => a.id === state.activeArtboardId);
    
    if (!activeArtboard) return "No active artboard.";

    let snapshot = `CANVAS CONTEXT:\n`;
    snapshot += `- Artboard: ${activeArtboard.width}x${activeArtboard.height}\n`;
    
    const selectedIds = state.selectedLayerIds || [];
    snapshot += `- Selected Layers (${selectedIds.length}):\n`;
    
    selectedIds.forEach(id => {
      const layer = activeArtboard.layers.find(l => l.id === id);
      if (layer) {
        snapshot += `  - [${layer.id}] Type: ${layer.type}, Name: "${layer.name || layer.type}", Bounds: (x:${layer.x}, y:${layer.y}, w:${layer.width}, h:${layer.height})\n`;
        if (layer.type === 'text') {
           snapshot += `    Text Content: "${(layer as any).text}", Font: ${(layer as any).fontFamily}, Size: ${(layer as any).fontSize}px\n`;
        } else if ((layer as any).fill !== undefined || (layer as any).color !== undefined) {
           snapshot += `    Color: ${(layer as any).fill || (layer as any).color}\n`;
        }
      }
    });

    if (spatialPin) {
      snapshot += `\n🎯 ACTIVE SPATIAL PIN CONTEXT:\n`;
      snapshot += `- Pin Coordinates: (x: ${spatialPin.x}px, y: ${spatialPin.y}px)\n`;
      snapshot += `- Zone: ${spatialPin.zoneSummary}\n`;
      if (spatialPin.targetLayerId) {
        const target = activeArtboard.layers.find(l => l.id === spatialPin.targetLayerId);
        if (target) {
          snapshot += `- Target Layer directly under pin: [${target.id}] "${target.name || target.type}" (${target.type})\n`;
          snapshot += `  Bounds: (x: ${target.x}, y: ${target.y}, w: ${target.width}, h: ${target.height})\n`;
          if (target.type === 'text') {
            snapshot += `  Text Content: "${(target as any).text}", Font: ${(target as any).fontFamily}, Size: ${(target as any).fontSize}px\n`;
          } else if ((target as any).fill || (target as any).color) {
            snapshot += `  Color/Fill: ${(target as any).fill || (target as any).color}\n`;
          }
        }
      } else {
        snapshot += `- Target: Empty Canvas space. User wants surgical creation/positioning at (${spatialPin.x}, ${spatialPin.y})!\n`;
      }
      if (spatialPin.nearbyLayerIds?.length) {
        snapshot += `- Nearby Layers: ${spatialPin.nearbyLayerIds.join(', ')}\n`;
      }
      snapshot += `CRITICAL INSTRUCTION: When creating or modifying elements, anchor them at or near (${spatialPin.x}, ${spatialPin.y})!\n`;
    }
    
    return snapshot;
  }

  /**
   * Processes a natural language command from the user, feeding it the current AST and spatial context.
   * Dispatches explicit store mutations.
   */
  public async processCommand(userPrompt: string, spatialPin?: SpatialPin | null): Promise<string> {
    const context = this.buildContextSnapshot(spatialPin);
    
    const systemPrompt = `You are the Kreathief Agentic Copilot. You have full control over the user's design canvas.
You can read the current canvas state below and dispatch JSON function calls to modify it.

${context}

You must respond with a strict JSON object containing an "actions" array, followed by a conversational "response".
Supported action types:
- UPDATE_LAYER: payload { id: string, updates: Record<string, any> }
- ADD_TEXT: payload { text: string, x?: number, y?: number, fontSize?: number, fontFamily?: string, color?: string, fontWeight?: string }
- ADD_SHAPE: payload { shapeType: "rectangle" | "circle" | "star", x?: number, y?: number, width?: number, height?: number, fill?: string, cornerRadius?: number }
- ALIGN_LAYERS: payload { alignment: "left" | "center" | "right" | "top" | "middle" | "bottom" }
- APPLY_LINT_FIX: payload { layerId?: string }
- DELETE_LAYER: payload { id?: string }
- GROUP_SELECTED: payload {}

Format:
{
  "actions": [
    { "action": "UPDATE_LAYER", "payload": { "id": "layer_123", "updates": { "fill": "#FF0000" } } }
  ],
  "response": "I have updated the background to red."
}
`;

    try {
      log.info('[AgenticCopilot] Thinking with spatial context...', { userPrompt, spatialPin });
      
      const result = await callBackendGeminiAPI({
        systemInstruction: systemPrompt,
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      });
      const text =
        typeof result === 'string'
          ? result
          : (result?.text ?? result?.candidates?.[0]?.content?.parts?.[0]?.text ?? '');
      const parsed = JSON.parse(text);

      if (parsed.actions && Array.isArray(parsed.actions)) {
        this.executeActions(parsed.actions, spatialPin);
      }

      return parsed.response || "Task complete.";
    } catch (e) {
      log.error('[AgenticCopilot] Failed to process command', e);
      return "I encountered an error executing that command on the canvas.";
    }
  }
  
  /**
   * Routes the LLM's requested actions to the actual Zustand state.
   */
  public executeActions(actions: AgenticAction[], spatialPin?: SpatialPin | null) {
    const state = useStore.getState();
    const activeArtboard = state.artboards.find(a => a.id === state.activeArtboardId);
    
    actions.forEach(act => {
      log.info(`[AgenticCopilot] Executing action: ${act.action}`, act.payload);
      
      switch (act.action) {
        case 'UPDATE_LAYER': {
          const targetId = act.payload?.id || spatialPin?.targetLayerId;
          if (targetId && act.payload?.updates) {
            state.updateLayer(targetId, act.payload.updates);
          }
          break;
        }

        case 'ADD_TEXT': {
          const text = act.payload?.text || 'New Text';
          const fontSize = act.payload?.fontSize || 36;
          const width = act.payload?.width || Math.max(140, Math.round(text.length * (fontSize * 0.6)));
          const height = act.payload?.height || Math.round(fontSize * 1.3);
          const x = act.payload?.x !== undefined
            ? act.payload.x
            : (spatialPin ? Math.round(spatialPin.x - width / 2) : 100);
          const y = act.payload?.y !== undefined
            ? act.payload.y
            : (spatialPin ? Math.round(spatialPin.y - height / 2) : 100);

          const newLayer = {
            id: generateLayerId('text'),
            type: 'text' as const,
            name: act.payload?.name || text.slice(0, 24),
            x: Math.max(0, x),
            y: Math.max(0, y),
            width,
            height,
            text,
            fontSize,
            fontFamily: act.payload?.fontFamily || 'Inter',
            color: act.payload?.color || act.payload?.fill || '#0f172a',
            fontWeight: act.payload?.fontWeight || 'bold',
            textAlign: act.payload?.textAlign || 'center',
            opacity: 1,
            rotation: 0,
            locked: false,
            visible: true,
          };
          state.addLayer(newLayer as any);
          break;
        }

        case 'ADD_SHAPE': {
          const shapeType = act.payload?.shapeType || 'rectangle';
          const width = act.payload?.width || 200;
          const height = act.payload?.height || (shapeType === 'circle' ? 200 : 80);
          const x = act.payload?.x !== undefined
            ? act.payload.x
            : (spatialPin ? Math.round(spatialPin.x - width / 2) : 100);
          const y = act.payload?.y !== undefined
            ? act.payload.y
            : (spatialPin ? Math.round(spatialPin.y - height / 2) : 100);

          const newShape = {
            id: generateLayerId('shape'),
            type: 'shape' as const,
            name: act.payload?.name || (shapeType === 'circle' ? 'Circle' : 'Card Container'),
            x: Math.max(0, x),
            y: Math.max(0, y),
            width,
            height,
            shapeType,
            fill: act.payload?.fill || '#6366f1',
            color: act.payload?.fill || '#6366f1',
            cornerRadius: act.payload?.cornerRadius ?? (shapeType === 'circle' ? 9999 : 16),
            opacity: act.payload?.opacity ?? 1,
            rotation: 0,
            locked: false,
            visible: true,
            stroke: act.payload?.stroke,
            strokeWidth: act.payload?.strokeWidth,
            shadows: act.payload?.shadow ? [{ color: 'rgba(0,0,0,0.15)', blur: 16, x: 0, y: 8 }] : [],
          };
          state.addLayer(newShape as any);
          break;
        }

        case 'APPLY_LINT_FIX': {
          if (activeArtboard) {
            const targetId = act.payload?.layerId || spatialPin?.targetLayerId;
            const lintReport = lintArtboardDesign(activeArtboard);
            const targetIssues = lintReport.issues.filter(
              iss => iss.autoFix && (!targetId || iss.layerId === targetId)
            );
            targetIssues.forEach(iss => {
              if (iss.autoFix) {
                const patch = (iss.autoFix as any).patch || (typeof (iss.autoFix as any).apply === 'function' ? (iss.autoFix as any).apply() : {});
                state.updateLayer(iss.layerId, patch);
              }
            });
          }
          break;
        }

        case 'GENERATE_LAYER_AWARE_DESIGN' as any: {
          const prompt = act.payload?.prompt;
          if (prompt && typeof (state as any).generateLayerAwareDesign === 'function') {
            (state as any).generateLayerAwareDesign(prompt);
          }
          break;
        }

        case 'ALIGN_LAYERS': {
          if (act.payload?.alignment && typeof state.alignLayers === 'function') {
            state.alignLayers(act.payload.alignment);
          }
          break;
        }

        case 'DELETE_LAYER': {
          const idToDelete = act.payload?.id || spatialPin?.targetLayerId;
          if (idToDelete) {
            state.deleteLayer(idToDelete);
          } else {
            state.deleteSelected();
          }
          break;
        }

        case 'GROUP_SELECTED': {
          state.groupSelected();
          break;
        }
      }
    });
  }
}

export const agenticCopilot = new AgenticCopilot();
