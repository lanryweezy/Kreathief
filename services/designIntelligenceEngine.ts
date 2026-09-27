import { CreativeBrief } from '../types/brief';

/**
 * ============================================
 * DESIGN INTELLIGENCE ENGINE (Intent Parser)
 * ============================================
 * Takes raw natural language from the user ("Make a flyer for my business")
 * and attempts to structure it into the CreativeBrief schema.
 * 
 * In production, this uses an LLM call. Here we simulate the parsing
 * for deterministic testing and architecture scaffolding.
 */

export class DesignIntelligenceEngine {
  
  /**
   * Simulates an LLM parsing a prompt into a structured brief.
   * If the prompt is vague, it scores the confidence as 0.0 for missing fields.
   */
  public async parseIntent(prompt: string): Promise<CreativeBrief> {
    const text = prompt.toLowerCase();
    
    // Base template
    const brief: CreativeBrief = {
      objective: prompt,
      confidence: {
        objective: 1.0,
      }
    };

    // 1. Guess Channel
    if (text.includes('instagram') || text.includes('ig')) {
      brief.channel = 'instagram';
      brief.confidence.channel = 0.9;
    } else if (text.includes('whatsapp') || text.includes('story')) {
      brief.channel = 'whatsapp';
      brief.confidence.channel = 0.9;
    } else if (text.includes('poster') || text.includes('flyer') || text.includes('print')) {
      brief.channel = 'print';
      brief.confidence.channel = 0.8;
    } else {
      brief.confidence.channel = 0.0;
    }

    // 2. Guess Offer / Business
    if (text.includes('restaurant') || text.includes('food') || text.includes('menu')) {
      brief.offer = 'Restaurant / Food';
      brief.confidence.offer = 0.8;
    } else if (text.includes('fashion') || text.includes('clothes')) {
      brief.offer = 'Fashion / Retail';
      brief.confidence.offer = 0.8;
    } else if (text.includes('tech') || text.includes('app') || text.includes('software')) {
      brief.offer = 'Tech / Software';
      brief.confidence.offer = 0.8;
    } else {
      brief.confidence.offer = 0.0;
    }

    // 3. Audience
    if (text.includes('kids') || text.includes('children')) {
      brief.audience = 'Parents and Children';
      brief.confidence.audience = 0.9;
    } else if (text.includes('corporate') || text.includes('b2b')) {
      brief.audience = 'Corporate Professionals';
      brief.confidence.audience = 0.9;
    } else {
      brief.confidence.audience = 0.0;
    }

    // 4. Call to Action
    if (text.includes('buy') || text.includes('shop')) {
      brief.callToAction = 'Shop Now';
      brief.confidence.callToAction = 0.9;
    } else if (text.includes('visit')) {
      brief.callToAction = 'Visit Website';
      brief.confidence.callToAction = 0.9;
    } else {
      brief.confidence.callToAction = 0.0;
    }

    return brief;
  }
}

export const designIntelligenceEngine = new DesignIntelligenceEngine();
