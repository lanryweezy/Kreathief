import { db as supabase } from '../lib/supabase/client';
import { log } from '../utils/log';

export interface MarketplaceTemplate {
  id: string; title: string; description: string; category: string; tags: string[];
  authorId: string; authorName: string; authorAvatar?: string; likes: number; downloads: number;
  thumbnailUrl: string | null; templateData: any; status: 'pending' | 'approved' | 'rejected';
  createdAt: number; updatedAt: number;
}

export interface SubmitTemplateData {
  title: string; description: string; category: string; tags: string[]; templateData: any; thumbnailUrl?: string;
}

interface PaginatedResult<T> { data: T[]; total: number; page: number; hasMore: boolean; }

const PAGE_SIZE = 12;

const map = (r: any): MarketplaceTemplate => ({
  id: r.id, title: r.title, description: r.description || '', category: r.category || 'Uncategorized',
  tags: r.tags || [], authorId: r.author_id, authorName: r.author_name, authorAvatar: r.author_avatar,
  likes: r.likes || 0, downloads: r.downloads || 0, thumbnailUrl: r.thumbnail_url, templateData: r.template_data,
  status: r.status, createdAt: new Date(r.created_at).getTime(), updatedAt: new Date(r.updated_at || r.created_at).getTime(),
});

export const templateMarketplace = {
  async submitTemplate(data: SubmitTemplateData): Promise<MarketplaceTemplate | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');
      const { data: row, error } = await supabase.from('marketplace_templates').insert({
        title: data.title, description: data.description, category: data.category, tags: data.tags,
        template_data: data.templateData, thumbnail_url: data.thumbnailUrl || null,
        author_id: user.user.id, author_name: user.user.user_metadata?.full_name || user.user.email || 'Anonymous',
        author_avatar: user.user.user_metadata?.avatar_url, status: 'pending',
      }).select().single();
      if (error) throw error;
      return map(row);
    } catch (e) { log.error('[TemplateMarketplace] Submit failed', e); return null; }
  },

  async getTemplates(category?: string, page = 1, sortBy: 'popular' | 'recent' | 'likes' = 'popular'): Promise<PaginatedResult<MarketplaceTemplate>> {
    try {
      const from = (page - 1) * PAGE_SIZE;
      let q = supabase.from('marketplace_templates').select('*', { count: 'exact' }).eq('status', 'approved');
      if (category && category !== 'All') q = q.eq('category', category);
      const col = sortBy === 'recent' ? 'created_at' : sortBy === 'likes' ? 'likes' : 'downloads';
      const { data, error, count } = await q.order(col, { ascending: false }).range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return { data: (data || []).map(map), total: count || 0, page, hasMore: (count || 0) > from + PAGE_SIZE };
    } catch (e) { log.error('[TemplateMarketplace] Fetch failed', e); return { data: [], total: 0, page, hasMore: false }; }
  },

  async getTemplateById(id: string): Promise<MarketplaceTemplate | null> {
    try {
      const { data, error } = await supabase.from('marketplace_templates').select('*').eq('id', id).single();
      if (error) throw error; return map(data);
    } catch (e) { log.error('[TemplateMarketplace] Get by ID failed', e); return null; }
  },

  async likeTemplate(id: string): Promise<void> {
    try { await supabase.rpc('increment_marketplace_template_likes', { template_id: id }); }
    catch (e) { log.error('[TemplateMarketplace] Like failed', e); }
  },

  async getPopularTemplates(limit = 8): Promise<MarketplaceTemplate[]> {
    try {
      const { data, error } = await supabase.from('marketplace_templates').select('*')
        .eq('status', 'approved').order('downloads', { ascending: false }).limit(limit);
      if (error) throw error; return (data || []).map(map);
    } catch (e) { log.error('[TemplateMarketplace] Popular fetch failed', e); return []; }
  },

  async getRecentTemplates(limit = 8): Promise<MarketplaceTemplate[]> {
    try {
      const { data, error } = await supabase.from('marketplace_templates').select('*')
        .eq('status', 'approved').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error; return (data || []).map(map);
    } catch (e) { log.error('[TemplateMarketplace] Recent fetch failed', e); return []; }
  },

  async searchTemplates(query: string, limit = 20): Promise<MarketplaceTemplate[]> {
    try {
      const safeQuery = query.replace(/[",]/g, '');
      const { data, error } = await supabase.from('marketplace_templates').select('*').eq('status', 'approved')
        .or(`title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,author_name.ilike.%${safeQuery}%`)
        .order('likes', { ascending: false }).limit(limit);
      if (error) throw error; return (data || []).map(map);
    } catch (e) { log.error('[TemplateMarketplace] Search failed', e); return []; }
  },

  async getTemplatesByUser(userId: string): Promise<MarketplaceTemplate[]> {
    try {
      const { data, error } = await supabase.from('marketplace_templates').select('*')
        .eq('author_id', userId).order('created_at', { ascending: false });
      if (error) throw error; return (data || []).map(map);
    } catch (e) { log.error('[TemplateMarketplace] User fetch failed', e); return []; }
  },
};
