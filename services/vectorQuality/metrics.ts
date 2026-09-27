import { Layer } from '../../types';
import { log } from '../../utils/log';

export interface EvaluationScore {
  geometryScore: number; // 0-100 (overlaps, alignment, out-of-bounds)
  vlmScore: number; // 0-100 (prompt adherence, style match)
  hirMetric: number; // Human Intervention Rate (predicted % of elements a human must fix)
  overall: number;
  flags: string[];
}

export class MultiJudgeEvalService {
  /**
   * Geometry Judge: Mathematically evaluates the AST for structural design flaws.
   */
  public evaluateGeometry(layers: Layer[], canvasWidth: number, canvasHeight: number): { score: number; flags: string[] } {
    let penalty = 0;
    const flags: string[] = [];

    // 1. Check Out of Bounds
    layers.forEach((layer) => {
      if (layer.x < 0 || layer.y < 0 || layer.x + layer.width > canvasWidth || layer.y + layer.height > canvasHeight) {
        if (layer.type !== 'image') {
          // Images are allowed to bleed, but text/ui elements should not
          penalty += 15;
          flags.push(`Layer ${layer.id} (${layer.type}) bleeds out of bounds illegally.`);
        }
      }
    });

    // 2. Check Overlapping Text (Basic AABB Collision)
    const textLayers = layers.filter(l => l.type === 'text');
    for (let i = 0; i < textLayers.length; i++) {
      for (let j = i + 1; j < textLayers.length; j++) {
        const t1 = textLayers[i];
        const t2 = textLayers[j];
        
        const overlap = !(
          t1.x + t1.width < t2.x ||
          t2.x + t2.width < t1.x ||
          t1.y + t1.height < t2.y ||
          t2.y + t2.height < t1.y
        );

        if (overlap) {
          penalty += 25;
          flags.push(`Text collision detected between ${t1.id} and ${t2.id}.`);
        }
      }
    }

    // 3. Contrast & Alignment heuristics could be added here...

    const score = Math.max(0, 100 - penalty);
    return { score, flags };
  }

  /**
   * VLM Judge: Simulates a call to an LLM evaluator to grade prompt adherence.
   */
  public async evaluateVLM(prompt: string, layoutSnapshot: string): Promise<{ score: number; flags: string[] }> {
    // In production, this pings GPT-4V or Gemini with the rendered image + prompt
    log.info('[MultiJudge] Running VLM Judge evaluation...');
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          score: 88,
          flags: ['VLM: Color palette slightly deviates from "cyberpunk" theme.']
        });
      }, 800);
    });
  }

  /**
   * Master Eval: Runs all judges and calculates the KDAB/HIR metrics.
   */
  public async runFullEvaluation(prompt: string, layers: Layer[], canvasW: number, canvasH: number): Promise<EvaluationScore> {
    const geo = this.evaluateGeometry(layers, canvasW, canvasH);
    const vlm = await this.evaluateVLM(prompt, JSON.stringify(layers));

    // Predicted Human Intervention Rate (lower is better)
    // Formula: (Number of critical geometry flags / total layers) * weight
    const criticalIssues = geo.flags.length;
    let hir = (criticalIssues / Math.max(layers.length, 1)) * 100;
    hir = Math.min(100, Math.max(0, hir));

    const overall = (geo.score * 0.6) + (vlm.score * 0.4);

    return {
      geometryScore: geo.score,
      vlmScore: vlm.score,
      hirMetric: hir,
      overall,
      flags: [...geo.flags, ...vlm.flags]
    };
  }
}

export const multiJudgeEval = new MultiJudgeEvalService();
