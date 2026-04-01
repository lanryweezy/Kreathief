import { supabase } from '../lib/supabase/client';
import { StarterTemplate } from '../data/templates';
import { log } from '../utils/log';

export interface CommunityTemplate extends StarterTemplate {
  userId: string;
  userName: string;
  likes: number;
  createdAt: number;
}

export const communityService = {
  async fetchTemplates(category?: string, query?: string): Promise<CommunityTemplate[]> {
    try {
      let supabaseQuery = supabase
        .from('community_templates')
        .select('*')
        .order('likes', { ascending: false });

      if (category && category !== 'All') {
        supabaseQuery = supabaseQuery.eq('category', category);
      }

      if (query) {
        supabaseQuery = supabaseQuery.ilike('name', `%${query}%`);
      }

      const { data, error } = await supabaseQuery;

      if (error) {throw error;}

      return (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        description: t.description,
        size: t.size,
        state: t.state,
        userId: t.user_id,
        userName: t.user_name,
        likes: t.likes || 0,
        createdAt: new Date(t.created_at).getTime(),
      }));
    } catch (error) {
      log.error('[CommunityService] Fetch failed', error);
      return [];
    }
  },

  async publishTemplate(template: Omit<CommunityTemplate, 'likes' | 'createdAt'>): Promise<boolean> {
    try {
      const { error } = await supabase.from('community_templates').insert({
        id: template.id,
        name: template.name,
        category: template.category,
        description: template.description,
        size: template.size,
        state: template.state,
        user_id: template.userId,
        user_name: template.userName,
        likes: 0,
      });

      if (error) {throw error;}
      return true;
    } catch (error) {
      log.error('[CommunityService] Publish failed', error);
      return false;
    }
  },

  async likeTemplate(id: string): Promise<void> {
    try {
      // RPC call to increment likes atomically
      await supabase.rpc('increment_template_likes', { template_id: id });
    } catch (error) {
      log.error('[CommunityService] Like failed', error);
    }
  }
};
