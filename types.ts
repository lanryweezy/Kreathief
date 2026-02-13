
export enum AppMode {
  GENERATE = 'GENERATE',
  EDIT = 'EDIT',
  THEME = 'THEME'
}

export enum NavTab {
  MAGIC = 'MAGIC',
  TEMPLATES = 'TEMPLATES',
  ELEMENTS = 'ELEMENTS',
  UPLOADS = 'UPLOADS',
  TEXT = 'TEXT',
  DRAW = 'DRAW',
  BRAND = 'BRAND',
  TEXTURES = 'TEXTURES',
  PROJECTS = 'PROJECTS',
  LAYERS = 'LAYERS',
  MOCKUP = 'MOCKUP',
  ASSISTANT = 'ASSISTANT',
  STICKERS = 'STICKERS',
  PHOTOS = 'PHOTOS',
  AI_SUGGESTIONS = 'AI_SUGGESTIONS',
  SMART_CONTENT = 'SMART_CONTENT',
  QUALITY_SCORE = 'QUALITY_SCORE'
}

export enum BrushType {
  BASIC = 'basic',
  CALLIGRAPHY = 'calligraphy',
  OIL = 'oil',
  CRAYON = 'crayon',
  PENCIL = 'pencil',
  WATERCOLOR = 'watercolor',
  VECTOR_PENCIL = 'vector_pencil'
}

export enum AspectRatio {
  SQUARE = '1:1',
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
  WIDE = '4:3',
  TALL = '3:4'
}

export type GenerationQuality = 'standard' | 'hd';

export interface CanvasSize {
  width: number;
  height: number;
  name: string;
}

export interface GeneratedImage {
  id: string;
  url: string; // Base64 data URI
  prompt: string;
  timestamp: number;
  mode: AppMode;
  aspectRatio: AspectRatio;
}

export interface Shadow {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface Stroke {
  color: string;
  width: number;
  opacity?: number;
  jitter?: number; // 0-100
  smoothing?: number; // 0-100
  pressureSensitive?: boolean;
  dashArray?: number[];
  cap?: 'butt' | 'round' | 'square';
  join?: 'round' | 'bevel' | 'miter';
}

export interface LayerFilters {
  brightness: number; // 100 default
  contrast: number;   // 100 default
  saturation: number; // 100 default
  grayscale: number;  // 0 default
  blur: number;       // 0 default
  sepia: number;      // 0 default
  hueRotate: number;  // 0 default
  vignette: number;   // 0 default
}

export interface TextGradient {
  enabled: boolean;
  startColor: string;
  endColor: string;
  angle: number;
}

export interface TextLayer {
  id: string;
  type: 'text';
  name?: string;
  text: string;
  x: number;
  y: number;
  groupId?: string;
  width: number;
  rotation: number;
  fontSize: number;
  fontWeight: string;
  fontStyle: 'normal' | 'italic';
  textDecoration: string; // 'none' | 'underline' | 'line-through' | 'underline line-through'
  color: string;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  letterSpacing: number;
  lineHeight: number;
  textTransform: 'none' | 'uppercase' | 'lowercase';
  opacity: number;
  shadow?: Shadow;
  stroke?: Stroke;
  locked: boolean;
  visible: boolean;
  blendMode?: string;
  gradient?: TextGradient;
  textGradient?: Gradient;
  // Advanced Vintage Tools
  curve?: number; // -360 to 360 degrees
  warpStyle?: 'none' | 'arc' | 'flag' | 'rise'; // New Warp Styles
  skewX?: number; // degrees
  skewY?: number; // degrees
  // Text Effects
  styleType?: 'normal' | 'hollow' | 'lift' | 'echo';
  // Typography on Path
  textPath?: string; // SVG path data
  textPathSide?: 'left' | 'right';
  textPathStartOffset?: number; // % or px
  // 3D Text
  depth?: number; // 0-50 px extrusion
  depthColor?: string;
}

export interface Gradient {
  type: 'linear' | 'radial';
  angle?: number; // 0-360 degrees for linear
  colors: Array<{ color: string; position: number }>;
  startX?: number; // for radial
  startY?: number;
  endX?: number;
  endY?: number;
}

export interface ShapeLayer {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'star' | 'hexagon' | 'diamond' | 'arrow' | 'heart' | 'speech_bubble' | 'ribbon' | 'shield' | 'banner' | 'pentagon' | 'octagon' | 'plus' | 'star_4' | 'star_8' | 'path';
  name?: string;
  x: number;
  y: number;
  groupId?: string;
  rotation: number;
  width: number;
  height: number;
  color: string;
  cornerRadius: number;
  opacity: number;
  shadow?: Shadow;
  stroke?: Stroke;
  locked: boolean;
  visible: boolean;
  blendMode?: string;
  gradient?: Gradient;
  backgroundImage?: string;
  backgroundScale?: number; // 1 = 100%
  skewX?: number;
  skewY?: number;
  perspective?: number; // CSS perspective value for 3D distortion
  rotateX?: number; // 3D rotation on X axis
  rotateY?: number; // 3D rotation on Y axis
  pathData?: string; // SVG Path D attribute for custom shapes
  viewBox?: string; // SVG ViewBox
}

export interface ImageLayer {
  id: string;
  type: 'image';
  name?: string;
  src: string;
  x: number;
  y: number;
  groupId?: string;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  flipX: boolean;
  flipY: boolean;
  filters: LayerFilters;
  blendMode: string;
  cornerRadius?: number;
  shadow?: Shadow;
  stroke?: Stroke;
  skewX?: number;
  skewY?: number;
}

export type Layer = TextLayer | ShapeLayer | ImageLayer;

export interface CanvasFilters {
  brightness: number; // %
  contrast: number;   // %
  saturation: number; // %
  sepia: number;      // %
  grayscale: number;  // %
  blur: number;       // px
  opacity: number;    // 0-1
  vignette: number;   // 0-100
  overlayTexture?: string; // CSS url or data URI for vintage texture overlay
}

export interface GenerationConfig {
  prompt: string;
  aspectRatio: AspectRatio;
  referenceImage?: string; // Base64 string for editing
}

export interface HistoryState {
  layers: Layer[];
  canvasBackgroundColor: string;
  canvasFilters: CanvasFilters;
  canvasSize?: CanvasSize;
  showGrid?: boolean;
  showRulers?: boolean;
  onToggleGrid?: () => void;
  onToggleRulers?: () => void;
}

export interface Project {
  id: string;
  name: string;
  updatedAt: number;
  thumbnail?: string;
  state: HistoryState;
}

export interface DesignTheme {
  name: string;
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
}

export interface BrandKit {
  id: string;
  name: string;
  colors: string[];
  fonts: string[];
  logos?: string[];
  primaryLogo?: string;
  secondaryLogo?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// SaaS Types
export type UserPlan = 'free' | 'pro' | 'enterprise';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: UserPlan;
  avatar?: string;
}
