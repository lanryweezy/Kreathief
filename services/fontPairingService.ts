import { log } from '../utils/log';

export interface FontPairing {
  headingFont: string;
  bodyFont: string;
  vibe: string;
  contrast: 'High' | 'Medium' | 'Low';
}

const CURATED_PAIRINGS: FontPairing[] = [
  { headingFont: 'Clash Display', bodyFont: 'Inter', vibe: 'Modern Tech', contrast: 'High' },
  { headingFont: 'Playfair Display', bodyFont: 'Source Sans Pro', vibe: 'Editorial Elegance', contrast: 'High' },
  { headingFont: 'Space Grotesk', bodyFont: 'IBM Plex Sans', vibe: 'Cyberpunk Brutalism', contrast: 'Medium' },
  { headingFont: 'Bebas Neue', bodyFont: 'Montserrat', vibe: 'Bold Marketing', contrast: 'High' },
  { headingFont: 'Lora', bodyFont: 'Merriweather', vibe: 'Classic Academic', contrast: 'Low' },
  { headingFont: 'Oswald', bodyFont: 'Lato', vibe: 'Clean Corporate', contrast: 'High' }
];

export class FontPairingService {
  /**
   * Suggests a curated font pairing based on an AI-detected mood or archetype.
   */
  public suggestPairingByVibe(promptKeywords: string): FontPairing {
    const prompt = promptKeywords.toLowerCase();
    
    if (prompt.includes('cyber') || prompt.includes('tech') || prompt.includes('future')) {
      return CURATED_PAIRINGS[2]; // Space Grotesk + IBM Plex
    }
    if (prompt.includes('elegant') || prompt.includes('editorial') || prompt.includes('fashion')) {
      return CURATED_PAIRINGS[1]; // Playfair + Source Sans
    }
    if (prompt.includes('bold') || prompt.includes('promo') || prompt.includes('sale')) {
      return CURATED_PAIRINGS[3]; // Bebas Neue + Montserrat
    }
    
    // Default fallback to Modern Tech
    return CURATED_PAIRINGS[0]; 
  }

  /**
   * Mock endpoint for calling an external AI model to dynamically generate font pairings.
   */
  public async generateDynamicPairing(designContext: string): Promise<FontPairing> {
    return new Promise((resolve) => {
      log.info('[FontPairingService] Requesting AI font pairing for:', designContext);
      setTimeout(() => {
        resolve({
          headingFont: 'Syne',
          bodyFont: 'DM Sans',
          vibe: 'Avant-Garde Custom',
          contrast: 'High'
        });
      }, 1000);
    });
  }
}

export const fontPairingService = new FontPairingService();
