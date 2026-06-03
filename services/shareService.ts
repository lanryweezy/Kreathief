import { storageService } from './storageService';
import { logger } from './logger';

class ShareService {
  /**
   * Generates a unique short link for a design
   * For this mock, it uses a random string and persists the mapping in IndexedDB
   */
  async generateShareLink(projectId: string): Promise<string> {
    try {
      // Check if a share link already exists for this project
      const existingShare = await storageService.getShareByProjectId(projectId);
      if (existingShare) {
        return this.formatShareUrl(existingShare.id);
      }

      // Generate a unique short ID (8 characters) securely
      const shareId = crypto.randomUUID().replace(/-/g, '').substring(0, 8);

      await storageService.saveShare({
        id: shareId,
        projectId,
        createdAt: Date.now(),
      });

      logger.info('Share link generated', { projectId, shareId });
      return this.formatShareUrl(shareId);
    } catch (error) {
      logger.error('Failed to generate share link', { error, projectId });
      throw error;
    }
  }

  /**
   * Resolves a share ID to its project ID
   */
  async resolveShare(shareId: string): Promise<string | null> {
    try {
      const mapping = await storageService.getShare(shareId);
      return mapping ? mapping.projectId : null;
    } catch (error) {
      logger.error('Failed to resolve share link', { error, shareId });
      return null;
    }
  }

  private formatShareUrl(shareId: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    // In a real app, this would be a dedicated sharing domain or path
    return `${origin}/share/${shareId}`;
  }
}

export const shareService = new ShareService();
