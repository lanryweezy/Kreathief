import { KreathiefSceneGraph, ASTLayerNode } from '../types/ast';
import { Layer, ShapeLayer, TextLayer, ImageLayer } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Maps the AI-generated KreathiefSceneGraph AST directly into Kreathief's native React `Layer` state.
 */
export function mapASTToLayers(graph: KreathiefSceneGraph, artboardWidth: number, artboardHeight: number): Layer[] {
  const reactLayers: Layer[] = [];
  
  // Flatten recursive structure while preserving absolute positions
  const flattenNodes = (nodes: ASTLayerNode[], parentX = 0, parentY = 0) => {
    for (const node of nodes) {
      let x = parentX;
      let y = parentY;
      let w = 0;
      let h = 0;

      if (node.transform?.bounds) {
        x += node.transform.bounds.x * artboardWidth;
        y += node.transform.bounds.y * artboardHeight;
        w = node.transform.bounds.width * artboardWidth;
        h = node.transform.bounds.height * artboardHeight;
      }

      // Convert Node to React Store Layer
      const baseLayer = {
        id: node.id || uuidv4(),
        name: node.name || `${node.type}_${Math.floor(Math.random()*1000)}`,
        x,
        y,
        width: w,
        height: h,
        rotation: node.transform?.rotation || 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: node.zIndex || reactLayers.length
      };

      if (node.type === 'shape' || node.type === 'container') {
        const shapeLayer: ShapeLayer = {
          ...baseLayer,
          type: 'rectangle', // Map AST shape to rectangle for now
          color: node.style?.fill?.color || '#000000',
          cornerRadius: Array.isArray(node.style?.cornerRadius) ? (node.style.cornerRadius[0] || 0) : (node.style?.cornerRadius || 0)
        };
        // Handle Gradients
        if (node.style?.fill?.type === 'radial_gradient' || node.style?.fill?.type === 'linear_gradient') {
           shapeLayer.backgroundGradient = {
             type: node.style.fill.type === 'radial_gradient' ? 'radial' : 'linear',
             colors: node.style.fill.stops?.map(s => ({ color: s.color, position: s.offset * 100 })) || []
           };
        }
        reactLayers.push(shapeLayer);
      } 
      else if (node.type === 'text' || node.type === 'vector_badge') {
        const textLayer: TextLayer = {
          ...baseLayer,
          type: 'text',
          text: node.content || 'Text',
          fontSize: node.style?.fontSize || 40,
          fontWeight: (node.style?.fontWeight || 400).toString(),
          fontFamily: node.style?.fontFamily || 'Inter',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: node.style?.color || '#000000',
          textAlign: 'center',
          letterSpacing: 0,
          lineHeight: 1.2,
          textTransform: 'none'
        };
        
        // Map 3D Extrusion
        if (node.style?.extrusion) {
           textLayer.warpParams = {
             rotateX: 0,
             rotateY: 0,
             perspective: 1000,
             depth3d: node.style.extrusion.depth,
             is3dExtrusion: true
           };
           textLayer.depthColor = node.style.extrusion.color;
           textLayer.depth = node.style.extrusion.depth;
        }

        // Map Strokes
        if (node.style?.stroke) {
           textLayer.textStroke = {
             width: node.style.stroke.width,
             color: node.style.stroke.color
           };
        }
        
        reactLayers.push(textLayer);
      }
      else if (node.type === 'raster_asset') {
        const imageLayer: ImageLayer = {
          ...baseLayer,
          type: 'image',
          src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop', // Placeholder for AI assets
          flipX: false,
          flipY: false,
        };
        reactLayers.push(imageLayer);
      }
      else if (node.type === 'group' && node.children) {
        // We calculate absolute layouts for children
        let currentY = y;
        const gap = node.layoutEngine?.gap || 0;
        
        for (const child of node.children) {
          // Flatten Flex groups directly to absolute coordinates for the canvas
          // Center alignment horizontally
          const childX = x + (w / 2);
          
          if (child.type === 'text') {
             // Mock text height spacing for flex layouts
             const hOffset = child.style?.fontSize || 40;
             child.transform = { bounds: { x: 0, y: 0, width: 0, height: 0 } };
             flattenNodes([child], childX, currentY);
             currentY += hOffset + gap;
          } else if (child.type === 'container') {
             // Basic mock sizing for wrappers
             const boxH = (child.children?.[0]?.style?.fontSize || 40) + 40;
             child.transform = { bounds: { x: 0, y: 0, width: 0, height: 0 } };
             flattenNodes([child], childX - 200, currentY - 20); // rough centering
             currentY += boxH + gap;
          } else {
             child.transform = { bounds: { x: 0, y: 0, width: 0, height: 0 } };
             flattenNodes([child], childX, currentY);
          }
        }
      }
    }
  };

  flattenNodes(graph.sceneGraph.layers);
  
  // Final z-index sort
  return reactLayers.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
}
