import { log } from '../utils/log';
import { buildFilterString } from '../utils/layers';
import { renderMultilineText } from '../utils/textRendering';
import { getLayerClipPath } from '../utils/layerRendering';

/**
 * exportWorker.ts
 * Background worker for heavy canvas rendering and export
 */

self.onmessage = async (e: MessageEvent) => {
  const { width, height, backgroundColor, backgroundImageUrl, layers, filters, format, quality } = e.data;

  try {
    // @ts-ignore - ignore type mismatch
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      self.postMessage({ error: 'Could not create OffscreenCanvas context' });
      return;
    }

    // --- Helpers ---
    const applyClip = (ctx: any, layer: any, maskLayer: any) => {
      const def = getLayerClipPath(maskLayer);
      // We need to trace the path in the local space of the TARGET layer
      // But the mask definition is percentage based (0-100%).
      // So we use the Target Layer dimensions? NO.
      // Clip to Shape means "Take the shape of the mask layer".
      // Does it mean "Take the geometry of the mask layer"?
      // In our CSS implementation, we applied `clip-path: polygon(...)` to the Target Layer DIV.
      // This means the polygon coordinates are relative to the TARGET LAYER'S bounding box.
      // YES. So if Mask is "Triangle" and Target is "Square Image", the Image becomes a Triangle.

      const w = layer.width;
      const h = layer.height;
      const hw = w / 2;
      const hh = h / 2;

      ctx.beginPath();

      if (def && def.startsWith('polygon')) {
        const points = def.match(/[\d.]+% [\d.]+/g);
        if (points) {
          points.forEach((p, i) => {
            const [xPerc, yPerc] = p.split(' ').map((s) => parseFloat(s));
            const x = (xPerc / 100) * w - hw;
            const y = (yPerc / 100) * h - hh;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.closePath();
        }
      } else if (maskLayer.type === 'circle') {
        ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      } else if (maskLayer.type === 'path' && maskLayer.pathData) {
        // Path logic... might be complex if not normalized.
        // Assuming pathData fits in 0..100 domain or we scale it?
        // For now, support Primitives.
        const path = new Path2D(maskLayer.pathData);
        // Need to scale path to layer?
        // CSS `path()` is absolute. If we support it, we assume 1:1.
        ctx.clip(path);
        return;
      } else {
        // Default rectangle
        ctx.rect(-hw, -hh, w, h);
      }
      ctx.clip();
    };

    // --- Rendering Logic ---

    // 1. Background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // 2. Background Image
    if (backgroundImageUrl) {
      try {
        const response = await fetch(backgroundImageUrl);
        const blob = await response.blob();
        const img = await createImageBitmap(blob);

        // Contain logic
        const imgAspect = img.width / img.height;
        const canvasAspect = width / height;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgAspect > canvasAspect) {
          drawWidth = width;
          drawHeight = width / imgAspect;
          offsetX = 0;
          offsetY = (height - drawHeight) / 2;
        } else {
          drawHeight = height;
          drawWidth = height * imgAspect;
          offsetY = 0;
          offsetX = (width - drawWidth) / 2;
        }

        ctx.save();
        if (filters) {
          // @ts-ignore - ignore type mismatch
          ctx.filter = buildFilterString(filters);
        }
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        ctx.restore();
      } catch (err) {
        log.warn('Worker: Failed to load background', { error: err });
      }
    }

    // 3. Draw Layers (Combined loop)
    if (layers) {
      // @ts-ignore - ignore type mismatch
      for (const layer of layers) {
        if (!layer.visible) {
          continue;
        }

        ctx.save();
        const centerX = layer.x + (layer.width || 0) / 2;
        let centerY = layer.y + (layer.height || layer.fontSize * 1.2 || 0) / 2;

        if (layer.type === 'text') {
          centerY = layer.y + (layer.fontSize || 40) / 2;
        }

        ctx.translate(centerX, centerY);
        ctx.rotate(((layer.rotation || 0) * Math.PI) / 180);

        // --- Masking Application ---
        if (layer.maskLayerId) {
          // @ts-ignore - ignore type mismatch
          const maskLayer = layers.find((l) => l.id === layer.maskLayerId);
          if (maskLayer) {
            applyClip(ctx, layer, maskLayer);
          }
        }

        if (layer.type === 'image') {
          try {
            const response = await fetch(layer.src);
            const blob = await response.blob();
            const img = await createImageBitmap(blob);

            // Skew
            const radX = ((layer.skewX || 0) * Math.PI) / 180;
            const radY = ((layer.skewY || 0) * Math.PI) / 180;
            ctx.transform(1, Math.tan(radY), Math.tan(radX), 1, 0, 0);

            const scaleX = layer.flipX ? -1 : 1;
            const scaleY = layer.flipY ? -1 : 1;
            ctx.scale(scaleX, scaleY);
            ctx.globalAlpha = layer.opacity ?? 1;

            if (layer.filters) {
              // @ts-ignore - ignore type mismatch
              ctx.filter = buildFilterString(layer.filters);
            }

            ctx.drawImage(img, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
          } catch (err) {
            log.warn('Worker: Failed to load image layer', { error: err });
          }
        } else if (layer.type === 'text') {
          ctx.globalAlpha = layer.opacity ?? 1;

          // 3D Depth
          if ((layer as any).depth && (layer as any).depth > 0) {
            const depth = (layer as any).depth;
            const depthColor = (layer as any).depthColor || '#333333';
            ctx.save();
            for (let i = 1; i <= depth; i++) {
               ctx.save();
               ctx.translate(i, i);
               renderMultilineText(ctx as any, { ...layer, color: depthColor } as any);
               ctx.restore();
            }
            ctx.restore();
          }

          renderMultilineText(ctx as any, layer as any);
        } else {
          // Shape
          ctx.fillStyle = layer.color || '#000000';
          ctx.globalAlpha = layer.opacity ?? 1;

          const hw = (layer.width || 0) / 2;
          const hh = (layer.height || 0) / 2;

          if (layer.type === 'rectangle') {
            ctx.fillRect(-hw, -hh, layer.width, layer.height);
          } else if (layer.type === 'circle') {
            ctx.beginPath();
            ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
            ctx.fill();
          } else if (layer.type === 'path' && layer.pathData) {
            const path = new Path2D(layer.pathData);
            ctx.save();
            ctx.translate(-hw, -hh);
            const scaleX = layer.width / 100;
            const scaleY = layer.height / 100;
            ctx.scale(scaleX, scaleY);
            ctx.fill(path);
            ctx.restore();
          } else {
            // Complex polygon shapes
            const def = getLayerClipPath(layer);
            if (def && def.startsWith('polygon')) {
              const points = def.match(/[\d.]+% [\d.]+/g);
              if (points) {
                ctx.beginPath();
                points.forEach((p, i) => {
                  const [xPerc, yPerc] = p.split(' ').map((s) => parseFloat(s));
                  const x = (xPerc / 100) * layer.width - hw;
                  const y = (yPerc / 100) * layer.height - hh;
                  if (i === 0) {
                    ctx.moveTo(x, y);
                  } else {
                    ctx.lineTo(x, y);
                  }
                });
                ctx.closePath();
                ctx.fill();
              }
            }
          }
        }
        ctx.restore();
      }
    }

    // --- End Rendering ---

    // Convert to Blob
    // @ts-ignore - ignore type mismatch
    const blob = await canvas.convertToBlob({ type: `image/${format}`, quality: quality || 0.95 });

    // Convert to DataURL for message
    const reader = new FileReader();
    reader.onloadend = () => {
      self.postMessage({ dataUrl: reader.result });
    };
    reader.readAsDataURL(blob);
  } catch (err: any) {
    self.postMessage({ error: err.message });
  }
};
