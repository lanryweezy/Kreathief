/**
 * Kreathief Graphic Design Intelligence Schema
 * The comprehensive contract for Vision Models (VLMs) to reverse-engineer designs.
 */

export interface GraphicDesignIntelligence {
  schemaVersion: string;
  name: string;
  document: IntelligenceDocument;
  composition: IntelligenceComposition;
  background: IntelligenceBackground;
  colorSystem: IntelligenceColorSystem;
  typography: IntelligenceTypography;
  objects: IntelligenceObject[];
  brandIdentity: IntelligenceBrandIdentity;
  shapesAndGeometry: IntelligenceShape[];
  designIntent?: Record<string, any>;
}

export interface IntelligenceDocument {
  id: string;
  canvas: {
    width: number;
    height: number;
    aspectRatio: string;
    orientation: string;
  };
}

export interface IntelligenceComposition {
  layoutType: string;
  focalPoints: any[];
  grid: {
    columns: number;
    rows: number;
  };
}

export interface IntelligenceBackground {
  type: string;
  color: string;
  gradient?: {
    type: string;
    stops: Array<{ offset: number; color: string }>;
  };
}

export interface IntelligenceColorSystem {
  dominantColors: string[];
  accentColors: string[];
  backgroundColors: string[];
}

export interface IntelligenceTypography {
  textBlocks: Array<{
    id: string;
    content: string;
    fontFamily: string;
    fontWeight: number;
    fontSize: number;
    color: string;
    position: { x: number; y: number; normalizedX: number; normalizedY: number };
    dimensions: { width: number; height: number; normalizedWidth: number; normalizedHeight: number };
    effects?: any[];
  }>;
}

export interface IntelligenceObject {
  id: string;
  name: string;
  type: string; // '3DObject', 'productRender', 'cutout'
  position: { normalizedX: number; normalizedY: number };
  dimensions: { normalizedWidth: number; normalizedHeight: number };
  rotation: number;
  zIndex: number;
}

export interface IntelligenceShape {
  id: string;
  type: string;
  position: { normalizedX: number; normalizedY: number };
  dimensions: { normalizedWidth: number; normalizedHeight: number };
  fill: { type: string; color?: string };
  cornerRadius?: number;
  zIndex: number;
}

export interface IntelligenceBrandIdentity {
  logos: Array<{
    id: string;
    content: string;
    position: { normalizedX: number; normalizedY: number };
    dimensions: { normalizedWidth: number; normalizedHeight: number };
  }>;
}
