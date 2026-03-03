export enum AppMode {
  GENERATE = 'GENERATE',
  EDIT = 'EDIT',
  THEME = 'THEME',
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
  QUALITY_SCORE = 'QUALITY_SCORE',
  VECTORIZER = 'VECTORIZER',
  TEXT_EFFECTS = 'TEXT_EFFECTS',
  ARRANGE = 'ARRANGE',
  MOTION = 'MOTION',
  SNAPSHOTS = 'SNAPSHOTS',
  COMMENTS = 'COMMENTS',
  COMMUNITY = 'COMMUNITY',
}

export enum BrushType {
  BASIC = 'basic',
  CALLIGRAPHY = 'calligraphy',
  OIL = 'oil',
  CRAYON = 'crayon',
  PENCIL = 'pencil',
  WATERCOLOR = 'watercolor',
  VECTOR_PENCIL = 'vector_pencil',
  SPLATTER = 'splatter',
  TEXTURE = 'texture',
  ERASER = 'eraser',
}

export enum AspectRatio {
  SQUARE = '1:1',
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
  WIDE = '4:3',
  TALL = '3:4',
}

export type GenerationQuality = 'standard' | 'hd';

export type CanvasUnit = 'px' | 'in' | 'cm' | 'mm';

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'w' | 'e' | 'n' | 's';

export interface CanvasSize {
  width: number;
  height: number;
  name: string;
  unit?: CanvasUnit;
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

export interface AdvancedShadow extends Shadow {
  type: 'drop' | 'line' | 'block' | '3d';
  opacity: number;
  angle?: number;
  distance?: number;
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

export interface AnimationSettings {
  type: 'none' | 'fade' | 'slide' | 'zoom' | 'rotate' | 'bounce' | 'pulse' | 'shake' | 'flip' | 'float';
  direction?: 'up' | 'down' | 'left' | 'right' | 'in' | 'out';
  duration: number; // seconds
  delay: number; // seconds
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
  iterationCount: number | 'infinite';
  intensity?: number;
  angle?: number;
}

export interface LayerFilters {
  brightness: number; // 100 default
  contrast: number; // 100 default
  saturation: number; // 100 default
  grayscale: number; // 0 default
  blur: number; // 0 default
  sepia: number; // 0 default
  hueRotate: number; // 0 default
  vignette: number; // 0 default
  opacity: number; // 1 default
}

export interface TextGradient {
  enabled: boolean;
  startColor: string;
  endColor: string;
  angle: number;
}

export interface ImageFillSettings {
  src: string;
  fit: 'fill' | 'contain' | 'cover';
  offsetX: number;
  offsetY: number;
  scale: number;
  opacity: number;
  rotation?: number;
  gradientOverlay?: Gradient;
}

export interface LayerBase {
  id: string;
  name?: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  maskLayerId?: string;
  groupId?: string;
  animation?: AnimationSettings;
  filters?: LayerFilters;
  blendMode?: string;
  shadow?: Shadow;
  stroke?: Stroke;
  skewX?: number;
  skewY?: number;
  perspective?: number;
  rotateX?: number;
  rotateY?: number;
  isProcessing?: boolean;
}

export interface TextLayer extends LayerBase {
  type: 'text';
  text: string;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: string;
  fontStyle: 'normal' | 'italic';
  textDecoration: string;
  color: string;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  letterSpacing: number;
  lineHeight: number;
  textTransform: 'none' | 'uppercase' | 'lowercase';
  gradient?: TextGradient;
  // effects...
  curve?: number;
  warpStyle?: 'none' | 'arc' | 'flag' | 'rise' | 'wave' | 'fish';
  styleType?: 'normal' | 'hollow' | 'lift' | 'echo';
  textPath?: string;
  depth?: number;
  depthColor?: string;
  // Text transform effects
  transformType?: string;
  transformIntensity?: number;
  transformDirection?: number; // Changed from string to number
  // Advanced shadows
  advancedShadows?: AdvancedShadow[];
  decorations?: {
    textures?: string[];
    cuts?: Array<{ type: string; value: number }>;
    lines?: Array<{ type: string; value: number }>;
  };
  // Text features
  kerning?: number;
  ligatures?: boolean;
}

export type PointType = 'sharp' | 'smooth' | 'symmetric';

export interface VectorPoint {
  id: string;
  x: number;
  y: number;
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
  type: PointType;
  cornerRadius?: number;
}

export interface VectorPath {
  points: VectorPoint[];
  isClosed: boolean;
}

export interface Gradient {
  enabled?: boolean;
  type: 'linear' | 'radial';
  angle?: number; // 0-360 degrees for linear
  colors: Array<{ color: string; position: number }>;
  startX?: number; // for radial
  startY?: number;
  endX?: number;
  endY?: number;
}

export type ShapeType =
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'hexagon'
  | 'diamond'
  | 'arrow'
  | 'heart'
  | 'speech_bubble'
  | 'ribbon'
  | 'shield'
  | 'banner'
  | 'pentagon'
  | 'octagon'
  | 'plus'
  | 'star_4'
  | 'star_8'
  | 'path';

export interface ShapeLayer extends LayerBase {
  type: ShapeType;
  width: number;
  height: number;
  color: string;
  cornerRadius: number;
  gradient?: Gradient;
  backgroundImage?: string;
  backgroundScale?: number; // 1 = 100%
  backgroundPositionX?: number;
  backgroundPositionY?: number;
  pathData?: string; // SVG Path D attribute for custom shapes
  viewBox?: string; // SVG ViewBox
  vectorPath?: VectorPath; // For active editing
  imageFill?: ImageFillSettings;
  backgroundGradient?: Gradient;
  flipX?: boolean;
  flipY?: boolean;
}

export interface ImageLayer extends LayerBase {
  type: 'image';
  src: string;
  width: number;
  height: number;
  flipX: boolean;
  flipY: boolean;
  cornerRadius?: number;
  crop?: { x: number; y: number; width: number; height: number };
  naturalWidth?: number;
  naturalHeight?: number;
  maskPath?: string; // SVG path data for lasso cutouts
  maskDataURL?: string; // Base64 data for refined bitmap masks
  maskType?: 'none' | 'lasso' | 'ai' | 'bitmap';
}

export type Layer = TextLayer | ImageLayer | ShapeLayer;

export interface CanvasFilters {
  brightness: number; // %
  contrast: number; // %
  saturation: number; // %
  sepia: number; // %
  grayscale: number; // %
  blur: number; // px
  opacity: number; // 0-1
  vignette: number; // 0-100
  hueRotate: number; // deg
  overlayTexture?: string; // CSS url or data URI for vintage texture overlay
}

export interface GenerationConfig {
  prompt: string;
  aspectRatio: AspectRatio;
  referenceImage?: string; // Base64 string for editing
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
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

export interface DesignComment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: number;
}

export interface DesignSnapshot {
  id: string;
  projectId: string;
  name: string;
  timestamp: number;
  state: HistoryState;
  thumbnail?: string;
}

export interface Project {
  id: string;
  name: string;
  updatedAt: number;
  thumbnail?: string;
  state: HistoryState;
  tags?: string[];
  isPublished?: boolean; // For community marketplace
  authorId?: string;
  authorName?: string;
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

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
