/**
 * KreathiefSceneGraph.v1 AST Schema
 * Defines the strict structural format for AI-generated design graphs.
 */

export interface KreathiefSceneGraph {
  $schema?: string;
  document: DocumentMeta;
  designSystem?: DesignSystemTokens;
  sceneGraph: SceneGraphRoot;
}

export interface DocumentMeta {
  id: string;
  name: string;
  canvas: {
    width: number;
    height: number;
    aspectRatio: string;
    orientation: 'portrait' | 'landscape' | 'square';
    colorSpace: string;
    dpi: number;
    unit: string;
  };
  safeArea?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface DesignSystemTokens {
  tokens: {
    colors: Record<string, string>;
    spacingScale?: number[];
  };
}

export interface SceneGraphRoot {
  rootLayerId: string;
  layers: ASTLayerNode[];
}

export type LayerRole = 'background' | 'focal_object' | 'primary_message' | 'compliance' | string;
export type LayerType = 'shape' | 'raster_asset' | 'group' | 'container' | 'text' | 'vector_badge';

export interface NormalizedTransform {
  bounds: {
    x: number; // 0.0 to 1.0
    y: number; // 0.0 to 1.0
    width: number; // 0.0 to 1.0
    height: number; // 0.0 to 1.0
  };
  rotation?: number; // degrees
  skewX?: number;
}

export interface ASTLayerNode {
  id: string;
  name?: string;
  type: LayerType;
  role?: LayerRole;
  zIndex?: number;
  
  // Normalized positioning
  transform?: NormalizedTransform;
  
  // Flex layout for groups
  layoutEngine?: {
    display: 'flex';
    flexDirection: 'row' | 'column';
    justifyContent?: 'center' | 'flex-start' | 'flex-end' | 'space-between';
    alignItems?: 'center' | 'flex-start' | 'flex-end';
    gap?: number;
  };

  // Content & Styles
  content?: string;
  style?: ASTStyle;
  semantics?: Record<string, any>;
  compositing?: Record<string, any>;
  
  // Hierarchy
  children?: ASTLayerNode[];
}

export interface ASTStyle {
  fill?: {
    type: 'solid' | 'radial_gradient' | 'linear_gradient';
    color?: string;
    cx?: number;
    cy?: number;
    r?: number;
    stops?: Array<{ offset: number; color: string; opacity: number }>;
  };
  border?: {
    width: number;
    color: string;
  };
  cornerRadius?: number | number[];
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  // Text specifics
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  letterSpacing?: number;
  color?: string;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize';
  stroke?: {
    color: string;
    width: number;
    join?: 'round' | 'miter' | 'bevel';
  };
  extrusion?: {
    depth: number;
    angle: number;
    color: string;
  };
}
