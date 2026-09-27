import { KreathiefSceneGraph, ASTLayerNode, NormalizedTransform, ASTStyle } from '../types/ast';

export class ASTRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  public render(graph: KreathiefSceneGraph) {
    // Sort layers by zIndex
    const layers = [...graph.sceneGraph.layers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    
    for (const layer of layers) {
      this.renderNode(layer);
    }
  }

  private renderNode(node: ASTLayerNode, parentOffsetX = 0, parentOffsetY = 0) {
    this.ctx.save();

    // 1. Calculate Absolute Bounds from Normalized (0.0 - 1.0) space
    let x = parentOffsetX;
    let y = parentOffsetY;
    let w = 0;
    let h = 0;

    if (node.transform?.bounds) {
      x += node.transform.bounds.x * this.canvasWidth;
      y += node.transform.bounds.y * this.canvasHeight;
      w = node.transform.bounds.width * this.canvasWidth;
      h = node.transform.bounds.height * this.canvasHeight;
    }

    // Apply basic transforms
    if (node.transform?.rotation || node.transform?.skewX || x !== 0 || y !== 0) {
      this.ctx.translate(x + w / 2, y + h / 2);
      if (node.transform?.rotation) {
        this.ctx.rotate((node.transform.rotation * Math.PI) / 180);
      }
      if (node.transform?.skewX) {
        this.ctx.transform(1, 0, Math.tan((node.transform.skewX * Math.PI) / 180), 1, 0, 0);
      }
      this.ctx.translate(-(x + w / 2), -(y + h / 2));
    }

    // 2. Render Node Content
    switch (node.type) {
      case 'shape':
      case 'container':
        this.renderShape(x, y, w, h, node.style);
        break;
      case 'text':
      case 'vector_badge':
        this.renderText(node.content || '', x, y, node.style);
        break;
      case 'raster_asset':
        this.renderPlaceholderAsset(node.name || 'ASSET', x, y, w, h);
        break;
      case 'group':
        // Handle Flex-box simulated stacking
        if (node.layoutEngine && node.children) {
          this.renderFlexGroup(node.children, x, y, w, h, node.layoutEngine);
        } else if (node.children) {
          node.children.forEach(child => this.renderNode(child, x, y));
        }
        break;
    }

    // Group containers can also have non-flex children
    if (node.type === 'container' && node.children) {
      node.children.forEach(child => this.renderNode(child, x, y));
    }

    this.ctx.restore();
  }

  private renderShape(x: number, y: number, w: number, h: number, style?: ASTStyle) {
    if (!style?.fill) {return;}

    this.ctx.beginPath();
    
    // Simple rounded rect
    let radius = 0;
    if (Array.isArray(style.cornerRadius) && style.cornerRadius.length > 0) {
      radius = style.cornerRadius[0];
    } else if (typeof style.cornerRadius === 'number') {
      radius = style.cornerRadius;
    }

    this.ctx.roundRect(x, y, w, h, radius);

    // Apply Fill
    if (style.fill.type === 'solid' && style.fill.color) {
      this.ctx.fillStyle = style.fill.color;
    } else if (style.fill.type === 'radial_gradient' && style.fill.stops) {
      const cx = x + (style.fill.cx || 0.5) * w;
      const cy = y + (style.fill.cy || 0.5) * h;
      const r = (style.fill.r || 0.5) * Math.max(w, h);
      
      const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      style.fill.stops.forEach(stop => {
        grad.addColorStop(stop.offset, stop.color);
      });
      this.ctx.fillStyle = grad;
    }

    this.ctx.fill();

    // Borders
    if (style.border) {
      this.ctx.lineWidth = style.border.width;
      this.ctx.strokeStyle = style.border.color;
      this.ctx.stroke();
    }
  }

  private renderText(text: string, x: number, y: number, style?: ASTStyle) {
    if (!style) {return;}

    this.ctx.font = `${style.fontWeight || 400} ${style.fontSize || 24}px "${style.fontFamily || 'sans-serif'}"`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'center'; // Simplify alignment for the AST layout
    
    // Adjust x to be center since we use center align
    const cx = x;
    const cy = y;

    // Apply Extrusion (3D Text)
    if (style.extrusion) {
      this.ctx.fillStyle = style.extrusion.color;
      const depth = style.extrusion.depth;
      // Draw multiple layers backwards to simulate 3D block
      for (let i = depth; i > 0; i--) {
        this.ctx.fillText(text, cx + i, cy + i);
      }
    }

    // Outline / Stroke
    if (style.stroke) {
      this.ctx.lineWidth = style.stroke.width;
      this.ctx.strokeStyle = style.stroke.color;
      this.ctx.lineJoin = style.stroke.join || 'round';
      this.ctx.strokeText(text, cx, cy);
    }

    // Main Fill
    this.ctx.fillStyle = style.color || '#000000';
    this.ctx.fillText(text, cx, cy);
  }

  private renderPlaceholderAsset(name: string, x: number, y: number, w: number, h: number) {
    this.ctx.fillStyle = 'rgba(200, 200, 255, 0.5)';
    this.ctx.fillRect(x, y, w, h);
    this.ctx.strokeStyle = '#590DF2';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(x, y, w, h);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(name, x + w / 2, y + h / 2);
  }

  private renderFlexGroup(children: ASTLayerNode[], x: number, y: number, w: number, h: number, layoutEngine: any) {
    // A simplified flexbox layout simulator
    const gap = layoutEngine.gap || 0;
    
    let currentY = y;
    
    for (const child of children) {
      // Create a simulated transform for the child based on flex positioning
      // We assume center alignment for this simple AST rendering
      const childX = x + (w / 2);
      
      // We pass the absolute calculated positions back into renderNode
      // But text nodes usually use the X as center
      child.transform = {
        bounds: { x: 0, y: 0, width: 0, height: 0 }
      };
      
      this.renderNode(child, childX, currentY);
      
      // Advance layout (assuming fixed height jumps for the demo)
      currentY += gap + (child.style?.fontSize ? child.style.fontSize : 40);
    }
  }
}
