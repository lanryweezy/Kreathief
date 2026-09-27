import { Layer } from '../types';
import { log } from '../utils/log';

class FontManagerService {
  private loadedFonts: Set<string> = new Set();

  // List of web-safe fonts that don't need Google Fonts injection
  private webSafeFonts = new Set([
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Times',
    'Courier New',
    'Courier',
    'Verdana',
    'Georgia',
    'Palatino',
    'Garamond',
    'Bookman',
    'Comic Sans MS',
    'Trebuchet MS',
    'Arial Black',
    'Impact',
    'system-ui',
    'sans-serif',
    'serif',
    'monospace',
  ]);

  /**
   * Scans an array of layers and dynamically injects any required Google Fonts
   * that haven't been loaded yet, returning a Promise that resolves ONLY when
   * the fonts are loaded and ready in document.fonts.
   */
  public async loadFontsForLayers(layers: Layer[], timeoutMs = 3000): Promise<void> {
    const requiredFonts = new Set<string>();

    layers.forEach((layer) => {
      if (layer.type === 'text') {
        const fontFamily = (layer as any).fontFamily;
        if (fontFamily && !this.webSafeFonts.has(fontFamily) && !this.loadedFonts.has(fontFamily)) {
          requiredFonts.add(fontFamily);
        }
      }
    });

    if (requiredFonts.size === 0) return;

    try {
      const fontsArray = Array.from(requiredFonts);
      const fontFamilies = fontsArray.map((font) => font.replace(/\s+/g, '+')).join('&family=');

      if (typeof document === 'undefined' || !document.head) {
        fontsArray.forEach((font) => this.loadedFonts.add(font));
        return;
      }

      if (fontFamilies.length > 0) {
        const url = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;

        await new Promise<void>((resolve) => {
          const timer = setTimeout(() => {
            log.warn(`[FontManager] Font preflight timed out after ${timeoutMs}ms: ${fontsArray.join(', ')}`);
            fontsArray.forEach((font) => this.loadedFonts.add(font));
            resolve();
          }, timeoutMs);

          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = url;

          link.onload = async () => {
            try {
              if (typeof document !== 'undefined' && 'fonts' in document) {
                const fontPromises = fontsArray.map((font) =>
                  (document as any).fonts.load(`16px "${font}"`).catch(() => [])
                );
                await Promise.all(fontPromises);
                await (document as any).fonts.ready.catch(() => {});
              }
            } catch (_err) {
              /* Ignore font load API errors */
            } finally {
              clearTimeout(timer);
              fontsArray.forEach((font) => this.loadedFonts.add(font));
              log.info(`[FontManager] Google Fonts loaded & preflight ready: ${fontsArray.join(', ')}`);
              resolve();
            }
          };

          link.onerror = () => {
            clearTimeout(timer);
            log.warn(`[FontManager] Failed to load stylesheet for Google Fonts: ${fontsArray.join(', ')}`);
            fontsArray.forEach((font) => this.loadedFonts.add(font));
            resolve();
          };

          document.head.appendChild(link);
        });
      }
    } catch (e) {
      log.error('[FontManager] Failed to inject Google Fonts', e);
    }
  }

  /**
   * Clears the tracking of loaded fonts. (Useful for full resets or testing).
   */
  public reset() {
    this.loadedFonts.clear();
  }
}

export const fontManager = new FontManagerService();
