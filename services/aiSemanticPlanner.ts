import { callBackendGeminiAPI } from './geminiService';
import { log } from '../utils/log';
import { safeParseJSON } from '../utils/errorHandling';
import { SemanticDesignBlueprint, ASTNode, ContainerNode } from '../types/designAST';
import { LayoutSolver } from '../layout/layoutSolver';
import { Layer } from '../types';

const PLANNER_SYSTEM_PROMPT = `
You are the Kreathief AI Design Planner (Art Director).
Your job is to take a creative brief and generate a Semantic Design AST (Abstract Syntax Tree) representing the layout structure.

DO NOT output absolute x, y, width, height pixel coordinates.
Instead, use a layout system based on Containers (flex-row, flex-col), gaps, paddings, and flex ratios.

ROLES:
- 'background': Generated atmospheric backdrop (Flux/Midjourney)
- 'vector-accent': SVG graphics/decorations (Recraft V3)
- 'hero-cutout': The main subject with transparent background (Qwen)
- 'typography': Native text elements
- 'cta': Call to action buttons

OUTPUT JSON FORMAT:
{
  "canvas": {
    "width": number,
    "height": number,
    "backgroundColor": string (optional hex)
  },
  "root": {
    "id": "root",
    "type": "container",
    "direction": "col" | "row",
    "padding": number,
    "gap": number,
    "alignItems": "start"|"center"|"end"|"space-between",
    "justifyContent": "start"|"center"|"end"|"space-between",
    "children": [
      // ASTNodes: ContainerNode, TypographyNode, AssetNode
    ]
  },
  "metadata": {
    "theme": string,
    "vibe": string
  }
}

RULES:
1. Always build a logical flex hierarchy. E.g., a "hero-cutout" AssetNode next to a "container" (flex-col) of TypographyNodes.
2. For TypographyNode, assign "hierarchyWeight" (1-10) instead of font size. 10 is the main headline.
3. For TypographyNode, optionally apply a "warpEffect" ('arch', 'wave', 'circle', 'flag') for retro styles, badges, or highly stylized designs.
4. For AssetNode, provide a highly detailed "prompt" describing the image/vector.
5. Keep the tree depth reasonable (1-3 levels).
6. Output ONLY valid JSON.
`;

const CRITIC_SYSTEM_PROMPT = `
You are the Kreathief AI Critic.
Your job is to evaluate a Semantic Design AST and provide a score (1-10) and feedback.

CHECKLIST:
1. HIERARCHY: Is there a clear focal point (e.g., a hierarchyWeight 9-10 text node, or a hero-cutout)?
2. SPACING: Are the gaps and paddings appropriate? (If a container has many items, does it have a gap?)
3. CONTRAST: If the canvas has no background color, is there a background asset node?

OUTPUT JSON FORMAT:
{
  "score": number (1-10),
  "feedback": string,
  "passed": boolean (true if score >= 8)
}
`;

export async function planSemanticDesign(prompt: string, width: number, height: number): Promise<{ blueprint: SemanticDesignBlueprint; layers: Layer[] }> {
  log.info('[SemanticPlanner] Starting Planner Loop for prompt:', prompt);
  
  let currentBlueprint: SemanticDesignBlueprint | null = null;
  let attempts = 0;
  const MAX_ATTEMPTS = 3;
  let criticFeedback = '';

  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    
    // 1. Plan
    const userMessage = `Create a semantic design AST for this brief:\n"${prompt}"\nCanvas: ${width}x${height}px\n${criticFeedback ? 'CRITIC FEEDBACK TO FIX:\n' + criticFeedback : ''}`;
    
    const response = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      systemInstruction: PLANNER_SYSTEM_PROMPT,
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
    });
    
    let rawText = '';
    const resAny = response as any;
    if (typeof response === 'string') rawText = response;
    else if (resAny?.candidates?.[0]?.content?.parts?.[0]?.text) rawText = resAny.candidates[0].content.parts[0].text;
    else if (resAny?.choices?.[0]?.message?.content) rawText = resAny.choices[0].message.content;

    const blueprint = safeParseJSON<SemanticDesignBlueprint | null>(rawText, null);
    if (!blueprint || !blueprint.root) {
      throw new Error('Failed to parse planner output');
    }
    
    currentBlueprint = blueprint;

    // 2. Critique
    const criticMessage = `Evaluate this AST:\n${JSON.stringify(blueprint, null, 2)}`;
    const criticResponse = await callBackendGeminiAPI({
      modelName: 'gemini-2.5-flash',
      systemInstruction: CRITIC_SYSTEM_PROMPT,
      contents: [{ role: 'user', parts: [{ text: criticMessage }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    });
    
    let criticRaw = '';
    const critAny = criticResponse as any;
    if (typeof criticResponse === 'string') criticRaw = criticResponse;
    else if (critAny?.candidates?.[0]?.content?.parts?.[0]?.text) criticRaw = critAny.candidates[0].content.parts[0].text;
    else if (critAny?.choices?.[0]?.message?.content) criticRaw = critAny.choices[0].message.content;

    const critique = safeParseJSON<{ score: number, feedback: string, passed: boolean } | null>(criticRaw, null);
    
    if (critique?.passed) {
      log.info(`[SemanticPlanner] Critic passed on attempt ${attempts} with score ${critique.score}`);
      break;
    } else {
      log.warn(`[SemanticPlanner] Critic failed on attempt ${attempts}: ${critique?.feedback}`);
      criticFeedback = critique?.feedback || 'Structure is invalid.';
    }
  }

  if (!currentBlueprint) {
    throw new Error('Planner failed to generate a valid blueprint');
  }

  // 3. Solve Layout
  const solver = new LayoutSolver();
  const layers = solver.solve(currentBlueprint);
  
  return { blueprint: currentBlueprint, layers };
}
