import React, { useEffect, useRef, useState } from 'react';
import { Artboard } from '../types';

export const AudienceView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [artboards, setArtboards] = useState<Artboard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(-1);
  const animationRef = useRef<number>(0);

  // Set up message listener from parent window (the presenter)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // In production, verify e.origin
      if (e.data?.type === 'SYNC_PRESENTATION') {
        setArtboards(e.data.artboards || []);
        setPrevIdx(currentIdx);
        setCurrentIdx(e.data.activeIndex || 0);
      }
    };

    window.addEventListener('message', handleMessage);
    // Tell parent we are ready
    if (window.opener) {
      window.opener.postMessage({ type: 'AUDIENCE_READY' }, '*');
    }

    return () => window.removeEventListener('message', handleMessage);
  }, [currentIdx]);

  // Canvas rendering engine with basic transitions
  useEffect(() => {
    if (!canvasRef.current || artboards.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    let startTime: number | null = null;
    const duration = 500; // ms

    const currSlide = artboards[currentIdx];
    const prevSlide = prevIdx >= 0 && prevIdx !== currentIdx ? artboards[prevIdx] : null;

    // Check what transition to use based on currSlide's settings
    const meta = (currSlide as any).storyNode || {};
    const transition = meta.transition || 'none';

    const parseHex = (hex: string) => {
      if (!hex) return [255, 255, 255];
      const c = hex.replace('#', '');
      if (c.length === 3) {
        return [parseInt(c[0] + c[0], 16), parseInt(c[1] + c[1], 16), parseInt(c[2] + c[2], 16)];
      }
      if (c.length === 6) {
        return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
      }
      return [255, 255, 255];
    };

    const interpolateColor = (c1: string, c2: string, p: number) => {
      if (!c1 || !c2) return c2 || '#ffffff';
      if (!c1.startsWith('#') || !c2.startsWith('#')) return c2;
      const rgb1 = parseHex(c1);
      const rgb2 = parseHex(c2);
      const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * p);
      const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * p);
      const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * p);
      return `rgb(${r}, ${g}, ${b})`;
    };

    const renderLayer = (layer: any, ctx: CanvasRenderingContext2D, alpha: number, scaleX: number, scaleY: number) => {
      if (layer.visible === false) return;
      ctx.save();
      ctx.globalAlpha = alpha * (layer.opacity ?? 1);

      const lx = (layer.x || 0) * scaleX;
      const ly = (layer.y || 0) * scaleY;
      const lw = (layer.width || 0) * scaleX;
      const lh = (layer.height || 0) * scaleY;

      if (layer.type === 'text') {
        ctx.fillStyle = layer.color || '#ffffff';
        const fontSize = Math.max(4, (layer.fontSize || 16) * Math.min(scaleX, scaleY));
        ctx.font = `${layer.fontWeight || '400'} ${fontSize}px ${layer.fontFamily || 'sans-serif'}`;
        ctx.textAlign = (layer.textAlign as CanvasTextAlign) || 'left';
        ctx.fillText(layer.text || '', lx, ly + fontSize, lw);
      } else if (['rectangle', 'circle', 'hexagon', 'diamond'].includes(layer.type)) {
        ctx.fillStyle = layer.color || '#334155';
        if (layer.type === 'circle') {
          ctx.beginPath();
          ctx.ellipse(lx + lw / 2, ly + lh / 2, lw / 2, lh / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(lx, ly, lw, lh, (layer.cornerRadius || 0) * Math.min(scaleX, scaleY));
          } else {
            ctx.rect(lx, ly, lw, lh);
          }
          ctx.fill();
        }
      } else if (layer.type === 'image' && layer.src) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(lx, ly, lw, lh);
      }
      ctx.restore();
    };

    const renderSlide = (
      slide: Artboard,
      ctx: CanvasRenderingContext2D,
      alpha: number,
      offsetX: number = 0,
      scale: number = 1
    ) => {
      ctx.save();
      ctx.globalAlpha = alpha;

      const scaleX = W / slide.width;
      const scaleY = H / slide.height;

      // Base transform
      ctx.translate(W / 2 + offsetX, H / 2);
      ctx.scale(scale, scale);
      ctx.translate(-W / 2, -H / 2);

      // Background
      ctx.fillStyle = slide.backgroundColor || '#1e293b';
      ctx.fillRect(0, 0, W, H);

      // Layers
      slide.layers.forEach((layer: any) => {
        renderLayer(layer, ctx, alpha, scaleX, scaleY);
      });
      ctx.restore();
    };

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      let progress = Math.min(elapsed / duration, 1);

      // Easing (ease-in-out cubic)
      progress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      ctx.clearRect(0, 0, W, H);

      if (!prevSlide || transition === 'none' || progress === 1) {
        // Just render current
        renderSlide(currSlide, ctx, 1);
      } else if (transition === 'fade') {
        renderSlide(prevSlide, ctx, 1 - progress);
        renderSlide(currSlide, ctx, progress);
      } else if (transition === 'slide') {
        const direction = currentIdx > prevIdx ? 1 : -1;
        renderSlide(prevSlide, ctx, 1, -direction * progress * W);
        renderSlide(currSlide, ctx, 1, direction * W - direction * progress * W);
      } else if (transition === 'zoom') {
        renderSlide(prevSlide, ctx, 1 - progress, 0, 1 + progress * 0.5);
        renderSlide(currSlide, ctx, progress, 0, 0.5 + progress * 0.5);
      } else if (transition === 'flip') {
        // fake flip with scaling
        if (progress < 0.5) {
          renderSlide(prevSlide, ctx, 1, 0, 1 - progress * 2);
        } else {
          renderSlide(currSlide, ctx, 1, 0, (progress - 0.5) * 2);
        }
      } else if (transition === 'magic_move') {
        const scaleX = W / currSlide.width;
        const scaleY = H / currSlide.height;

        // Render Background
        ctx.save();
        ctx.fillStyle = interpolateColor(
          prevSlide.backgroundColor || '#1e293b',
          currSlide.backgroundColor || '#1e293b',
          progress
        );
        ctx.fillRect(0, 0, W, H);

        const matchedCurrIds = new Set<string>();
        const matchedPrevIds = new Set<string>();
        const matches: { prev: any; curr: any }[] = [];

        currSlide.layers.forEach((currLayer: any) => {
          if (!currLayer.name) return;
          const prevLayer = prevSlide.layers.find(
            (pl: any) => pl.name === currLayer.name && pl.type === currLayer.type
          );
          if (prevLayer) {
            matches.push({ prev: prevLayer, curr: currLayer });
            matchedCurrIds.add(currLayer.id);
            matchedPrevIds.add(prevLayer.id);
          }
        });

        // 1. Unmatched previous layers fade out
        prevSlide.layers.forEach((layer: any) => {
          if (matchedPrevIds.has(layer.id)) return;
          renderLayer(layer, ctx, 1 - progress, scaleX, scaleY);
        });

        // 2. Unmatched current layers fade in
        currSlide.layers.forEach((layer: any) => {
          if (matchedCurrIds.has(layer.id)) return;
          renderLayer(layer, ctx, progress, scaleX, scaleY);
        });

        // 3. Matched layers interpolate positions, size, colors, fontSizes
        matches.forEach(({ prev, curr }) => {
          const interpolatedLayer = {
            ...curr,
            x: prev.x + (curr.x - prev.x) * progress,
            y: prev.y + (curr.y - prev.y) * progress,
            width: (prev.width ?? 0) + ((curr.width ?? 0) - (prev.width ?? 0)) * progress,
            height: (prev.height ?? 0) + ((curr.height ?? 0) - (prev.height ?? 0)) * progress,
            opacity: (prev.opacity ?? 1) + ((curr.opacity ?? 1) - (prev.opacity ?? 1)) * progress,
            color: interpolateColor(prev.color, curr.color, progress),
            fontSize: (prev.fontSize ?? 16) + ((curr.fontSize ?? 16) - (prev.fontSize ?? 16)) * progress,
          };
          renderLayer(interpolatedLayer, ctx, 1, scaleX, scaleY);
        });
        ctx.restore();
      } else {
        renderSlide(currSlide, ctx, 1);
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationRef.current);
  }, [artboards, currentIdx, prevIdx]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden m-0 p-0">
      <canvas ref={canvasRef} width={1920} height={1080} className="w-full h-full object-contain" />
    </div>
  );
};
