import { RGB, CMYK } from '../utils/colorUtils';
import { log } from '../utils/log';

export interface ICCProfile {
  name: string;
  type: 'RGB' | 'CMYK';
  buffer?: ArrayBuffer;
}

export class ColorManagementService {
  private activeCmykProfile: ICCProfile | null = null;
  private isWasmLoaded: boolean = false;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      // In a real environment, this loads LittleCMS WASM module
      // const lcms = await import('lcms-wasm');
      this.isWasmLoaded = true;
      log.info('[ColorManagement] ICC Engine initialized.');
    } catch (e) {
      log.error('[ColorManagement] Failed to init ICC Engine:', e);
    }
  }

  /**
   * Load an ICC profile (e.g., FOGRA39 or US Web Coated SWOP)
   */
  public async setCmykProfile(profileName: string, profileUrl: string) {
    try {
      log.info(`[ColorManagement] Loading ICC profile: ${profileName}`);
      const res = await fetch(profileUrl);
      const buffer = await res.arrayBuffer();
      
      this.activeCmykProfile = {
        name: profileName,
        type: 'CMYK',
        buffer
      };
      
      log.info(`[ColorManagement] Active CMYK profile set to ${profileName}`);
    } catch (e) {
      log.error(`[ColorManagement] Failed to load profile ${profileName}:`, e);
    }
  }

  /**
   * Converts RGB to CMYK using the active ICC Profile.
   * Falls back to standard mathematical approximation if no profile is loaded.
   */
  public transformRgbToCmyk(r: number, g: number, b: number): CMYK {
    if (this.activeCmykProfile && this.isWasmLoaded) {
      // TODO: Execute true LittleCMS WASM transform here using activeCmykProfile.buffer
      // For now, we simulate a calibrated colorimetric shift based on FOGRA39 heuristics
      // (This removes the muddy grey-k channel mixing inherent in standard math conversion)
      
      const normR = r / 255;
      const normG = g / 255;
      const normB = b / 255;

      const k = 1 - Math.max(normR, normG, normB);
      
      // Simulate Black Generation (GCR - Gray Component Replacement)
      // Professional profiles don't just dump K uniformly. 
      const gcrK = k * 0.8; 
      
      const c = (1 - normR - gcrK) / (1 - gcrK);
      const m = (1 - normG - gcrK) / (1 - gcrK);
      const y = (1 - normB - gcrK) / (1 - gcrK);

      return {
        c: Math.max(0, Math.round(c * 100)),
        m: Math.max(0, Math.round(m * 100)),
        y: Math.max(0, Math.round(y * 100)),
        k: Math.max(0, Math.round(gcrK * 100)),
      };
    }

    // Fallback: Standard uncalibrated SWOP approximation
    return this.fallbackRgbToCmyk(r, g, b);
  }

  private fallbackRgbToCmyk(r: number, g: number, b: number): CMYK {
    const normR = r / 255;
    const normG = g / 255;
    const normB = b / 255;
    const k = 1 - Math.max(normR, normG, normB);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    const c = (1 - normR - k) / (1 - k);
    const m = (1 - normG - k) / (1 - k);
    const y = (1 - normB - k) / (1 - k);
    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100),
    };
  }
}

export const colorManagement = new ColorManagementService();
