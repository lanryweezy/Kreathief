import { Layer } from '../types';
import { v4 as uuidv4 } from 'uuid';

export type MotionStyle = 'cyberpunk' | 'luxury' | 'brutalism' | 'fluid';
export type SemanticLayerRole = 'background' | 'macro-text' | 'hero-image' | 'headline' | 'microcopy' | 'accent' | 'unknown';

export interface MotionCurve {
  duration: number; // in milliseconds
  delay: number; // in milliseconds
  easing: (t: number) => number;
}

export interface LayerAnimationTransform {
  x?: number;
  y?: number;
  scale?: number;
  opacity?: number;
  rotation?: number;
  letterSpacing?: number;
  blur?: number;
}

export interface LayerMotionState {
  role: SemanticLayerRole;
  initial: LayerAnimationTransform;
  target: LayerAnimationTransform;
  curve: MotionCurve;
  isStaggeredChild?: boolean;
}

export interface VirtualCamera {
  type: 'static' | 'dolly-zoom' | 'pan-right' | 'shaky-cam';
  intensity: number;
}

export const Easing = {
  cubicOut: (t: number) => --t * t * t + 1,
  elasticOut: (t: number) => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
  },
  glitch: (t: number) => {
    if (t < 0.2) {return 0;}
    if (t < 0.25) {return 0.8;}
    if (t < 0.3) {return 0.2;}
    if (t < 0.4) {return 0.9;}
    if (t < 0.8) {return 1;}
    if (t < 0.85) {return 0.7;}
    return 1;
  },
  linear: (t: number) => t,
};

export function classifyLayerRole(layer: Layer, canvasWidth: number, canvasHeight: number): SemanticLayerRole {
  const name = (layer.name || '').toLowerCase();
  
  if (name.includes('base') || name.includes('bg') || (layer.width >= canvasWidth && layer.height >= canvasHeight && layer.opacity! < 0.5)) {
    return 'background';
  }
  
  if (layer.type === 'text') {
    if (layer.fontSize! > 100 || name.includes('macro')) {return 'macro-text';}
    if (layer.fontSize! > 40 || name.includes('headline')) {return 'headline';}
    if (layer.fontSize! < 20 || name.includes('micro')) {return 'microcopy';}
  }
  
  if (layer.type === 'image' || name.includes('hero') || name.includes('focal')) {
    return 'hero-image';
  }
  
  if (name.includes('accent') || name.includes('breaker') || name.includes('pill')) {
    return 'accent';
  }
  
  return 'unknown';
}

export function buildLayerMotionState(layer: Layer, role: SemanticLayerRole, style: MotionStyle): LayerMotionState {
  const state: LayerMotionState = {
    role,
    initial: { opacity: 0, scale: 1, x: layer.x, y: layer.y, rotation: layer.rotation || 0, blur: 0 },
    target: { opacity: layer.opacity !== undefined ? layer.opacity : 1, scale: 1, x: layer.x, y: layer.y, rotation: layer.rotation || 0, blur: 0 },
    curve: { duration: 3000, delay: 0, easing: Easing.cubicOut }
  };

  if (style === 'luxury') {
    state.curve.duration = 4000;
    if (role === 'hero-image') {
      state.initial.scale = 1.1; 
      state.target.scale = 1.0;
      state.initial.blur = 20; // Depth of field focus pull!
      state.target.blur = 0;
    }
    if (role === 'headline') {
      state.initial.y = layer.y + 60; 
      const currentSpacing = (layer as any).letterSpacing || 0;
      state.initial.letterSpacing = currentSpacing + 30; 
      state.target.letterSpacing = currentSpacing;
      state.initial.blur = 10;
    }
  } 
  else if (style === 'cyberpunk') {
    state.curve.duration = 2000;
    if (role === 'macro-text' || role === 'headline') {
      state.curve.easing = Easing.glitch; 
    }
    if (role === 'accent') {
      state.initial.scale = 0;
      state.curve.easing = Easing.elasticOut; 
    }
    if (role === 'hero-image') {
      state.initial.scale = 1.3;
      state.initial.blur = 30;
      state.target.scale = 1.0;
      state.curve.easing = Easing.cubicOut;
    }
  }
  else if (style === 'brutalism') {
    state.curve.duration = 1500; 
    state.curve.easing = Easing.elasticOut;
    if (role === 'headline') {
      state.initial.x = layer.x - 300; 
    }
    if (role === 'hero-image') {
      state.initial.rotation = (layer.rotation || 0) - 25; 
    }
  }

  return state;
}

/**
 * Advanced Kinetic Typography: 
 * Splits a single text layer into multiple individual character layers, 
 * pre-calculating staggered delays for a cascading animation effect.
 */
export function splitTextLayerForStagger(layer: Layer, staggerDelayMs: number = 50): Layer[] {
  if (layer.type !== 'text' || !layer.text) {return [layer];}
  
  const chars = layer.text.split('');
  const newLayers: Layer[] = [];
  
  // Very rough approximation of font width based on fontSize and a standard ratio (since we don't have DOM measureText here)
  const estimatedCharWidth = (layer.fontSize || 24) * 0.6 + (layer.letterSpacing || 0);
  
  let currentX = layer.x;
  
  for (let i = 0; i < chars.length; i++) {
    const charLayer: Layer = {
      ...layer,
      id: `${layer.id}_char_${i}_${uuidv4().slice(0, 4)}`,
      name: `${layer.name} (Char ${i})`,
      text: chars[i],
      x: currentX,
      // Store the requested delay in a custom property so videoExportService can read it
      motionDelayOverride: i * staggerDelayMs,
    } as any;
    
    newLayers.push(charLayer);
    currentX += estimatedCharWidth;
  }
  
  return newLayers;
}

export function interpolateLayer(layer: Layer, state: LayerMotionState, t: number): Layer {
  // Respect delay
  let adjustedT = 0;
  if (t > 0) {
     adjustedT = Math.min(1, Math.max(0, t));
  }
  
  const eased = state.curve.easing(adjustedT);
  const lerp = (start: number, end: number) => start + (end - start) * eased;
  const cloned = { ...layer };
  
  if (state.initial.opacity !== undefined && state.target.opacity !== undefined) {
    cloned.opacity = lerp(state.initial.opacity, state.target.opacity);
  }
  if (state.initial.x !== undefined && state.target.x !== undefined) {
    cloned.x = lerp(state.initial.x, state.target.x);
  }
  if (state.initial.y !== undefined && state.target.y !== undefined) {
    cloned.y = lerp(state.initial.y, state.target.y);
  }
  if (state.initial.rotation !== undefined && state.target.rotation !== undefined) {
    cloned.rotation = lerp(state.initial.rotation, state.target.rotation);
  }
  if (state.initial.letterSpacing !== undefined && state.target.letterSpacing !== undefined && cloned.type === 'text') {
    cloned.letterSpacing = lerp(state.initial.letterSpacing, state.target.letterSpacing);
  }
  if (state.initial.blur !== undefined && state.target.blur !== undefined) {
    // Inject custom blur property for the canvas renderer to read
    (cloned as any).currentBlur = lerp(state.initial.blur, state.target.blur);
  }
  
  if (state.initial.scale !== undefined && state.target.scale !== undefined) {
    const scale = lerp(state.initial.scale, state.target.scale);
    if (scale !== 1) {
      const dw = layer.width * scale - layer.width;
      const dh = layer.height * scale - layer.height;
      cloned.width = layer.width * scale;
      cloned.height = layer.height * scale;
      cloned.x = layer.x - dw / 2;
      cloned.y = layer.y - dh / 2;
    }
  }
  
  return cloned;
}
