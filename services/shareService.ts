import { db as supabase } from '../lib/supabase/client';
import { log } from '../utils/log';

class ShareService {
  async generateShareLink(
    projectId: string,
    userId: string,
    options?: { password?: string; expiresInDays?: number }
  ): Promise<string> {
    try {
      // Check if a share link already exists for this project by this user
      const { data: existing } = await supabase
        .from('share_links')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        return this.formatShareUrl((existing as any).id);
      }

      const shareId = this.generateId();

      const insertData: any = {
        id: shareId,
        project_id: projectId,
        user_id: userId,
        is_public: true,
      };

      if (options?.password) {
        // Salted PBKDF2 (100k iterations) stored as a self-describing `pbkdf2$salt$hash` string — no schema change needed
        const saltBytes = crypto.getRandomValues(new Uint8Array(16));
        const saltHex = Array.from(saltBytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        const hashHex = await this.hashPasswordPBKDF2(options.password, saltHex);
        insertData.password_hash = `pbkdf2$${saltHex}$${hashHex}`;
      }

      if (options?.expiresInDays) {
        const expires = new Date();
        expires.setDate(expires.getDate() + options.expiresInDays);
        insertData.expires_at = expires.toISOString();
      }

      const { error } = await ((supabase as any).from('share_links') as any).insert(insertData);
      if (error) {
        throw error;
      }

      log.info('Share link created', { projectId, shareId });
      return this.formatShareUrl(shareId);
    } catch (error) {
      log.error('Failed to generate share link', { error, projectId });
      throw error;
    }
  }

  async resolveShare(shareId: string): Promise<{ projectId: string; userId: string } | null> {
    try {
      const { data, error } = await supabase
        .from('share_links')
        .select('project_id, user_id, expires_at, view_count')
        .eq('id', shareId)
        .single();

      if (error || !data) {
        return null;
      }

      // Check expiry
      if ((data as any).expires_at && new Date((data as any).expires_at) < new Date()) {
        return null;
      }

      // Increment view count
      await ((supabase as any).from('share_links') as any)
        .update({ view_count: (data as any).view_count ? (data as any).view_count + 1 : 1 })
        .eq('id', shareId);

      return { projectId: (data as any).project_id, userId: (data as any).user_id };
    } catch (error) {
      log.error('Failed to resolve share link', { error, shareId });
      return null;
    }
  }

  async deleteShareLink(shareId: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any).from('share_links').delete().eq('id', shareId);
      if (error) {
        throw error;
      }
      return true;
    } catch (error) {
      log.error('Failed to delete share link', { error, shareId });
      return false;
    }
  }

  async getShareLinksForProject(projectId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('share_links')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      log.error('Failed to fetch share links', { error, projectId });
      return [];
    }
  }

  async verifyPassword(shareId: string, password: string): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any)
        .from('share_links')
        .select('password_hash')
        .eq('id', shareId)
        .single();

      if (error || !data) {
        return false;
      } // DB error = deny access
      if (!(data as any).password_hash) {
        return true;
      } // No password set

      const stored: string = (data as any).password_hash;

      if (stored.startsWith('pbkdf2$')) {
        const [, saltHex, expectedHash] = stored.split('$');
        if (!saltHex || !expectedHash) {
          return false;
        }
        const hash = await this.hashPasswordPBKDF2(password, saltHex);
        return hash === expectedHash;
      }

      // Legacy links: unsalted SHA-256(password + shareId)
      const encoder = new TextEncoder();
      const hashData = encoder.encode(password + shareId);
      const hashBuffer = await crypto.subtle.digest('SHA-256', hashData);
      const hash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      return hash === stored;
    } catch (error) {
      return false;
    }
  }

  private async hashPasswordPBKDF2(password: string, saltHex: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = new Uint8Array((saltHex.match(/.{2}/g) || []).map((b) => parseInt(b, 16)));
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    return Array.from(new Uint8Array(bits))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private formatShareUrl(shareId: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kreathief.vercel.app';
    return `${origin}/share/${shareId}`;
  }
}

export const shareService = new ShareService();
