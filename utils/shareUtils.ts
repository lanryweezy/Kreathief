import { Project } from '../types';
import { log } from './log';

/**
 * Serializes and compresses a Project into a shareable URL string.
 * Uses CompressionStream (GZIP) if available, falling back to Base64.
 */
export const generateShareLink = async (project: Project): Promise<string> => {
  try {
    // 1. Serialize essential state
    const stateToShare = {
      name: project.name,
      state: project.state,
      // Minimal metadata
      v: 1, // version
    };

    const jsonString = JSON.stringify(stateToShare);

    // 2. Compress
    let compressedData = '';

    if (typeof CompressionStream !== 'undefined' && typeof Response !== 'undefined') {
      // Use efficient GZIP compression
      const stream = new Blob([jsonString]).stream().pipeThrough(new CompressionStream('gzip'));
      const compressedBlob = await new Response(stream).blob();
      const buffer = await compressedBlob.arrayBuffer();
      // Convert to Base64URL-safe string
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      compressedData = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } else {
      // Fallback for older browsers (though unlikely in modern React apps)
      compressedData = btoa(jsonString);
    }

    // 3. Construct URL
    const url = new URL(window.location.href);
    url.searchParams.set('share', compressedData);
    // Use 'z' param to indicate zipped content vs legacy
    if (typeof CompressionStream !== 'undefined') {
      url.searchParams.set('v', 'z1');
    }

    return url.toString();
  } catch (err) {
    log.error('Failed to generate share link:', err);
    throw new Error('Could not generate share link.');
  }
};

/**
 * Parses and decompresses a project from a URL share string.
 */
export const parseShareLink = async (currentUrl: string): Promise<Project | null> => {
  try {
    const url = new URL(currentUrl);
    const shareData = url.searchParams.get('share');
    const version = url.searchParams.get('v');

    if (!shareData) {
      return null;
    }

    let jsonString = '';

    if (version === 'z1' && typeof DecompressionStream !== 'undefined') {
      // Decompress GZIP
      // Restore Base64 padding/chars
      let base64 = shareData.replace(/-/g, '+').replace(/_/g, '/');
      const padding = shareData.length % 4;
      if (padding) {
        base64 += '='.repeat(4 - padding);
      }

      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      const decompressedBlob = await new Response(stream).blob();
      jsonString = await decompressedBlob.text();
    } else {
      // Fallback or legacy standard base64
      jsonString = atob(shareData);
    }

    const data = JSON.parse(jsonString);

    // Reconstruct valid Project object
    return {
      id: `shared_${Date.now()}`,
      name: data.name || 'Shared Design',
      updatedAt: Date.now(),
      state: data.state,
    } as Project;
  } catch (err) {
    log.error('Failed to parse share link:', err);
    return null;
  }
};
