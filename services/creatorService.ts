import { db as supabase } from '../lib/supabase/client';
import { log } from '../utils/log';

export interface Creator {
  id: string;
  user_id: string;
  name: string;
  email: string;
  portfolio_url: string | null;
  specialization: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface Asset {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  file_url: string;
  thumbnail_url: string | null;
  price: number;
  downloads: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface AssetStats {
  totalAssets: number;
  totalDownloads: number;
  totalEarnings: number;
}

export const creatorService = {
  async becomeCreator(data: {
    name: string;
    email: string;
    portfolio_url?: string;
    specialization?: string;
  }): Promise<Creator | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: creator, error } = await supabase
        .from('creators')
        .insert({
          user_id: user.id,
          name: data.name,
          email: data.email,
          portfolio_url: data.portfolio_url || null,
          specialization: data.specialization || null,
          is_verified: false
        })
        .select()
        .single();

      if (error) throw error;
      return creator;
    } catch (error) {
      log.error('[CreatorService] becomeCreator failed', error);
      return null;
    }
  },

  async uploadAsset(data: {
    title: string;
    description?: string;
    category: string;
    tags?: string[];
    file_url: string;
    thumbnail_url?: string;
    price?: number;
  }): Promise<Asset | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: creator } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!creator) throw new Error('Not a creator');

      const { data: asset, error } = await supabase
        .from('assets')
        .insert({
          creator_id: creator.id,
          title: data.title,
          description: data.description || null,
          category: data.category,
          tags: data.tags || [],
          file_url: data.file_url,
          thumbnail_url: data.thumbnail_url || null,
          price: data.price || 0,
          downloads: 0,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return asset;
    } catch (error) {
      log.error('[CreatorService] uploadAsset failed', error);
      return null;
    }
  },

  async getCreatorAssets(creatorId: string): Promise<Asset[]> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('[CreatorService] getCreatorAssets failed', error);
      return [];
    }
  },

  async getAssetStats(creatorId: string): Promise<AssetStats> {
    try {
      const { data: assets, error } = await supabase
        .from('assets')
        .select('downloads, price')
        .eq('creator_id', creatorId)
        .eq('status', 'approved');

      if (error) throw error;

      const totalAssets = assets?.length || 0;
      const totalDownloads = assets?.reduce((sum, a) => sum + (a.downloads || 0), 0) || 0;
      const totalEarnings = assets?.reduce((sum, a) => sum + ((a.downloads || 0) * (a.price || 0)), 0) || 0;

      return { totalAssets, totalDownloads, totalEarnings };
    } catch (error) {
      log.error('[CreatorService] getAssetStats failed', error);
      return { totalAssets: 0, totalDownloads: 0, totalEarnings: 0 };
    }
  },

  async approveAsset(assetId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('assets')
        .update({ status: 'approved' })
        .eq('id', assetId);

      if (error) throw error;
      return true;
    } catch (error) {
      log.error('[CreatorService] approveAsset failed', error);
      return false;
    }
  },

  async rejectAsset(assetId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('assets')
        .update({ status: 'rejected' })
        .eq('id', assetId);

      if (error) throw error;
      return true;
    } catch (error) {
      log.error('[CreatorService] rejectAsset failed', error);
      return false;
    }
  },

  async getAssetById(assetId: string): Promise<Asset | null> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('[CreatorService] getAssetById failed', error);
      return null;
    }
  }
};