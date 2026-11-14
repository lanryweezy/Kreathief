/**
 * High-Performance Client-Side Video & Animation Exporter
 * Captures animated design frames and Smart Animate presentations to MP4/WebM video files using MediaRecorder.
 */

import { Layer, Artboard, AnimationSettings } from '../types';
import { exportToCanvas, layerToDesignNode } from './exportService';

function applyEasing(t: number, easing: AnimationSettings['easing'] = 'ease-out'): number {
  let x = Math.max(0, Math.min(1, t));
  switch (easing) {
    case 'linear':
      return x;
    case 'ease-in':
      return x * x;
    case 'ease-in-out':
      return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    case 'bounce': {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (x < 1 / d1) {
        return n1 * x * x;
      }
      if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
      }
      if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
      }
      return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
    case 'ease-out':
    default:
      return 1 - Math.pow(1 - x, 3);
  }
}

function animateLayerAtTime(layer: Layer, timeSec: number): Layer {
  const anim = layer.animation;
  if (!anim || anim.type === 'none') {
    return layer;
  }

  const duration = Math.max(0.1, anim.duration || 0.8);
  const delay = Math.max(0, anim.delay || 0);
  const elapsed = timeSec - delay;

  if (elapsed < 0) {
    // Before entrance animation starts, keep entrance types hidden
    if (anim.type === 'fade' || anim.type === 'slide' || anim.type === 'zoom') {
      return { ...layer, opacity: 0 };
    }
    return layer;
  }

  const rawProgress =
    anim.iterationCount === 'infinite' ? (elapsed % duration) / duration : Math.min(1, elapsed / duration);
  const p = applyEasing(rawProgress, anim.easing);
  const baseOpacity = layer.opacity ?? 1;
  const intensity = anim.intensity ?? 1;

  switch (anim.type) {
    case 'fade':
      return { ...layer, opacity: baseOpacity * p };
    case 'slide': {
      const dist = 120 * intensity * (1 - p);
      const dx = anim.direction === 'left' ? dist : anim.direction === 'right' ? -dist : 0;
      const dy = anim.direction === 'down' ? -dist : anim.direction === 'left' || anim.direction === 'right' ? 0 : dist;
      return { ...layer, x: layer.x + dx, y: layer.y + dy, opacity: baseOpacity * Math.min(1, p * 1.4) };
    }
    case 'zoom': {
      const scale = 0.65 + 0.35 * p;
      const nw = layer.width * scale;
      const nh = layer.height * scale;
      return {
        ...layer,
        x: layer.x + (layer.width - nw) / 2,
        y: layer.y + (layer.height - nh) / 2,
        width: nw,
        height: nh,
        opacity: baseOpacity * p,
      };
    }
    case 'rotate':
      return { ...layer, rotation: (layer.rotation || 0) + (anim.angle ?? 360) * p };
    case 'bounce': {
      const jump = Math.abs(Math.sin(rawProgress * Math.PI * 2)) * 28 * intensity * (1 - rawProgress * 0.4);
      return { ...layer, y: layer.y - jump };
    }
    case 'pulse': {
      const pulseScale = 1 + Math.sin(rawProgress * Math.PI * 2) * 0.08 * intensity;
      const nw = layer.width * pulseScale;
      const nh = layer.height * pulseScale;
      return {
        ...layer,
        x: layer.x + (layer.width - nw) / 2,
        y: layer.y + (layer.height - nh) / 2,
        width: nw,
        height: nh,
      };
    }
    case 'shake':
      return { ...layer, x: layer.x + Math.sin(rawProgress * Math.PI * 6) * 14 * intensity * (1 - rawProgress) };
    case 'float':
      return { ...layer, y: layer.y + Math.sin(elapsed * 2.2) * 16 * intensity };
    default:
      return layer;
  }
}

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
  const baseLayers = artboard.layers || [];

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

      // Clear & render animated layer states at currentTimeSec
      ctx.fillStyle = (artboard as any).backgroundColor || '#0f172a';
      ctx.fillRect(0, 0, width, height);

      const animatedNodes = baseLayers.map((l) => layerToDesignNode(animateLayerAtTime(l, currentTimeSec)));
      await exportToCanvas(canvas, animatedNodes, {
        format: 'png',
        scale,
        selectionOnly: false,
        background: true,
        backgroundColor: (artboard as any).backgroundColor,
        textureOverlay: (artboard as any).textureOverlay || null,
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
      const slideLocalSec = currentSec - slideIndex * slideDurationSeconds;
      const currentAb = artboards[slideIndex];
      const nextAb = slideIndex < totalSlides - 1 ? artboards[slideIndex + 1] : null;
      const nodes = (currentAb.layers || []).map((l) => layerToDesignNode(animateLayerAtTime(l, slideLocalSec)));

      const progress = frame / totalFrames;
      options.onProgress?.(progress, `Slide ${slideIndex + 1} of ${totalSlides} (${Math.round(progress * 100)}%)`);

      ctx.fillStyle = (currentAb as any).backgroundColor || '#0f172a';
      ctx.fillRect(0, 0, width, height);

      await exportToCanvas(canvas, nodes, {
        format: 'png',
        scale,
        selectionOnly: false,
        background: true,
        quality: 1,
      });

      // Crossfade into the next slide during the transitionSeconds window
      if (nextAb && transitionSeconds > 0 && slideLocalSec >= slideDurationSeconds - transitionSeconds) {
        const transT = applyEasing(
          (slideLocalSec - (slideDurationSeconds - transitionSeconds)) / transitionSeconds,
          'ease-in-out'
        );
        const overlayCanvas = document.createElement('canvas');
        overlayCanvas.width = width;
        overlayCanvas.height = height;
        const nextNodes = (nextAb.layers || []).map((l) => layerToDesignNode(animateLayerAtTime(l, 0)));
        await exportToCanvas(overlayCanvas, nextNodes, {
          format: 'png',
          scale,
          selectionOnly: false,
          background: true,
          quality: 1,
        });
        ctx.save();
        ctx.globalAlpha = transT;
        ctx.drawImage(overlayCanvas, 0, 0);
        ctx.restore();
      }

      frame++;
      setTimeout(render, 1000 / fps);
    };

    render().catch(reject);
  });
}
