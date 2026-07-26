import { db as supabase } from '../lib/supabase/client';
import { log } from '../utils/log';
import type { Profile } from '../lib/supabase/types';
import type { CommunityTemplate } from './communityService';
import { communityService } from './communityService';

export interface UserProfile extends Profile {
  communityTemplates?: CommunityTemplate[];
}

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await (supabase as any).from('profiles').select('*').eq('id', userId).single();

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('[ProfileService] Fetch failed', error);
      return null;
    }
  },

  async getPublicProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) return null;

      const templates = await communityService.getTemplatesByUser(userId);

      return {
        ...profile,
        communityTemplates: templates,
      };
    } catch (error) {
      log.error('[ProfileService] Public profile fetch failed', error);
      return null;
    }
  },

  async updateProfile(
    userId: string,
    updates: { name?: string; bio?: string; website?: string; location?: string; avatar_url?: string }
  ): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      log.error('[ProfileService] Update failed', error);
      return false;
    }
  },

  async searchProfiles(query: string, limit: number = 20): Promise<Profile[]> {
    try {
      const safeQuery = query.replace(/[",]/g, '');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_public', true)
        .or(`name.ilike.%${safeQuery}%`)
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('[ProfileService] Search failed', error);
      return [];
    }
  },

  async getPublicProjects(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, thumbnail_url, created_at, tags, is_public')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('[ProfileService] Public projects fetch failed', error);
      return [];
    }
  },
};
