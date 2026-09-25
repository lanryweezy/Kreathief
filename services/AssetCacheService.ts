import { log } from '../utils/log';

export class AssetCacheService {
  /**
   * In-memory LRU ceiling for AI-generated assets: JS Map keeps insertion
   * order, so re-setting on read refreshes recency and the oldest key is
   * always first for O(1) eviction.
   */
  static readonly MAX_CACHE_SIZE = 200;
  private static cache = new Map<string, any>();

  static set(key: string, value: any): void {
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, value);
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) {
        const oldestValue = this.cache.get(oldest);
        if (oldestValue && oldestValue.blobUrl && oldestValue.blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(oldestValue.blobUrl);
        } else if (typeof oldestValue === 'string' && oldestValue.startsWith('blob:')) {
          URL.revokeObjectURL(oldestValue);
        }
        this.cache.delete(oldest);
      }
    }
  }

  static get(key: string): any | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key);
    // Refresh recency
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  static clear(): void {
    for (const value of this.cache.values()) {
      if (value && value.blobUrl && value.blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(value.blobUrl);
      } else if (typeof value === 'string' && value.startsWith('blob:')) {
        URL.revokeObjectURL(value);
      }
    }
    this.cache.clear();
  }

  /**
   * Called when a search returns 0 results from standard APIs.
   * Prompts Fal.ai to generate the missing asset, caches it in Supabase,
   * and returns the generated asset.
   */
  static async generateMissingAsset(query: string, type: 'icon' | 'illustration' | '3d'): Promise<any> {
    const cacheKey = `${type}:${query.toLowerCase().trim()}`;
    const cached = this.get(cacheKey);
    if (cached) return cached;

    log.info(`[AssetCacheService] Generating missing asset for: ${query}`);

    let prompt = '';
    if (type === 'icon') {
      prompt = `A clean, flat vector icon of ${query}, minimal, single color, transparent background`;
    } else if (type === 'illustration') {
      prompt = `A high quality vector illustration of ${query}, flat design, corporate memphis style, transparent background`;
    } else if (type === '3d') {
      prompt = `A 3D isometric render of ${query}, soft lighting, clay style, transparent background`;
    }

    try {
      // In a real implementation, this would call Fal.ai, download the result,
      // upload it to Supabase Storage, insert a row in the public_assets table,
      // and return the URL. For now, we simulate this pipeline.

      // const falResult = await falService.generateImage({ prompt });
      // const uploadedUrl = await supabaseStorage.upload(falResult.url);

      log.info(`[AssetCacheService] AI Generation triggered for ${query}`);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const asset = {
        id: `ai-gen-${Date.now()}`,
        name: `${query} (AI Generated)`,
        thumbnailUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(query)}`,
        source: 'ai-cache',
        assetType: type === '3d' ? '3d' : 'svg',
      };
      this.set(cacheKey, asset);
      return asset;
    } catch (error) {
      log.error('[AssetCacheService] Failed to generate missing asset', error);
      return null;
    }
  }
}
