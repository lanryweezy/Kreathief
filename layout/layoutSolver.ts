import { v4 as uuidv4 } from 'uuid';
import { Layer } from '../types';
import { ASTNode, SemanticDesignBlueprint, ContainerNode } from '../types/designAST';

import { recommendPairingForStyle, TypographyPairing } from '../services/typographyPairingEngine';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Traverses the SemanticDesignBlueprint AST and computes absolute coordinates
 * for every node, producing a flat array of standard Kreathief Layers.
 */
export class LayoutSolver {
  private layers: Layer[] = [];
  private pairing: TypographyPairing | null = null;
  
  public solve(blueprint: SemanticDesignBlueprint): Layer[] {
    this.layers = [];
    
    // 1. Run the Typography Agent / Pairing Engine based on metadata
    const styleCue = blueprint.metadata?.theme || blueprint.metadata?.vibe || 'minimalism';
    this.pairing = recommendPairingForStyle(styleCue);

    // Create base background if specified
    if (blueprint.canvas.backgroundColor) {
      this.layers.push({
        id: `bg_${uuidv4().slice(0, 8)}`,
        type: 'rect',
        name: 'Background',
        x: 0,
        y: 0,
        width: blueprint.canvas.width,
        height: blueprint.canvas.height,
        color: blueprint.canvas.backgroundColor,
        rotation: 0,
        opacity: 1,
        locked: true,
        visible: true
      } as any);
    }
    
    // Start traversal from root
    this.traverseNode(blueprint.root, {
      x: 0,
      y: 0,
      width: blueprint.canvas.width,
      height: blueprint.canvas.height
    });
    
    return this.layers;
  }
  
  private traverseNode(node: ASTNode, box: BoundingBox) {
    switch (node.type) {
      case 'container':
        this.solveContainer(node, box);
        break;
      case 'typography':
        this.solveTypography(node, box);
        break;
      case 'asset':
        this.solveAsset(node, box);
        break;
    }
  }
  
  private solveContainer(node: ContainerNode, box: BoundingBox) {
    const padding = node.padding || 0;
    const gap = node.gap || 0;
    
    // The usable space inside the container
    const innerBox: BoundingBox = {
      x: box.x + padding,
      y: box.y + padding,
      width: Math.max(0, box.width - padding * 2),
      height: Math.max(0, box.height - padding * 2)
    };
    
    // Optional container background layer
    if (node.backgroundColor) {
      this.layers.push({
        id: node.id,
        type: 'rect',
        name: node.name || 'Container',
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        color: node.backgroundColor,
        cornerRadius: node.cornerRadius ? { tl: node.cornerRadius, tr: node.cornerRadius, bl: node.cornerRadius, br: node.cornerRadius } : undefined,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true
      } as any);
    }
    
    if (node.children.length === 0) return;
    
    // Calculate flex distribution
    const totalFlex = node.children.reduce((sum, child) => sum + (child.flex || 1), 0);
    const totalGaps = gap * (node.children.length - 1);
    
    let currentX = innerBox.x;
    let currentY = innerBox.y;
    
    node.children.forEach(child => {
      const flex = child.flex || 1;
      const flexRatio = flex / totalFlex;
      
      let childBox: BoundingBox;
      
      if (node.direction === 'row') {
        const availableWidth = innerBox.width - totalGaps;
        const childWidth = availableWidth * flexRatio;
        childBox = {
          x: currentX,
          y: innerBox.y,
          width: childWidth,
          height: innerBox.height
        };
        currentX += childWidth + gap;
      } else {
        const availableHeight = innerBox.height - totalGaps;
        const childHeight = availableHeight * flexRatio;
        childBox = {
          x: innerBox.x,
          y: currentY,
          width: innerBox.width,
          height: childHeight
        };
        currentY += childHeight + gap;
      }
      
      this.traverseNode(child, childBox);
    });
  }
  
  private solveTypography(node: import('../types/designAST').TypographyNode, box: BoundingBox) {
    // Map hierarchy to font size as a baseline
    const baseFontSize = Math.max(12, box.height * (node.hierarchyWeight / 20));
    
    let fontToUse = this.pairing?.body || 'Inter';
    if (node.role === 'headline' || node.role === 'subheadline') {
      fontToUse = this.pairing?.heading || 'Outfit';
    } else if (node.role === 'eyebrow' || node.role === 'cta') {
      fontToUse = this.pairing?.accent || this.pairing?.heading || 'Inter';
    }
    
    const newLayer: any = {
      id: node.id,
      type: 'text',
      name: node.name || `Text (${node.role})`,
      text: node.content,
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      fontSize: baseFontSize,
      fontFamily: fontToUse,
      fontWeight: node.hierarchyWeight > 6 ? '700' : '400',
      color: node.color || '#000000',
      textAlign: node.textAlign || 'left',
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true
    };
    
    if (node.warpEffect && node.warpEffect !== 'none') {
      newLayer.textWarp = {
        style: node.warpEffect,
        bend: node.warpEffect === 'circle' ? 100 : 50, // default curve
        horizontalDistortion: 0,
        verticalDistortion: 0
      };
    }

    this.layers.push(newLayer as any);
  }
  
  private solveAsset(node: import('../types/designAST').AssetNode, box: BoundingBox) {
    // For now, output a placeholder shape that the Asset Router will fill with generated imagery
    this.layers.push({
      id: node.id,
      type: node.shapeType || 'rect',
      name: node.name || `Asset (${node.role})`,
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      color: node.backgroundColor || '#e2e8f0', // placeholder color
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      aiProvenance: {
        source: 'generated',
        prompt: node.prompt,
        role: node.role
      }
    } as any);
  }
}
