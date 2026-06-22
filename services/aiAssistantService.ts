import { DesignCritique, DesignSuggestion, DesignContext, Layer, Artboard, BrandKit, ChatMessage } from '../types';
import { callBackendGeminiAPI } from './geminiService';
import { log } from '../utils/log';
import { safeParseJSON } from '../utils/errorHandling';
import { SchemaType } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';

export class AIAssistantService {
  private static instance: AIAssistantService;

  public static getInstance(): AIAssistantService {
    if (!AIAssistantService.instance) {
      AIAssistantService.instance = new AIAssistantService();
    }
    return AIAssistantService.instance;
  }

  /**
   * Analyze the current design and provide contextual suggestions
   */
  async analyzeDesign(artboard: Artboard, context: DesignContext, brandKit?: BrandKit): Promise<DesignCritique> {
    try {
      const designData = this.prepareDesignData(artboard, context, brandKit);

      const systemPrompt = `You are an expert design critic and mentor. Analyze this design and provide constructive feedback.

      Focus on:
      1. Visual hierarchy and composition
      2. Color harmony and contrast
      3. Typography choices and readability  
      4. Brand consistency
      5. Accessibility issues
      6. Layout and spacing
      7. Overall design effectiveness

      Be specific, actionable, and encouraging. Rate 0-100 overall.`;

      const response = await callBackendGeminiAPI({
        modelName: 'gemini-2.0-flash',
        systemInstruction: systemPrompt,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              overallScore: {
                type: SchemaType.NUMBER,
                description: 'Overall design quality score 0-100',
              },
              strengths: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'List of design strengths',
              },
              areas_for_improvement: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Areas needing improvement',
              },
              suggestions: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    type: {
                      type: SchemaType.STRING,
                      enum: ['improvement', 'warning', 'tip', 'accessibility'],
                    },
                    severity: {
                      type: SchemaType.STRING,
                      enum: ['low', 'medium', 'high'],
                    },
                    title: { type: SchemaType.STRING },
                    message: { type: SchemaType.STRING },
                    layerId: { type: SchemaType.STRING },
                    category: {
                      type: SchemaType.STRING,
                      enum: ['layout', 'color', 'typography', 'accessibility', 'branding', 'composition'],
                    },
                  },
                  required: ['type', 'severity', 'title', 'message', 'category'],
                },
              },
            },
            required: ['overallScore', 'strengths', 'areas_for_improvement', 'suggestions'],
          },
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Analyze this design:\n\n${JSON.stringify(designData, null, 2)}`,
              },
            ],
          },
        ],
      });

      const parsed = safeParseJSON<Partial<DesignCritique>>(response.text || '{}', {});

      return {
        overallScore: parsed.overallScore || 75,
        score: parsed.score || parsed.overallScore || 75,
        summary: parsed.summary || '',
        suggestions: (parsed.suggestions || []).map(
          (s: any) =>
            ({
              ...s,
              id: uuidv4(),
            }) as DesignSuggestion
        ),
        strengths: parsed.strengths || [],
        areas_for_improvement: parsed.areas_for_improvement || [],
        timestamp: Date.now(),
      };
    } catch (error) {
      log.error('[AI Assistant] Analysis failed', error);
      throw new Error('Failed to analyze design. Please try again.');
    }
  }

  /**
   * Handle conversational queries about the design
   */
  async handleConversation(
    message: string,
    artboard: Artboard,
    context: DesignContext,
    conversationHistory: ChatMessage[]
  ): Promise<ChatMessage> {
    try {
      const designData = this.prepareDesignData(artboard, context);
      const recentHistory = conversationHistory.slice(-6); // Last 6 messages for context

      const systemPrompt = `You are Kiro, an AI design assistant built into Kreathief. You help users improve their designs through conversation.

      Context: You can see the current design state and should provide specific, actionable advice.
      
      Style: Be friendly, encouraging, and specific. Use design terminology but explain it simply.
      
      Capabilities:
      - Suggest design improvements
      - Explain design principles  
      - Help with color, typography, layout decisions
      - Provide accessibility guidance
      - Answer questions about the current design
      
      Always be constructive and helpful.`;

      const conversationContext =
        recentHistory.length > 0
          ? `Recent conversation:\n${recentHistory.map((msg) => `${msg.role}: ${msg.content}`).join('\n')}\n\n`
          : '';

      const response = await callBackendGeminiAPI({
        modelName: 'gemini-2.0-flash',
        systemInstruction: systemPrompt,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${conversationContext}Current design state:\n${JSON.stringify(designData, null, 2)}\n\nUser message: ${message}`,
              },
            ],
          },
        ],
      });

      return {
        id: uuidv4(),
        role: 'assistant',
        content: response.text || 'I apologize, but I could not process your request. Please try again.',
        timestamp: Date.now(),
      };
    } catch (error) {
      log.error('[AI Assistant] Conversation failed', error);
      throw new Error('Failed to process your message. Please try again.');
    }
  }

  /**
   * Get real-time suggestions as the user works
   */
  async getRealtimeSuggestions(
    artboard: Artboard,
    context: DesignContext,
    lastChange?: { type: string; layerId?: string }
  ): Promise<DesignSuggestion[]> {
    try {
      // Focus on quick, actionable suggestions for the most recent change
      const designData = this.prepareDesignData(artboard, context);

      const systemPrompt = `You are a real-time design assistant. Provide 1-3 quick, actionable suggestions based on the current design state.

      Focus on:
      - Immediate improvements
      - Common design mistakes
      - Quick accessibility fixes
      - Color/contrast issues
      
      Be concise and specific.`;

      const response = await callBackendGeminiAPI({
        modelName: 'gemini-2.0-flash',
        systemInstruction: systemPrompt,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                type: {
                  type: SchemaType.STRING,
                  enum: ['improvement', 'warning', 'tip'],
                },
                severity: {
                  type: SchemaType.STRING,
                  enum: ['low', 'medium', 'high'],
                },
                title: { type: SchemaType.STRING },
                message: { type: SchemaType.STRING },
                category: {
                  type: SchemaType.STRING,
                  enum: ['layout', 'color', 'typography', 'accessibility', 'branding', 'composition'],
                },
              },
              required: ['type', 'severity', 'title', 'message', 'category'],
            },
          },
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Design state: ${JSON.stringify(designData, null, 2)}\nRecent change: ${JSON.stringify(lastChange || {}, null, 2)}`,
              },
            ],
          },
        ],
      });

      const suggestions = safeParseJSON<any[]>(response.text || '[]', []);

      return suggestions.map(
        (s) =>
          ({
            ...s,
            id: uuidv4(),
          }) as DesignSuggestion
      );
    } catch (error) {
      log.error('[AI Assistant] Realtime suggestions failed', error);
      return [];
    }
  }

  /**
   * Generate improvement suggestions with auto-fix capabilities
   */
  async generateAutoFixes(
    suggestion: DesignSuggestion,
    artboard: Artboard
  ): Promise<{ layerId: string; updates: Partial<Layer> }[]> {
    // This would contain logic for common auto-fixes
    // For now, return empty array - can be extended with specific fixes
    return [];
  }

  /**
   * Prepare design data for AI analysis
   */
  private prepareDesignData(artboard: Artboard, context: DesignContext, brandKit?: BrandKit) {
    return {
      canvas: {
        width: artboard.width,
        height: artboard.height,
        backgroundColor: artboard.backgroundColor || context.canvasSize.name,
      },
      layers: artboard.layers.map((layer) => ({
        id: layer.id,
        type: layer.type,
        name: layer.name,
        dimensions: {
          x: layer.x,
          y: layer.y,
          width: layer.width,
          height: layer.height,
        },
        visible: layer.visible,
        opacity: layer.opacity,
        // Type-specific properties
        ...(layer.type === 'text' && {
          text: (layer as any).text,
          fontSize: (layer as any).fontSize,
          fontFamily: (layer as any).fontFamily,
          color: (layer as any).color,
          textAlign: (layer as any).textAlign,
        }),
        ...(layer.type === 'image' && {
          hasAltText: !!(layer as any).altText,
        }),
        ...((['rectangle', 'circle', 'triangle'] as const).includes(layer.type as any) && {
          color: (layer as any).color,
          cornerRadius: (layer as any).cornerRadius,
        }),
      })),
      context: {
        layerCount: context.layerCount,
        hasText: context.hasText,
        hasImages: context.hasImages,
        colorPalette: context.colorPalette,
        fontFamilies: context.fontFamilies,
        purpose: context.purpose,
      },
      brandKit: brandKit
        ? {
            colors: brandKit.colors,
            fonts: brandKit.fonts,
            name: brandKit.name,
          }
        : null,
    };
  }
}

export const aiAssistantService = AIAssistantService.getInstance();
