import { db as supabase } from '../lib/supabase/client';
import { log } from '../utils/log';
import type { Asset } from './creatorService';

export const assetService = {
  async searchAssets(
    query: string,
    category?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ assets: Asset[]; total: number }> {
    try {
      let q = supabase.from('assets').select('*', { count: 'exact' }).eq('status', 'approved');

      if (query) {
        const safeQuery = query.replace(/[",]/g, '');
        q = q.or(`title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,tags.cs.{${safeQuery}}`);
      }

      if (category) {
        q = q.eq('category', category);
      }

      const offset = (page - 1) * limit;
      q = q.range(offset, offset + limit - 1).order('created_at', { ascending: false });

      const { data, error, count } = await q;
      if (error) throw error;

      return {
        assets: data || [],
        total: count || 0,
      };
    } catch (error) {
      log.error('[AssetService] searchAssets failed', error);
      return { assets: [], total: 0 };
    }
  },

  async getAssetById(id: string): Promise<Asset | null> {
    try {
      const { data, error } = await supabase.from('assets').select('*').eq('id', id).single();

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('[AssetService] getAssetById failed', error);
      return null;
    }
  },

  async downloadAsset(id: string): Promise<boolean> {
    try {
      const { error } = await (supabase.rpc as any)('increment_asset_downloads', { asset_id: id });

      if (error) {
        const { error: updateError } = await (supabase as any)
          .from('assets')
          .update({ downloads: 0 })
          .eq('id', id);

        const { data: asset } = await (supabase as any).from('assets').select('downloads').eq('id', id).single();

        if (asset) {
          const { error: retryError } = await (supabase as any)
            .from('assets')
            .update({ downloads: ((asset as any).downloads || 0) + 1 })
            .eq('id', id);

          if (retryError) throw retryError;
        }
      }
      return true;
    } catch (error) {
      log.error('[AssetService] downloadAsset failed', error);
      return false;
    }
  },

  async getPopularAssets(limit: number = 10): Promise<Asset[]> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('status', 'approved')
        .order('downloads', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('[AssetService] getPopularAssets failed', error);
      return [];
    }
  },

  async getRecentAssets(limit: number = 10): Promise<Asset[]> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('[AssetService] getRecentAssets failed', error);
      return [];
    }
  },

  async getAssetsByCategory(category: string): Promise<Asset[]> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('status', 'approved')
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('[AssetService] getAssetsByCategory failed', error);
      return [];
    }
  },
};
