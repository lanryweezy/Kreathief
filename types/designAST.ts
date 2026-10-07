export type FlexDirection = 'row' | 'col';
export type Alignment = 'start' | 'center' | 'end' | 'space-between' | 'space-around';
export type AssetRole = 'background' | 'hero-cutout' | 'vector-accent' | 'image' | 'shape';
export type TypographyRole = 'headline' | 'subheadline' | 'body' | 'eyebrow' | 'cta';

export interface ASTNodeBase {
  id: string;
  name?: string;
}

export interface ContainerNode extends ASTNodeBase {
  type: 'container';
  direction: FlexDirection;
  alignItems?: Alignment; // Cross-axis alignment
  justifyContent?: Alignment; // Main-axis alignment
  padding?: number;
  gap?: number;
  flex?: number; // How much space it takes relative to siblings
  children: ASTNode[];
  // Background styling for the container itself
  backgroundColor?: string;
  cornerRadius?: number;
}

export interface TypographyNode extends ASTNodeBase {
  type: 'typography';
  role: TypographyRole;
  content: string;
  hierarchyWeight: number; // 1-10 for importance scale
  // Optional explicit overrides (though usually assigned by TypographyAgent)
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  flex?: number;
  warpEffect?: 'none' | 'arch' | 'wave' | 'circle' | 'flag';
}

export interface AssetNode extends ASTNodeBase {
  type: 'asset';
  role: AssetRole;
  prompt: string;
  aspectRatioConstraint?: 'square' | 'wide' | 'tall';
  flex?: number;
  // Specific geometry details assigned by the planner if it's a raw shape
  shapeType?: 'rect' | 'ellipse' | 'polygon';
  backgroundColor?: string;
}

export type ASTNode = ContainerNode | TypographyNode | AssetNode;

/**
 * The top-level blueprint that the PlannerAgent outputs
 */
export interface SemanticDesignBlueprint {
  canvas: {
    width: number;
    height: number;
    backgroundColor?: string;
  };
  root: ContainerNode; // The top-level layout wrapper
  metadata: {
    theme?: string;
    targetAudience?: string;
    vibe?: string;
  };
}
