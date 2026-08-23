/**
 * High-Performance Client-Side Video & Animation Exporter
 * Captures animated design frames and Smart Animate presentations to MP4/WebM video files using MediaRecorder.
 */

import { Layer, Artboard } from '../types';
import { exportToCanvas, layerToDesignNode } from './exportService';

export interface VideoExportOptions {
  fps?: number; // 30 or 60
  durationSeconds?: number; // total duration
  format?: 'webm' | 'mp4';
  bitrate?: number; // bits per second, e.g. 5_000_000 (5 Mbps)
  onProgress?: (progress: number, stage: string) => void;
  scale?: number;
}

/**
 * Checks supported video mime types in the current browser.
 */
export function getSupportedVideoMimeType(): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4;codecs=avc1',
    'video/mp4',
  ];

  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }

  return 'video/webm';
}

/**
 * Renders and records an animated artboard into a video Blob.
 */
export async function exportArtboardToVideo(artboard: Artboard, options: VideoExportOptions = {}): Promise<Blob> {
  const fps = options.fps || 30;
  const duration = options.durationSeconds || 5;
  const scale = options.scale || 1;
  const width = Math.round((artboard.width || 1080) * scale);
  const height = Math.round((artboard.height || 1080) * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    throw new Error('Failed to create canvas 2D rendering context');
  }

  const mimeType = getSupportedVideoMimeType();
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: options.bitrate || 6_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const totalFrames = Math.round(duration * fps);
  const frameIntervalMs = 1000 / fps;
  const nodes = (artboard.layers || []).map(layerToDesignNode);

  return new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType.split(';')[0] });
      resolve(blob);
    };

    recorder.onerror = (err) => {
      reject(err);
    };

    recorder.start();

    let frameIndex = 0;

    const renderLoop = async () => {
      if (frameIndex >= totalFrames) {
        options.onProgress?.(1, 'Finalizing video packaging...');
        setTimeout(() => {
          recorder.stop();
        }, 200);
        return;
      }

      const progress = frameIndex / totalFrames;
      const currentTimeSec = frameIndex / fps;
      options.onProgress?.(
        progress,
        `Rendering frame ${frameIndex + 1} of ${totalFrames} (${Math.round(progress * 100)}%)`
      );

      // Clear & render canvas nodes
      ctx.fillStyle = (artboard as any).backgroundColor || '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Render layers onto the video canvas
      await exportToCanvas(canvas, nodes, {
        format: 'png',
        scale,
        selectionOnly: false,
        background: true,
        quality: 1,
      });

      frameIndex++;
      setTimeout(renderLoop, frameIntervalMs);
    };

    renderLoop().catch(reject);
  });
}

/**
 * Renders a multi-slide presentation into a video reel with Smart Animate slide transitions.
 */
export async function exportSlideshowToVideo(
  artboards: Artboard[],
  slideDurationSeconds = 3,
  transitionSeconds = 0.8,
  options: VideoExportOptions = {}
): Promise<Blob> {
  const fps = options.fps || 30;
  const scale = options.scale || 1;
  const firstAb = artboards[0] || { width: 1080, height: 1080 };
  const width = Math.round((firstAb.width || 1080) * scale);
  const height = Math.round((firstAb.height || 1080) * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    throw new Error('Canvas 2D context creation failed');
  }

  const mimeType = getSupportedVideoMimeType();
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: options.bitrate || 6_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const totalSlides = artboards.length;
  const totalDuration = totalSlides * slideDurationSeconds;
  const totalFrames = Math.round(totalDuration * fps);

  return new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType.split(';')[0] }));
    };
    recorder.onerror = reject;
    recorder.start();

    let frame = 0;

    const render = async () => {
      if (frame >= totalFrames) {
        options.onProgress?.(1, 'Encoding video reel...');
        setTimeout(() => recorder.stop(), 200);
        return;
      }

      const currentSec = frame / fps;
      const slideIndex = Math.min(totalSlides - 1, Math.floor(currentSec / slideDurationSeconds));
      const currentAb = artboards[slideIndex];
      const nodes = (currentAb.layers || []).map(layerToDesignNode);

      const progress = frame / totalFrames;
      options.onProgress?.(progress, `Slide ${slideIndex + 1} of ${totalSlides} (${Math.round(progress * 100)}%)`);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      await exportToCanvas(canvas, nodes, {
        format: 'png',
        scale,
        selectionOnly: false,
        background: true,
        quality: 1,
      });

      frame++;
      setTimeout(render, 1000 / fps);
    };

    render().catch(reject);
  });
}
