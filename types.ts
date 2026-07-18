export enum AppMode {
  GENERATE = 'GENERATE',
  EDIT = 'EDIT',
  THEME = 'THEME',
}

export enum NavTab {
  MAGIC = 'MAGIC',
  TEMPLATES = 'TEMPLATES',
  MEDIA = 'MEDIA',
  TEXT = 'TEXT',
  DRAW = 'DRAW',
  BRAND = 'BRAND',
  TEXTURES = 'TEXTURES',
  PROJECTS = 'PROJECTS',
  LAYERS = 'LAYERS',
  COMPONENTS = 'COMPONENTS',
  MOCKUP = 'MOCKUP',
  ASSISTANT = 'ASSISTANT',
  STICKERS = 'STICKERS',
  AI_SUGGESTIONS = 'AI_SUGGESTIONS',
  SMART_CONTENT = 'SMART_CONTENT',
  QUALITY_SCORE = 'QUALITY_SCORE',
  ACCESSIBILITY = 'ACCESSIBILITY',
  VECTORIZER = 'VECTORIZER',
  MOTION = 'MOTION',
  SNAPSHOTS = 'SNAPSHOTS',
  COMMENTS = 'COMMENTS',
  COMMUNITY = 'COMMUNITY',
  ELEMENTS = 'ELEMENTS',
  UPLOADS = 'UPLOADS',
  PHOTOS = 'PHOTOS',
  TEXT_EFFECTS = 'TEXT_EFFECTS',
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
  CUSTOM = 'custom',
}

export interface CustomBrush {
  id: string;
  name: string;
  tipData: string; // Base64 sampled bitmap
  size: number;
  spacing: number;
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
  opacity?: number;
  inset?: boolean;
}

export interface CornerRadius {
  tl: number;
  tr: number;
  br: number;
  bl: number;
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
  alignment?: 'inside' | 'center' | 'outside';
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
  backdropBlur?: number; // 0 default
  artisticFilter?: string; // Optional SVG filter ID (e.g. 'watercolor')
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

export interface AutoLayoutSettings {
  direction: 'row' | 'col';
  padding: number | { top: number; right: number; bottom: number; left: number };
  spacing: number;
  alignment: 'start' | 'center' | 'end' | 'space-between';
}

export interface DesignTokenRef {
  kitId: string;
  type: 'color' | 'font';
  path: string; // e.g., 'colors.0' or 'fonts.heading'
}

export interface LayerBase {
  id: string;
  name?: string;
  x: number; // Local to Artboard
  y: number; // Local to Artboard
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  maskLayerId?: string;
  isMasking?: boolean; // True if this layer masks the one(s) above it
  clippingMaskType?: 'clipping' | 'alpha' | 'luminance';
  groupId?: string;
  colorToken?: DesignTokenRef;
  fontToken?: DesignTokenRef;
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
  lockProportions?: boolean;
  dirty?: boolean; // For rendering optimization: true if layer needs redraw
  needsSimplification?: boolean;
  needsOffset?: boolean;
  needsCornerRounding?: boolean;
  convertToPath?: boolean;
  simplifyTolerance?: number;
  offsetDistance?: number;
  // Group/Folder support
  isGroup?: boolean; // True if this is a group marker (folder)
  isExpanded?: boolean; // For groups: whether children are visible in layers panel
  // Design Systems: Component Support
  masterId?: string; // Reference to the Master Component
  componentId?: string; // If this layer IS a Master Component itself
  overrides?: string[]; // Properties that are overridden from the Master
  // Auto-Layout
  autoLayout?: AutoLayoutSettings;
  // Layout Constraints for Semantic Resizing
  constraints?: {
    horizontal: 'start' | 'end' | 'center' | 'scale' | 'both';
    vertical: 'start' | 'end' | 'center' | 'scale' | 'both';
  };
}

export interface TextLayer extends LayerBase {
  type: 'text';
  text: string;
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
  warpStyle?: 'none' | 'arc' | 'flag' | 'rise' | 'wave' | 'fish' | 'bulge' | 'squeeze' | 'perspective';
  styleType?: 'normal' | 'hollow' | 'lift' | 'echo' | 'emboss' | 'deboss';
  textPath?: string;
  depth?: number;
  depthColor?: string;
  // Text transform effects
  transformType?: string;
  transformIntensity?: number;
  transformDirection?: number;
  // Advanced shadows
  advancedShadows?: AdvancedShadow[];
  decorations?: {
    textures?: string[];
    cuts?: Array<{ type: string; value: number }>;
    lines?: Array<{ type: string; value: number }>;
  };
  // Neon glow effect
  neonGlow?: {
    enabled: boolean;
    color: string;
    intensity: number; // 0-100
    spread: number; // 0-50
    flicker: boolean;
  };
  // Text shadow
  textShadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
  // Text stroke
  textStroke?: {
    width: number;
    color: string;
  };
  // Text features
  kerning?: number;
  ligatures?: boolean;
  spaceBefore?: number;
  spaceAfter?: number;
  // Warp parameters for bulge/squeeze/perspective
  warpParams?: {
    rotateX: number;
    rotateY: number;
    perspective: number;
  };
}

export type PointType = 'sharp' | 'smooth' | 'symmetric' | 'corner';

export interface VectorPoint {
  id: string;
  x: number;
  y: number;
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
  type: PointType;
  cornerRadius?: number;
  isMove?: boolean;
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
  color: string;
  cornerRadius: number;
  cornerRadiusPerCorner?: CornerRadius;
  gradient?: Gradient;
  backgroundImage?: string;
  backgroundScale?: number;
  backgroundPositionX?: number;
  backgroundPositionY?: number;
  pathData?: string;
  viewBox?: string;
  vectorPath?: VectorPath;
  imageFill?: ImageFillSettings;
  backgroundGradient?: Gradient;
  flipX?: boolean;
  flipY?: boolean;
  strokeProfile?: 'uniform' | 'taper-start' | 'taper-end' | 'taper-both';
  strokeDasharray?: string;
  pathEffects?: {
    roughen?: { amount: number };
    zigzag?: { amplitude: number; frequency: number };
    offset?: { distance: number };
  };
}

export interface InpaintNode {
  id: string;
  patchSrc: string; // The AI-generated patch (transparent background)
  maskPath: string; // The path that was patched
  opacity: number; // Defaults to 1.0
  enabled: boolean; // Defaults to true
}

export interface ImageLayer extends LayerBase {
  type: 'image';
  src: string;
  flipX: boolean;
  flipY: boolean;
  cornerRadius?: number;
  crop?: { x: number; y: number; width: number; height: number };
  naturalWidth?: number;
  naturalHeight?: number;
  maskPath?: string; // SVG path data for lasso cutouts
  maskDataURL?: string; // Base64 data for refined bitmap masks
  maskType?: 'none' | 'lasso' | 'ai' | 'bitmap';
  altText?: string;
  inpaintNodes?: InpaintNode[];
}

export interface AdjustmentLayer extends LayerBase {
  type: 'adjustment';
  adjustmentFilters: {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    hueRotate: number;
    sepia: number;
    invert: number;
  };
}

export interface GroupLayer extends LayerBase {
  type: 'group';
  children: string[]; // IDs of child layers
}

export type Layer = TextLayer | ImageLayer | ShapeLayer | AdjustmentLayer | GroupLayer;

export interface Artboard {
  id: string;
  name: string;
  x: number; // World Position
  y: number; // World Position
  width: number;
  height: number;
  layers: Layer[];
  backgroundColor?: string;

  storyNode?: {
    id: string;
    connections: string[]; // IDs of other artboards
    notes?: string;
    duration?: number;
    transition?: 'fade' | 'slide' | 'zoom' | 'none';
  };
}

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
  noise?: number; // 0-100
  grainScale?: number; // 0-100
  textureBlendMode?: 'multiply' | 'screen' | 'overlay' | 'soft-light';
  artisticFilter?: string;
  overlayTexture?: string; // CSS url or data URI for vintage texture overlay
}

export interface HistoryState {
  artboards: Artboard[];
  activeArtboardId?: string;
  canvasBackgroundColor: string;
  canvasFilters: CanvasFilters;
  canvasSize?: { width: number; height: number; name: string };
  showGrid?: boolean;
  showRulers?: boolean;
  brandKits?: BrandKit[];
  selectedLayerIds?: string[];
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

export interface CanvasComment {
  id: string;
  x: number;
  y: number;
  content: string;
  author: {
    name: string;
    avatar?: string;
  };
  createdAt: number;
  resolved: boolean;
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
  comments?: CanvasComment[];
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
  isGuest?: boolean;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: {
    label: string;
    onClick: () => void;
  };
  details?: string;
}

export interface DesignCritique {
  suggestions: DesignSuggestion[];
  score: number;
  overallScore: number;
  summary: string;
  strengths: string[];
  areas_for_improvement: string[];
  timestamp?: number;
}

export interface DesignSuggestion {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  title?: string;
  category?: string;
  autoFix?: any;
}

export interface DesignContext {
  layerCount: number;
  hasText: boolean;
  hasImages: boolean;
  colorPalette: string[];
  fontFamilies: string[];
  canvasSize: { width: number; height: number; name?: string };
  purpose?: string;
  brandKit?: any;
}

export interface AIAssistantState {
  isActive: boolean;
  isAnalyzing: boolean;
  currentCritique?: DesignCritique;
  conversationHistory: any[];
  lastAnalysis: number;
  autoSuggest: boolean;
  position: { x: number; y: number };
  isMinimized: boolean;
}
