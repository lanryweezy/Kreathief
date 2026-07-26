import { db as supabase } from '../lib/supabase/client';
import { log } from '../utils/log';

export interface DBComment {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  user_avatar_url: string | null;
  text: string;
  position: any;
  layer_id: string | null;
  parent_id: string | null;
  resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface CanvasComment {
  id: string;
  x: number;
  y: number;
  content: string;
  author: { name: string; avatar?: string };
  userId: string;
  createdAt: number;
  resolved: boolean;
  parentId?: string | null;
}

export interface DesignComment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: number;
}

export const commentService = {
  // ========== Canvas Comments (pin-style, positioned on canvas) ==========

  async getCanvasComments(projectId: string): Promise<CanvasComment[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('project_id', projectId)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((c: DBComment) => ({
        id: c.id,
        x: c.position?.x ?? 0,
        y: c.position?.y ?? 0,
        content: c.text,
        author: { name: c.user_name, avatar: c.user_avatar_url || undefined },
        userId: c.user_id,
        createdAt: new Date(c.created_at).getTime(),
        resolved: c.resolved,
        parentId: c.parent_id,
      }));
    } catch (error) {
      log.error('[CommentService] Get canvas comments failed', error);
      return [];
    }
  },

  async addCanvasComment(
    projectId: string,
    userId: string,
    userName: string,
    userAvatar: string | null,
    x: number,
    y: number,
    content: string
  ): Promise<CanvasComment | null> {
    try {
      const id = crypto.randomUUID();
      const { error } = await (supabase.from('comments') as any).insert({
        id,
        project_id: projectId,
        user_id: userId,
        user_name: userName,
        user_avatar_url: userAvatar,
        text: content,
        position: { x, y },
        resolved: false,
      });

      if (error) throw error;

      return {
        id,
        x,
        y,
        content,
        author: { name: userName, avatar: userAvatar || undefined },
        userId,
        createdAt: Date.now(),
        resolved: false,
      };
    } catch (error) {
      log.error('[CommentService] Add canvas comment failed', error);
      return null;
    }
  },

  async resolveCanvasComment(commentId: string): Promise<boolean> {
    try {
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select('resolved')
        .eq('id', commentId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await (supabase.from('comments') as any)
        .update({ resolved: !(data as any).resolved, updated_at: new Date().toISOString() } as any)
        .eq('id', commentId);

      if (error) throw error;
      return true;
    } catch (error) {
      log.error('[CommentService] Resolve comment failed', error);
      return false;
    }
  },

  async deleteCanvasComment(commentId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
      return true;
    } catch (error) {
      log.error('[CommentService] Delete comment failed', error);
      return false;
    }
  },

  // ========== Design Comments (chat-style, general messages) ==========

  async getDesignComments(projectId: string): Promise<DesignComment[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((c: DBComment) => ({
        id: c.id,
        projectId: c.project_id,
        userId: c.user_id,
        userName: c.user_name,
        userAvatar: c.user_avatar_url || undefined,
        text: c.text,
        timestamp: new Date(c.created_at).getTime(),
      }));
    } catch (error) {
      log.error('[CommentService] Get design comments failed', error);
      return [];
    }
  },

  async addDesignComment(
    projectId: string,
    userId: string,
    userName: string,
    userAvatar: string | null,
    text: string
  ): Promise<DesignComment | null> {
    try {
      const id = crypto.randomUUID();
      const { error } = await (supabase.from('comments') as any).insert({
        id,
        project_id: projectId,
        user_id: userId,
        user_name: userName,
        user_avatar_url: userAvatar,
        text,
        resolved: false,
      });

      if (error) throw error;

      return {
        id,
        projectId,
        userId,
        userName,
        userAvatar: userAvatar || undefined,
        text,
        timestamp: Date.now(),
      };
    } catch (error) {
      log.error('[CommentService] Add design comment failed', error);
      return null;
    }
  },
};
