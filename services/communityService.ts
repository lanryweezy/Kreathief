import { db as supabase } from '../lib/supabase/client';
import { log } from '../utils/log';

export interface CommunityTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  size: any;
  state: any;
  userId: string;
  userName: string;
  userAvatar?: string;
  likes: number;
  downloads: number;
  thumbnailUrl: string | null;
  tags: string[];
  remixOf: string | null;
  createdAt: number;
  updatedAt: number;
}

export const communityService = {
  async fetchTemplates(
    category?: string,
    query?: string,
    sortBy: 'likes' | 'downloads' | 'newest' = 'likes'
  ): Promise<CommunityTemplate[]> {
    try {
      let q = supabase.from('community_templates').select('*');

      if (category && category !== 'All') {
        q = q.eq('category', category);
      }
      if (query) {
        q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%,user_name.ilike.%${query}%`);
      }

      const orderCol = sortBy === 'newest' ? 'created_at' : sortBy === 'downloads' ? 'downloads' : 'likes';
      q = q.order(orderCol, { ascending: sortBy === 'newest' ? false : true });

      const { data, error } = await q;
      if (error) throw error;

      return (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        category: t.category || 'Uncategorized',
        description: t.description || '',
        size: t.size,
        state: t.state,
        userId: t.user_id,
        userName: t.user_name,
        likes: t.likes || 0,
        downloads: t.downloads || 0,
        thumbnailUrl: t.thumbnail_url || null,
        tags: t.tags || [],
        remixOf: t.remix_of || null,
        createdAt: new Date(t.created_at).getTime(),
        updatedAt: new Date(t.updated_at || t.created_at).getTime(),
      }));
    } catch (error) {
      log.error('[CommunityService] Fetch failed', error);
      return [];
    }
  },

  async publishTemplate(template: {
    id: string;
    name: string;
    category: string;
    description?: string;
    size: any;
    state: any;
    userId: string;
    userName: string;
    thumbnailUrl?: string;
    tags?: string[];
    remixOf?: string;
  }): Promise<boolean> {
    try {
      const { error } = await (supabase.from('community_templates') as any).insert({
        id: template.id,
        name: template.name,
        category: template.category,
        description: template.description || '',
        size: typeof template.size === 'object' ? JSON.stringify(template.size) : template.size,
        state: template.state,
        user_id: template.userId,
        user_name: template.userName,
        thumbnail_url: template.thumbnailUrl || null,
        tags: template.tags || [],
        remix_of: template.remixOf || null,
        likes: 0,
        downloads: 0,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      log.error('[CommunityService] Publish failed', error);
      return false;
    }
  },

  async likeTemplate(id: string): Promise<void> {
    try {
      await (supabase.rpc as any)('increment_template_likes', { template_id: id });
    } catch (error) {
      log.error('[CommunityService] Like failed', error);
    }
  },

  async unlikeTemplate(id: string): Promise<void> {
    try {
      await (supabase.rpc as any)('decrement_template_likes', { template_id: id });
    } catch (error) {
      log.error('[CommunityService] Unlike failed', error);
    }
  },

  async recordDownload(id: string): Promise<void> {
    try {
      await (supabase.rpc as any)('increment_template_downloads', { template_id: id });
    } catch (error) {
      log.error('[CommunityService] Download tracking failed', error);
    }
  },

  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('community_templates').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      log.error('[CommunityService] Delete failed', error);
      return false;
    }
  },

  async getTemplatesByUser(userId: string): Promise<CommunityTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('community_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        category: t.category || 'Uncategorized',
        description: t.description || '',
        size: t.size,
        state: t.state,
        userId: t.user_id,
        userName: t.user_name,
        likes: t.likes || 0,
        downloads: t.downloads || 0,
        thumbnailUrl: t.thumbnail_url || null,
        tags: t.tags || [],
        remixOf: t.remix_of || null,
        createdAt: new Date(t.created_at).getTime(),
        updatedAt: new Date(t.updated_at || t.created_at).getTime(),
      }));
    } catch (error) {
      log.error('[CommunityService] User fetch failed', error);
      return [];
    }
  },
};
